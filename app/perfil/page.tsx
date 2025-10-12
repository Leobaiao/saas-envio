import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server";
import PerfilClient from "@/components/perfil-client"
export const dynamic = 'force-dynamic'
export default async function PerfilPage() {
  const supabase = await createClient()

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
