import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContatosClient from "@/components/contatos-client"

export default async function ContatosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Busca contatos do usuário
  const { data: contatos } = await supabase
    .from("contatos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Busca listas do usuário
  const { data: listas } = await supabase
    .from("listas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <ContatosClient initialContatos={contatos || []} initialListas={listas || []} userId={user.id} />
}
