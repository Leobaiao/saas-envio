// Hook para atualizações em tempo real
"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useRealtimeMessages(contatoId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!contatoId) return

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      // Buscar mensagens iniciais
      const { data: initialMessages } = await supabase
        .from("mensagens")
        .select("*")
        .eq("contato_id", contatoId)
        .order("enviada_em", { ascending: true })

      if (initialMessages) {
        setMessages(initialMessages)
      }

      // Configurar realtime
      channel = supabase
        .channel(`messages:${contatoId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "mensagens",
            filter: `contato_id=eq.${contatoId}`,
          },
          (payload) => {
            console.log("[v0] Nova mensagem recebida:", payload.new)
            setMessages((prev) => [...prev, payload.new])
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "mensagens",
            filter: `contato_id=eq.${contatoId}`,
          },
          (payload) => {
            console.log("[v0] Mensagem atualizada:", payload.new)
            setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg)))
          },
        )
        .subscribe((status) => {
          console.log("[v0] Status da conexão realtime:", status)
          setIsConnected(status === "SUBSCRIBED")
        })
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [contatoId, supabase])

  return { messages, isConnected }
}

export function useRealtimeCampaigns(userId: string) {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      const { data: initialCampaigns } = await supabase
        .from("campanhas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (initialCampaigns) {
        setCampaigns(initialCampaigns)
      }

      channel = supabase
        .channel(`campaigns:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "campanhas",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("[v0] Campanha atualizada:", payload)

            if (payload.eventType === "INSERT") {
              setCampaigns((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setCampaigns((prev) => prev.map((camp) => (camp.id === payload.new.id ? payload.new : camp)))
            } else if (payload.eventType === "DELETE") {
              setCampaigns((prev) => prev.filter((camp) => camp.id !== payload.old.id))
            }
          },
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, supabase])

  return { campaigns }
}
