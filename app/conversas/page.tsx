import { createServerClient } from "@/lib/supabase/server"
import { ConversationService } from "@/lib/services/conversationService"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ConversationsClient } from "@/components/conversas-client"
import { redirect } from "next/navigation"

export default async function ConversasPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const conversations = await ConversationService.getUserConversations(user.id)
  const inboxItems = await ConversationService.getInboxItems()

  // Buscar lista de usuários para transferência
  const { data: users } = await supabase.from("profiles").select("id, nome, email").neq("id", user.id)

  return (
    <AuthenticatedLayout>
      <ConversationsClient
        initialConversations={conversations}
        initialInboxItems={inboxItems}
        availableUsers={users || []}
        currentUserId={user.id}
      />
    </AuthenticatedLayout>
  )
}
