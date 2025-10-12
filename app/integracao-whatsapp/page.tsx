import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import WhatsAppConfigClient from "@/components/whatsapp-config-client"
export const dynamic = 'force-dynamic'
export default async function IntegracaoWhatsAppPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Buscar configuração existente
  const { data: config } = await supabase.from("whatsapp_config").select("*").eq("user_id", user.id).single()

  return <WhatsAppConfigClient userId={user.id} initialConfig={config} />
}
