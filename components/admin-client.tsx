"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/lib/hooks/use-toast"
import type { WuzapiInstance } from "@/lib/services/wuzapiService"

interface AdminClientProps {
  initialInstances: any[]
  initialLogs: any[]
  initialStats: any[]
}

export function AdminClient({ initialInstances, initialLogs, initialStats }: AdminClientProps) {
  const [instances, setInstances] = useState<WuzapiInstance[]>(initialInstances)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<WuzapiInstance | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    instance_name: "",
    instance_id: "",
    api_url: "",
    api_key: "",
    webhook_url: "",
  })

  const fetchInstances = async () => {
    try {
      const response = await fetch("/api/admin/instances")
      const data = await response.json()
      if (data.instances) {
        setInstances(data.instances)
      }
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error)
    }
  }

  const handleAddInstance = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar instância")
      }

      showToast("Instância adicionada com sucesso", "success")
      setShowAddModal(false)
      setFormData({
        instance_name: "",
        instance_id: "",
        api_url: "",
        api_key: "",
        webhook_url: "",
      })
      await fetchInstances()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao adicionar instância", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteInstance = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta instância?")) return

    try {
      const response = await fetch(`/api/admin/instances?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar instância")
      }

      showToast("Instância deletada com sucesso", "success")
      await fetchInstances()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao deletar instância", "error")
    }
  }

  const handleGetQRCode = async (instance: WuzapiInstance) => {
    setSelectedInstance(instance)
    setShowQRModal(true)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/instances/${instance.id}/qr`)
      const data = await response.json()

      if (data.qr_code) {
        setQrCode(data.qr_code)
      } else {
        showToast("QR Code não disponível", "error")
      }
    } catch (error) {
      showToast("Erro ao obter QR Code", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async (instance: WuzapiInstance) => {
    try {
      const response = await fetch(`/api/admin/instances/${instance.id}/status`)
      const data = await response.json()

      showToast(`Status: ${data.status.status}`, "success")
      await fetchInstances()
    } catch (error) {
      showToast("Erro ao verificar status", "error")
    }
  }

  const handleToggleActive = async (instance: WuzapiInstance) => {
    try {
      const response = await fetch("/api/admin/instances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: instance.id,
          is_active: !instance.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar instância")
      }

      showToast(`Instância ${!instance.is_active ? "ativada" : "desativada"} com sucesso`, "success")
      await fetchInstances()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao atualizar instância", "error")
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="font-mono text-2xl font-bold text-neutral-900">Painel de Administração</h1>
          <Button onClick={() => setShowAddModal(true)}>Adicionar Instância</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <Card key={instance.id} className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-sm font-bold text-neutral-900">{instance.instance_name}</h3>
                  <p className="font-mono text-xs text-neutral-600">{instance.instance_id}</p>
                </div>
                <Badge
                  variant={
                    instance.status === "connected"
                      ? "default"
                      : instance.status === "disconnected"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {instance.status}
                </Badge>
              </div>

              {instance.phone_number && (
                <p className="mb-3 font-mono text-xs text-neutral-600">Telefone: {instance.phone_number}</p>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={() => handleCheckStatus(instance)} size="sm" variant="secondary" className="flex-1">
                    Verificar Status
                  </Button>
                  <Button onClick={() => handleGetQRCode(instance)} size="sm" variant="secondary" className="flex-1">
                    QR Code
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleToggleActive(instance)}
                    size="sm"
                    variant={instance.is_active ? "secondary" : "default"}
                    className="flex-1"
                  >
                    {instance.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    onClick={() => handleDeleteInstance(instance.id)}
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {instances.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-mono text-sm text-neutral-600">Nenhuma instância configurada</p>
            <Button onClick={() => setShowAddModal(true)} className="mt-4">
              Adicionar Primeira Instância
            </Button>
          </Card>
        )}

        {showAddModal && (
          <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Adicionar Nova Instância">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">Nome da Instância:</label>
                <input
                  type="text"
                  value={formData.instance_name}
                  onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                  placeholder="Minha Instância WhatsApp"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">ID da Instância:</label>
                <input
                  type="text"
                  value={formData.instance_id}
                  onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                  placeholder="instance-123"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">URL da API:</label>
                <input
                  type="url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                  placeholder="https://api.wuzapi.com"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">API Key:</label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                  placeholder="sua-api-key"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-sm font-bold text-neutral-700">
                  Webhook URL (opcional):
                </label>
                <input
                  type="url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  className="w-full border-2 border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
                  placeholder="https://seu-dominio.com/api/webhooks/whatsapp"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddInstance} disabled={isLoading} className="flex-1">
                  {isLoading ? "Adicionando..." : "Adicionar"}
                </Button>
                <Button onClick={() => setShowAddModal(false)} variant="secondary" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {showQRModal && (
          <Modal
            isOpen={showQRModal}
            onClose={() => {
              setShowQRModal(false)
              setQrCode(null)
              setSelectedInstance(null)
            }}
            title="QR Code para Conexão"
          >
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center">
                  <img
                    src={qrCode || "/placeholder.svg"}
                    alt="QR Code"
                    className="max-w-full border-2 border-neutral-300"
                  />
                  <p className="mt-4 text-center font-mono text-sm text-neutral-600">
                    Escaneie este QR Code com o WhatsApp para conectar a instância
                  </p>
                </div>
              ) : (
                <p className="text-center font-mono text-sm text-neutral-600">QR Code não disponível</p>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
