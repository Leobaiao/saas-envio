"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

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
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border-2 border-border p-8">
          <h1 className="text-2xl font-mono text-foreground mb-8">Bem-vindo</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-mono text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-input bg-background px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-ring"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-mono text-muted-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full border-2 border-input bg-background px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-ring"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border-2 border-destructive bg-[color:var(--color-error-muted)] p-3">
                <p className="text-sm font-mono text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="block w-full bg-primary text-primary-foreground font-mono text-sm py-3 border-2 border-primary hover:bg-primary/90 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center space-y-2">
              <Link
                href="/auth/registrar"
                className="block text-sm font-mono text-muted-foreground underline hover:text-foreground"
              >
                Criar nova conta
              </Link>
              <Link
                href="/auth/recuperar-senha"
                className="block text-sm font-mono text-muted-foreground underline hover:text-foreground"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
