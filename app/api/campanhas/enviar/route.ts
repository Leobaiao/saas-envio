import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { campanha_id } = await request.json()

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar campanha
    const { data: campanha, error: campanhaError } = await supabase
      .from("campanhas")
      .select("*")
      .eq("id", campanha_id)
      .eq("user_id", user.id)
      .single()

    if (campanhaError || !campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    // Buscar contatos da lista
    const { data: contatosLista, error: contatosError } = await supabase
      .from("contatos_listas")
      .select("contato_id")
      .eq("lista_id", campanha.lista_id)
      .eq("user_id", user.id)

    if (contatosError || !contatosLista || contatosLista.length === 0) {
      return NextResponse.json({ error: "Nenhum contato encontrado na lista" }, { status: 400 })
    }

    const contatoIds = contatosLista.map((c) => c.contato_id)

    // Buscar dados completos dos contatos
    const { data: contatos } = await supabase.from("contatos").select("*").in("id", contatoIds).eq("is_active", true)

    if (!contatos || contatos.length === 0) {
      return NextResponse.json({ error: "Nenhum contato ativo encontrado" }, { status: 400 })
    }

    // Buscar configuração do WhatsApp
    const { data: whatsappConfig } = await supabase.from("whatsapp_config").select("*").eq("user_id", user.id).single()

    if (!whatsappConfig || !whatsappConfig.is_active) {
      return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 400 })
    }

    let enviadas = 0
    let falhas = 0

    // Enviar mensagem para cada contato
    for (const contato of contatos) {
      try {
        // Substituir variáveis na mensagem
        let mensagemPersonalizada = campanha.mensagem
        mensagemPersonalizada = mensagemPersonalizada.replace(/{nome}/g, contato.nome || "")
        mensagemPersonalizada = mensagemPersonalizada.replace(/{empresa}/g, contato.empresa || "")
        mensagemPersonalizada = mensagemPersonalizada.replace(/{telefone}/g, contato.telefone || "")

        // Registrar mensagem no banco
        const { error: mensagemError } = await supabase.from("mensagens").insert({
          user_id: user.id,
          contato_id: contato.id,
          campanha_id: campanha.id,
          tipo: "enviada",
          mensagem: mensagemPersonalizada,
          status: campanha.agendada_para ? "pendente" : "enviada",
          media_url: campanha.media_url,
          media_type: campanha.media_type,
        })

        if (mensagemError) {
          falhas++
        } else {
          enviadas++

          // Atualizar última mensagem do contato
          await supabase.from("contatos").update({ ultima_mensagem: new Date().toISOString() }).eq("id", contato.id)
        }
      } catch (error) {
        console.error("Erro ao enviar para contato:", contato.id, error)
        falhas++
      }
    }

    // Atualizar estatísticas da campanha
    await supabase
      .from("campanhas")
      .update({
        status: "enviada",
        enviadas: enviadas,
        falhas: falhas,
        entregues: enviadas, // Assumindo entrega imediata
      })
      .eq("id", campanha_id)

    return NextResponse.json({
      success: true,
      enviadas,
      falhas,
      total: contatos.length,
    })
  } catch (error) {
    console.error("Erro ao enviar campanha:", error)
    return NextResponse.json({ error: "Erro ao enviar campanha" }, { status: 500 })
  }
}
