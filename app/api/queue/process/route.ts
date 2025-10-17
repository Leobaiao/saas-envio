import { type NextRequest, NextResponse } from "next/server"
import { QueueService } from "@/lib/services/queueService"

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autorização (para cron jobs)
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.CRON_SECRET || "your-secret-token"

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await QueueService.processQueue()

    return NextResponse.json({ success: true, message: "Fila processada" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Erro ao processar fila:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar fila" },
      { status: 500 },
    )
  }
}
