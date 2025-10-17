import { type NextRequest, NextResponse } from "next/server"
import { WuzapiMessageSchema } from "@/lib/types/webhook"
import { WebhookService } from "@/lib/services/webhookService"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log("[v0] Webhook recebido:", JSON.stringify(payload, null, 2))

    // Validar payload com Zod
    const validationResult = WuzapiMessageSchema.safeParse(payload)

    if (!validationResult.success) {
      console.error("[v0] Payload inválido:", validationResult.error)
      return NextResponse.json({ error: "Payload inválido", details: validationResult.error }, { status: 400 })
    }

    const validatedPayload = validationResult.data

    // Processar diferentes tipos de eventos
    switch (validatedPayload.event) {
      case "message.received":
      case "message":
        await WebhookService.processIncomingMessage(validatedPayload)
        break

      case "message.status":
      case "message.ack":
        await WebhookService.processMessageStatus(validatedPayload)
        break

      default:
        console.log("[v0] Evento ignorado:", validatedPayload.event)
        return NextResponse.json({ success: true, message: "Evento ignorado" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao processar webhook:", error)

    // Registrar erro no log
    try {
      const supabase = await createServerClient()
      await supabase.from("webhooks_log").insert({
        tipo: "wuzapi_error",
        payload: { error: error instanceof Error ? error.message : "Erro desconhecido" },
        processado: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      })
    } catch (logError) {
      console.error("[v0] Erro ao registrar log:", logError)
    }

    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("secret")

  const WEBHOOK_SECRET = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_super_secreto"

  if (token === WEBHOOK_SECRET) {
    return NextResponse.json({ success: true, message: "Webhook verificado" }, { status: 200 })
  }

  return NextResponse.json({ error: "Token inválido" }, { status: 403 })
}
