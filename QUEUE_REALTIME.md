# Sistema de Fila e Atualizações em Tempo Real

## Visão Geral

Este documento explica o sistema de fila de mensagens e atualizações em tempo real implementado na plataforma.

## Sistema de Fila

### Arquitetura

O sistema de fila usa o Supabase como backend para armazenar e processar jobs de forma assíncrona. Isso permite:

- Envio de mensagens em massa sem travar a aplicação
- Retry automático em caso de falhas
- Processamento em background
- Monitoramento de progresso em tempo real

### Tipos de Jobs

1. **envio_mensagem**: Envio de mensagem individual
2. **envio_campanha**: Envio de campanha para múltiplos contatos
3. **processamento_webhook**: Processamento de webhooks em background

### Adicionando Jobs à Fila

\`\`\`typescript
import { QueueService } from '@/lib/services/queueService'

// Adicionar mensagem à fila
await QueueService.addJob('envio_mensagem', {
  contato_id: 'uuid-do-contato',
  conteudo: 'Olá!',
  user_id: 'uuid-do-usuario',
  instance_id: 'uuid-da-instancia'
})

// Adicionar campanha à fila
await QueueService.addJob('envio_campanha', {
  campanha_id: 'uuid-da-campanha',
  contatos_ids: ['uuid1', 'uuid2', 'uuid3'],
  mensagem: 'Mensagem da campanha',
  user_id: 'uuid-do-usuario',
  instance_id: 'uuid-da-instancia'
}, 5) // 5 tentativas máximas
\`\`\`

### Processamento da Fila

A fila é processada automaticamente via cron job. Configure no Vercel:

\`\`\`json
{
  "crons": [{
    "path": "/api/queue/process",
    "schedule": "*/5 * * * *"
  }]
}
\`\`\`

Ou use um serviço externo como cron-job.org:

\`\`\`bash
curl -X POST https://seu-dominio.com/api/queue/process \
  -H "Authorization: Bearer seu-token-secreto"
\`\`\`

### Monitoramento

Consultar jobs na fila:

\`\`\`sql
-- Jobs pendentes
SELECT * FROM queue_jobs 
WHERE status = 'pendente' 
ORDER BY created_at;

-- Jobs com falha
SELECT * FROM queue_jobs 
WHERE status = 'falha' 
ORDER BY created_at DESC;

-- Estatísticas
SELECT 
  status,
  COUNT(*) as total,
  AVG(tentativas) as media_tentativas
FROM queue_jobs
GROUP BY status;
\`\`\`

### Limpeza Automática

Jobs concluídos ou com falha são mantidos por 7 dias. Para limpar manualmente:

\`\`\`sql
SELECT limpar_queue_jobs_antigos();
\`\`\`

## Atualizações em Tempo Real

### Supabase Realtime

O sistema usa Supabase Realtime para atualizações instantâneas sem polling.

### Hooks Disponíveis

#### useRealtimeMessages

Monitora mensagens de um contato em tempo real:

\`\`\`typescript
import { useRealtimeMessages } from '@/lib/hooks/useRealtime'

function ChatComponent({ contatoId }: { contatoId: string }) {
  const { messages, isConnected } = useRealtimeMessages(contatoId)
  
  return (
    <div>
      {isConnected && <span>Conectado</span>}
      {messages.map(msg => (
        <div key={msg.id}>{msg.conteudo}</div>
      ))}
    </div>
  )
}
\`\`\`

#### useRealtimeCampaigns

Monitora campanhas do usuário em tempo real:

\`\`\`typescript
import { useRealtimeCampaigns } from '@/lib/hooks/useRealtime'

function CampaignsComponent({ userId }: { userId: string }) {
  const { campaigns } = useRealtimeCampaigns(userId)
  
  return (
    <div>
      {campaigns.map(camp => (
        <div key={camp.id}>
          {camp.nome} - {camp.progress}%
        </div>
      ))}
    </div>
  )
}
\`\`\`

### Eventos Suportados

- **INSERT**: Nova mensagem/campanha criada
- **UPDATE**: Mensagem/campanha atualizada (status, progresso)
- **DELETE**: Mensagem/campanha deletada

### Performance

O Realtime do Supabase é otimizado para:
- Baixa latência (< 100ms)
- Reconexão automática
- Filtros server-side
- Broadcast eficiente

### Limitações

- Máximo de 100 conexões simultâneas por cliente (plano gratuito)
- Mensagens maiores que 250KB não são suportadas
- Rate limit de 100 mensagens/segundo

## Boas Práticas

### Fila

1. Use jobs para operações que podem falhar (envio de mensagens)
2. Configure retry adequado baseado na criticidade
3. Monitore jobs com falha regularmente
4. Implemente alertas para falhas críticas
5. Limpe jobs antigos periodicamente

### Realtime

1. Sempre limpe subscriptions no cleanup do useEffect
2. Use filtros para reduzir tráfego desnecessário
3. Implemente fallback para quando realtime falhar
4. Teste reconexão em ambientes instáveis
5. Monitore número de conexões ativas

## Troubleshooting

### Fila não está processando

1. Verifique se o cron job está configurado
2. Confirme que o token de autorização está correto
3. Veja logs de erro na tabela queue_jobs
4. Verifique se há jobs travados em "processando"

### Realtime não atualiza

1. Verifique se RLS está configurado corretamente
2. Confirme que o usuário tem permissão para ler a tabela
3. Teste a conexão manualmente no console
4. Verifique se há erros no console do navegador

### Performance degradada

1. Reduza número de subscriptions simultâneas
2. Use filtros mais específicos
3. Implemente debounce para atualizações frequentes
4. Considere pagination para grandes volumes
