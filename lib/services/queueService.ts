// Serviço de fila de mensagens usando Supabase
import { createServerClient } from "@/lib/supabase/server"

export interface QueueJob {
  id: string
  tipo: "envio_mensagem" | "envio_campanha" | "processamento_webhook"
  payload: Record<string, any>
  status: "pendente" | "processando" | "concluido" | "falha"
  tentativas: number
  max_tentativas: number
  erro?: string
  created_at: string
  processado_em?: string
}

export class QueueService {
  /**
   * Adiciona um job à fila
   */
  static async addJob(tipo: QueueJob["tipo"], payload: Record<string, any>, maxTentativas = 3): Promise<QueueJob> {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("queue_jobs")
      .insert({
        tipo,
        payload,
        status: "pendente",
        tentativas: 0,
        max_tentativas: maxTentativas,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Processa jobs pendentes da fila
   */
  static async processQueue(): Promise<void> {
    const supabase = await createServerClient()

    // Buscar jobs pendentes
    const { data: jobs, error } = await supabase
      .from("queue_jobs")
      .select("*")
      .eq("status", "pendente")
      .lt("tentativas", supabase.rpc("max_tentativas"))
      .order("created_at", { ascending: true })
      .limit(10)

    if (error) {
      console.error("[v0] Erro ao buscar jobs:", error)
      return
    }

    if (!jobs || jobs.length === 0) return

    // Processar cada job
    for (const job of jobs) {
      await this.processJob(job)
    }
  }

  /**
   * Processa um job individual
   */
  private static async processJob(job: QueueJob): Promise<void> {
    const supabase = await createServerClient()

    try {
      // Marcar como processando
      await supabase.from("queue_jobs").update({ status: "processando" }).eq("id", job.id)

      // Processar baseado no tipo
      switch (job.tipo) {
        case "envio_mensagem":
          await this.processMessageJob(job)
          break
        case "envio_campanha":
          await this.processCampaignJob(job)
          break
        case "processamento_webhook":
          await this.processWebhookJob(job)
          break
        default:
          throw new Error(`Tipo de job desconhecido: ${job.tipo}`)
      }

      // Marcar como concluído
      await supabase
        .from("queue_jobs")
        .update({
          status: "concluido",
          processado_em: new Date().toISOString(),
        })
        .eq("id", job.id)
    } catch (error) {
      console.error(`[v0] Erro ao processar job ${job.id}:`, error)

      // Incrementar tentativas
      const novasTentativas = job.tentativas + 1
      const status = novasTentativas >= job.max_tentativas ? "falha" : "pendente"

      await supabase
        .from("queue_jobs")
        .update({
          status,
          tentativas: novasTentativas,
          erro: error instanceof Error ? error.message : "Erro desconhecido",
        })
        .eq("id", job.id)
    }
  }

  /**
   * Processa job de envio de mensagem
   */
  private static async processMessageJob(job: QueueJob): Promise<void> {
    const { contato_id, conteudo, user_id, instance_id } = job.payload
    const supabase = await createServerClient()

    // Buscar contato e instância
    const { data: contato } = await supabase.from("contatos").select("telefone").eq("id", contato_id).single()

    const { data: instance } = await supabase.from("whatsapp_instances").select("*").eq("id", instance_id).single()

    if (!contato || !instance) {
      throw new Error("Contato ou instância não encontrada")
    }

    // Enviar mensagem via Wuzapi
    const response = await fetch(`${instance.api_url}/instance/${instance.instance_id}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instance.api_key}`,
      },
      body: JSON.stringify({
        phone: contato.telefone,
        message: conteudo,
      }),
    })

    if (!response.ok) {
      throw new Error("Falha ao enviar mensagem via Wuzapi")
    }

    const result = await response.json()

    // Salvar mensagem no banco
    await supabase.from("mensagens").insert({
      user_id,
      contato_id,
      tipo: "enviada",
      conteudo,
      status: "enviada",
      whatsapp_message_id: result.id,
      enviada_em: new Date().toISOString(),
    })
  }

  /**
   * Processa job de campanha
   */
  private static async processCampaignJob(job: QueueJob): Promise<void> {
    const { campanha_id, contatos_ids, mensagem, user_id, instance_id } = job.payload
    const supabase = await createServerClient()

    let enviadas = 0
    let falhas = 0

    for (const contatoId of contatos_ids) {
      try {
        await this.processMessageJob({
          ...job,
          payload: {
            contato_id: contatoId,
            conteudo: mensagem,
            user_id,
            instance_id,
          },
        })
        enviadas++

        // Atualizar progresso da campanha
        const progresso = (enviadas / contatos_ids.length) * 100
        await supabase
          .from("campanhas")
          .update({
            enviadas,
            falhas,
            progress: progresso,
          })
          .eq("id", campanha_id)

        // Pequeno delay entre envios para evitar rate limit
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        falhas++
        console.error(`[v0] Erro ao enviar para contato ${contatoId}:`, error)
      }
    }

    // Atualizar status final da campanha
    await supabase
      .from("campanhas")
      .update({
        status: "enviada",
        enviadas,
        falhas,
        progress: 100,
      })
      .eq("id", campanha_id)
  }

  /**
   * Processa job de webhook
   */
  private static async processWebhookJob(job: QueueJob): Promise<void> {
    // Implementação específica para processamento de webhooks em background
    console.log("[v0] Processando webhook job:", job.id)
  }
}
