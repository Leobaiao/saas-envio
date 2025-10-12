"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-neutral-300 p-8">
          <h1 className="text-2xl font-mono text-neutral-900 mb-8">Bem-vindo</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-mono text-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="seu@email.com"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-mono text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border-2 border-red-600 bg-red-50 p-3">
                <p className="text-sm font-mono text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="block w-full bg-neutral-900 text-white font-mono text-sm py-3 border-2 border-neutral-900 hover:bg-neutral-800 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center space-y-2">
              <a
                href="/auth/registrar"
                className="block text-sm font-mono text-neutral-600 underline hover:text-neutral-900"
              >
                Criar nova conta
              </a>
              <a href="#" className="block text-sm font-mono text-neutral-600 underline hover:text-neutral-900">
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
