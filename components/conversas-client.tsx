"use client"

import { useState } from "react"
import { useConversations } from "@/lib/hooks/useConversations"
import type { ConversationWithDetails, InboxItem } from "@/lib/types/conversation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/lib/hooks/use-toast"

interface ConversationsClientProps {
  initialConversations: ConversationWithDetails[]
  initialInboxItems: InboxItem[]
  availableUsers: Array<{ id: string; nome: string; email: string }>
  currentUserId: string
}

export function ConversationsClient({
  initialConversations,
  initialInboxItems,
  availableUsers,
  currentUserId,
}: ConversationsClientProps) {
  const { conversations, inboxItems, transferConversation, addParticipant, removeParticipant, assignInboxItem } =
    useConversations()
  const { showToast } = useToast()

  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [transferReason, setTransferReason] = useState("")

  const displayConversations = conversations.length > 0 ? conversations : initialConversations
  const displayInboxItems = inboxItems.length > 0 ? inboxItems : initialInboxItems

  const handleTransfer = async () => {
    if (!selectedConversation || !selectedUserId) return

    const success = await transferConversation(selectedConversation.id, selectedUserId, transferReason)
    if (success) {
      showToast("Conversa transferida com sucesso", "success")
      setShowTransferModal(false)
      setSelectedConversation(null)
      setSelectedUserId("")
      setTransferReason("")
    } else {
      showToast("Erro ao transferir conversa", "error")
    }
  }

  const handleAddParticipant = async (tipo: "participante" | "observador") => {
    if (!selectedConversation || !selectedUserId) return

    const success = await addParticipant(selectedConversation.id, selectedUserId, tipo)
    if (success) {
      showToast("Participante adicionado com sucesso", "success")
      setSelectedUserId("")
    } else {
      showToast("Erro ao adicionar participante", "error")
    }
  }

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedConversation) return

    const success = await removeParticipant(selectedConversation.id, userId)
    if (success) {
      showToast("Participante removido com sucesso", "success")
    } else {
      showToast("Erro ao remover participante", "error")
    }
  }

  const handleAssignInbox = async (itemId: string) => {
    const success = await assignInboxItem(itemId, currentUserId)
    if (success) {
      showToast("Conversa atribuída com sucesso", "success")
    } else {
      showToast("Erro ao atribuir conversa", "error")
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="font-mono text-2xl font-bold text-neutral-900">Gerenciamento de Conversas</h1>
        </div>

        {displayInboxItems.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 font-mono text-lg font-bold text-neutral-900">
              Caixa de Entrada ({displayInboxItems.length})
            </h2>
            <div className="space-y-3">
              {displayInboxItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-neutral-900">
                      {item.contato?.nome || "Contato Desconhecido"}
                    </p>
                    <p className="font-mono text-xs text-neutral-600">{item.contato?.telefone}</p>
                  </div>
                  <Button onClick={() => handleAssignInbox(item.id)} size="sm">
                    Atribuir para Mim
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayConversations.map((conv) => (
            <Card key={conv.id} className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-sm font-bold text-neutral-900">{conv.contato?.nome}</h3>
                  <p className="font-mono text-xs text-neutral-600">{conv.contato?.telefone}</p>
                </div>
                <Badge variant={conv.status === "ativa" ? "default" : "secondary"}>{conv.status}</Badge>
              </div>

              <div className="mb-3 space-y-1">
                <p className="font-mono text-xs text-neutral-600">
                  Proprietário: {conv.proprietario?.nome || "Desconhecido"}
                </p>
                {conv.participantes && conv.participantes.length > 1 && (
                  <p className="font-mono text-xs text-neutral-600">
                    Participantes: {conv.participantes.filter((p) => p.is_active).length}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedConversation(conv)
                    setShowTransferModal(true)
                  }}
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                >
                  Transferir
                </Button>
                <Button
                  onClick={() => {
                    setSelectedConversation(conv)
                    setShowParticipantsModal(true)
                  }}
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                >
                  Participantes
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {showTransferModal && selectedConversation && (
          <Modal
            isOpen={showTransferModal}
            onClose={() => {
              setShowTransferModal(false)
              setSelectedConversation(null)
              setSelectedUserId("")
              setTransferReason("")
            }}
            title="Transferir Conversa"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">Transferir para:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                >
                  <option value="">Selecione um usuário</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">Motivo (opcional):</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                  rows={3}
                  placeholder="Descreva o motivo da transferência..."
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleTransfer} disabled={!selectedUserId} className="flex-1">
                  Transferir
                </Button>
                <Button
                  onClick={() => {
                    setShowTransferModal(false)
                    setSelectedConversation(null)
                    setSelectedUserId("")
                    setTransferReason("")
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {showParticipantsModal && selectedConversation && (
          <Modal
            isOpen={showParticipantsModal}
            onClose={() => {
              setShowParticipantsModal(false)
              setSelectedConversation(null)
              setSelectedUserId("")
            }}
            title="Gerenciar Participantes"
          >
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-mono text-sm font-bold text-neutral-900">Participantes Ativos:</h3>
                <div className="space-y-2">
                  {selectedConversation.participantes
                    ?.filter((p) => p.is_active)
                    .map((participant: any) => (
                      <div key={participant.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-mono text-sm text-neutral-900">{participant.user?.nome}</p>
                          <Badge variant="secondary" className="mt-1">
                            {participant.tipo}
                          </Badge>
                        </div>
                        {participant.tipo !== "proprietario" && (
                          <Button
                            onClick={() => handleRemoveParticipant(participant.user_id)}
                            size="sm"
                            variant="secondary"
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-mono text-sm font-bold text-neutral-900">Adicionar Participante:</h3>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mb-3 w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                >
                  <option value="">Selecione um usuário</option>
                  {availableUsers
                    .filter(
                      (user) => !selectedConversation.participantes?.some((p) => p.user_id === user.id && p.is_active),
                    )
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nome} ({user.email})
                      </option>
                    ))}
                </select>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddParticipant("participante")}
                    disabled={!selectedUserId}
                    size="sm"
                    className="flex-1"
                  >
                    Adicionar como Participante
                  </Button>
                  <Button
                    onClick={() => handleAddParticipant("observador")}
                    disabled={!selectedUserId}
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                  >
                    Adicionar como Observador
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
