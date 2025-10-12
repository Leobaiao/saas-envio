import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Sidebar from "@/components/sidebar"

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
      mensagem,
      created_at,
      contato_id,
      contatos (
        nome
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-neutral-100 font-mono">
      <Sidebar />

      <main className="ml-64 p-6 transition-all duration-300">
        <div className="border-2 border-neutral-900 bg-white">
          {/* Header */}
          <div className="border-b-2 border-neutral-900 p-4">
            <h1 className="text-xl font-bold uppercase tracking-wider text-neutral-900">Caixa de Entrada</h1>
          </div>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            {!mensagens || mensagens.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-neutral-600">Nenhuma mensagem ainda.</p>
                <p className="mt-2 text-xs text-neutral-500">
                  Comece criando contatos e enviando campanhas para ver suas conversas aqui.
                </p>
              </div>
            ) : (
              mensagens.map((mensagem: any) => (
                <a
                  key={mensagem.id}
                  href="/chat"
                  className="block border-b-2 border-neutral-300 p-4 hover:bg-neutral-50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-sm font-semibold text-neutral-900">
                      {mensagem.contatos?.nome || "Contato"}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(mensagem.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">{mensagem.mensagem}</p>
                </a>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
