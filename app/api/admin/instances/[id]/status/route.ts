import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { WuzapiService } from "@/lib/services/wuzapiService"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: instance, error } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error

    const status = await WuzapiService.getInstanceStatus(instance.api_url, instance.api_key, instance.instance_id)

    // Atualiza o status no banco
    await supabase
      .from("whatsapp_instances")
      .update({
        status: status.status,
        phone_number: status.phone,
        last_connected_at: status.status === "connected" ? new Date().toISOString() : instance.last_connected_at,
      })
      .eq("id", params.id)

    return NextResponse.json({ status }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao verificar status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao verificar status" },
      { status: 500 },
    )
  }
}
