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

    const { itemId, userId } = await request.json()

    if (!itemId || !userId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    await ConversationService.assignInboxItem(itemId, userId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao atribuir conversa:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atribuir conversa" },
      { status: 500 },
    )
  }
}
