# Configuração de Webhooks - Guia Completo

## Visão Geral

Este documento explica como configurar e usar os webhooks do sistema para receber mensagens do WhatsApp via Wuzapi.

## Endpoint do Webhook

\`\`\`
POST https://seu-dominio.com/api/webhooks/whatsapp
\`\`\`

## Autenticação

O webhook usa um token secreto para verificação. Configure a variável de ambiente:

\`\`\`env
WHATSAPP_VERIFY_TOKEN=seu_token_super_secreto
\`\`\`

### Verificação do Webhook (GET)

Para verificar se o webhook está configurado corretamente:

\`\`\`
GET https://seu-dominio.com/api/webhooks/whatsapp?secret=seu_token_super_secreto
\`\`\`

Resposta esperada:
\`\`\`json
{
  "success": true,
  "message": "Webhook verificado"
}
\`\`\`

## Estrutura do Payload

### Mensagem Recebida

\`\`\`json
{
  "event": "message.received",
  "instanceId": "instance-123",
  "data": {
    "from": "5511999999999@c.us",
    "to": "5511888888888@c.us",
    "body": "Olá, preciso de ajuda!",
    "type": "chat",
    "timestamp": 1234567890,
    "id": "msg-unique-id",
    "sender": {
      "name": "João Silva",
      "pushname": "João"
    }
  }
}
\`\`\`

### Status de Mensagem

\`\`\`json
{
  "event": "message.status",
  "instanceId": "instance-123",
  "data": {
    "id": "msg-unique-id",
    "status": "delivered",
    "timestamp": 1234567890
  }
}
\`\`\`

Status possíveis:
- `delivered` - Mensagem entregue
- `read` - Mensagem lida
- `failed` - Falha no envio

## Processamento Automático

O webhook processa automaticamente:

1. **Criação de Contatos**: Se o número não existir, cria um novo contato
2. **Registro de Mensagens**: Salva todas as mensagens recebidas no banco
3. **Respostas Automáticas**: Verifica e envia respostas automáticas configuradas
4. **Atualização de Status**: Atualiza o status das mensagens enviadas
5. **Logs**: Registra todos os webhooks recebidos para auditoria

## Configuração na Wuzapi

1. Acesse o painel da Wuzapi
2. Vá em Configurações > Webhooks
3. Adicione a URL do webhook: `https://seu-dominio.com/api/webhooks/whatsapp`
4. Configure os eventos:
   - `message.received` - Mensagens recebidas
   - `message.status` - Status de mensagens
5. Salve as configurações

## Testando o Webhook

### Usando cURL

\`\`\`bash
curl -X POST https://seu-dominio.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "instanceId": "test-instance",
    "data": {
      "from": "5511999999999@c.us",
      "to": "5511888888888@c.us",
      "body": "Teste de webhook",
      "type": "chat",
      "timestamp": 1234567890,
      "id": "test-msg-id",
      "sender": {
        "name": "Teste",
        "pushname": "Teste"
      }
    }
  }'
\`\`\`

### Verificando Logs

Acesse a tabela `webhooks_log` no Supabase para ver todos os webhooks recebidos:

\`\`\`sql
SELECT * FROM webhooks_log 
ORDER BY created_at DESC 
LIMIT 10;
\`\`\`

## Troubleshooting

### Webhook não está recebendo mensagens

1. Verifique se a URL está correta na configuração da Wuzapi
2. Confirme que o domínio está acessível publicamente
3. Verifique os logs de erro no Supabase
4. Teste a URL manualmente com cURL

### Mensagens não estão sendo salvas

1. Verifique se a instância está ativa no banco de dados
2. Confirme que o `instanceId` no payload corresponde ao cadastrado
3. Verifique os logs da tabela `webhooks_log` para ver erros

### Respostas automáticas não funcionam

1. Verifique se há respostas automáticas ativas para o usuário
2. Confirme que o gatilho está correto (case-insensitive)
3. Verifique se a instância está conectada e ativa
4. Veja os logs de erro no console

## Segurança

- Sempre use HTTPS em produção
- Mantenha o token secreto seguro
- Valide todos os payloads recebidos
- Monitore logs de webhooks suspeitos
- Implemente rate limiting se necessário

## Monitoramento

Recomendamos monitorar:

- Taxa de sucesso de webhooks processados
- Tempo de resposta do endpoint
- Erros e exceções
- Volume de mensagens recebidas

Use a query SQL para estatísticas:

\`\`\`sql
SELECT 
  DATE(created_at) as data,
  COUNT(*) as total,
  SUM(CASE WHEN processado THEN 1 ELSE 0 END) as processados,
  SUM(CASE WHEN erro IS NOT NULL THEN 1 ELSE 0 END) as erros
FROM webhooks_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
