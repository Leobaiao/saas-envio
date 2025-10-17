import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { WuzapiService } from "@/lib/services/wuzapiService"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: instances, error } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ instances }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao buscar instâncias:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar instâncias" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { instance_name, instance_id, api_url, api_key, webhook_url } = await request.json()

    if (!instance_name || !instance_id || !api_url || !api_key) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // Testa a conexão antes de salvar
    const connectionTest = await WuzapiService.testConnection(api_url, api_key)
    if (!connectionTest.success) {
      return NextResponse.json({ error: `Falha na conexão: ${connectionTest.message}` }, { status: 400 })
    }

    const { data: instance, error } = await supabase
      .from("whatsapp_instances")
      .insert({
        user_id: user.id,
        instance_name,
        instance_id,
        api_url,
        api_key,
        webhook_url,
        status: "pending",
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ instance }, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro ao criar instância:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar instância" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID da instância é obrigatório" }, { status: 400 })
    }

    const { data: instance, error } = await supabase
      .from("whatsapp_instances")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ instance }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao atualizar instância:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar instância" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da instância é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("whatsapp_instances").delete().eq("id", id).eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao deletar instância:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao deletar instância" },
      { status: 500 },
    )
  }
}
