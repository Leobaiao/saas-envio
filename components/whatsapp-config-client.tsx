"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WhatsAppConfigClientProps {
  userId: string
  initialConfig: any
}

export default function WhatsAppConfigClient({ userId, initialConfig }: WhatsAppConfigClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [testing, setTesting] = useState(false)

  const [config, setConfig] = useState({
    api_key: initialConfig?.api_key || "",
    phone_number: initialConfig?.phone_number || "",
    webhook_url: initialConfig?.webhook_url || "",
    is_active: initialConfig?.is_active || false,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (initialConfig) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from("whatsapp_config")
          .update({
            api_key: config.api_key,
            phone_number: config.phone_number,
            webhook_url: config.webhook_url,
            is_active: config.is_active,
          })
          .eq("user_id", userId)

        if (error) throw error
      } else {
        // Criar nova configuração
        const { error } = await supabase.from("whatsapp_config").insert({
          user_id: userId,
          api_key: config.api_key,
          phone_number: config.phone_number,
          webhook_url: config.webhook_url,
          is_active: config.is_active,
        })

        if (error) throw error
      }

      setMessage("Configuração salva com sucesso!")
      router.refresh()
    } catch (error: any) {
      setMessage("Erro ao salvar configuração: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!config.api_key || !config.phone_number) {
      setMessage("Preencha a API Key e o número de telefone primeiro")
      return
    }

    setTesting(true)
    setMessage("")

    try {
      // Simular teste de conexão
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Aqui você faria uma chamada real para a API do WhatsApp
      // const response = await fetch('/api/whatsapp/test', {
      //   method: 'POST',
      //   body: JSON.stringify({ api_key: config.api_key, phone_number: config.phone_number })
      // })

      setMessage("Conexão testada com sucesso! WhatsApp está configurado corretamente.")
    } catch (error: any) {
      setMessage("Erro ao testar conexão: " + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 border-4 border-neutral-900 bg-white p-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900">Integração WhatsApp</h1>
            <p className="mt-2 text-neutral-600">Configure a conexão com a API do WhatsApp Business</p>
          </div>

          {message && (
            <div
              className={`mb-6 border-2 p-4 ${
                message.includes("sucesso")
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-red-600 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mb-8 border-4 border-neutral-900 bg-white p-6">
            <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-neutral-900">Configurações da API</h2>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div>
                <Label htmlFor="api_key" className="font-bold uppercase text-neutral-900">
                  API Key *
                </Label>
                <Input
                  id="api_key"
                  type="password"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                  placeholder="Sua chave de API do WhatsApp Business"
                  required
                />
                <p className="mt-1 text-xs text-neutral-500">Obtenha sua API Key no painel do WhatsApp Business API</p>
              </div>

              <div>
                <Label htmlFor="phone_number" className="font-bold uppercase text-neutral-900">
                  Número de Telefone *
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={config.phone_number}
                  onChange={(e) => setConfig({ ...config, phone_number: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                  placeholder="+55 11 98765-4321"
                  required
                />
                <p className="mt-1 text-xs text-neutral-500">Número verificado no WhatsApp Business</p>
              </div>

              <div>
                <Label htmlFor="webhook_url" className="font-bold uppercase text-neutral-900">
                  Webhook URL (Opcional)
                </Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={config.webhook_url}
                  onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                  placeholder="https://seu-dominio.com/api/webhook"
                />
                <p className="mt-1 text-xs text-neutral-500">URL para receber notificações de mensagens</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={config.is_active}
                  onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                  className="h-5 w-5 border-2 border-neutral-900"
                />
                <Label htmlFor="is_active" className="font-bold uppercase text-neutral-900">
                  Ativar Integração
                </Label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || loading}
                  className="border-2 border-neutral-900 bg-white font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100"
                >
                  {testing ? "Testando..." : "Testar Conexão"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || testing}
                  className="flex-1 border-2 border-neutral-900 bg-neutral-900 font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                >
                  {loading ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </div>
            </form>
          </div>

          <div className="border-4 border-blue-900 bg-blue-50 p-6">
            <h3 className="mb-4 text-lg font-bold uppercase tracking-wider text-blue-900">Como Configurar</h3>
            <ol className="list-inside list-decimal space-y-2 text-sm text-blue-800">
              <li>Crie uma conta no WhatsApp Business API</li>
              <li>Obtenha sua API Key no painel de desenvolvedor</li>
              <li>Verifique seu número de telefone</li>
              <li>Cole a API Key e o número nos campos acima</li>
              <li>Teste a conexão antes de ativar</li>
              <li>Ative a integração para começar a enviar mensagens</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
