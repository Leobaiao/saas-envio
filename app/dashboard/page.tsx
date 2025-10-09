"use client"

import Sidebar from "@/components/sidebar"

export default function DashboardPage() {
  // Mock conversation data
  const conversations = [
    {
      id: 1,
      sender: "João Silva",
      message: "Olá, gostaria de saber mais sobre o produto...",
      timestamp: "10:30",
    },
    {
      id: 2,
      sender: "Maria Santos",
      message: "Obrigada pelo retorno rápido!",
      timestamp: "09:15",
    },
    {
      id: 3,
      sender: "Pedro Costa",
      message: "Quando podemos agendar uma reunião?",
      timestamp: "Ontem",
    },
    {
      id: 4,
      sender: "Ana Oliveira",
      message: "Recebi o orçamento, vou analisar...",
      timestamp: "Ontem",
    },
    {
      id: 5,
      sender: "Carlos Ferreira",
      message: "Preciso de ajuda com a configuração",
      timestamp: "15 Mar",
    },
  ]

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
            {conversations.map((conversation) => (
              <a
                key={conversation.id}
                href="/chat"
                className="block border-b-2 border-neutral-300 p-4 hover:bg-neutral-50"
              >
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-sm font-semibold text-neutral-900">{conversation.sender}</span>
                  <span className="text-xs text-neutral-500">{conversation.timestamp}</span>
                </div>
                <p className="text-sm text-neutral-600">{conversation.message}</p>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
