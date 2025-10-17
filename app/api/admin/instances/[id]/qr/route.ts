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

    const qrCode = await WuzapiService.getQRCode(instance.api_url, instance.api_key, instance.instance_id)

    if (qrCode) {
      await supabase.from("whatsapp_instances").update({ qr_code: qrCode }).eq("id", params.id)
    }

    return NextResponse.json({ qr_code: qrCode }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao obter QR Code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao obter QR Code" },
      { status: 500 },
    )
  }
}
