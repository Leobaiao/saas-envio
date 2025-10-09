"use client"

import type React from "react"
import { useState } from "react"
import Sidebar from "@/components/sidebar"

// ============================================
// TIPOS E INTERFACES (Types & Interfaces)
// ============================================

// Interface para representar uma campanha salva
interface Campaign {
  id: number
  name: string
  message: string
  lists: number[]
  totalContacts: number
  stats: { total: number; sent: number; failed: number; delivered: number; read: number }
  sentAt: string
  hasMedia: boolean
  mediaType?: "image" | "video" | "document"
  mediaName?: string
  scheduledFor?: string // Data e hora do agendamento
  status?: "draft" | "scheduled" | "sending" | "sent" // Status da campanha
}

export default function CampanhasPage() {
  // ============================================
  // ESTADO DA APLICAÇÃO (Application State)
  // ============================================

  // Estado para controlar qual visualização está ativa
  const [currentView, setCurrentView] = useState<"create" | "reports">("create")

  // Estado para armazenar quais listas foram selecionadas
  const [selectedLists, setSelectedLists] = useState<number[]>([])

  // Estado para armazenar o texto da mensagem
  const [messageText, setMessageText] = useState("")

  // Estado para armazenar o nome da campanha
  const [campaignName, setCampaignName] = useState("")

  // Estado para controlar o status do envio em massa
  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "success" | "error">("idle")

  // Estado para armazenar o progresso do envio (0-100)
  const [sendingProgress, setSendingProgress] = useState(0)

  // Estado para armazenar estatísticas do envio
  const [sendStats, setSendStats] = useState({ total: 0, sent: 0, failed: 0, delivered: 0, read: 0 })

  // Estado para armazenar arquivo de mídia anexado
  const [mediaFile, setMediaFile] = useState<{ name: string; type: string; size: number } | null>(null)

  const [isScheduling, setIsScheduling] = useState(false) // Controla se está agendando
  const [scheduledDate, setScheduledDate] = useState("") // Data do agendamento
  const [scheduledTime, setScheduledTime] = useState("") // Hora do agendamento

  // Estado para armazenar campanhas enviadas
  const [sentCampaigns, setSentCampaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: "Campanha de Boas-Vindas",
      message: "Olá! Bem-vindo à nossa plataforma...",
      lists: [1, 2],
      totalContacts: 169,
      stats: { total: 169, sent: 169, failed: 8, delivered: 161, read: 142 },
      sentAt: "2024-01-15 14:30",
      hasMedia: true,
      mediaType: "image",
      mediaName: "welcome-banner.jpg",
      status: "sent",
    },
    {
      id: 2,
      name: "Promoção de Fim de Ano",
      message: "Aproveite 50% de desconto em todos os planos!",
      lists: [1],
      totalContacts: 124,
      stats: { total: 124, sent: 124, failed: 3, delivered: 121, read: 98 },
      sentAt: "2024-01-10 10:15",
      hasMedia: false,
      status: "sent",
    },
    {
      id: 3,
      name: "Lançamento de Produto",
      message: "Novidade chegando! Fique atento...",
      lists: [1, 2],
      totalContacts: 169,
      stats: { total: 0, sent: 0, failed: 0, delivered: 0, read: 0 },
      sentAt: "",
      scheduledFor: "2024-01-25 10:00",
      hasMedia: false,
      status: "scheduled",
    },
  ])

  // ============================================
  // DADOS MOCKADOS (Mock Data)
  // ============================================

  // Listas de contatos disponíveis
  const lists = [
    { id: 1, name: "Clientes Ativos", count: 124 },
    { id: 2, name: "Novos Leads", count: 45 },
    { id: 3, name: "Inativos", count: 23 },
  ]

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO (Handler Functions)
  // ============================================

  /**
   * Alterna a seleção de uma lista
   * Se já estiver selecionada, remove. Se não, adiciona.
   */
  const toggleListSelection = (listId: number) => {
    setSelectedLists(
      (prev) =>
        prev.includes(listId)
          ? prev.filter((id) => id !== listId) // Remove se já estiver selecionada
          : [...prev, listId], // Adiciona se não estiver selecionada
    )
  }

  /**
   * Calcula o total de contatos nas listas selecionadas
   */
  const getTotalContacts = () => {
    return lists.filter((list) => selectedLists.includes(list.id)).reduce((sum, list) => sum + list.count, 0)
  }

  /**
   * Simula o upload de um arquivo de mídia (imagem, vídeo ou documento)
   * Em produção, isso faria upload real para um servidor/storage
   */
  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Valida o tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Arquivo muito grande! Tamanho máximo: 10MB")
        return
      }

      // Valida o tipo do arquivo
      const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf"]
      if (!validTypes.includes(file.type)) {
        alert("Tipo de arquivo não suportado! Use: JPG, PNG, GIF, MP4 ou PDF")
        return
      }

      // Armazena informações do arquivo
      setMediaFile({
        name: file.name,
        type: file.type,
        size: file.size,
      })
    }
  }

  /**
   * Remove o arquivo de mídia anexado
   */
  const handleRemoveMedia = () => {
    setMediaFile(null)
  }

  /**
   * Simula o envio em massa de mensagens
   * Pode ser enviado imediatamente ou agendado para o futuro
   *
   * Adicionada lógica de agendamento
   */
  const handleSendMassMessages = async () => {
    // Validação: verifica se há listas selecionadas
    if (selectedLists.length === 0) {
      alert("Por favor, selecione pelo menos uma lista de contatos.")
      return
    }

    // Validação: verifica se há mensagem
    if (!messageText.trim()) {
      alert("Por favor, escreva uma mensagem.")
      return
    }

    // Validação: verifica se há nome da campanha
    if (!campaignName.trim()) {
      alert("Por favor, dê um nome para a campanha.")
      return
    }

    // Calcula o total de contatos que receberão a mensagem
    const totalContacts = getTotalContacts()

    if (isScheduling) {
      if (!scheduledDate || !scheduledTime) {
        alert("Por favor, selecione data e hora para o agendamento.")
        return
      }

      const scheduledDateTime = `${scheduledDate} ${scheduledTime}`

      const newCampaign: Campaign = {
        id: sentCampaigns.length + 1,
        name: campaignName,
        message: messageText,
        lists: selectedLists,
        totalContacts,
        stats: { total: 0, sent: 0, failed: 0, delivered: 0, read: 0 },
        sentAt: "",
        scheduledFor: scheduledDateTime,
        hasMedia: mediaFile !== null,
        mediaType: mediaFile?.type.startsWith("image")
          ? "image"
          : mediaFile?.type.startsWith("video")
            ? "video"
            : "document",
        mediaName: mediaFile?.name,
        status: "scheduled",
      }

      setSentCampaigns([newCampaign, ...sentCampaigns])

      alert(`Campanha agendada para ${new Date(scheduledDateTime).toLocaleString("pt-BR")}`)

      // Limpa o formulário
      setSelectedLists([])
      setMessageText("")
      setCampaignName("")
      setMediaFile(null)
      setIsScheduling(false)
      setScheduledDate("")
      setScheduledTime("")

      return
    }

    // Envio imediato (código existente)
    setSendingStatus("sending")
    setSendingProgress(0)
    setSendStats({ total: totalContacts, sent: 0, failed: 0, delivered: 0, read: 0 })

    try {
      // Simula o envio progressivo de mensagens
      for (let i = 0; i <= totalContacts; i++) {
        // Aguarda um pequeno delay para simular envio real
        await new Promise((resolve) => setTimeout(resolve, 50))

        // Atualiza o progresso (0-100%)
        const progress = Math.round((i / totalContacts) * 100)
        setSendingProgress(progress)

        // Simula taxa de sucesso de 95% (5% de falha aleatória)
        const success = Math.random() > 0.05
        // Simula taxa de entrega de 95% das mensagens enviadas
        const delivered = success && Math.random() > 0.05
        // Simula taxa de leitura de 85% das mensagens entregues
        const read = delivered && Math.random() > 0.15

        // Atualiza estatísticas
        setSendStats((prev) => ({
          total: totalContacts,
          sent: success ? prev.sent + 1 : prev.sent,
          failed: success ? prev.failed : prev.failed + 1,
          delivered: delivered ? prev.delivered + 1 : prev.delivered,
          read: read ? prev.read + 1 : prev.read,
        }))
      }

      // Atualiza status para "sucesso"
      setSendingStatus("success")

      // Cria objeto da nova campanha
      const newCampaign: Campaign = {
        id: sentCampaigns.length + 1,
        name: campaignName,
        message: messageText,
        lists: selectedLists,
        totalContacts,
        stats: sendStats,
        sentAt: new Date().toLocaleString("pt-BR"),
        hasMedia: mediaFile !== null,
        mediaType: mediaFile?.type.startsWith("image")
          ? "image"
          : mediaFile?.type.startsWith("video")
            ? "video"
            : "document",
        mediaName: mediaFile?.name,
        status: "sent",
      }

      // Adiciona a campanha ao histórico
      setSentCampaigns([newCampaign, ...sentCampaigns])

      // Após 3 segundos, reseta o formulário
      setTimeout(() => {
        setSendingStatus("idle")
        setSelectedLists([])
        setMessageText("")
        setCampaignName("")
        setSendingProgress(0)
        setMediaFile(null)
      }, 3000)
    } catch (error) {
      // Em caso de erro, atualiza o status
      setSendingStatus("error")
      console.error("[v0] Erro ao enviar mensagens em massa:", error)
    }
  }

  /**
   * Cancela uma campanha agendada
   */
  const handleCancelScheduledCampaign = (campaignId: number) => {
    if (!confirm("Deseja cancelar esta campanha agendada?")) return

    setSentCampaigns((prev) => prev.filter((c) => c.id !== campaignId))
    alert("Campanha agendada cancelada com sucesso!")
  }

  /**
   * Envia uma campanha agendada imediatamente
   */
  const handleSendScheduledCampaignNow = async (campaign: Campaign) => {
    if (!confirm(`Deseja enviar a campanha "${campaign.name}" agora?`)) return

    // Carrega os dados da campanha
    setSelectedLists(campaign.lists)
    setMessageText(campaign.message)
    setCampaignName(`${campaign.name} (Enviado Agora)`)

    // Remove a campanha agendada
    setSentCampaigns((prev) => prev.filter((c) => c.id !== campaign.id))

    // Executa o envio
    await handleSendMassMessages()
  }

  /**
   * Reenvia uma campanha já enviada anteriormente
   * Carrega os dados da campanha e executa o envio novamente
   */
  const handleResendCampaign = async (campaign: Campaign) => {
    // Confirma com o usuário
    if (!confirm(`Deseja reenviar a campanha "${campaign.name}" para ${campaign.totalContacts} contatos?`)) {
      return
    }

    // Carrega os dados da campanha
    setSelectedLists(campaign.lists)
    setMessageText(campaign.message)
    setCampaignName(`${campaign.name} (Reenvio)`)

    // Simula o reenvio
    setSendingStatus("sending")
    setSendingProgress(0)
    setSendStats({ total: campaign.totalContacts, sent: 0, failed: 0, delivered: 0, read: 0 })

    try {
      // Loop de envio progressivo
      for (let i = 0; i <= campaign.totalContacts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        const progress = Math.round((i / campaign.totalContacts) * 100)
        setSendingProgress(progress)

        const success = Math.random() > 0.05
        const delivered = success && Math.random() > 0.05
        const read = delivered && Math.random() > 0.15

        setSendStats((prev) => ({
          total: campaign.totalContacts,
          sent: success ? prev.sent + 1 : prev.sent,
          failed: success ? prev.failed : prev.failed + 1,
          delivered: delivered ? prev.delivered + 1 : prev.delivered,
          read: read ? prev.read + 1 : prev.read,
        }))
      }

      setSendingStatus("success")

      // Salva o reenvio no histórico
      const resentCampaign: Campaign = {
        ...campaign,
        id: sentCampaigns.length + 1,
        name: `${campaign.name} (Reenvio)`,
        stats: sendStats,
        sentAt: new Date().toLocaleString("pt-BR"),
        status: "sent",
      }
      setSentCampaigns([resentCampaign, ...sentCampaigns])

      // Reseta após 3 segundos
      setTimeout(() => {
        setSendingStatus("idle")
        setSendingProgress(0)
        setSelectedLists([])
        setMessageText("")
        setCampaignName("")
      }, 3000)
    } catch (error) {
      setSendingStatus("error")
      console.error("[v0] Erro ao reenviar campanha:", error)
    }
  }

  /**
   * Reenvia apenas as mensagens que falharam em uma campanha
   * Filtra apenas os contatos que tiveram falha no envio e reenvia
   *
   * @param campaign - Campanha com mensagens falhadas
   */
  const handleResendFailedMessages = async (campaign: Campaign) => {
    // Verifica se há mensagens com falha
    if (campaign.stats.failed === 0) {
      alert("Não há mensagens com falha nesta campanha.")
      return
    }

    // Confirma com o usuário
    if (
      !confirm(
        `Deseja reenviar apenas as ${campaign.stats.failed} mensagens que falharam na campanha "${campaign.name}"?`,
      )
    ) {
      return
    }

    // Simula o reenvio apenas das mensagens com falha
    setSendingStatus("sending")
    setSendingProgress(0)
    setSendStats({ total: campaign.stats.failed, sent: 0, failed: 0, delivered: 0, read: 0 })

    try {
      // Loop de envio progressivo apenas para mensagens falhadas
      for (let i = 0; i <= campaign.stats.failed; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        const progress = Math.round((i / campaign.stats.failed) * 100)
        setSendingProgress(progress)

        // Taxa de sucesso maior no reenvio (98%)
        const success = Math.random() > 0.02
        const delivered = success && Math.random() > 0.05
        const read = delivered && Math.random() > 0.15

        setSendStats((prev) => ({
          total: campaign.stats.failed,
          sent: success ? prev.sent + 1 : prev.sent,
          failed: success ? prev.failed : prev.failed + 1,
          delivered: delivered ? prev.delivered + 1 : prev.delivered,
          read: read ? prev.read + 1 : prev.read,
        }))
      }

      setSendingStatus("success")

      // Salva o reenvio no histórico
      const resentCampaign: Campaign = {
        ...campaign,
        id: sentCampaigns.length + 1,
        name: `${campaign.name} (Reenvio - Falhas)`,
        totalContacts: campaign.stats.failed,
        stats: sendStats,
        sentAt: new Date().toLocaleString("pt-BR"),
        status: "sent",
      }
      setSentCampaigns([resentCampaign, ...sentCampaigns])

      alert(`Reenvio concluído! ${sendStats.sent} mensagens enviadas com sucesso.`)

      // Reseta após 3 segundos
      setTimeout(() => {
        setSendingStatus("idle")
        setSendingProgress(0)
      }, 3000)
    } catch (error) {
      setSendingStatus("error")
      console.error("[v0] Erro ao reenviar mensagens com falha:", error)
    }
  }

  /**
   * Reseta o formulário de criação de campanha
   * Limpa todos os campos e volta ao estado inicial
   */
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

  // ============================================
  // RENDERIZAÇÃO DA INTERFACE (UI Rendering)
  // ============================================

  return (
    <div className="min-h-screen bg-neutral-100 font-mono">
      {/* ============================================ */}
      {/* SIDEBAR ESQUERDA - Navegação */}
      {/* ============================================ */}
      <Sidebar />

      {/* ============================================ */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ============================================ */}
      <main className="ml-64 p-8 transition-all duration-300">
        <div className="mx-auto max-w-4xl">
          {/* Título da página com botões de navegação */}
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

          {/* ============================================ */}
          {/* VISUALIZAÇÃO: RELATÓRIOS DE CAMPANHAS */}
          {/* ============================================ */}
          {currentView === "reports" ? (
            <div className="space-y-6">
              {sentCampaigns.length === 0 ? (
                // Mensagem quando não há campanhas
                <div className="border-2 border-neutral-300 bg-white p-8 text-center">
                  <p className="text-sm text-neutral-600">Nenhuma campanha enviada ainda.</p>
                  <button
                    onClick={() => setCurrentView("create")}
                    className="mt-4 border-2 border-neutral-900 bg-neutral-900 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                  >
                    Criar Primeira Campanha
                  </button>
                </div>
              ) : (
                // Lista de campanhas enviadas
                sentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border-2 border-neutral-900 bg-white p-6">
                    {/* Cabeçalho da campanha */}
                    <div className="mb-4 flex items-start justify-between border-b-2 border-neutral-300 pb-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-lg font-bold text-neutral-900">{campaign.name}</h3>
                          {campaign.status === "scheduled" && (
                            <span className="border-2 border-blue-600 bg-blue-50 px-2 py-1 text-xs font-bold uppercase text-blue-600">
                              🕒 Agendada
                            </span>
                          )}
                          {campaign.status === "sent" && (
                            <span className="border-2 border-green-600 bg-green-50 px-2 py-1 text-xs font-bold uppercase text-green-600">
                              ✓ Enviada
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
                        {campaign.hasMedia && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                            <span className="border-2 border-neutral-300 bg-neutral-100 px-2 py-1">
                              📎 {campaign.mediaName}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Botão de reenvio ou ações de agendamento */}
                      <div className="flex gap-2">
                        {campaign.status === "scheduled" ? (
                          <>
                            <button
                              onClick={() => handleSendScheduledCampaignNow(campaign)}
                              className="border-2 border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                            >
                              Enviar Agora
                            </button>
                            <button
                              onClick={() => handleCancelScheduledCampaign(campaign.id)}
                              className="border-2 border-red-600 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleResendCampaign(campaign)}
                              className="border-2 border-neutral-900 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white"
                            >
                              Reenviar Tudo
                            </button>
                            {campaign.stats.failed > 0 && (
                              <button
                                onClick={() => handleResendFailedMessages(campaign)}
                                className="border-2 border-red-600 bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700"
                              >
                                Reenviar Falhas ({campaign.stats.failed})
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Estatísticas detalhadas da campanha (apenas para campanhas enviadas) */}
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

                        {/* Métricas de performance */}
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
              {/* ============================================ */}
              {/* VISUALIZAÇÃO: CRIAR NOVA CAMPANHA */}
              {/* ============================================ */}

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
                <p className="mt-2 text-xs text-neutral-600">
                  Dê um nome descritivo para identificar esta campanha nos relatórios
                </p>
              </div>

              {/* Seleção de Listas */}
              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Selecionar Lista(s)
                </h2>
                <div className="space-y-3">
                  {/* Mapeia cada lista e cria um checkbox */}
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

                {/* Mostra total de contatos selecionados */}
                {selectedLists.length > 0 && (
                  <div className="mt-4 border-t-2 border-neutral-300 pt-4">
                    <p className="text-sm font-bold text-neutral-900">
                      Total de contatos selecionados: <span className="text-neutral-600">{getTotalContacts()}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Área de Texto da Mensagem */}
              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Escreva sua mensagem</h2>
                  <button className="border-2 border-neutral-400 bg-neutral-100 px-3 py-1 text-xs uppercase tracking-wider text-neutral-700 hover:border-neutral-900">
                    Variáveis Disponíveis
                  </button>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sendingStatus === "sending"}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-4 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  rows={8}
                  placeholder="Olá, {nome}! Temos novidades..."
                />
                <div className="mt-2 text-right text-xs text-neutral-600">{messageText.length} caracteres</div>
              </div>

              {/* Anexar Mídia */}
              <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Anexar Mídia</h2>

                {mediaFile ? (
                  // Mostra preview do arquivo anexado
                  <div className="flex items-center justify-between border-2 border-neutral-300 bg-neutral-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="border-2 border-neutral-900 bg-white px-3 py-2 text-xs font-bold">
                        {mediaFile.type.startsWith("image") ? "🖼️" : mediaFile.type.startsWith("video") ? "🎥" : "📄"}
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
                  // Mostra botão de upload
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
                      className="inline-block cursor-pointer border-2 border-neutral-900 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white disabled:opacity-50"
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

              {/* Status e Progresso do Envio */}
              {sendingStatus !== "idle" && (
                <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Status do Envio</h3>

                  {/* Barra de progresso */}
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

                  {/* Estatísticas do envio */}
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

                  {/* Mensagem de sucesso */}
                  {sendingStatus === "success" && (
                    <div className="mt-4 border-2 border-green-600 bg-green-50 p-4 text-center">
                      <p className="text-sm font-bold text-green-600">Campanha enviada com sucesso!</p>
                    </div>
                  )}

                  {/* Mensagem de erro */}
                  {sendingStatus === "error" && (
                    <div className="mt-4 border-2 border-red-600 bg-red-50 p-4 text-center">
                      <p className="text-sm font-bold text-red-600">Erro ao enviar campanha. Tente novamente.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 border-t-2 border-neutral-900 pt-6">
                <button
                  onClick={handleResetForm}
                  disabled={sendingStatus === "sending"}
                  className="flex-1 border-2 border-neutral-400 bg-white px-6 py-4 text-base font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Limpar Formulário
                </button>
                {/* Botão de envio principal */}
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
