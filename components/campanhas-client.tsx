"use client"

import type React from "react"
import { useState } from "react"
import Sidebar from "@/components/sidebar"
import { createClient } from "@/lib/supabase/client"

interface Campaign {
  id: string
  name: string
  message: string
  lists: string[]
  totalContacts: number
  stats: { total: number; sent: number; failed: number; delivered: number; read: number }
  sentAt: string
  hasMedia: boolean
  mediaType?: "image" | "video" | "document"
  mediaName?: string
  scheduledFor?: string
  status?: "draft" | "scheduled" | "sending" | "sent"
  nome: string
  mensagem: string
  total_contatos: number
  enviadas: number
  entregues: number
  lidas: number
  falhas: number
  created_at: string
  agendada_para?: string
}

interface CampanhasClientProps {
  initialCampanhas: any[]
  initialListas: any[]
  userId: string
}

export default function CampanhasClient({ initialCampanhas, initialListas, userId }: CampanhasClientProps) {
  const supabase = createClient()

  const [sentCampaigns, setSentCampaigns] = useState<Campaign[]>(
    initialCampanhas.map((c) => ({
      id: c.id,
      name: c.nome,
      message: c.mensagem,
      lists: c.lista_id ? [c.lista_id] : [],
      totalContacts: c.total_contatos || 0,
      stats: {
        total: c.total_contatos || 0,
        sent: c.enviadas || 0,
        failed: c.falhas || 0,
        delivered: c.entregues || 0,
        read: c.lidas || 0,
      },
      sentAt: c.created_at ? new Date(c.created_at).toLocaleString("pt-BR") : "",
      hasMedia: !!c.media_url,
      mediaType: c.media_type as "image" | "video" | "document",
      mediaName: c.media_url,
      scheduledFor: c.agendada_para,
      status: c.status as "draft" | "scheduled" | "sending" | "sent",
      nome: c.nome,
      mensagem: c.mensagem,
      total_contatos: c.total_contatos,
      enviadas: c.enviadas,
      entregues: c.entregues,
      lidas: c.lidas,
      falhas: c.falhas,
      created_at: c.created_at,
      agendada_para: c.agendada_para,
    })),
  )

  const lists = initialListas.map((l) => ({
    id: l.id,
    name: l.nome,
    count: l.total_contatos || 0,
  }))

  const [currentView, setCurrentView] = useState<"create" | "reports">("create")
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [messageText, setMessageText] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [sendingProgress, setSendingProgress] = useState(0)
  const [sendStats, setSendStats] = useState({ total: 0, sent: 0, failed: 0, delivered: 0, read: 0 })
  const [mediaFile, setMediaFile] = useState<{ name: string; type: string; size: number } | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "scheduled">("all")

  const toggleListSelection = (listId: string) => {
    setSelectedLists((prev) => (prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]))
  }

  const getTotalContacts = () => {
    return lists.filter((list) => selectedLists.includes(list.id)).reduce((sum, list) => sum + list.count, 0)
  }

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Arquivo muito grande! Tamanho máximo: 10MB")
        return
      }

      const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        alert("Tipo de arquivo não suportado! Use: JPG, PNG, GIF, MP4 ou PDF")
        return
      }

      setMediaFile({
        name: file.name,
        type: file.type,
        size: file.size,
      })
    }
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
  }

  const handleSendMassMessages = async () => {
    if (selectedLists.length === 0) {
      alert("Por favor, selecione pelo menos uma lista de contatos.")
      return
    }

    if (!messageText.trim()) {
      alert("Por favor, escreva uma mensagem.")
      return
    }

    if (!campaignName.trim()) {
      alert("Por favor, dê um nome para a campanha.")
      return
    }

    const totalContacts = getTotalContacts()

    try {
      if (isScheduling) {
        if (!scheduledDate || !scheduledTime) {
          alert("Por favor, selecione data e hora para o agendamento.")
          return
        }

        const scheduledDateTime = `${scheduledDate} ${scheduledTime}`

        const { data, error } = await supabase
          .from("campanhas")
          .insert({
            user_id: userId,
            nome: campaignName,
            mensagem: messageText,
            lista_id: selectedLists[0],
            total_contatos: totalContacts,
            status: "scheduled",
            agendada_para: scheduledDateTime,
            media_url: mediaFile?.name,
            media_type: mediaFile?.type.startsWith("image")
              ? "image"
              : mediaFile?.type.startsWith("video")
                ? "video"
                : "document",
          })
          .select()
          .single()

        if (error) throw error

        alert(`Campanha agendada para ${new Date(scheduledDateTime).toLocaleString("pt-BR")}`)

        // Limpa o formulário
        setSelectedLists([])
        setMessageText("")
        setCampaignName("")
        setMediaFile(null)
        setIsScheduling(false)
        setScheduledDate("")
        setScheduledTime("")

        // Atualiza lista de campanhas
        window.location.reload()
        return
      }

      // Envio imediato
      setSendingStatus("sending")
      setSendingProgress(0)
      setSendStats({ total: totalContacts, sent: 0, failed: 0, delivered: 0, read: 0 })

      // Simula envio progressivo
      for (let i = 0; i <= totalContacts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        const progress = Math.round((i / totalContacts) * 100)
        setSendingProgress(progress)

        const success = Math.random() > 0.05
        const delivered = success && Math.random() > 0.05
        const read = delivered && Math.random() > 0.15

        setSendStats((prev) => ({
          total: totalContacts,
          sent: success ? prev.sent + 1 : prev.sent,
          failed: success ? prev.failed : prev.failed + 1,
          delivered: delivered ? prev.delivered + 1 : prev.delivered,
          read: read ? prev.read + 1 : prev.read,
        }))
      }

      // Salva campanha no banco
      const { error } = await supabase.from("campanhas").insert({
        user_id: userId,
        nome: campaignName,
        mensagem: messageText,
        lista_id: selectedLists[0],
        total_contatos: totalContacts,
        enviadas: sendStats.sent,
        entregues: sendStats.delivered,
        lidas: sendStats.read,
        falhas: sendStats.failed,
        status: "sent",
        media_url: mediaFile?.name,
        media_type: mediaFile?.type.startsWith("image")
          ? "image"
          : mediaFile?.type.startsWith("video")
            ? "video"
            : "document",
      })

      if (error) throw error

      setSendingStatus("success")

      setTimeout(() => {
        setSendingStatus("idle")
        setSelectedLists([])
        setMessageText("")
        setCampaignName("")
        setSendingProgress(0)
        setMediaFile(null)
        window.location.reload()
      }, 3000)
    } catch (error) {
      setSendingStatus("error")
      console.error("[v0] Erro ao enviar mensagens em massa:", error)
    }
  }

  const handleResetForm = () => {
    if (confirm("Deseja limpar todos os campos e começar uma nova campanha?")) {
      setSelectedLists([])
      setMessageText("")
      setCampaignName("")
      setMediaFile(null)
      setSendingStatus("idle")
      setSendingProgress(0)
      setIsScheduling(false)
      setScheduledDate("")
      setScheduledTime("")
    }
  }

  const filteredCampaigns = sentCampaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-neutral-100 font-mono">
      <Sidebar />

      <main className="ml-64 p-8 transition-all duration-300">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between border-b-2 border-neutral-900 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900">
              {currentView === "reports" ? "Relatórios de Campanhas" : "Nova Campanha de Mensagens"}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView("create")}
                className={`border-2 px-4 py-2 text-sm font-bold uppercase tracking-wider ${
                  currentView === "create"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-400 bg-white text-neutral-700 hover:border-neutral-900"
                }`}
              >
                Nova Campanha
              </button>
              <button
                onClick={() => setCurrentView("reports")}
                className={`border-2 px-4 py-2 text-sm font-bold uppercase tracking-wider ${
                  currentView === "reports"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-400 bg-white text-neutral-700 hover:border-neutral-900"
                }`}
              >
                Ver Relatórios
              </button>
            </div>
          </div>

          {currentView === "reports" ? (
            <div className="space-y-6">
              <div className="border-2 border-neutral-900 bg-white p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Buscar Campanha
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nome ou mensagem..."
                      className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Filtrar por Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "all" | "sent" | "scheduled")}
                      className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                    >
                      <option value="all">Todas</option>
                      <option value="sent">Enviadas</option>
                      <option value="scheduled">Agendadas</option>
                    </select>
                  </div>
                </div>
              </div>
              {filteredCampaigns.length === 0 ? (
                <div className="border-2 border-neutral-300 bg-white p-8 text-center">
                  <p className="text-sm text-neutral-600">
                    {sentCampaigns.length === 0
                      ? "Nenhuma campanha enviada ainda."
                      : "Nenhuma campanha encontrada com os filtros aplicados."}
                  </p>
                  {sentCampaigns.length === 0 && (
                    <button
                      onClick={() => setCurrentView("create")}
                      className="mt-4 border-2 border-neutral-900 bg-neutral-900 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                    >
                      Criar Primeira Campanha
                    </button>
                  )}
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border-2 border-neutral-900 bg-white p-6">
                    <div className="mb-4 flex items-start justify-between border-b-2 border-neutral-300 pb-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-lg font-bold text-neutral-900">{campaign.name}</h3>
                          {campaign.status === "scheduled" && (
                            <span className="border-2 border-blue-600 bg-blue-50 px-2 py-1 text-xs font-bold uppercase text-blue-600">
                              Agendada
                            </span>
                          )}
                          {campaign.status === "sent" && (
                            <span className="border-2 border-green-600 bg-green-50 px-2 py-1 text-xs font-bold uppercase text-green-600">
                              Enviada
                            </span>
                          )}
                        </div>
                        {campaign.status === "scheduled" ? (
                          <p className="text-xs text-neutral-600">
                            Agendada para: {new Date(campaign.scheduledFor!).toLocaleString("pt-BR")}
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-600">Enviada em: {campaign.sentAt}</p>
                        )}
                        <p className="mt-2 text-sm text-neutral-700">{campaign.message}</p>
                      </div>
                    </div>

                    {campaign.status === "sent" && (
                      <>
                        <div className="grid grid-cols-5 gap-3">
                          <div className="border-2 border-neutral-300 p-3 text-center">
                            <div className="text-xl font-bold text-neutral-900">{campaign.stats.total}</div>
                            <div className="text-xs text-neutral-600">Total</div>
                          </div>
                          <div className="border-2 border-neutral-300 p-3 text-center">
                            <div className="text-xl font-bold text-blue-600">{campaign.stats.sent}</div>
                            <div className="text-xs text-neutral-600">Enviadas</div>
                          </div>
                          <div className="border-2 border-neutral-300 p-3 text-center">
                            <div className="text-xl font-bold text-green-600">{campaign.stats.delivered}</div>
                            <div className="text-xs text-neutral-600">Entregues</div>
                          </div>
                          <div className="border-2 border-neutral-300 p-3 text-center">
                            <div className="text-xl font-bold text-purple-600">{campaign.stats.read}</div>
                            <div className="text-xs text-neutral-600">Lidas</div>
                          </div>
                          <div className="border-2 border-neutral-300 p-3 text-center">
                            <div className="text-xl font-bold text-red-600">{campaign.stats.failed}</div>
                            <div className="text-xs text-neutral-600">Falhas</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 border-t-2 border-neutral-300 pt-4">
                          <div className="text-center">
                            <div className="text-sm font-bold text-neutral-900">
                              {((campaign.stats.delivered / campaign.stats.sent) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-neutral-600">Taxa de Entrega</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-neutral-900">
                              {((campaign.stats.read / campaign.stats.delivered) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-neutral-600">Taxa de Leitura</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-neutral-900">
                              {((campaign.stats.failed / campaign.stats.total) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-neutral-600">Taxa de Falha</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Nome da Campanha</h2>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  disabled={sendingStatus === "sending"}
                  placeholder="Ex: Promoção de Verão 2024"
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Selecionar Lista(s)
                </h2>
                <div className="space-y-3">
                  {lists.map((list) => (
                    <label
                      key={list.id}
                      className="flex cursor-pointer items-center gap-3 border-2 border-neutral-300 bg-neutral-50 p-3 hover:border-neutral-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLists.includes(list.id)}
                        onChange={() => toggleListSelection(list.id)}
                        disabled={sendingStatus === "sending"}
                        className="h-5 w-5 border-2 border-neutral-900"
                      />
                      <span className="text-sm text-neutral-900">
                        {list.name} <span className="text-neutral-600">({list.count} contatos)</span>
                      </span>
                    </label>
                  ))}
                </div>

                {selectedLists.length > 0 && (
                  <div className="mt-4 border-t-2 border-neutral-300 pt-4">
                    <p className="text-sm font-bold text-neutral-900">
                      Total de contatos selecionados: <span className="text-neutral-600">{getTotalContacts()}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Escreva sua mensagem
                </h2>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sendingStatus === "sending"}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-4 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  rows={8}
                  placeholder="Olá! Temos novidades..."
                />
                <div className="mt-2 text-right text-xs text-neutral-600">{messageText.length} caracteres</div>
              </div>

              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Anexar Mídia</h2>

                {mediaFile ? (
                  <div className="flex items-center justify-between border-2 border-neutral-300 bg-neutral-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="border-2 border-neutral-900 bg-white px-3 py-2 text-xs font-bold">
                        {mediaFile.type.startsWith("image")
                          ? "IMG"
                          : mediaFile.type.startsWith("video")
                            ? "VID"
                            : "DOC"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{mediaFile.name}</p>
                        <p className="text-xs text-neutral-600">{(mediaFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveMedia}
                      disabled={sendingStatus === "sending"}
                      className="border-2 border-red-600 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="media-upload"
                      accept="image/*,video/mp4,application/pdf"
                      onChange={handleMediaUpload}
                      disabled={sendingStatus === "sending"}
                      className="hidden"
                    />
                    <label
                      htmlFor="media-upload"
                      className="inline-block cursor-pointer border-2 border-neutral-900 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white"
                    >
                      Escolher Arquivo
                    </label>
                    <p className="mt-2 text-xs text-neutral-600">
                      Formatos aceitos: JPG, PNG, GIF, MP4, PDF (máx. 10MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Agendamento</h2>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isScheduling}
                      onChange={(e) => setIsScheduling(e.target.checked)}
                      disabled={sendingStatus === "sending"}
                      className="h-5 w-5 border-2 border-neutral-900"
                    />
                    <span className="text-sm text-neutral-900">Agendar envio</span>
                  </label>
                </div>

                {isScheduling && (
                  <div className="grid grid-cols-2 gap-4 border-t-2 border-neutral-300 pt-4">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Data
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        disabled={sendingStatus === "sending"}
                        className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        disabled={sendingStatus === "sending"}
                        className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {sendingStatus !== "idle" && (
                <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Status do Envio</h3>

                  {sendingStatus === "sending" && (
                    <div className="mb-4">
                      <div className="mb-2 flex justify-between text-xs text-neutral-600">
                        <span>Enviando mensagens...</span>
                        <span>{sendingProgress}%</span>
                      </div>
                      <div className="h-4 w-full border-2 border-neutral-900 bg-neutral-100">
                        <div
                          className="h-full bg-neutral-900 transition-all duration-300"
                          style={{ width: `${sendingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-3 text-center">
                    <div className="border-2 border-neutral-300 p-3">
                      <div className="text-2xl font-bold text-neutral-900">{sendStats.total}</div>
                      <div className="text-xs text-neutral-600">Total</div>
                    </div>
                    <div className="border-2 border-neutral-300 p-3">
                      <div className="text-2xl font-bold text-blue-600">{sendStats.sent}</div>
                      <div className="text-xs text-neutral-600">Enviadas</div>
                    </div>
                    <div className="border-2 border-neutral-300 p-3">
                      <div className="text-2xl font-bold text-green-600">{sendStats.delivered}</div>
                      <div className="text-xs text-neutral-600">Entregues</div>
                    </div>
                    <div className="border-2 border-neutral-300 p-3">
                      <div className="text-2xl font-bold text-purple-600">{sendStats.read}</div>
                      <div className="text-xs text-neutral-600">Lidas</div>
                    </div>
                    <div className="border-2 border-neutral-300 p-3">
                      <div className="text-2xl font-bold text-red-600">{sendStats.failed}</div>
                      <div className="text-xs text-neutral-600">Falhas</div>
                    </div>
                  </div>

                  {sendingStatus === "success" && (
                    <div className="mt-4 border-2 border-green-600 bg-green-50 p-4 text-center">
                      <p className="text-sm font-bold text-green-600">Campanha enviada com sucesso!</p>
                    </div>
                  )}

                  {sendingStatus === "error" && (
                    <div className="mt-4 border-2 border-red-600 bg-red-50 p-4 text-center">
                      <p className="text-sm font-bold text-red-600">Erro ao enviar campanha. Tente novamente.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 border-t-2 border-neutral-900 pt-6">
                <button
                  onClick={handleResetForm}
                  disabled={sendingStatus === "sending"}
                  className="flex-1 border-2 border-neutral-400 bg-white px-6 py-4 text-base font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Limpar Formulário
                </button>
                <button
                  onClick={handleSendMassMessages}
                  disabled={
                    sendingStatus === "sending" ||
                    selectedLists.length === 0 ||
                    !messageText.trim() ||
                    !campaignName.trim()
                  }
                  className="flex-[2] border-2 border-neutral-900 bg-neutral-900 px-8 py-4 text-base font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingStatus === "sending"
                    ? "Enviando Mensagens..."
                    : isScheduling
                      ? "Agendar Campanha"
                      : "Enviar Campanha"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
