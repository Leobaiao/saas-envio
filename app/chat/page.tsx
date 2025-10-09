"use client"

import type React from "react"
import { useState } from "react"
import Sidebar from "@/components/sidebar"

export default function ChatPage() {
  // ============================================
  // ESTADO DA APLICAÇÃO (Application State)
  // ============================================

  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, sender: "Cliente X", text: "Olá, boa tarde!", time: "14:20", isReply: false },
    { id: 2, sender: "Você", text: "Olá! Como posso ajudar?", time: "14:21", isReply: false },
    {
      id: 3,
      sender: "Cliente X",
      text: "Gostaria de saber mais sobre os planos disponíveis",
      time: "14:22",
      isReply: false,
    },
    {
      id: 4,
      sender: "Você",
      text: "Claro! Temos 3 planos principais: Básico, Pro e Enterprise.",
      time: "14:23",
      isReply: false,
    },
    { id: 5, sender: "Cliente X", text: "Qual a diferença entre eles?", time: "14:24", isReply: false },
    {
      id: 6,
      sender: "Você",
      text: "O Básico inclui até 1000 mensagens/mês, o Pro até 10.000 e o Enterprise é ilimitado.",
      time: "14:25",
      isReply: false,
    },
  ])

  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [replyingTo, setReplyingTo] = useState<{ id: number; text: string; sender: string } | null>(null)
  const [mediaFile, setMediaFile] = useState<{ name: string; type: string; size: number } | null>(null)

  const [isScheduling, setIsScheduling] = useState(false) // Controla se está no modo de agendamento
  const [scheduledDate, setScheduledDate] = useState("") // Data do agendamento
  const [scheduledTime, setScheduledTime] = useState("") // Hora do agendamento
  const [scheduledMessages, setScheduledMessages] = useState<
    Array<{
      id: number
      text: string
      scheduledFor: string
      status: "pending" | "sent" | "cancelled"
      hasMedia: boolean
      media: { name: string; type: string; size: number } | null
    }>
  >([]) // Lista de mensagens agendadas

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO (Handler Functions)
  // ============================================

  /**
   * Simula o envio de uma mensagem individual
   * Pode ser enviada imediatamente ou agendada para o futuro
   */
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    if (isScheduling) {
      if (!scheduledDate || !scheduledTime) {
        alert("Por favor, selecione data e hora para o agendamento.")
        return
      }

      const scheduledDateTime = `${scheduledDate} ${scheduledTime}`

      // Cria mensagem agendada
      const newScheduledMessage = {
        id: Date.now(),
        text: messageInput,
        scheduledFor: scheduledDateTime,
        status: "pending" as const,
        hasMedia: mediaFile !== null,
        media: mediaFile,
      }

      setScheduledMessages([...scheduledMessages, newScheduledMessage])

      alert(`Mensagem agendada para ${new Date(scheduledDateTime).toLocaleString("pt-BR")}`)

      // Limpa o formulário
      setMessageInput("")
      setMediaFile(null)
      setIsScheduling(false)
      setScheduledDate("")
      setScheduledTime("")

      return
    }

    // Envio imediato (código existente)
    setSendingStatus("sending")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newMessage = {
        id: messages.length + 1,
        sender: "Você",
        text: messageInput,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        isReply: replyingTo !== null,
        replyTo: replyingTo,
        hasMedia: mediaFile !== null,
        media: mediaFile,
      }

      setMessages([...messages, newMessage])
      setMessageInput("")
      setReplyingTo(null)
      setMediaFile(null)
      setSendingStatus("success")

      setTimeout(() => setSendingStatus("idle"), 2000)
    } catch (error) {
      setSendingStatus("error")
      console.error("[v0] Erro ao enviar mensagem:", error)
    }
  }

  /**
   * Cancela uma mensagem agendada
   */
  const handleCancelScheduledMessage = (id: number) => {
    setScheduledMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, status: "cancelled" as const } : msg)))
  }

  /**
   * Envia uma mensagem agendada imediatamente
   */
  const handleSendScheduledNow = async (id: number) => {
    const scheduledMsg = scheduledMessages.find((msg) => msg.id === id)
    if (!scheduledMsg) return

    setSendingStatus("sending")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newMessage = {
        id: messages.length + 1,
        sender: "Você",
        text: scheduledMsg.text,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        isReply: false,
        hasMedia: scheduledMsg.hasMedia,
        media: scheduledMsg.media,
      }

      setMessages([...messages, newMessage])
      setScheduledMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, status: "sent" as const } : msg)))
      setSendingStatus("success")

      setTimeout(() => setSendingStatus("idle"), 2000)
    } catch (error) {
      setSendingStatus("error")
      console.error("[v0] Erro ao enviar mensagem:", error)
    }
  }

  const handleReplyToMessage = (messageId: number) => {
    const message = messages.find((m) => m.id === messageId)
    if (message) {
      setReplyingTo({
        id: message.id,
        text: message.text,
        sender: message.sender,
      })
    }
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
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

  const activeChats = [
    { id: 1, name: "João Silva", lastMessage: "Olá, gostaria de saber...", time: "10:30" },
    { id: 2, name: "Maria Santos", lastMessage: "Obrigada pelo retorno!", time: "09:15" },
    { id: 3, name: "Pedro Costa", lastMessage: "Quando podemos agendar?", time: "Ontem" },
    { id: 4, name: "Ana Oliveira", lastMessage: "Recebi o orçamento...", time: "Ontem" },
    { id: 5, name: "Carlos Ferreira", lastMessage: "Preciso de ajuda...", time: "15 Mar" },
  ]

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <Sidebar />

      <div className="ml-64 flex flex-1 transition-all duration-300">
        <aside className="flex w-80 flex-col border-r-2 border-neutral-300 bg-white">
          <div className="border-b-2 border-neutral-300 p-4">
            <h2 className="font-mono text-lg text-neutral-900">Conversas Ativas</h2>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            {activeChats.map((chat) => (
              <div key={chat.id} className="cursor-pointer border-b-2 border-neutral-300 p-4 hover:bg-neutral-50">
                <div className="mb-1 flex items-start justify-between">
                  <span className="font-mono text-sm font-semibold text-neutral-900">{chat.name}</span>
                  <span className="font-mono text-xs text-neutral-500">{chat.time}</span>
                </div>
                <p className="truncate font-mono text-xs text-neutral-600">{chat.lastMessage}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <div className="border-b-2 border-neutral-300 bg-white p-4">
            <div className="flex items-center justify-between">
              <h1 className="font-mono text-lg text-neutral-900">Cliente X</h1>
              <a
                href="/dashboard"
                className="border-2 border-neutral-900 bg-white px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                ← Voltar
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            <div className="mx-auto max-w-4xl space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "Você" ? "justify-end" : "justify-start"}`}>
                  <div className="group relative max-w-md">
                    {message.isReply && message.replyTo && (
                      <div className="mb-2 border-l-4 border-neutral-400 bg-neutral-200 p-2 text-xs">
                        <div className="font-bold text-neutral-600">{message.replyTo.sender}</div>
                        <div className="text-neutral-700">{message.replyTo.text}</div>
                      </div>
                    )}

                    <div
                      className={`${
                        message.sender === "Você" ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
                      } border-2 border-neutral-300 p-3`}
                    >
                      <div className="mb-1 font-mono text-xs text-neutral-400">{message.sender}</div>
                      <p className="font-mono text-sm">{message.text}</p>

                      {message.hasMedia && message.media && (
                        <div className="mt-2 border-t-2 border-neutral-400 pt-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span>
                              {message.media.type.startsWith("image")
                                ? "🖼️"
                                : message.media.type.startsWith("video")
                                  ? "🎥"
                                  : "📄"}
                            </span>
                            <span>{message.media.name}</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-right font-mono text-xs text-neutral-400">{message.time}</div>
                    </div>

                    {message.sender !== "Você" && (
                      <button
                        onClick={() => handleReplyToMessage(message.id)}
                        className="absolute -bottom-2 right-2 hidden border-2 border-neutral-900 bg-white px-2 py-1 font-mono text-xs text-neutral-900 hover:bg-neutral-900 hover:text-white group-hover:block"
                      >
                        Responder
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {scheduledMessages.filter((msg) => msg.status === "pending").length > 0 && (
            <div className="border-t-2 border-neutral-300 bg-neutral-50 p-4">
              <div className="mx-auto max-w-4xl">
                <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Mensagens Agendadas
                </h3>
                <div className="space-y-2">
                  {scheduledMessages
                    .filter((msg) => msg.status === "pending")
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center justify-between border-2 border-neutral-300 bg-white p-3"
                      >
                        <div className="flex-1">
                          <p className="font-mono text-sm text-neutral-900">{msg.text}</p>
                          <p className="mt-1 font-mono text-xs text-neutral-600">
                            Agendada para: {new Date(msg.scheduledFor).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendScheduledNow(msg.id)}
                            className="border-2 border-neutral-900 bg-white px-3 py-1 font-mono text-xs text-neutral-900 hover:bg-neutral-900 hover:text-white"
                          >
                            Enviar Agora
                          </button>
                          <button
                            onClick={() => handleCancelScheduledMessage(msg.id)}
                            className="border-2 border-red-600 bg-white px-3 py-1 font-mono text-xs text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <div className="border-t-2 border-neutral-300 bg-white p-4">
            <div className="mx-auto max-w-4xl">
              {replyingTo && (
                <div className="mb-3 flex items-start justify-between border-2 border-neutral-300 bg-neutral-50 p-3">
                  <div className="flex-1">
                    <div className="mb-1 font-mono text-xs font-bold text-neutral-600">
                      Respondendo a {replyingTo.sender}
                    </div>
                    <div className="font-mono text-xs text-neutral-700">{replyingTo.text}</div>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    className="ml-2 border-2 border-neutral-400 bg-white px-2 py-1 font-mono text-xs text-neutral-600 hover:border-neutral-900"
                  >
                    ✕
                  </button>
                </div>
              )}

              {mediaFile && (
                <div className="mb-3 flex items-center justify-between border-2 border-neutral-300 bg-neutral-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {mediaFile.type.startsWith("image") ? "🖼️" : mediaFile.type.startsWith("video") ? "🎥" : "📄"}
                    </span>
                    <div>
                      <div className="font-mono text-xs font-bold text-neutral-900">{mediaFile.name}</div>
                      <div className="font-mono text-xs text-neutral-600">{(mediaFile.size / 1024).toFixed(2)} KB</div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveMedia}
                    className="border-2 border-red-600 bg-white px-2 py-1 font-mono text-xs text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Remover
                  </button>
                </div>
              )}

              {isScheduling && (
                <div className="mb-3 border-2 border-neutral-900 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neutral-900">
                      Agendar Mensagem
                    </h3>
                    <button
                      onClick={() => setIsScheduling(false)}
                      className="border-2 border-neutral-400 bg-white px-2 py-1 font-mono text-xs text-neutral-600 hover:border-neutral-900"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-mono text-xs font-bold uppercase text-neutral-700">Data</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-mono text-xs font-bold uppercase text-neutral-700">Hora</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {sendingStatus === "sending" && (
                <div className="mb-2 font-mono text-xs text-neutral-600">Enviando mensagem...</div>
              )}
              {sendingStatus === "success" && (
                <div className="mb-2 font-mono text-xs text-green-600">Mensagem enviada com sucesso!</div>
              )}
              {sendingStatus === "error" && (
                <div className="mb-2 font-mono text-xs text-red-600">Erro ao enviar mensagem. Tente novamente.</div>
              )}

              <div className="flex gap-3">
                <input
                  type="file"
                  id="chat-media-upload"
                  accept="image/*,video/mp4,application/pdf"
                  onChange={handleMediaUpload}
                  disabled={sendingStatus === "sending"}
                  className="hidden"
                />
                <label
                  htmlFor="chat-media-upload"
                  className="flex cursor-pointer items-center border-2 border-neutral-300 bg-white px-4 py-3 font-mono text-sm hover:border-neutral-500 disabled:opacity-50"
                >
                  📎
                </label>

                <button
                  onClick={() => setIsScheduling(!isScheduling)}
                  disabled={sendingStatus === "sending"}
                  className={`border-2 px-4 py-3 font-mono text-sm ${
                    isScheduling
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500"
                  } disabled:opacity-50`}
                  title="Agendar mensagem"
                >
                  🕒
                </button>

                <input
                  type="text"
                  placeholder="Digite sua mensagem"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={sendingStatus === "sending"}
                  className="flex-1 border-2 border-neutral-300 bg-white px-4 py-3 font-mono text-sm focus:border-neutral-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingStatus === "sending" || !messageInput.trim()}
                  className="border-2 border-neutral-900 bg-neutral-900 px-6 py-3 font-mono text-sm text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingStatus === "sending" ? "Enviando..." : isScheduling ? "Agendar" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
