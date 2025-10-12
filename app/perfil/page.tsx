import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import PerfilClient from "@/components/perfil-client"

export default async function PerfilPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return <PerfilClient user={user} profile={profile} />
}
