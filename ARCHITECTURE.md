# Arquitetura do Sistema

## Visão Geral

O sistema segue uma arquitetura em camadas com separação clara de responsabilidades.

## Camadas

### 1. Apresentação (Presentation Layer)

**Localização**: `/app`, `/components`

Responsável pela interface do usuário e interação.

**Componentes**:
- **Pages**: Páginas Next.js (Server Components)
- **Client Components**: Componentes interativos React
- **UI Components**: Componentes reutilizáveis de interface

**Padrões**:
- Server Components para busca de dados
- Client Components para interatividade
- Hooks customizados para lógica compartilhada

### 2. Lógica de Negócio (Business Logic Layer)

**Localização**: `/lib/services`

Contém toda a lógica de negócio da aplicação.

**Serviços**:
- `ConversationService`: Gerenciamento de conversas
- `WuzapiService`: Integração com Wuzapi
- `WebhookService`: Processamento de webhooks
- `QueueService`: Gerenciamento de fila

**Responsabilidades**:
- Validação de regras de negócio
- Orquestração de operações complexas
- Transformação de dados
- Integração com APIs externas

### 3. Acesso a Dados (Data Access Layer)

**Localização**: `/lib/supabase`

Gerencia toda comunicação com o banco de dados.

**Componentes**:
- `client.ts`: Cliente Supabase para browser
- `server.ts`: Cliente Supabase para servidor
- `middleware.ts`: Middleware para autenticação

**Padrões**:
- Repository pattern implícito
- Row Level Security (RLS)
- Realtime subscriptions

### 4. API Layer

**Localização**: `/app/api`

Endpoints REST para comunicação externa e interna.

**Rotas**:
- `/api/admin/*`: Gerenciamento administrativo
- `/api/conversations/*`: Operações de conversas
- `/api/messages/*`: Envio de mensagens
- `/api/webhooks/*`: Recebimento de webhooks
- `/api/queue/*`: Processamento de fila

**Padrões**:
- Validação com Zod
- Autenticação via Supabase
- Tratamento de erros padronizado

## Fluxo de Dados

### Envio de Mensagem

1. Usuário preenche formulário (Client Component)
2. Submissão chama API Route (`/api/messages/send`)
3. API valida dados com Zod
4. API verifica autenticação
5. Service busca contato e instância
6. Service adiciona job à fila
7. Cron processa fila
8. Service envia via Wuzapi
9. Service salva no banco
10. Realtime notifica cliente
11. UI atualiza automaticamente

### Recebimento de Mensagem

1. Wuzapi envia webhook
2. API Route valida payload
3. WebhookService processa mensagem
4. Service busca/cria contato
5. Service salva mensagem
6. Service processa respostas automáticas
7. Realtime notifica clientes conectados
8. UI atualiza automaticamente

### Transferência de Conversa

1. Usuário seleciona conversa e destinatário
2. Client Component chama API
3. API valida permissões
4. ConversationService registra transferência
5. Service atualiza proprietário
6. Service gerencia participantes
7. Banco atualiza via RLS
8. Realtime notifica ambos usuários

## Segurança

### Autenticação

- Supabase Auth com JWT
- Middleware valida tokens
- RLS protege dados no banco

### Autorização

- RLS policies por tabela
- Verificação de proprietário
- Validação de permissões em services

### Validação

- Zod schemas para todos inputs
- Sanitização de dados
- Validação de tipos TypeScript

## Performance

### Otimizações

- Server Components para SSR
- Lazy loading de componentes
- Debounce em buscas
- Pagination em listas
- Índices no banco de dados

### Caching

- SWR para cache de API
- Supabase cache automático
- Static generation quando possível

### Realtime

- Subscriptions filtradas
- Cleanup automático
- Reconexão automática

## Escalabilidade

### Horizontal

- Stateless API Routes
- Fila distribuída
- Realtime via Supabase

### Vertical

- Índices otimizados
- Queries eficientes
- Connection pooling

## Monitoramento

### Logs

- Console logs estruturados
- Tabela `system_logs`
- Tabela `webhooks_log`

### Métricas

- Tabela `system_stats`
- Dashboard de analytics
- Monitoramento de fila

## Deployment

### Vercel

- Deploy automático via Git
- Edge Functions
- Cron Jobs
- Environment Variables

### Supabase

- Database hosting
- Auth service
- Realtime service
- Storage (futuro)

## Diagramas

### Arquitetura Geral

\`\`\`
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│  (Next.js Pages + React Components)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              API Layer                      │
│         (Next.js API Routes)                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Business Logic Layer               │
│            (Services)                       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Data Access Layer                  │
│        (Supabase Client)                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            Database                         │
│         (PostgreSQL)                        │
└─────────────────────────────────────────────┘
\`\`\`

### Fluxo de Mensagem

\`\`\`
User → UI → API → Service → Queue → Worker → Wuzapi → WhatsApp
                                      ↓
                                   Database
                                      ↓
                                  Realtime
                                      ↓
                                     UI
\`\`\`
