import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { contato_id, conteudo, agendada_para, tem_midia, midia_url, midia_tipo } = await request.json()

    if (!contato_id || !conteudo) {
      return NextResponse.json({ error: "Contato e conteúdo são obrigatórios" }, { status: 400 })
    }

    // Buscar configuração do WhatsApp
    const { data: config } = await supabase.from("whatsapp_config").select("*").eq("user_id", user.id).single()

    if (!config || !config.is_active) {
      return NextResponse.json({ error: "WhatsApp não configurado ou inativo" }, { status: 400 })
    }

    // Buscar dados do contato
    const { data: contato } = await supabase.from("contatos").select("*").eq("id", contato_id).single()

    if (!contato) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    // Criar registro da mensagem
    const { data: mensagem, error: mensagemError } = await supabase
      .from("mensagens")
      .insert({
        user_id: user.id,
        contato_id,
        tipo: "enviada",
        conteudo,
        status: agendada_para ? "pendente" : "enviada",
        tem_midia: tem_midia || false,
        midia_url: midia_url || null,
        midia_tipo: midia_tipo || null,
        agendada_para: agendada_para || null,
        enviada_em: agendada_para ? null : new Date().toISOString(),
      })
      .select()
      .single()

    if (mensagemError) throw mensagemError

    // Se não for agendada, enviar imediatamente
    if (!agendada_para) {
      // Aqui você faria a chamada real para a API do WhatsApp
      // const whatsappResponse = await fetch('https://api.whatsapp.com/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${config.api_key}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     to: contato.telefone,
      //     message: conteudo,
      //     media_url: midia_url
      //   })
      // })

      // Simular envio bem-sucedido
      await supabase
        .from("mensagens")
        .update({
          status: "entregue",
          entregue_em: new Date().toISOString(),
          whatsapp_message_id: `wamid.${Date.now()}`,
        })
        .eq("id", mensagem.id)
    }

    return NextResponse.json({
      success: true,
      mensagem,
      message: agendada_para ? "Mensagem agendada com sucesso" : "Mensagem enviada com sucesso",
    })
  } catch (error: any) {
    console.error("[v0] Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar mensagem" }, { status: 500 })
  }
}
