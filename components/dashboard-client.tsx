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
          <div className="border-4 border-primary bg-card p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total de Contatos
            </div>
            <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.totalContatos}</div>
            <Link href="/contatos" className="mt-2 inline-block text-xs text-muted-foreground hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="border-4 border-primary bg-card p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Campanhas Ativas
            </div>
            <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.totalCampanhas}</div>
            <Link href="/campanhas" className="mt-2 inline-block text-xs text-muted-foreground hover:underline">
              Gerenciar →
            </Link>
          </div>

          <div className="border-4 border-primary bg-card p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Mensagens Enviadas
            </div>
            <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.enviadas}</div>
            <div className="mt-2 text-xs text-[color:var(--color-success)]">Taxa de entrega: {taxaEntrega}%</div>
          </div>

          <div className="border-4 border-primary bg-card p-4 md:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Taxa de Leitura</div>
            <div className="text-3xl md:text-4xl font-bold text-foreground">{taxaLeitura}%</div>
            <div className="mt-2 text-xs text-muted-foreground">{stats.lidas} mensagens lidas</div>
          </div>
        </div>

        <div className="mb-6 border-4 border-primary bg-card p-4 md:p-6">
          <h2 className="mb-4 md:mb-6 text-base md:text-lg font-bold uppercase tracking-wider text-foreground">
            Mensagens dos Últimos 7 Dias
          </h2>
          <div className="flex h-40 md:h-48 items-end justify-between gap-1 md:gap-2">
            {diasSemana.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma mensagem nos últimos 7 dias
              </div>
            ) : (
              diasSemana.map((dia) => {
                const count = stats.mensagensPorDia[dia]
                const altura = (count / maxMensagens) * 100
                return (
                  <div key={dia} className="flex flex-1 flex-col items-center">
                    <div className="mb-1 md:mb-2 text-xs font-bold text-foreground">{count}</div>
                    <div
                      className="w-full border-2 border-primary bg-primary"
                      style={{ height: `${altura}%`, minHeight: "8px" }}
                      aria-label={`${count} mensagens em ${dia}`}
                    />
                    <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-muted-foreground">{dia}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <div className="border-2 border-[color:var(--color-success)] bg-[color:var(--color-success-muted)] p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[color:var(--color-success)]">
              Entregues
            </div>
            <div className="text-2xl font-bold text-[color:var(--color-success)]">{stats.enviadas}</div>
          </div>

          <div className="border-2 border-[color:var(--color-info)] bg-[color:var(--color-info-muted)] p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[color:var(--color-info)]">Lidas</div>
            <div className="text-2xl font-bold text-[color:var(--color-info)]">{stats.lidas}</div>
          </div>

          <div className="border-2 border-[color:var(--color-warning)] bg-[color:var(--color-warning-muted)] p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[color:var(--color-warning)]">
              Pendentes
            </div>
            <div className="text-2xl font-bold text-[color:var(--color-warning)]">{stats.pendentes}</div>
          </div>

          <div className="border-2 border-destructive bg-[color:var(--color-error-muted)] p-4 md:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-destructive">Falhas</div>
            <div className="text-2xl font-bold text-destructive">{stats.falhas}</div>
          </div>
        </div>

        <div className="border-4 border-primary bg-card">
          <div className="border-b-2 border-border p-3 md:p-4">
            <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-foreground">
              Mensagens Recentes
            </h2>
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            {!mensagens || mensagens.length === 0 ? (
              <div className="p-6 md:p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Comece criando contatos e enviando campanhas para ver suas conversas aqui.
                </p>
              </div>
            ) : (
              mensagens.map((mensagem: any) => (
                <Link
                  key={mensagem.id}
                  href="/chat"
                  className="block border-b-2 border-border p-3 md:p-4 hover:bg-muted"
                >
                  <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {mensagem.contatos?.nome || "Contato"}
                      </span>
                      <span
                        className={`border px-2 py-0.5 text-xs font-bold uppercase ${
                          mensagem.status === "lida"
                            ? "border-[color:var(--color-info)] bg-[color:var(--color-info-muted)] text-[color:var(--color-info)]"
                            : mensagem.status === "entregue" || mensagem.status === "enviada"
                              ? "border-[color:var(--color-success)] bg-[color:var(--color-success-muted)] text-[color:var(--color-success)]"
                              : mensagem.status === "falhou"
                                ? "border-destructive bg-[color:var(--color-error-muted)] text-destructive"
                                : "border-[color:var(--color-warning)] bg-[color:var(--color-warning-muted)] text-[color:var(--color-warning)]"
                        }`}
                      >
                        {mensagem.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(mensagem.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{mensagem.conteudo}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </AuthenticatedLayout>
  )
}
