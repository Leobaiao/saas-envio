"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/redefinir-senha`,
    })

    if (error) {
      setError("Erro ao enviar email: " + error.message)
    } else {
      setMessage("Email de recuperação enviado! Verifique sua caixa de entrada.")
      setEmail("")
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 border-4 border-neutral-900 bg-white p-8">
          <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-neutral-900">Recuperar Senha</h1>
          <p className="text-neutral-600">Digite seu email para receber instruções de recuperação</p>
        </div>

        {message && <div className="mb-6 border-2 border-green-600 bg-green-50 p-4 text-green-800">{message}</div>}

        {error && <div className="mb-6 border-2 border-red-600 bg-red-50 p-4 text-red-800">{error}</div>}

        <div className="border-4 border-neutral-900 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="font-bold uppercase text-neutral-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 border-2 border-neutral-900"
                placeholder="seu@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full border-2 border-neutral-900 bg-neutral-900 font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              {loading ? "Enviando..." : "Enviar Email de Recuperação"}
            </Button>
          </form>

          <div className="mt-6 border-t-2 border-neutral-300 pt-6 text-center">
            <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
