# 📚 Guia de Integração com Backend e Banco de Dados

Este documento explica como integrar o sistema de gerenciamento de contatos com um backend real e banco de dados.

## 🗄️ Estrutura do Banco de Dados

### Tabela: `contacts`

\`\`\`sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  number VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,  -- Para soft delete
  user_id INTEGER NOT NULL,  -- ID do usuário dono do contato
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_number ON contacts(number);
CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at);
\`\`\`

### Tabela: `contact_tags`

\`\`\`sql
CREATE TABLE contact_tags (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_contact_tags_contact_id ON contact_tags(contact_id);
\`\`\`

### Tabela: `contact_lists`

\`\`\`sql
CREATE TABLE contact_lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de relacionamento muitos-para-muitos
CREATE TABLE contact_list_members (
  contact_id INTEGER NOT NULL,
  list_id INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contact_id, list_id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
);
\`\`\`

## 🔌 API Endpoints

### 1. Listar Contatos
\`\`\`typescript
// GET /api/contacts
// Retorna todos os contatos do usuário autenticado

export async function GET(request: Request) {
  const userId = await getUserIdFromSession(request)
  
  const contacts = await db.query(`
    SELECT 
      c.*,
      ARRAY_AGG(ct.tag) as tags
    FROM contacts c
    LEFT JOIN contact_tags ct ON c.id = ct.contact_id
    WHERE c.user_id = $1 AND c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `, [userId])
  
  return Response.json(contacts.rows)
}
\`\`\`

### 2. Criar Contato
\`\`\`typescript
// POST /api/contacts
// Cria um novo contato

export async function POST(request: Request) {
  const userId = await getUserIdFromSession(request)
  const { name, number, email, company, notes, tags } = await request.json()
  
  // Validação
  if (!name || !number) {
    return Response.json(
      { error: 'Nome e número são obrigatórios' },
      { status: 400 }
    )
  }
  
  // Inicia transação
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    
    // Insere o contato
    const result = await client.query(`
      INSERT INTO contacts (name, number, email, company, notes, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, number, email, company, notes, userId])
    
    const contact = result.rows[0]
    
    // Insere as tags se existirem
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await client.query(`
          INSERT INTO contact_tags (contact_id, tag)
          VALUES ($1, $2)
        `, [contact.id, tag])
      }
    }
    
    await client.query('COMMIT')
    return Response.json(contact, { status: 201 })
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Erro ao criar contato:', error)
    return Response.json(
      { error: 'Erro ao criar contato' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
\`\`\`

### 3. Atualizar Contato
\`\`\`typescript
// PUT /api/contacts/[id]
// Atualiza um contato existente

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession(request)
  const contactId = params.id
  const { name, number, email, company, notes, tags } = await request.json()
  
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    
    // Verifica se o contato pertence ao usuário
    const checkResult = await client.query(`
      SELECT id FROM contacts 
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `, [contactId, userId])
    
    if (checkResult.rows.length === 0) {
      return Response.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }
    
    // Atualiza o contato
    const result = await client.query(`
      UPDATE contacts 
      SET name = $1, number = $2, email = $3, company = $4, 
          notes = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `, [name, number, email, company, notes, contactId, userId])
    
    // Remove tags antigas
    await client.query(`
      DELETE FROM contact_tags WHERE contact_id = $1
    `, [contactId])
    
    // Insere novas tags
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await client.query(`
          INSERT INTO contact_tags (contact_id, tag)
          VALUES ($1, $2)
        `, [contactId, tag])
      }
    }
    
    await client.query('COMMIT')
    return Response.json(result.rows[0])
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Erro ao atualizar contato:', error)
    return Response.json(
      { error: 'Erro ao atualizar contato' },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
\`\`\`

### 4. Excluir Contato (Soft Delete)
\`\`\`typescript
// DELETE /api/contacts/[id]
// Marca o contato como excluído (soft delete)

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromSession(request)
  const contactId = params.id
  
  try {
    // Soft delete: marca como excluído sem remover do banco
    const result = await db.query(`
      UPDATE contacts 
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id
    `, [contactId, userId])
    
    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }
    
    return Response.json({ success: true })
    
  } catch (error) {
    console.error('Erro ao excluir contato:', error)
    return Response.json(
      { error: 'Erro ao excluir contato' },
      { status: 500 }
    )
  }
}
\`\`\`

## 🔄 Integração no Frontend

### Exemplo de Hook Personalizado

\`\`\`typescript
// hooks/use-contacts.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useContacts() {
  const { data, error, mutate } = useSWR('/api/contacts', fetcher)
  
  const createContact = async (contactData: any) => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    })
    
    if (!response.ok) throw new Error('Erro ao criar contato')
    
    // Revalida os dados
    mutate()
    return response.json()
  }
  
  const updateContact = async (id: number, contactData: any) => {
    const response = await fetch(`/api/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    })
    
    if (!response.ok) throw new Error('Erro ao atualizar contato')
    
    mutate()
    return response.json()
  }
  
  const deleteContact = async (id: number) => {
    const response = await fetch(`/api/contacts/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) throw new Error('Erro ao excluir contato')
    
    mutate()
  }
  
  return {
    contacts: data,
    isLoading: !error && !data,
    isError: error,
    createContact,
    updateContact,
    deleteContact
  }
}
\`\`\`

### Uso no Componente

\`\`\`typescript
// Substitua o useState por este hook
const { 
  contacts, 
  isLoading, 
  updateContact, 
  deleteContact 
} = useContacts()

// Na função de salvar
const handleSaveContact = async () => {
  try {
    await updateContact(editForm.id, editForm)
    alert('Contato atualizado com sucesso!')
  } catch (error) {
    alert('Erro ao salvar contato')
  }
}
\`\`\`

## 🔐 Segurança

### Autenticação
\`\`\`typescript
// lib/auth.ts
export async function getUserIdFromSession(request: Request) {
  const session = await getSession(request)
  
  if (!session?.userId) {
    throw new Error('Não autenticado')
  }
  
  return session.userId
}
\`\`\`

### Validação de Dados
\`\`\`typescript
// lib/validation.ts
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
})
\`\`\`

## 📊 Otimizações

### Cache com SWR
- Revalidação automática
- Cache local
- Otimistic updates

### Paginação
\`\`\`typescript
// GET /api/contacts?page=1&limit=50
const { page = 1, limit = 50 } = request.query
const offset = (page - 1) * limit

const contacts = await db.query(`
  SELECT * FROM contacts
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3
`, [userId, limit, offset])
\`\`\`

### Busca e Filtros
\`\`\`typescript
// GET /api/contacts?search=joao&tag=VIP
const { search, tag } = request.query

let query = `
  SELECT DISTINCT c.* FROM contacts c
  LEFT JOIN contact_tags ct ON c.id = ct.contact_id
  WHERE c.user_id = $1 AND c.deleted_at IS NULL
`

const params = [userId]

if (search) {
  query += ` AND (c.name ILIKE $2 OR c.number ILIKE $2)`
  params.push(`%${search}%`)
}

if (tag) {
  query += ` AND ct.tag = $${params.length + 1}`
  params.push(tag)
}
\`\`\`

## 🚀 Deploy

### Variáveis de Ambiente
\`\`\`env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key
\`\`\`

### Migrações
Use ferramentas como Prisma, Drizzle ou node-pg-migrate para gerenciar migrações do banco de dados.

---

**Pronto!** Agora você tem um guia completo para integrar o sistema com backend e banco de dados real.
