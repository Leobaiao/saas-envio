# Guia de Cores Semânticas

## Visão Geral

Este documento descreve o sistema de cores semânticas implementado no projeto, substituindo cores hardcoded (como `bg-blue-500`, `text-red-600`) por tokens semânticos que suportam temas e garantem consistência visual.

## Tokens de Cores Disponíveis

### Cores Base

| Token | Uso | Exemplo |
|-------|-----|---------|
| `bg-background` | Fundo principal da aplicação | Páginas, containers principais |
| `text-foreground` | Texto principal | Títulos, parágrafos, conteúdo |
| `bg-card` | Fundo de cards e painéis | Cards, modais, painéis |
| `text-card-foreground` | Texto em cards | Conteúdo dentro de cards |

### Cores de Interação

| Token | Uso | Exemplo |
|-------|-----|---------|
| `bg-primary` | Ação principal | Botões primários, links importantes |
| `text-primary-foreground` | Texto em elementos primários | Texto em botões primários |
| `bg-secondary` | Ação secundária | Botões secundários, badges |
| `text-secondary-foreground` | Texto em elementos secundários | Texto em botões secundários |

### Cores de Estado

| Token | Uso | Exemplo |
|-------|-----|---------|
| `bg-muted` | Elementos desabilitados/inativos | Inputs desabilitados, texto secundário |
| `text-muted-foreground` | Texto secundário | Labels, descrições, placeholders |
| `bg-accent` | Destaque sutil | Hover states, elementos destacados |
| `text-accent-foreground` | Texto em elementos de destaque | Texto em elementos com bg-accent |

### Cores de Feedback

| Token | Uso | Exemplo |
|-------|-----|---------|
| `border-destructive` / `text-destructive` | Erros, ações destrutivas | Mensagens de erro, botões de deletar |
| `bg-[color:var(--color-success)]` | Sucesso | Mensagens de sucesso, status positivo |
| `bg-[color:var(--color-warning)]` | Avisos | Alertas, status pendente |
| `bg-[color:var(--color-info)]` | Informação | Mensagens informativas, status neutro |
| `bg-[color:var(--color-error)]` | Erro | Mensagens de erro, status negativo |

### Cores de Borda e Input

| Token | Uso | Exemplo |
|-------|-----|---------|
| `border-border` | Bordas padrão | Divisores, bordas de cards |
| `border-input` | Bordas de inputs | Campos de formulário |
| `border-ring` | Foco em elementos | Focus states, outline |

### Cores da Sidebar

| Token | Uso | Exemplo |
|-------|-----|---------|
| `bg-sidebar` | Fundo da sidebar | Barra lateral de navegação |
| `text-sidebar-foreground` | Texto na sidebar | Links, labels na sidebar |
| `bg-sidebar-primary` | Item ativo na sidebar | Link ativo |
| `border-sidebar-border` | Bordas na sidebar | Divisores na sidebar |

## Cores de Feedback com Variantes

Para estados de sucesso, aviso, informação e erro, use as variantes muted para fundos:

\`\`\`tsx
// Sucesso
<div className="border-2 border-[color:var(--color-success)] bg-[color:var(--color-success-muted)]">
  <p className="text-[color:var(--color-success)]">Operação realizada com sucesso!</p>
</div>

// Aviso
<div className="border-2 border-[color:var(--color-warning)] bg-[color:var(--color-warning-muted)]">
  <p className="text-[color:var(--color-warning)]">Atenção: verifique os dados</p>
</div>

// Informação
<div className="border-2 border-[color:var(--color-info)] bg-[color:var(--color-info-muted)]">
  <p className="text-[color:var(--color-info)]">Mensagem lida</p>
</div>

// Erro
<div className="border-2 border-destructive bg-[color:var(--color-error-muted)]">
  <p className="text-destructive">Erro ao processar</p>
</div>
\`\`\`

## Exemplos de Uso

### Botões

\`\`\`tsx
// Botão primário
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Salvar
</button>

// Botão secundário
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
  Cancelar
</button>

// Botão destrutivo
<button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Deletar
</button>
\`\`\`

### Cards

\`\`\`tsx
<div className="bg-card border-2 border-border p-6">
  <h2 className="text-foreground font-bold">Título do Card</h2>
  <p className="text-muted-foreground">Descrição do conteúdo</p>
</div>
\`\`\`

### Inputs

\`\`\`tsx
<input 
  className="border-2 border-input bg-background text-foreground focus:border-ring"
  placeholder="Digite aqui..."
/>
\`\`\`

### Status Badges

\`\`\`tsx
// Status de sucesso
<span className="border border-[color:var(--color-success)] bg-[color:var(--color-success-muted)] text-[color:var(--color-success)] px-2 py-1">
  Ativo
</span>

// Status de erro
<span className="border border-destructive bg-[color:var(--color-error-muted)] text-destructive px-2 py-1">
  Inativo
</span>
\`\`\`

## Benefícios

1. **Consistência**: Todas as cores seguem o mesmo sistema
2. **Manutenibilidade**: Alterar cores em um único lugar (globals.css)
3. **Temas**: Suporte automático para dark mode
4. **Acessibilidade**: Contraste adequado garantido pelos tokens
5. **Escalabilidade**: Fácil adicionar novos tokens conforme necessário

## Migração de Cores Antigas

| Antes (Hardcoded) | Depois (Semântico) |
|-------------------|-------------------|
| `bg-blue-500` | `bg-primary` ou `bg-[color:var(--color-info)]` |
| `bg-green-600` | `bg-[color:var(--color-success)]` |
| `bg-red-600` | `bg-destructive` ou `bg-[color:var(--color-error)]` |
| `bg-yellow-600` | `bg-[color:var(--color-warning)]` |
| `bg-gray-50` | `bg-muted` ou `bg-background` |
| `bg-white` | `bg-card` ou `bg-background` |
| `text-gray-600` | `text-muted-foreground` |
| `text-black` | `text-foreground` |

## Próximos Passos

- [ ] Migrar componentes restantes para cores semânticas
- [ ] Implementar dark mode completo
- [ ] Adicionar mais variantes de cores se necessário
- [ ] Criar componentes reutilizáveis com cores semânticas
