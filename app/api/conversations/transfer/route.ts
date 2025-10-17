import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { ConversationService } from "@/lib/services/conversationService"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { conversaId, paraUserId, motivo } = await request.json()

    if (!conversaId || !paraUserId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const transfer = await ConversationService.transferConversation(user.id, conversaId, paraUserId, motivo)

    return NextResponse.json({ success: true, transfer }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao transferir conversa:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao transferir conversa" },
      { status: 500 },
    )
  }
}
