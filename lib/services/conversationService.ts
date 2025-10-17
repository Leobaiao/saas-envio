// Serviço para gerenciamento de conversas
import { createServerClient } from "@/lib/supabase/server"
import type {
  Conversation,
  ConversationParticipant,
  ConversationTransfer,
  InboxItem,
  ConversationWithDetails,
  ParticipantType,
} from "@/lib/types/conversation"

export class ConversationService {
  /**
   * Busca todas as conversas do usuário (como proprietário ou participante)
   */
  static async getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("conversas")
      .select(`
        *,
        contato:contatos(id, nome, telefone, email),
        proprietario:profiles!conversas_proprietario_id_fkey(id, nome, email),
        participantes:conversa_participantes(*, user:profiles(id, nome, email))
      `)
      .or(
        `proprietario_id.eq.${userId},id.in.(select conversa_id from conversa_participantes where user_id='${userId}' and is_active=true)`,
      )
      .eq("status", "ativa")
      .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })

    if (error) throw error
    return data as ConversationWithDetails[]
  }

  /**
   * Cria uma nova conversa
   */
  static async createConversation(contatoId: string, proprietarioId: string, notas?: string): Promise<Conversation> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("conversas")
      .insert({
        contato_id: contatoId,
        proprietario_id: proprietarioId,
        notas,
        status: "ativa",
      })
      .select()
      .single()

    if (error) throw error

    // Adiciona o proprietário como participante
    await supabase.from("conversa_participantes").insert({
      conversa_id: data.id,
      user_id: proprietarioId,
      tipo: "proprietario",
      adicionado_por: proprietarioId,
    })

    return data
  }

  /**
   * Transfere a propriedade de uma conversa para outro usuário
   */
  static async transferConversation(
    conversaId: string,
    deUserId: string,
    paraUserId: string,
    motivo?: string,
  ): Promise<ConversationTransfer> {
    const supabase = await createServerClient()

    // Registra a transferência
    const { data: transfer, error: transferError } = await supabase
      .from("conversa_transferencias")
      .insert({
        conversa_id: conversaId,
        de_user_id: deUserId,
        para_user_id: paraUserId,
        motivo,
      })
      .select()
      .single()

    if (transferError) throw transferError

    // Atualiza o proprietário da conversa
    const { error: updateError } = await supabase
      .from("conversas")
      .update({
        proprietario_id: paraUserId,
        status: "transferida",
      })
      .eq("id", conversaId)

    if (updateError) throw updateError

    // Remove o antigo proprietário dos participantes e adiciona o novo
    await supabase
      .from("conversa_participantes")
      .update({ is_active: false, removido_em: new Date().toISOString() })
      .eq("conversa_id", conversaId)
      .eq("user_id", deUserId)

    await supabase.from("conversa_participantes").insert({
      conversa_id: conversaId,
      user_id: paraUserId,
      tipo: "proprietario",
      adicionado_por: deUserId,
    })

    return transfer
  }

  /**
   * Adiciona um participante à conversa (modo "sala de reunião")
   */
  static async addParticipant(
    conversaId: string,
    userId: string,
    tipo: ParticipantType,
    adicionadoPor: string,
  ): Promise<ConversationParticipant> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("conversa_participantes")
      .insert({
        conversa_id: conversaId,
        user_id: userId,
        tipo,
        adicionado_por: adicionadoPor,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Remove um participante da conversa
   */
  static async removeParticipant(conversaId: string, userId: string): Promise<void> {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("conversa_participantes")
      .update({
        is_active: false,
        removido_em: new Date().toISOString(),
      })
      .eq("conversa_id", conversaId)
      .eq("user_id", userId)

    if (error) throw error
  }

  /**
   * Busca itens da caixa de entrada geral (contatos não atribuídos)
   */
  static async getInboxItems(): Promise<InboxItem[]> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("caixa_entrada_geral")
      .select("*")
      .eq("status", "pendente")
      .order("prioridade", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Atribui um item da caixa de entrada para um usuário
   */
  static async assignInboxItem(itemId: string, userId: string): Promise<void> {
    const supabase = await createServerClient()

    // Atualiza o item da caixa de entrada
    const { data: inboxItem, error: inboxError } = await supabase
      .from("caixa_entrada_geral")
      .update({
        status: "atribuido",
        atribuido_para: userId,
        atribuido_em: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single()

    if (inboxError) throw inboxError

    // Cria uma nova conversa para o contato
    await this.createConversation(inboxItem.contato_id, userId)
  }
}
