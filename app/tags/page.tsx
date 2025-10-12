import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TagsClient from "@/components/tags-client"
export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Buscar tags do usuário
  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .order("nome", { ascending: true })

  if (error) {
    console.error("Erro ao buscar tags:", error)
  }

  return <TagsClient initialTags={tags || []} />
}
