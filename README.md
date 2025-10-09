# Sistema de Mensagens - Simulação de Envio

Este projeto simula um sistema de mensagens com envio individual (chat) e envio em massa (campanhas).

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Baixe o projeto** clicando nos três pontos no canto superior direito e selecionando "Download ZIP"

2. **Extraia o arquivo ZIP** e navegue até a pasta do projeto

3. **Instale as dependências:**

\`\`\`bash
npm install
\`\`\`

ou

\`\`\`bash
yarn install
\`\`\`

### Executando o Projeto

1. **Inicie o servidor de desenvolvimento:**

\`\`\`bash
npm run dev
\`\`\`

ou

\`\`\`bash
yarn dev
\`\`\`

2. **Abra o navegador** e acesse: `http://localhost:3000`

## 📱 Funcionalidades

### 1. Envio de Mensagem Individual (Chat)

**Página:** `/chat`

**Como usar:**
- Digite sua mensagem no campo de texto na parte inferior
- Clique em "Enviar" ou pressione Enter
- A mensagem será adicionada à conversa com simulação de envio (1 segundo de delay)
- Feedback visual mostra o status: "Enviando...", "Sucesso" ou "Erro"

**Código explicado:**
- `useState` gerencia o estado da mensagem e lista de mensagens
- `handleSendMessage` simula o envio com delay assíncrono
- Validação impede envio de mensagens vazias
- Timestamp automático para cada mensagem

### 2. Envio em Massa (Campanhas)

**Página:** `/campanhas`

**Como usar:**
1. Selecione uma ou mais listas de contatos (checkboxes)
2. Digite a mensagem no campo de texto
3. Clique em "Enviar Mensagens"
4. Acompanhe o progresso em tempo real:
   - Barra de progresso (0-100%)
   - Estatísticas: Total, Enviadas, Falhas
   - Taxa de sucesso simulada: 95%

**Código explicado:**
- `selectedLists` armazena IDs das listas selecionadas
- `getTotalContacts` calcula total de destinatários
- `handleSendMassMessages` simula envio progressivo com loop
- Atualização de progresso a cada 50ms
- Estatísticas em tempo real de sucesso/falha

## 🎨 Estrutura do Código

### Estados Principais (useState)

\`\`\`typescript
// Chat Individual
const [messageInput, setMessageInput] = useState("") // Texto digitado
const [messages, setMessages] = useState([...]) // Lista de mensagens
const [sendingStatus, setSendingStatus] = useState("idle") // Status do envio

// Campanha em Massa
const [selectedLists, setSelectedLists] = useState<number[]>([]) // Listas selecionadas
const [messageText, setMessageText] = useState("") // Texto da mensagem
const [sendingProgress, setSendingProgress] = useState(0) // Progresso 0-100
const [sendStats, setSendStats] = useState({...}) // Estatísticas
\`\`\`

### Funções Principais

- `handleSendMessage()` - Envia mensagem individual
- `handleSendMassMessages()` - Envia campanha em massa
- `toggleListSelection()` - Seleciona/deseleciona listas
- `getTotalContacts()` - Calcula total de contatos

## 🔧 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **React Hooks** - Gerenciamento de estado

## 📝 Notas

- Todos os envios são **simulados** (não há backend real)
- Delays simulam latência de rede realista
- Taxa de falha de 5% simula cenários reais
- Código totalmente comentado em português
