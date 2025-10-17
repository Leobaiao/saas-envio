// Serviço para processar webhooks
import { createServerClient } from "@/lib/supabase/server"
import type { WuzapiMessage } from "@/lib/types/webhook"

export class WebhookService {
  /**
   * Processa mensagem recebida via webhook
   */
  static async processIncomingMessage(payload: WuzapiMessage): Promise<void> {
    const supabase = await createServerClient()

    try {
      // Registrar webhook no log
      const { data: logEntry } = await supabase
        .from("webhooks_log")
        .insert({
          tipo: "wuzapi_incoming",
          payload: payload,
          processado: false,
        })
        .select()
        .single()

      // Buscar configuração do usuário pelo ID da instância
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("user_id, id")
        .eq("instance_id", payload.instanceId)
        .eq("is_active", true)
        .single()

      if (!instance) {
        throw new Error(`Instância não encontrada: ${payload.instanceId}`)
      }

      // Limpar número de telefone
      const telefone = payload.data.from.replace("@c.us", "").replace("@s.whatsapp.net", "")

      // Buscar ou criar contato
      let { data: contato } = await supabase
        .from("contatos")
        .select("id, nome")
        .eq("user_id", instance.user_id)
        .eq("telefone", telefone)
        .single()

      if (!contato) {
        const nome = payload.data.sender?.name || payload.data.sender?.pushname || telefone

        const { data: novoContato } = await supabase
          .from("contatos")
          .insert({
            user_id: instance.user_id,
            telefone: telefone,
            nome: nome,
            is_active: true,
          })
          .select()
          .single()

        contato = novoContato
      }

      // Salvar mensagem recebida
      const mensagemTexto = payload.data.body || payload.data.caption || ""
      const temMidia = payload.data.type !== "chat" && payload.data.type !== "text"

      await supabase.from("mensagens").insert({
        user_id: instance.user_id,
        contato_id: contato?.id,
        tipo: "recebida",
        conteudo: mensagemTexto,
        status: "entregue",
        tem_midia: temMidia,
        midia_url: payload.data.media_url || null,
        midia_tipo: payload.data.media_type || payload.data.type,
        whatsapp_message_id: payload.data.id,
        enviada_em: new Date(payload.data.timestamp * 1000).toISOString(),
      })

      // Processar respostas automáticas
      await this.processAutoResponses(instance.user_id, contato?.id, mensagemTexto, telefone)

      // Atualizar última mensagem do contato
      await supabase
        .from("contatos")
        .update({
          ultima_mensagem: new Date().toISOString(),
        })
        .eq("id", contato?.id)

      // Marcar webhook como processado
      if (logEntry) {
        await supabase.from("webhooks_log").update({ processado: true }).eq("id", logEntry.id)
      }
    } catch (error) {
      console.error("[v0] Erro ao processar webhook:", error)
      throw error
    }
  }

  /**
   * Processa respostas automáticas
   */
  private static async processAutoResponses(
    userId: string,
    contatoId: string,
    mensagemTexto: string,
    telefone: string,
  ): Promise<void> {
    const supabase = await createServerClient()

    const { data: respostas } = await supabase
      .from("respostas_automaticas")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (!respostas || respostas.length === 0) return

    const mensagemLower = mensagemTexto.toLowerCase()
    const respostaEncontrada = respostas.find((r) => mensagemLower.includes(r.gatilho.toLowerCase()))

    if (respostaEncontrada) {
      // Buscar instância ativa do usuário
      const { data: instance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .eq("status", "connected")
        .single()

      if (instance) {
        // Enviar resposta automática via API
        try {
          const response = await fetch(`${instance.api_url}/instance/${instance.instance_id}/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${instance.api_key}`,
            },
            body: JSON.stringify({
              phone: telefone,
              message: respostaEncontrada.resposta,
            }),
          })

          if (response.ok) {
            // Registrar mensagem enviada
            await supabase.from("mensagens").insert({
              user_id: userId,
              contato_id: contatoId,
              tipo: "enviada",
              conteudo: respostaEncontrada.resposta,
              status: "enviada",
              enviada_em: new Date().toISOString(),
            })

            // Incrementar contador de uso
            await supabase
              .from("respostas_automaticas")
              .update({
                uso_count: respostaEncontrada.uso_count + 1,
              })
              .eq("id", respostaEncontrada.id)
          }
        } catch (error) {
          console.error("[v0] Erro ao enviar resposta automática:", error)
        }
      }
    }
  }

  /**
   * Processa status de mensagem (entregue, lida, etc)
   */
  static async processMessageStatus(payload: any): Promise<void> {
    const supabase = await createServerClient()

    try {
      const messageId = payload.data.id
      const status = payload.data.status // 'delivered', 'read', 'failed'

      let statusMapeado = "enviada"
      let campoData = null

      switch (status) {
        case "delivered":
          statusMapeado = "entregue"
          campoData = { entregue_em: new Date().toISOString() }
          break
        case "read":
          statusMapeado = "lida"
          campoData = { lida_em: new Date().toISOString() }
          break
        case "failed":
          statusMapeado = "falha"
          campoData = { erro_mensagem: payload.data.error || "Erro desconhecido" }
          break
      }

      await supabase
        .from("mensagens")
        .update({
          status: statusMapeado,
          ...campoData,
        })
        .eq("whatsapp_message_id", messageId)
    } catch (error) {
      console.error("[v0] Erro ao processar status de mensagem:", error)
      throw error
    }
  }
}
