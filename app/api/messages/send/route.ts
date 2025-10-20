import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { MessageSchema, validateRequest } from "@/lib/utils/validation"
import { sanitizeInput, sanitizePhone, redactSensitiveData } from "@/lib/utils/sanitize"
import { rateLimit } from "@/lib/utils/rate-limit"
import { logger } from "@/lib/utils/logger"
import { retryWithBackoff } from "@/lib/utils/retry"

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.warn("Unauthorized message send attempt")
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const rateLimitResult = limiter.check(request, 10, user.id)
    if (!rateLimitResult.success) {
      logger.warn("Rate limit exceeded", { userId: user.id })
      return NextResponse.json(
        { error: "Limite de requisições excedido. Tente novamente em 1 minuto." },
        { status: 429 },
      )
    }

    const body = await request.json()

    const validation = validateRequest(MessageSchema, body)
    if (!validation.success) {
      logger.error("Invalid message request", { error: validation.error, userId: user.id })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { contato_id, conteudo, tem_midia, midia_url, midia_tipo, agendada_para } = validation.data

    const sanitizedContent = sanitizeInput(conteudo)

    // Buscar contato
    const { data: contato, error: contatoError } = await supabase
      .from("contatos")
      .select("telefone, nome")
      .eq("id", contato_id)
      .eq("user_id", user.id)
      .single()

    if (contatoError || !contato) {
      logger.error("Contact not found", { contatoId: contato_id, userId: user.id })
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    const sanitizedPhone = sanitizePhone(contato.telefone)

    // Se for agendada, salvar na tabela de mensagens agendadas
    if (agendada_para) {
      const { data: mensagemAgendada, error: agendadaError } = await supabase
        .from("mensagens_agendadas")
        .insert({
          user_id: user.id,
          contato_id,
          mensagem: sanitizedContent,
          agendada_para,
          status: "pendente",
          media_url: midia_url,
          media_type: midia_tipo,
        })
        .select()
        .single()

      if (agendadaError) {
        logger.error("Failed to schedule message", { error: agendadaError, userId: user.id })
        throw agendadaError
      }

      logger.info("Message scheduled successfully", {
        messageId: mensagemAgendada.id,
        userId: user.id,
        scheduledFor: agendada_para,
      })

      return NextResponse.json({ success: true, mensagem: mensagemAgendada }, { status: 201 })
    }

    // Buscar instância ativa
    const { data: instance, error: instanceError } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("status", "connected")
      .single()

    if (instanceError || !instance) {
      logger.error("No active instance found", { userId: user.id })
      return NextResponse.json({ error: "Nenhuma instância ativa encontrada" }, { status: 400 })
    }

    const wuzapiPayload: any = {
      phone: sanitizedPhone,
      message: sanitizedContent,
    }

    if (tem_midia && midia_url) {
      wuzapiPayload.media = {
        url: midia_url,
        type: midia_tipo,
      }
    }

    const sendToWuzapi = async () => {
      const response = await fetch(`${instance.api_url}/instance/${instance.instance_id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${instance.api_key}`,
        },
        body: JSON.stringify(wuzapiPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao enviar mensagem")
      }

      return response.json()
    }

    const result = await retryWithBackoff(sendToWuzapi, 3, 1000)

    // Salvar mensagem no banco
    const { data: mensagem, error: mensagemError } = await supabase
      .from("mensagens")
      .insert({
        user_id: user.id,
        contato_id,
        tipo: "enviada",
        conteudo: sanitizedContent,
        status: "enviada",
        tem_midia: tem_midia || false,
        midia_url,
        midia_tipo,
        whatsapp_message_id: result.id,
        enviada_em: new Date().toISOString(),
      })
      .select()
      .single()

    if (mensagemError) {
      logger.error("Failed to save message", { error: mensagemError, userId: user.id })
      throw mensagemError
    }

    const duration = Date.now() - startTime
    logger.info("Message sent successfully", {
      messageId: mensagem.id,
      userId: user.id,
      contactName: contato.nome,
      duration,
    })

    return NextResponse.json(
      {
        success: true,
        mensagem: redactSensitiveData(mensagem),
        remaining: rateLimitResult.remaining,
      },
      { status: 201 },
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Error sending message", {
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar mensagem" },
      { status: 500 },
    )
  }
}
