# Sistema de Gestão de Mensagens WhatsApp

Plataforma completa para gerenciamento de mensagens WhatsApp com suporte a múltiplas instâncias, conversas colaborativas, campanhas em massa, e automações.

## Funcionalidades Principais

### Gerenciamento de Instâncias
- Conexão com múltiplas instâncias Wuzapi
- QR Code para autenticação
- Monitoramento de status em tempo real
- Gerenciamento de webhooks

### Sistema de Conversas
- Caixa de entrada compartilhada
- Atribuição de conversas
- Transferência entre usuários
- Modo "sala de reunião" com múltiplos participantes
- Observadores para supervisão

### Envio de Mensagens
- Chat individual em tempo real
- Suporte a mídia (imagens, vídeos, PDFs)
- Agendamento de mensagens
- Templates com variáveis
- Respostas automáticas

### Campanhas
- Envio em massa para listas
- Acompanhamento de progresso em tempo real
- Agendamento de campanhas
- Estatísticas detalhadas

### Sistema de Fila
- Processamento assíncrono
- Retry automático em falhas
- Monitoramento de jobs
- Cron jobs para processamento

## Instalação

### Pré-requisitos

- Node.js 18+
- Conta Supabase
- Instância Wuzapi configurada

### 1. Clone o Projeto

\`\`\`bash
git clone <seu-repositorio>
cd saas-envio
\`\`\`

### 2. Instale Dependências

\`\`\`bash
npm install
\`\`\`

### 3. Configure Variáveis de Ambiente

Crie um arquivo `.env.local` ou configure no Vercel:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Wuzapi
WUZAPI_BASE_URL=https://api.wuzapi.com
WHATSAPP_VERIFY_TOKEN=seu-token-secreto

# Cron (para processamento de fila)
CRON_SECRET=seu-cron-secret

# Redirect (desenvolvimento)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### 4. Execute Scripts SQL

Execute os scripts na pasta `/scripts` no Supabase SQL Editor na ordem:

\`\`\`sql
001_initial_schema.sql
002_conversations.sql
003_instances.sql
004_queue_system.sql
-- ... demais scripts
\`\`\`

### 5. Inicie o Servidor

\`\`\`bash
npm run dev
\`\`\`

Acesse: `http://localhost:3000`

## Estrutura do Projeto

\`\`\`
├── app/
│   ├── admin/              # Painel administrativo
│   ├── api/                # API Routes
│   │   ├── admin/          # Gerenciamento de instâncias
│   │   ├── conversations/  # Operações de conversas
│   │   ├── messages/       # Envio de mensagens
│   │   ├── queue/          # Processamento de fila
│   │   └── webhooks/       # Recebimento de webhooks
│   ├── auth/               # Autenticação
│   ├── campanhas/          # Campanhas
│   ├── chat/               # Chat individual
│   ├── contatos/           # Gerenciamento de contatos
│   ├── conversas/          # Gerenciamento de conversas
│   └── dashboard/          # Dashboard principal
├── components/
│   ├── ui/                 # Componentes de UI
│   └── ...                 # Componentes específicos
├── lib/
│   ├── hooks/              # Hooks customizados
│   ├── services/           # Lógica de negócio
│   │   ├── conversationService.ts
│   │   ├── queueService.ts
│   │   ├── webhookService.ts
│   │   └── wuzapiService.ts
│   ├── supabase/           # Cliente Supabase
│   └── types/              # Tipos TypeScript
└── scripts/                # Scripts SQL
\`\`\`

## Uso

### 1. Configurar Instância Wuzapi

1. Acesse `/admin`
2. Clique em "Adicionar Instância"
3. Preencha os dados da API Wuzapi
4. Clique em "QR Code" e escaneie com WhatsApp
5. Aguarde conexão

### 2. Gerenciar Contatos

1. Acesse `/contatos`
2. Adicione contatos manualmente ou importe CSV
3. Organize em listas
4. Vincule a campanhas

### 3. Enviar Mensagens

#### Individual
1. Acesse `/chat`
2. Selecione contato
3. Digite mensagem
4. Envie ou agende

#### Campanha
1. Acesse `/campanhas`
2. Crie nova campanha
3. Selecione listas
4. Escreva mensagem
5. Envie ou agende

### 4. Gerenciar Conversas

1. Acesse `/conversas`
2. Atribua conversas da caixa de entrada
3. Transfira para outros usuários
4. Adicione participantes/observadores

### 5. Configurar Automações

#### Templates
1. Acesse `/templates`
2. Crie template com variáveis
3. Use no chat com substituição automática

#### Respostas Automáticas
1. Acesse `/respostas-automaticas`
2. Defina gatilho (palavra-chave)
3. Configure resposta
4. Ative

## API

### Endpoints Principais

#### Enviar Mensagem
\`\`\`bash
POST /api/messages/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "contato_id": "uuid",
  "conteudo": "Mensagem",
  "agendada_para": "2025-01-20T10:00:00Z" // opcional
}
\`\`\`

#### Transferir Conversa
\`\`\`bash
POST /api/conversations/transfer
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversaId": "uuid",
  "paraUserId": "uuid",
  "motivo": "Transferência"
}
\`\`\`

#### Processar Fila (Cron)
\`\`\`bash
POST /api/queue/process
Authorization: Bearer <cron-secret>
\`\`\`

## Webhook

Configure o webhook na Wuzapi:

\`\`\`
URL: https://seu-dominio.com/api/webhooks/whatsapp
Eventos: message.received, message.status
\`\`\`

O sistema processa automaticamente:
- Mensagens recebidas
- Status de mensagens (entregue, lida)
- Criação de contatos
- Respostas automáticas

## Deploy

### Vercel

1. Conecte repositório no Vercel
2. Configure variáveis de ambiente
3. Configure cron job:

\`\`\`json
{
  "crons": [{
    "path": "/api/queue/process",
    "schedule": "*/5 * * * *"
  }]
}
\`\`\`

4. Deploy

### Supabase

1. Crie projeto no Supabase
2. Execute scripts SQL
3. Configure RLS policies
4. Ative Realtime nas tabelas necessárias

## Monitoramento

### Logs

Acesse as tabelas no Supabase:
- `system_logs` - Logs gerais
- `webhooks_log` - Logs de webhooks
- `queue_jobs` - Status da fila

### Estatísticas

\`\`\`sql
-- Mensagens por dia
SELECT DATE(enviada_em), COUNT(*) 
FROM mensagens 
GROUP BY DATE(enviada_em);

-- Taxa de sucesso de campanhas
SELECT 
  nome,
  enviadas,
  falhas,
  (enviadas::float / (enviadas + falhas) * 100) as taxa_sucesso
FROM campanhas;

-- Jobs na fila
SELECT status, COUNT(*) 
FROM queue_jobs 
GROUP BY status;
\`\`\`

## Troubleshooting

### Mensagens não enviam
1. Verificar instância conectada em `/admin`
2. Ver logs em `queue_jobs`
3. Testar API Wuzapi diretamente

### Webhook não recebe
1. Verificar URL configurada na Wuzapi
2. Testar endpoint: `GET /api/webhooks/whatsapp?secret=<token>`
3. Ver logs em `webhooks_log`

### Realtime não atualiza
1. Verificar RLS policies no Supabase
2. Ver console do navegador
3. Verificar conexão em Network tab

## Documentação Adicional

- [Arquitetura](./ARCHITECTURE.md) - Detalhes da arquitetura
- [Webhooks](./WEBHOOK_SETUP.md) - Configuração de webhooks
- [Fila e Realtime](./QUEUE_REALTIME.md) - Sistema de fila
- [Testes](./TESTING_GUIDE.md) - Guia de testes

## Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Supabase** - Backend (PostgreSQL + Auth + Realtime)
- **Tailwind CSS v4** - Estilização
- **Zod** - Validação de schemas
- **SWR** - Cache e fetching
- **Wuzapi** - API WhatsApp

## Suporte

Para problemas ou dúvidas:
1. Verifique a documentação
2. Consulte os logs no Supabase
3. Abra uma issue no repositório

## Licença

MIT
