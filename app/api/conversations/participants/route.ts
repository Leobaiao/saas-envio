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

    const { conversaId, userId, tipo } = await request.json()

    if (!conversaId || !userId || !tipo) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const participant = await ConversationService.addParticipant(conversaId, userId, tipo, user.id)

    return NextResponse.json({ success: true, participant }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao adicionar participante:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao adicionar participante" },
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

    const { conversaId, userId } = await request.json()

    if (!conversaId || !userId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    await ConversationService.removeParticipant(conversaId, userId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao remover participante:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao remover participante" },
      { status: 500 },
    )
  }
}
