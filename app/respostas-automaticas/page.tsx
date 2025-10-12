import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import RespostasClient from "@/components/respostas-client"

export default async function RespostasAutomaticasPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: respostas, error } = await supabase
    .from("respostas_automaticas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar respostas:", error)
  }

  return <RespostasClient initialRespostas={respostas || []} />
}
