import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CampanhasClient from "@/components/campanhas-client"

export default async function CampanhasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Busca campanhas do usuário
  const { data: campanhas } = await supabase
    .from("campanhas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Busca listas do usuário
  const { data: listas } = await supabase.from("listas").select("*").eq("user_id", user.id)

  return <CampanhasClient initialCampanhas={campanhas || []} initialListas={listas || []} userId={user.id} />
}
