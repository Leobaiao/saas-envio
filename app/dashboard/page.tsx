import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Busca mensagens recentes do usuário
  const { data: mensagens } = await supabase
    .from("mensagens")
    .select(
      `
      id,
      conteudo,
      created_at,
      status,
      tipo,
      contato_id,
      contatos (
        nome
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Contar total de contatos
  const { count: totalContatos } = await supabase
    .from("contatos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true)

  // Contar total de campanhas
  const { count: totalCampanhas } = await supabase
    .from("campanhas")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Contar mensagens por status
  const { data: mensagensPorStatus } = await supabase.from("mensagens").select("status").eq("user_id", user.id)

  const statusCounts = {
    enviadas: mensagensPorStatus?.filter((m) => m.status === "enviada" || m.status === "entregue").length || 0,
    lidas: mensagensPorStatus?.filter((m) => m.status === "lida").length || 0,
    falhas: mensagensPorStatus?.filter((m) => m.status === "falhou").length || 0,
    pendentes: mensagensPorStatus?.filter((m) => m.status === "pendente").length || 0,
  }

  // Mensagens dos últimos 7 dias
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  const { data: mensagensRecentes } = await supabase
    .from("mensagens")
    .select("created_at, status")
    .eq("user_id", user.id)
    .gte("created_at", seteDiasAtras.toISOString())
    .order("created_at", { ascending: true })

  // Agrupar mensagens por dia
  const mensagensPorDia: Record<string, number> = {}
  mensagensRecentes?.forEach((msg) => {
    const dia = new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    mensagensPorDia[dia] = (mensagensPorDia[dia] || 0) + 1
  })

  const stats = {
    totalContatos: totalContatos || 0,
    totalCampanhas: totalCampanhas || 0,
    totalMensagens: mensagensPorStatus?.length || 0,
    ...statusCounts,
    mensagensPorDia,
  }

  return <DashboardClient mensagens={mensagens || []} stats={stats} />
}
