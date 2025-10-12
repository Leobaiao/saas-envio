"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegistrarPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Validações
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      // Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            nome,
            telefone,
            empresa,
          },
        },
      })

      if (authError) throw authError

      // Redireciona para página de sucesso
      router.push("/auth/sucesso")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-neutral-300 p-8">
          <h1 className="text-2xl font-mono text-neutral-900 mb-2">Criar Conta</h1>
          <p className="text-sm font-mono text-neutral-600 mb-8">Preencha os dados para criar sua conta</p>

          <form onSubmit={handleRegistrar} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <label htmlFor="nome" className="block text-sm font-mono text-neutral-700">
                Nome completo *
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="Seu nome"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-mono text-neutral-700">
                Email *
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

            {/* Telefone */}
            <div className="space-y-2">
              <label htmlFor="telefone" className="block text-sm font-mono text-neutral-700">
                Telefone
              </label>
              <input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="+55 11 98765-4321"
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <label htmlFor="empresa" className="block text-sm font-mono text-neutral-700">
                Empresa
              </label>
              <input
                id="empresa"
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="Nome da empresa"
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label htmlFor="senha" className="block text-sm font-mono text-neutral-700">
                Senha *
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm focus:outline-none focus:border-neutral-500"
                placeholder="••••••••"
              />
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmar-senha" className="block text-sm font-mono text-neutral-700">
                Confirmar senha *
              </label>
              <input
                id="confirmar-senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
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
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </button>

            <div className="text-center">
              <a href="/" className="text-sm font-mono text-neutral-600 underline hover:text-neutral-900">
                Já tem uma conta? Entrar
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
