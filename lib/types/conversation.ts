// Tipos TypeScript para gerenciamento de conversas

export type ConversationStatus = "ativa" | "arquivada" | "transferida"
export type ParticipantType = "proprietario" | "participante" | "observador"
export type InboxStatus = "pendente" | "atribuido" | "ignorado"

export interface Conversation {
  id: string
  contato_id: string
  proprietario_id: string
  status: ConversationStatus
  created_at: string
  updated_at: string
  ultima_mensagem_em?: string
  notas?: string
  metadata?: Record<string, any>
}

export interface ConversationParticipant {
  id: string
  conversa_id: string
  user_id: string
  tipo: ParticipantType
  adicionado_por?: string
  adicionado_em: string
  removido_em?: string
  is_active: boolean
}

export interface ConversationTransfer {
  id: string
  conversa_id: string
  de_user_id: string
  para_user_id: string
  motivo?: string
  transferido_em: string
  metadata?: Record<string, any>
}

export interface InboxItem {
  id: string
  contato_id: string
  mensagem_id?: string
  status: InboxStatus
  atribuido_para?: string
  atribuido_em?: string
  created_at: string
  prioridade: number
}

export interface ConversationWithDetails extends Conversation {
  contato?: {
    id: string
    nome: string
    telefone: string
    email?: string
  }
  proprietario?: {
    id: string
    nome: string
    email: string
  }
  participantes?: ConversationParticipant[]
  ultima_mensagem?: {
    id: string
    conteudo: string
    created_at: string
  }
}
