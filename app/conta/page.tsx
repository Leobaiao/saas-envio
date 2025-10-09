"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"

// ============================================
// TIPOS E INTERFACES (Types & Interfaces)
// ============================================

// Interface para representar os dados da conta do usuário
interface UserAccount {
  name: string
  email: string
  phone: string
  company: string
  plan: "free" | "basic" | "premium"
  createdAt: string
}

export default function ContaPage() {
  // ============================================
  // ESTADO DA APLICAÇÃO (Application State)
  // ============================================

  // Estado para armazenar os dados da conta do usuário
  const [account, setAccount] = useState<UserAccount>({
    name: "João Silva",
    email: "joao@email.com",
    phone: "+55 11 98765-4321",
    company: "Minha Empresa LTDA",
    plan: "premium",
    createdAt: "2023-01-15",
  })

  // Estado para controlar se está em modo de edição
  const [isEditing, setIsEditing] = useState(false)

  // Estado para armazenar os dados do formulário de edição
  const [editForm, setEditForm] = useState<UserAccount>(account)

  // Estado para controlar o status de salvamento
  const [saving, setSaving] = useState(false)

  // Estado para controlar a exibição do modal de alteração de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Estado para armazenar os dados de alteração de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Estado para controlar o processo de alteração de senha
  const [changingPassword, setChangingPassword] = useState(false)

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO (Handler Functions)
  // ============================================

  /**
   * Ativa o modo de edição e carrega os dados atuais no formulário
   */
  const handleStartEdit = () => {
    setEditForm(account)
    setIsEditing(true)
  }

  /**
   * Cancela a edição e descarta as alterações
   */
  const handleCancelEdit = () => {
    setEditForm(account)
    setIsEditing(false)
  }

  /**
   * Atualiza um campo do formulário de edição
   *
   * @param field - Campo a ser atualizado
   * @param value - Novo valor do campo
   */
  const handleEditFormChange = (field: keyof UserAccount, value: string) => {
    setEditForm({
      ...editForm,
      [field]: value,
    })
  }

  /**
   * Salva as alterações da conta
   * 1. Valida os campos obrigatórios
   * 2. Simula requisição ao backend
   * 3. Atualiza o estado local
   * 4. Sai do modo de edição
   *
   * INTEGRAÇÃO COM BACKEND:
   * Substitua a simulação por uma chamada real à API:
   *
   * const response = await fetch('/api/account', {
   *   method: 'PUT',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify(editForm)
   * })
   *
   * BANCO DE DADOS:
   * No backend, execute um UPDATE na tabela de usuários:
   *
   * UPDATE users
   * SET name = ?, email = ?, phone = ?, company = ?
   * WHERE id = ?
   */
  const handleSaveAccount = async () => {
    // Validação: verifica campos obrigatórios
    if (!editForm.name.trim() || !editForm.email.trim()) {
      alert("Nome e email são obrigatórios.")
      return
    }

    setSaving(true)

    try {
      // Simula delay de salvamento no servidor (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // AQUI: Integração com backend
      // const response = await fetch('/api/account', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editForm)
      // })

      // Atualiza o estado local
      setAccount(editForm)
      setIsEditing(false)

      alert("Conta atualizada com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao salvar conta:", error)
      alert("Erro ao salvar conta. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Altera a senha do usuário
   * 1. Valida os campos
   * 2. Verifica se as senhas coincidem
   * 3. Simula requisição ao backend
   * 4. Fecha o modal e limpa o formulário
   *
   * INTEGRAÇÃO COM BACKEND:
   * Substitua a simulação por uma chamada real à API:
   *
   * const response = await fetch('/api/account/password', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     currentPassword: passwordForm.currentPassword,
   *     newPassword: passwordForm.newPassword
   *   })
   * })
   *
   * BANCO DE DADOS:
   * No backend, verifique a senha atual e atualize:
   *
   * 1. Verifique se a senha atual está correta (bcrypt.compare)
   * 2. Hash da nova senha (bcrypt.hash)
   * 3. UPDATE users SET password_hash = ? WHERE id = ?
   */
  const handleChangePassword = async () => {
    // Validação: verifica se todos os campos foram preenchidos
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    // Validação: verifica se as senhas coincidem
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("As senhas não coincidem.")
      return
    }

    // Validação: verifica o tamanho mínimo da senha
    if (passwordForm.newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setChangingPassword(true)

    try {
      // Simula delay de alteração no servidor (1000ms)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // AQUI: Integração com backend
      // const response = await fetch('/api/account/password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     currentPassword: passwordForm.currentPassword,
      //     newPassword: passwordForm.newPassword
      //   })
      // })

      // Fecha o modal e limpa o formulário
      setShowPasswordModal(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      alert("Senha alterada com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao alterar senha:", error)
      alert("Erro ao alterar senha. Tente novamente.")
    } finally {
      setChangingPassword(false)
    }
  }

  /**
   * Retorna o nome do plano formatado
   */
  const getPlanName = (plan: string) => {
    const plans = {
      free: "Gratuito",
      basic: "Básico",
      premium: "Premium",
    }
    return plans[plan as keyof typeof plans] || plan
  }

  // ============================================
  // RENDERIZAÇÃO DA INTERFACE (UI Rendering)
  // ============================================

  return (
    <div className="min-h-screen bg-neutral-100 font-mono">
      <Sidebar />

      <main className="ml-64 p-8 transition-all duration-300">
        <div className="mx-auto max-w-4xl">
          {/* Cabeçalho da página */}
          <div className="mb-8 flex items-center justify-between border-b-2 border-neutral-900 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900">Minha Conta</h1>
          </div>

          {/* ============================================ */}
          {/* INFORMAÇÕES DA CONTA */}
          {/* ============================================ */}
          <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
            <div className="mb-4 flex items-center justify-between border-b-2 border-neutral-300 pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900">Informações Pessoais</h2>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="border-2 border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              // Modo de edição - formulário
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange("name", e.target.value)}
                    disabled={saving}
                    className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange("email", e.target.value)}
                    disabled={saving}
                    className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => handleEditFormChange("phone", e.target.value)}
                    disabled={saving}
                    className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => handleEditFormChange("company", e.target.value)}
                    disabled={saving}
                    className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAccount}
                    disabled={saving}
                    className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            ) : (
              // Modo de visualização - dados
              <div className="space-y-4">
                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Nome</div>
                  <div className="text-lg font-bold text-neutral-900">{account.name}</div>
                </div>

                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Email</div>
                  <div className="text-lg text-neutral-900">{account.email}</div>
                </div>

                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Telefone</div>
                  <div className="text-lg text-neutral-900">{account.phone}</div>
                </div>

                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Empresa</div>
                  <div className="text-lg text-neutral-900">{account.company}</div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* INFORMAÇÕES DO PLANO */}
          {/* ============================================ */}
          <div className="mb-6 border-2 border-neutral-900 bg-white p-6">
            <h2 className="mb-4 border-b-2 border-neutral-300 pb-3 text-lg font-bold uppercase tracking-wider text-neutral-900">
              Plano e Assinatura
            </h2>

            <div className="space-y-4">
              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Plano Atual</div>
                <div className="text-lg font-bold text-neutral-900">{getPlanName(account.plan)}</div>
              </div>

              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Membro Desde</div>
                <div className="text-lg text-neutral-900">
                  {new Date(account.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>

              <button className="w-full border-2 border-neutral-900 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white">
                Gerenciar Assinatura
              </button>
            </div>
          </div>

          {/* ============================================ */}
          {/* SEGURANÇA */}
          {/* ============================================ */}
          <div className="border-2 border-neutral-900 bg-white p-6">
            <h2 className="mb-4 border-b-2 border-neutral-300 pb-3 text-lg font-bold uppercase tracking-wider text-neutral-900">
              Segurança
            </h2>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              Alterar Senha
            </button>
          </div>
        </div>
      </main>

      {/* ============================================ */}
      {/* MODAL: Alterar Senha */}
      {/* ============================================ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50">
          <div className="w-full max-w-md border-4 border-neutral-900 bg-white p-6">
            <h2 className="mb-6 border-b-2 border-neutral-900 pb-3 text-xl font-bold uppercase tracking-wider text-neutral-900">
              Alterar Senha
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Senha Atual *
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  disabled={changingPassword}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  disabled={changingPassword}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  disabled={changingPassword}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                }}
                disabled={changingPassword}
                className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {changingPassword ? "Alterando..." : "Alterar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
