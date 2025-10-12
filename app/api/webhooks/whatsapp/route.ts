import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    const supabase = await createServerClient()

    // Registrar webhook no log
    await supabase.from("webhooks_log").insert({
      tipo: "whatsapp_incoming",
      payload: payload,
      processado: false,
    })

    // Processar mensagem recebida
    if (payload.messages && payload.messages.length > 0) {
      const message = payload.messages[0]

      // Buscar configuração do usuário pelo número de telefone
      const { data: config } = await supabase
        .from("whatsapp_config")
        .select("user_id")
        .eq("phone_number", payload.metadata?.phone_number_id)
        .single()

      if (config) {
        // Buscar ou criar contato
        const telefone = message.from
        let { data: contato } = await supabase
          .from("contatos")
          .select("id")
          .eq("user_id", config.user_id)
          .eq("telefone", telefone)
          .single()

        if (!contato) {
          const { data: novoContato } = await supabase
            .from("contatos")
            .insert({
              user_id: config.user_id,
              telefone: telefone,
              nome: message.profile?.name || telefone,
              is_active: true,
            })
            .select()
            .single()

          contato = novoContato
        }

        // Salvar mensagem recebida
        await supabase.from("mensagens").insert({
          user_id: config.user_id,
          contato_id: contato?.id,
          tipo: "recebida",
          mensagem: message.text?.body || message.caption || "",
          status: "entregue",
          media_url: message.image?.link || message.video?.link || message.document?.link || null,
          media_type: message.type,
        })

        // Verificar respostas automáticas
        const { data: respostas } = await supabase
          .from("respostas_automaticas")
          .select("*")
          .eq("user_id", config.user_id)
          .eq("is_active", true)

        if (respostas) {
          const mensagemTexto = (message.text?.body || "").toLowerCase()
          const respostaEncontrada = respostas.find((r) => mensagemTexto.includes(r.gatilho.toLowerCase()))

          if (respostaEncontrada) {
            // Enviar resposta automática (aqui você integraria com a API do WhatsApp)
            await supabase.from("mensagens").insert({
              user_id: config.user_id,
              contato_id: contato?.id,
              tipo: "enviada",
              mensagem: respostaEncontrada.resposta,
              status: "pendente",
            })

            // Incrementar contador de uso
            await supabase
              .from("respostas_automaticas")
              .update({ uso_count: respostaEncontrada.uso_count + 1 })
              .eq("id", respostaEncontrada.id)
          }
        }

        // Atualizar última mensagem do contato
        await supabase.from("contatos").update({ ultima_mensagem: new Date().toISOString() }).eq("id", contato?.id)
      }
    }

    // Marcar webhook como processado
    await supabase.from("webhooks_log").update({ processado: true }).eq("payload", payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}

// Verificação do webhook (WhatsApp Business API)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Verificar token (você deve configurar isso nas variáveis de ambiente)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_secreto"

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
