"use client"

import { useMemo } from "react"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import Link from "next/link"

interface DashboardClientProps {
  mensagens: any[]
  stats: {
    totalContatos: number
    totalCampanhas: number
    totalMensagens: number
    enviadas: number
    lidas: number
    falhas: number
    pendentes: number
    mensagensPorDia: Record<string, number>
  }
}

export default function DashboardClient({ mensagens, stats }: DashboardClientProps) {
  const taxaEntrega = useMemo(
    () => (stats.totalMensagens > 0 ? ((stats.enviadas / stats.totalMensagens) * 100).toFixed(1) : "0"),
    [stats.totalMensagens, stats.enviadas],
  )

  const taxaLeitura = useMemo(
    () => (stats.enviadas > 0 ? ((stats.lidas / stats.enviadas) * 100).toFixed(1) : "0"),
    [stats.enviadas, stats.lidas],
  )

  const diasSemana = useMemo(() => Object.keys(stats.mensagensPorDia), [stats.mensagensPorDia])
  const maxMensagens = useMemo(() => Math.max(...Object.values(stats.mensagensPorDia), 1), [stats.mensagensPorDia])

  return (
    <AuthenticatedLayout>
      <main className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-4 border-neutral-900 bg-white p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Total de Contatos</div>
            <div className="text-3xl md:text-4xl font-bold text-neutral-900">{stats.totalContatos}</div>
            <Link href="/contatos" className="mt-2 inline-block text-xs text-neutral-600 hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="border-4 border-neutral-900 bg-white p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Campanhas Ativas</div>
            <div className="text-3xl md:text-4xl font-bold text-neutral-900">{stats.totalCampanhas}</div>
            <Link href="/campanhas" className="mt-2 inline-block text-xs text-neutral-600 hover:underline">
              Gerenciar →
            </Link>
          </div>

          <div className="border-4 border-neutral-900 bg-white p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Mensagens Enviadas</div>
            <div className="text-3xl md:text-4xl font-bold text-neutral-900">{stats.enviadas}</div>
            <div className="mt-2 text-xs text-green-600">Taxa de entrega: {taxaEntrega}%</div>
          </div>

          <div className="border-4 border-neutral-900 bg-white p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Taxa de Leitura</div>
            <div className="text-3xl md:text-4xl font-bold text-neutral-900">{taxaLeitura}%</div>
            <div className="mt-2 text-xs text-neutral-600">{stats.lidas} mensagens lidas</div>
          </div>
        </div>

        <div className="mb-6 border-4 border-neutral-900 bg-white p-4 md:p-6">
          <h2 className="mb-4 md:mb-6 text-base md:text-lg font-bold uppercase tracking-wider text-neutral-900">
            Mensagens dos Últimos 7 Dias
          </h2>
          <div className="flex h-40 md:h-48 items-end justify-between gap-1 md:gap-2">
            {diasSemana.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                Nenhuma mensagem nos últimos 7 dias
              </div>
            ) : (
              diasSemana.map((dia) => {
                const count = stats.mensagensPorDia[dia]
                const altura = (count / maxMensagens) * 100
                return (
                  <div key={dia} className="flex flex-1 flex-col items-center">
                    <div className="mb-1 md:mb-2 text-xs font-bold text-neutral-900">{count}</div>
                    <div
                      className="w-full border-2 border-neutral-900 bg-neutral-900"
                      style={{ height: `${altura}%`, minHeight: "8px" }}
                      aria-label={`${count} mensagens em ${dia}`}
                    />
                    <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-neutral-600">{dia}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <div className="border-2 border-green-600 bg-green-50 p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-green-800">Entregues</div>
            <div className="text-2xl font-bold text-green-900">{stats.enviadas}</div>
          </div>

          <div className="border-2 border-blue-600 bg-blue-50 p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-800">Lidas</div>
            <div className="text-2xl font-bold text-blue-900">{stats.lidas}</div>
          </div>

          <div className="border-2 border-yellow-600 bg-yellow-50 p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-800">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.pendentes}</div>
          </div>

          <div className="border-2 border-red-600 bg-red-50 p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-red-800">Falhas</div>
            <div className="text-2xl font-bold text-red-900">{stats.falhas}</div>
          </div>
        </div>

        <div className="border-4 border-neutral-900 bg-white">
          <div className="border-b-2 border-neutral-900 p-3 md:p-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-neutral-900">
              Mensagens Recentes
            </h2>
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            {!mensagens || mensagens.length === 0 ? (
              <div className="p-6 md:p-8 text-center">
                <p className="text-sm text-neutral-600">Nenhuma mensagem ainda.</p>
                <p className="mt-2 text-xs text-neutral-500">
                  Comece criando contatos e enviando campanhas para ver suas conversas aqui.
                </p>
              </div>
            ) : (
              mensagens.map((mensagem: any) => (
                <Link
                  key={mensagem.id}
                  href="/chat"
                  className="block border-b-2 border-neutral-300 p-3 md:p-4 hover:bg-neutral-50"
                >
                  <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900">
                        {mensagem.contatos?.nome || "Contato"}
                      </span>
                      <span
                        className={`border px-2 py-0.5 text-xs font-bold uppercase ${
                          mensagem.status === "lida"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : mensagem.status === "entregue" || mensagem.status === "enviada"
                              ? "border-green-600 bg-green-50 text-green-700"
                              : mensagem.status === "falhou"
                                ? "border-red-600 bg-red-50 text-red-700"
                                : "border-yellow-600 bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {mensagem.status}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(mensagem.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="truncate text-sm text-neutral-600">{mensagem.conteudo}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </AuthenticatedLayout>
  )
}
