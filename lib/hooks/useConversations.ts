// Hook customizado para gerenciar conversas
"use client"

import { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { ConversationWithDetails, InboxItem } from "@/lib/types/conversation"

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient()

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data, error } = await supabase
        .from("conversas")
        .select(`
          *,
          contato:contatos(id, nome, telefone, email),
          proprietario:profiles!conversas_proprietario_id_fkey(id, nome, email),
          participantes:conversa_participantes(*, user:profiles(id, nome, email))
        `)
        .or(
          `proprietario_id.eq.${user.id},id.in.(select conversa_id from conversa_participantes where user_id='${user.id}' and is_active=true)`,
        )
        .eq("status", "ativa")
        .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })

      if (error) throw error
      setConversations(data as ConversationWithDetails[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conversas")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const fetchInboxItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("caixa_entrada_geral")
        .select("*, contato:contatos(id, nome, telefone)")
        .eq("status", "pendente")
        .order("prioridade", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setInboxItems(data)
    } catch (err) {
      console.error("Erro ao carregar caixa de entrada:", err)
    }
  }, [supabase])

  const transferConversation = useCallback(
    async (conversaId: string, paraUserId: string, motivo?: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        const response = await fetch("/api/conversations/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversaId, paraUserId, motivo }),
        })

        if (!response.ok) throw new Error("Erro ao transferir conversa")

        await fetchConversations()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao transferir conversa")
        return false
      }
    },
    [supabase, fetchConversations],
  )

  const addParticipant = useCallback(
    async (conversaId: string, userId: string, tipo: "participante" | "observador") => {
      try {
        const response = await fetch("/api/conversations/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversaId, userId, tipo }),
        })

        if (!response.ok) throw new Error("Erro ao adicionar participante")

        await fetchConversations()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao adicionar participante")
        return false
      }
    },
    [fetchConversations],
  )

  const removeParticipant = useCallback(
    async (conversaId: string, userId: string) => {
      try {
        const response = await fetch("/api/conversations/participants", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversaId, userId }),
        })

        if (!response.ok) throw new Error("Erro ao remover participante")

        await fetchConversations()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao remover participante")
        return false
      }
    },
    [fetchConversations],
  )

  const assignInboxItem = useCallback(
    async (itemId: string, userId: string) => {
      try {
        const response = await fetch("/api/conversations/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, userId }),
        })

        if (!response.ok) throw new Error("Erro ao atribuir conversa")

        await Promise.all([fetchConversations(), fetchInboxItems()])
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atribuir conversa")
        return false
      }
    },
    [fetchConversations, fetchInboxItems],
  )

  useEffect(() => {
    fetchConversations()
    fetchInboxItems()

    // Subscrição em tempo real para atualizações
    const conversationsChannel = supabase
      .channel("conversas-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversas" }, () => {
        fetchConversations()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversa_participantes" }, () => {
        fetchConversations()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "caixa_entrada_geral" }, () => {
        fetchInboxItems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
    }
  }, [fetchConversations, fetchInboxItems, supabase])

  return {
    conversations,
    inboxItems,
    isLoading,
    error,
    transferConversation,
    addParticipant,
    removeParticipant,
    assignInboxItem,
    refresh: fetchConversations,
  }
}
