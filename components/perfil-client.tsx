"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PerfilClientProps {
  user: any
  profile: any
}

export default function PerfilClient({ user, profile }: PerfilClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        company: formData.company,
      })
      .eq("id", user.id)

    if (error) {
      setMessage("Erro ao atualizar perfil: " + error.message)
    } else {
      setMessage("Perfil atualizado com sucesso!")
      router.refresh()
    }

    setLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    })

    if (error) {
      setMessage("Erro ao atualizar senha: " + error.message)
    } else {
      setMessage("Senha atualizada com sucesso!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 border-4 border-neutral-900 bg-white p-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-neutral-900">Meu Perfil</h1>
            <p className="mt-2 text-neutral-600">Gerencie suas informações pessoais e senha</p>
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

          {/* Informações do Perfil */}
          <div className="mb-8 border-4 border-neutral-900 bg-white p-6">
            <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-neutral-900">Informações Pessoais</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="email" className="font-bold uppercase text-neutral-900">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="mt-2 border-2 border-neutral-400 bg-neutral-100"
                />
                <p className="mt-1 text-xs text-neutral-500">O email não pode ser alterado</p>
              </div>

              <div>
                <Label htmlFor="full_name" className="font-bold uppercase text-neutral-900">
                  Nome Completo
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="font-bold uppercase text-neutral-900">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                />
              </div>

              <div>
                <Label htmlFor="company" className="font-bold uppercase text-neutral-900">
                  Empresa
                </Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-neutral-900 bg-neutral-900 font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </div>

          {/* Alterar Senha */}
          <div className="border-4 border-neutral-900 bg-white p-6">
            <h2 className="mb-6 text-xl font-bold uppercase tracking-wider text-neutral-900">Alterar Senha</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="font-bold uppercase text-neutral-900">
                  Nova Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="font-bold uppercase text-neutral-900">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="mt-2 border-2 border-neutral-900"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-neutral-900 bg-neutral-900 font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
              >
                {loading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
