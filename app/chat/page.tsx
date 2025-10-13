"use client"

import type React from "react"
import { useState, useEffect } from "react" // Importado useEffect
// CORREÇÃO: Usando caminho relativo correto (dois níveis acima)
import Sidebar from "../../components/sidebar" 
// CORREÇÃO: Usando caminho relativo correto (dois níveis acima)
import { createClient } from "../../lib/supabase/client" 

// Define a estrutura para mensagens com mídia (agora inclui a string Base64)
interface MediaFile {
  name: string
  type: string
  size: number
  base64Data: string // Novo campo para armazenar o conteúdo Base64
}

interface ChatMessage {
    id: number
    sender: string
    text: string
    time: string
    isReply: boolean
    replyTo?: { id: number; text: string; sender: string } | null
    hasMedia: boolean
    media?: MediaFile | null
}

// ==============================================================
// FUNÇÃO AUXILIAR: Converte File para Base64 Data URL (Data:MimeType;Base64,...)
// ==============================================================
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Interface para chats ativos (baseado na tabela 'contatos')
interface Contact {
  id: number;
  name: string;
  telefone: string;
  lastMessage: string;
  time: string;
}

export default function ChatPage() {
  // ============================================
  // ESTADO DA APLICAÇÃO (Application State)
  // ============================================

  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([]) // Inicialmente vazio, carregado do DB
  
  // NOVO ESTADO DO BANCO DE DADOS
  const supabaseClient = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null); // ID do contato selecionado
  const [isLoading, setIsLoading] = useState(true);

  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [replyingTo, setReplyingTo] = useState<{ id: number; text: string; sender: string } | null>(null)
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null) 

  const [isScheduling, setIsScheduling] = useState(false) 
  const [scheduledDate, setScheduledDate] = useState("") 
  const [scheduledTime, setScheduledTime] = useState("") 
  const [scheduledMessages, setScheduledMessages] = useState<
    Array<{
      id: number
      text: string
      scheduledFor: string
      status: "pending" | "sent" | "cancelled"
      hasMedia: boolean
      media: MediaFile | null
    }>
  >([]) 

  // ============================================
  // LÓGICA DE FETCHING E TEMPO REAL
  // ============================================

  // Função para formatar mensagens do DB
  const formatMessages = (messagesData: any[], currentContacts: Contact[], currentSelectedId: number): ChatMessage[] => {
    const contactName = currentContacts.find(c => c.id === currentSelectedId)?.name || "Cliente";
    
    return messagesData.map(msg => ({
        id: msg.id,
        sender: msg.tipo === 'recebida' ? contactName : "Você",
        text: msg.conteudo,
        time: new Date(msg.enviada_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isReply: false, 
        hasMedia: msg.tem_midia || false,
        media: msg.tem_midia ? {
            name: msg.midia_url?.split('/').pop() || 'Mídia',
            type: msg.midia_tipo || 'application/octet-stream',
            size: 0, 
            base64Data: msg.midia_url,
        } : null,
    }));
  };

  // 1. FETCH USER e CONTACTS
  useEffect(() => {
    const fetchUserAndContacts = async () => {
        setIsLoading(true);
        
        // 1. Obter Utilizador
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            console.error("Utilizador não autenticado. Redirecionar.");
            setIsLoading(false);
            return;
        }
        setUserId(user.id);

        // 2. Fetch Contatos
        const { data: contactsData, error: contactsError } = await supabaseClient
            .from("contatos")
            .select("id, nome, telefone, last_message, updated_at") // Campos relevantes
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }); 

        if (contactsError) {
            console.error("Erro ao obter contactos:", contactsError);
        } else if (contactsData) {
            const formattedContacts: Contact[] = contactsData.map(c => ({
                id: c.id,
                name: c.nome,
                telefone: c.telefone,
                lastMessage: c.last_message || 'Nenhuma mensagem recente',
                time: new Date(c.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            }));

            setContacts(formattedContacts);

            // Selecionar o primeiro chat
            if (formattedContacts.length > 0 && selectedContactId === null) {
                setSelectedContactId(formattedContacts[0].id);
            }
        }

        setIsLoading(false);
    };

    fetchUserAndContacts();
  }, [userId]); 

  // 2. FETCH e SUBSTRIÇÃO DE MENSAGENS (Tempo Real)
  useEffect(() => {
    if (!selectedContactId || !userId) {
        setMessages([]);
        return;
    }

    const fetchInitialMessages = async () => {
         // Carregar mensagens existentes para o chat selecionado
        const { data: messagesData, error: messagesError } = await supabaseClient
            .from("mensagens")
            .select("*")
            .eq("contato_id", selectedContactId)
            .order("enviada_em", { ascending: true }); 

        if (messagesError) {
            console.error("Erro ao obter mensagens:", messagesError);
        } else if (messagesData) {
            const formattedMessages = formatMessages(messagesData, contacts, selectedContactId);
            setMessages(formattedMessages);
        }
    };

    fetchInitialMessages();

    // 3. SUBSTRIÇÃO EM TEMPO REAL
    const channel = supabaseClient
        .channel(`chat_messages_${selectedContactId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'mensagens',
                filter: `contato_id=eq.${selectedContactId}`
            },
            () => {
                // Quando uma nova mensagem é inserida (pelo utilizador, campanha ou webhook), 
                // re-obtemos o histórico completo para garantir consistência.
                fetchInitialMessages(); 
            }
        )
        .subscribe();

    return () => {
        supabaseClient.removeChannel(channel);
    };

  }, [selectedContactId, userId, contacts]); 

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO (Handler Functions)
  // ============================================

  /**
   * Envia a mensagem (imediata ou agendada) para o backend.
   */
  const handleSendMessage = async () => {
    if (!selectedContactId) {
        console.error("Nenhum contato selecionado.");
        setSendingStatus("error");
        setTimeout(() => setSendingStatus("idle"), 3000);
        return;
    }

    const text = messageInput.trim()
    if (!text && !mediaFile) return

    let scheduledForIso: string | null = null

    if (isScheduling) {
      if (!scheduledDate || !scheduledTime) {
        console.error("Por favor, selecione data e hora para o agendamento.")
        setSendingStatus("error");
        setTimeout(() => setSendingStatus("idle"), 3000);
        return;
      }
      scheduledForIso = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
      
      // Adiciona ao estado local (simulação) antes de enviar para a API de agendamento (que é o que a sua rota faz)
      const newScheduledMessage = {
        id: Date.now(),
        text: text || mediaFile?.name || "Mensagem de Mídia",
        scheduledFor: scheduledForIso,
        status: "pending" as const,
        hasMedia: mediaFile !== null,
        media: mediaFile,
      }
      setScheduledMessages([...scheduledMessages, newScheduledMessage])
      
      // O restante do envio (chamar a API) ocorre abaixo...
    }
    
    // Lógica de envio (para envio imediato e para agendamento)
    if (!isScheduling || scheduledForIso) {
        setSendingStatus("sending")
        
        try {
            const payload = {
                contato_id: selectedContactId, // ID do contato selecionado
                conteudo: text,
                agendada_para: scheduledForIso,
                tem_midia: mediaFile !== null,
                midia_url: mediaFile ? mediaFile.base64Data : null, // Envia o Base64
                midia_tipo: mediaFile ? mediaFile.type : null,
            }

            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok || data.error) {
                setSendingStatus("error")
                console.error("Erro no envio:", data.error || "Erro desconhecido")
                throw new Error(data.error || "Falha ao enviar mensagem via API.")
            }
            
            // O realtime fará a atualização do histórico de 'messages' se for envio imediato.
            // Para feedback imediato, podemos limpar o estado.
            setSendingStatus("success")
            setTimeout(() => setSendingStatus("idle"), 2000)

        } catch (error) {
            setSendingStatus("error")
            console.error("Erro ao enviar mensagem:", error)
            // Se falhar o agendamento, remove do estado local para evitar confusão
            if (isScheduling && scheduledForIso) {
                setScheduledMessages((prev) => prev.filter(msg => msg.scheduledFor !== scheduledForIso));
            }
        }
    }

    // Limpa o formulário após o processamento
    setMessageInput("")
    setReplyingTo(null)
    setMediaFile(null)
    setIsScheduling(false)
    setScheduledDate("")
    setScheduledTime("")
  }

  /**
   * Cancela uma mensagem agendada (Simulação local)
   */
  const handleCancelScheduledMessage = (id: number) => {
    // Em produção, a API seria chamada aqui para cancelar no backend/Supabase.
    setScheduledMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, status: "cancelled" as const } : msg)))
  }

  /**
   * Envia uma mensagem agendada imediatamente (Re-usa handleSendMessage)
   */
  const handleSendScheduledNow = async (id: number) => {
    const scheduledMsg = scheduledMessages.find((msg) => msg.id === id)
    if (!scheduledMsg) return

    setMessageInput(scheduledMsg.text)
    setMediaFile(scheduledMsg.media)
    
    setScheduledMessages((prev) => prev.filter(msg => msg.id !== id)); 
    
    await handleSendMessage()
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

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      console.error("Arquivo muito grande! Tamanho máximo: 10MB")
      return
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      console.error("Tipo de arquivo não suportado! Use: JPG, PNG, GIF, MP4 ou PDF")
      return
    }
    
    try {
        const base64Data = await fileToBase64(file);

        setMediaFile({
          name: file.name,
          type: file.type,
          size: file.size,
          base64Data: base64Data,
        })

    } catch (error) {
        console.error("Erro ao converter arquivo para Base64:", error)
        console.error("Falha ao carregar o arquivo. Verifique o console.")
    }
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    const fileInput = document.getElementById('chat-media-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; 
  }

  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-100">
            <p className="font-mono text-lg text-neutral-900">
                A carregar conversas...
            </p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <Sidebar />

      <div className="ml-64 flex flex-1 transition-all duration-300">
        <aside className="flex w-80 flex-col border-r-2 border-neutral-300 bg-white">
          <div className="border-b-2 border-neutral-300 p-4">
            <h2 className="font-mono text-lg text-neutral-900">Conversas Ativas ({contacts.length})</h2>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            {contacts.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedContactId(chat.id)} // Seleciona o chat
                className={`cursor-pointer border-b-2 border-neutral-300 p-4 hover:bg-neutral-50 ${chat.id === selectedContactId ? 'bg-neutral-200' : ''}`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span className="font-mono text-sm font-semibold text-neutral-900">{chat.name}</span>
                  <span className="font-mono text-xs text-neutral-500">{chat.time}</span>
                </div>
                <p className="truncate font-mono text-xs text-neutral-600">{chat.lastMessage}</p>
              </div>
            ))}
            {contacts.length === 0 && (
                <div className="p-4 font-mono text-sm text-neutral-500">
                    Nenhuma conversa encontrada.
                </div>
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <div className="border-b-2 border-neutral-300 bg-white p-4">
            <div className="flex items-center justify-between">
              <h1 className="font-mono text-lg text-neutral-900">
                {selectedContactId ? contacts.find(c => c.id === selectedContactId)?.name || 'Cliente' : 'Selecione um Contato'}
              </h1>
              <a
                href="/dashboard"
                className="border-2 border-neutral-900 bg-white px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                ← Voltar
              </a>
            </div>
          </div>
        
          <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-400 hover:scrollbar-thumb-neutral-600">
            {!selectedContactId ? (
                <div className="mx-auto max-w-4xl text-center p-10 font-mono text-neutral-600">
                    Selecione uma conversa na barra lateral para começar a conversar.
                </div>
            ) : messages.length === 0 && !isLoading ? (
                <div className="mx-auto max-w-4xl text-center p-10 font-mono text-neutral-600">
                    Nenhuma mensagem neste chat. Envie a primeira!
                </div>
            ) : (
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
            )}
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
              {sendingStatus === "success" && !isScheduling && (
                <div className="mb-2 font-mono text-xs text-green-600">Mensagem enviada com sucesso!</div>
              )}
               {sendingStatus === "success" && isScheduling && (
                <div className="mb-2 font-mono text-xs text-green-600">Mensagem agendada com sucesso!</div>
              )}
              {sendingStatus === "error" && (
                <div className="mb-2 font-mono text-xs text-red-600">Erro ao enviar mensagem. Tente novamente.</div>
              )}

              {selectedContactId && (
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
                    disabled={sendingStatus === "sending" || (!messageInput.trim() && !mediaFile)}
                    className="border-2 border-neutral-900 bg-neutral-900 px-6 py-3 font-mono text-sm text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingStatus === "sending" ? "Enviando..." : isScheduling ? "Agendar" : "Enviar"}
                  </button>
                </div>
              )}

            {!selectedContactId && (
                <div className="p-3 border-2 border-neutral-300 bg-neutral-100 font-mono text-sm text-neutral-600">
                    Selecione um contato para ativar o campo de envio.
                </div>
            )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
