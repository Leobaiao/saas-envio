# Guia de Testes

## Testes Manuais

### 1. Autenticação

#### Registro
- [ ] Acessar `/auth/registrar`
- [ ] Preencher todos os campos
- [ ] Submeter formulário
- [ ] Verificar email de confirmação
- [ ] Confirmar email
- [ ] Fazer login

#### Login
- [ ] Acessar `/`
- [ ] Inserir credenciais válidas
- [ ] Verificar redirecionamento para `/dashboard`
- [ ] Verificar sessão persistente

#### Recuperação de Senha
- [ ] Acessar `/auth/recuperar-senha`
- [ ] Inserir email cadastrado
- [ ] Verificar email recebido
- [ ] Clicar no link
- [ ] Redefinir senha
- [ ] Fazer login com nova senha

### 2. Gerenciamento de Instâncias

#### Adicionar Instância
- [ ] Acessar `/admin`
- [ ] Clicar em "Adicionar Instância"
- [ ] Preencher dados da Wuzapi
- [ ] Verificar teste de conexão
- [ ] Salvar instância
- [ ] Verificar na lista

#### Conectar WhatsApp
- [ ] Clicar em "QR Code"
- [ ] Verificar geração do QR
- [ ] Escanear com WhatsApp
- [ ] Aguardar conexão
- [ ] Verificar status "connected"

#### Verificar Status
- [ ] Clicar em "Verificar Status"
- [ ] Verificar atualização em tempo real
- [ ] Confirmar número de telefone

### 3. Gerenciamento de Contatos

#### Adicionar Contato Manual
- [ ] Acessar `/contatos`
- [ ] Clicar em "Adicionar Contato"
- [ ] Preencher dados
- [ ] Salvar
- [ ] Verificar na lista

#### Importar CSV
- [ ] Preparar arquivo CSV
- [ ] Clicar em "Importar CSV"
- [ ] Selecionar arquivo
- [ ] Mapear colunas
- [ ] Importar
- [ ] Verificar contatos importados

#### Vincular a Lista
- [ ] Selecionar contato
- [ ] Clicar em "Adicionar a Lista"
- [ ] Selecionar lista
- [ ] Confirmar
- [ ] Verificar vínculo

### 4. Envio de Mensagens

#### Mensagem Individual
- [ ] Acessar `/chat`
- [ ] Selecionar contato
- [ ] Digitar mensagem
- [ ] Clicar em "Enviar"
- [ ] Verificar status "enviada"
- [ ] Aguardar status "entregue"

#### Mensagem com Mídia
- [ ] Clicar no ícone de anexo
- [ ] Selecionar imagem/vídeo/PDF
- [ ] Verificar preview
- [ ] Adicionar legenda
- [ ] Enviar
- [ ] Verificar recebimento

#### Mensagem Agendada
- [ ] Clicar no ícone de relógio
- [ ] Selecionar data futura
- [ ] Selecionar hora
- [ ] Digitar mensagem
- [ ] Clicar em "Agendar"
- [ ] Verificar em "Mensagens Agendadas"

### 5. Campanhas

#### Criar Campanha
- [ ] Acessar `/campanhas`
- [ ] Clicar em "Nova Campanha"
- [ ] Preencher nome
- [ ] Escrever mensagem
- [ ] Selecionar listas
- [ ] Criar campanha
- [ ] Verificar na lista

#### Acompanhar Progresso
- [ ] Abrir campanha em andamento
- [ ] Verificar barra de progresso
- [ ] Verificar contadores
- [ ] Aguardar conclusão
- [ ] Verificar estatísticas finais

#### Campanha Agendada
- [ ] Criar nova campanha
- [ ] Marcar "Agendar"
- [ ] Selecionar data/hora
- [ ] Salvar
- [ ] Verificar status "agendada"

### 6. Conversas

#### Atribuir da Caixa de Entrada
- [ ] Acessar `/conversas`
- [ ] Ver item na caixa de entrada
- [ ] Clicar em "Atribuir para Mim"
- [ ] Verificar criação de conversa
- [ ] Verificar remoção da caixa

#### Transferir Conversa
- [ ] Selecionar conversa
- [ ] Clicar em "Transferir"
- [ ] Selecionar usuário destino
- [ ] Adicionar motivo
- [ ] Confirmar
- [ ] Verificar transferência

#### Modo Sala de Reunião
- [ ] Abrir conversa
- [ ] Clicar em "Participantes"
- [ ] Adicionar usuário
- [ ] Selecionar tipo (participante/observador)
- [ ] Confirmar
- [ ] Verificar na lista
- [ ] Remover participante
- [ ] Verificar remoção

### 7. Templates

#### Criar Template
- [ ] Acessar `/templates`
- [ ] Clicar em "Novo Template"
- [ ] Preencher nome
- [ ] Selecionar categoria
- [ ] Escrever conteúdo com variáveis
- [ ] Salvar
- [ ] Verificar na lista

#### Usar Template
- [ ] Ir para chat
- [ ] Clicar em "Templates"
- [ ] Selecionar template
- [ ] Preencher variáveis
- [ ] Verificar preview
- [ ] Enviar

### 8. Respostas Automáticas

#### Configurar Resposta
- [ ] Acessar `/respostas-automaticas`
- [ ] Clicar em "Nova Resposta"
- [ ] Definir gatilho
- [ ] Escrever resposta
- [ ] Ativar
- [ ] Salvar

#### Testar Resposta
- [ ] Enviar mensagem com gatilho
- [ ] Aguardar resposta automática
- [ ] Verificar na conversa
- [ ] Verificar contador de uso

### 9. Webhook

#### Testar Recebimento
- [ ] Enviar mensagem para o WhatsApp conectado
- [ ] Verificar log em `webhooks_log`
- [ ] Verificar criação de mensagem
- [ ] Verificar atualização de contato
- [ ] Verificar resposta automática (se aplicável)

#### Testar Status
- [ ] Enviar mensagem do sistema
- [ ] Aguardar webhook de status
- [ ] Verificar atualização para "entregue"
- [ ] Abrir mensagem no WhatsApp
- [ ] Verificar atualização para "lida"

### 10. Fila

#### Verificar Processamento
- [ ] Criar campanha grande
- [ ] Verificar criação de jobs
- [ ] Aguardar processamento
- [ ] Verificar conclusão
- [ ] Verificar estatísticas

#### Testar Retry
- [ ] Desconectar instância
- [ ] Tentar enviar mensagem
- [ ] Verificar job com falha
- [ ] Reconectar instância
- [ ] Aguardar retry automático
- [ ] Verificar sucesso

## Testes de API

### Usando cURL

#### Enviar Mensagem
\`\`\`bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "contato_id": "uuid-do-contato",
    "conteudo": "Teste de API"
  }'
\`\`\`

#### Transferir Conversa
\`\`\`bash
curl -X POST http://localhost:3000/api/conversations/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "conversaId": "uuid-da-conversa",
    "paraUserId": "uuid-do-usuario",
    "motivo": "Teste"
  }'
\`\`\`

#### Processar Fila
\`\`\`bash
curl -X POST http://localhost:3000/api/queue/process \
  -H "Authorization: Bearer SEU_CRON_SECRET"
\`\`\`

#### Webhook
\`\`\`bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message.received",
    "instanceId": "test",
    "data": {
      "from": "5511999999999@c.us",
      "to": "5511888888888@c.us",
      "body": "Teste",
      "type": "chat",
      "timestamp": 1234567890,
      "id": "test-id",
      "sender": {
        "name": "Teste"
      }
    }
  }'
\`\`\`

## Checklist de Deploy

### Pré-Deploy
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Scripts SQL executados
- [ ] Instância Wuzapi configurada
- [ ] Webhook configurado
- [ ] Cron job configurado

### Pós-Deploy
- [ ] Testar login
- [ ] Testar envio de mensagem
- [ ] Testar recebimento via webhook
- [ ] Verificar logs
- [ ] Testar fila
- [ ] Verificar realtime

## Troubleshooting

### Mensagem não envia
1. Verificar instância conectada
2. Ver logs em `mensagens`
3. Verificar fila em `queue_jobs`
4. Testar API Wuzapi diretamente

### Webhook não recebe
1. Verificar URL configurada
2. Testar endpoint manualmente
3. Ver logs em `webhooks_log`
4. Verificar token

### Realtime não atualiza
1. Verificar RLS
2. Ver console do navegador
3. Testar subscription manualmente
4. Verificar filtros

### Fila não processa
1. Verificar cron configurado
2. Testar endpoint manualmente
3. Ver jobs em `queue_jobs`
4. Verificar logs de erro
