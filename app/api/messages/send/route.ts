import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const SendMessageSchema = z.object({
  contato_id: z.string().uuid(),
  conteudo: z.string().min(1),
  tem_midia: z.boolean().optional(),
  midia_url: z.string().optional(),
  midia_tipo: z.string().optional(),
  agendada_para: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = SendMessageSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error }, { status: 400 })
    }

    const { contato_id, conteudo, tem_midia, midia_url, midia_tipo, agendada_para } = validationResult.data

    // Buscar contato
    const { data: contato, error: contatoError } = await supabase
      .from("contatos")
      .select("telefone")
      .eq("id", contato_id)
      .eq("user_id", user.id)
      .single()

    if (contatoError || !contato) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    // Se for agendada, salvar na tabela de mensagens agendadas
    if (agendada_para) {
      const { data: mensagemAgendada, error: agendadaError } = await supabase
        .from("mensagens_agendadas")
        .insert({
          user_id: user.id,
          contato_id,
          mensagem: conteudo,
          agendada_para,
          status: "pendente",
          media_url: midia_url,
          media_type: midia_tipo,
        })
        .select()
        .single()

      if (agendadaError) throw agendadaError

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
      return NextResponse.json({ error: "Nenhuma instância ativa encontrada" }, { status: 400 })
    }

    // Enviar mensagem via Wuzapi
    const wuzapiPayload: any = {
      phone: contato.telefone,
      message: conteudo,
    }

    if (tem_midia && midia_url) {
      wuzapiPayload.media = {
        url: midia_url,
        type: midia_tipo,
      }
    }

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

    const result = await response.json()

    // Salvar mensagem no banco
    const { data: mensagem, error: mensagemError } = await supabase
      .from("mensagens")
      .insert({
        user_id: user.id,
        contato_id,
        tipo: "enviada",
        conteudo,
        status: "enviada",
        tem_midia: tem_midia || false,
        midia_url,
        midia_tipo,
        whatsapp_message_id: result.id,
        enviada_em: new Date().toISOString(),
      })
      .select()
      .single()

    if (mensagemError) throw mensagemError

    return NextResponse.json({ success: true, mensagem, wuzapi_response: result }, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro ao enviar mensagem:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar mensagem" },
      { status: 500 },
    )
  }
}
