import { createServerClient } from "@/lib/supabase/server"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { AdminClient } from "@/components/admin-client"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Buscar instâncias
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Buscar logs do sistema
  const { data: logs } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  // Buscar estatísticas
  const { data: stats } = await supabase
    .from("system_stats")
    .select("*")
    .eq("user_id", user.id)
    .order("stat_date", { ascending: false })
    .limit(30)

  return (
    <AuthenticatedLayout>
      <AdminClient initialInstances={instances || []} initialLogs={logs || []} initialStats={stats || []} />
    </AuthenticatedLayout>
  )
}
