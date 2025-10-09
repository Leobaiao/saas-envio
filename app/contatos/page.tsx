"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"

// ============================================
// TIPOS E INTERFACES (Types & Interfaces)
// ============================================

// Interface para representar um contato com informações completas
interface Contact {
  id: number
  name: string
  number: string
  email?: string // Email opcional
  company?: string // Empresa opcional
  notes?: string // Notas/observações opcionais
  createdAt?: string // Data de criação
  tags?: string[] // Tags para categorização
  ordersCount?: number // Campo para rastrear número de pedidos
  lastMessageDate?: string // Data da última interação com o contato
  isActive?: boolean // Status de atividade do contato (true = ativo, false = inativo)
}

// Interface para representar uma lista de contatos
interface ContactList {
  id: number
  name: string
  count: number
}

interface Notification {
  id: number
  message: string
  type: "warning" | "info" | "error"
  timestamp: string
}

export default function ContatosPage() {
  // ============================================
  // ESTADO DA APLICAÇÃO (Application State)
  // ============================================

  const [notifications, setNotifications] = useState<Notification[]>([])

  const [inactivityDays, setInactivityDays] = useState(30)

  // Estado para armazenar os contatos com informações adicionais
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: "João Silva",
      number: "+55 11 98765-4321",
      email: "joao@email.com",
      company: "Tech Corp",
      notes: "Cliente desde 2023",
      createdAt: "2023-01-15",
      tags: ["VIP", "Ativo"],
      ordersCount: 12, // Número de pedidos realizados
      lastMessageDate: "2024-01-20", // Data da última mensagem
      isActive: true, // Status ativo
    },
    {
      id: 2,
      name: "Maria Santos",
      number: "+55 21 97654-3210",
      email: "maria@email.com",
      company: "Design Studio",
      notes: "Interessada em plano premium",
      createdAt: "2023-02-20",
      tags: ["Lead"],
      ordersCount: 3,
      lastMessageDate: "2024-01-18",
      isActive: true,
    },
    {
      id: 3,
      name: "Pedro Oliveira",
      number: "+55 11 96543-2109",
      email: "pedro@email.com",
      createdAt: "2023-03-10",
      tags: ["Ativo"],
      ordersCount: 8,
      lastMessageDate: "2023-11-15", // Contato inativo há mais de 30 dias
      isActive: false,
    },
    {
      id: 4,
      name: "Ana Costa",
      number: "+55 31 95432-1098",
      email: "ana@email.com",
      company: "Marketing Plus",
      createdAt: "2023-04-05",
      tags: ["VIP"],
      ordersCount: 25,
      lastMessageDate: "2024-01-19",
      isActive: true,
    },
    {
      id: 5,
      name: "Carlos Souza",
      number: "+55 11 94321-0987",
      createdAt: "2023-05-12",
      tags: ["Novo"],
      ordersCount: 1,
      lastMessageDate: "2023-10-20", // Contato inativo
      isActive: false,
    },
    {
      id: 6,
      name: "Juliana Lima",
      number: "+55 21 93210-9876",
      email: "juliana@email.com",
      createdAt: "2023-06-18",
      tags: ["Ativo"],
      ordersCount: 6,
      lastMessageDate: "2024-01-21",
      isActive: true,
    },
    {
      id: 7,
      name: "Roberto Alves",
      number: "+55 11 92109-8765",
      company: "Consultoria ABC",
      createdAt: "2023-07-22",
      tags: ["Lead"],
      ordersCount: 0,
      lastMessageDate: "2024-01-17",
      isActive: true,
    },
    {
      id: 8,
      name: "Fernanda Rocha",
      number: "+55 31 91098-7654",
      email: "fernanda@email.com",
      notes: "Contato via indicação",
      createdAt: "2023-08-30",
      tags: ["Novo", "VIP"],
      ordersCount: 15,
      lastMessageDate: "2024-01-22",
      isActive: true,
    },
  ])

  // Estado para armazenar as listas de contatos
  const [lists, setLists] = useState<ContactList[]>([
    { id: 1, name: "Clientes Ativos", count: 124 },
    { id: 2, name: "Novos Leads", count: 45 },
    { id: 3, name: "Inativos", count: 23 },
  ])

  // Estado para controlar a exibição do modal de criar nova lista
  const [showCreateListModal, setShowCreateListModal] = useState(false)

  // Estado para armazenar o nome da nova lista
  const [newListName, setNewListName] = useState("")

  // Estado para controlar o status de criação da lista
  const [creatingList, setCreatingList] = useState(false)

  // Estado para controlar qual contato está sendo visualizado em detalhes
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Estado para controlar qual contato está sendo editado
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Estado para armazenar os dados do formulário de edição
  const [editForm, setEditForm] = useState<Contact | null>(null)

  // Estado para controlar o status de salvamento
  const [saving, setSaving] = useState(false)

  // Estado para controlar a confirmação de exclusão
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)

  // Estado para controlar o processo de exclusão
  const [deleting, setDeleting] = useState(false)

  // ============================================
  // ============================================

  /**
   * useEffect que verifica periodicamente contatos inativos
   * Executa ao carregar a página e a cada mudança no período de inatividade
   *
   * INTEGRAÇÃO COM BACKEND:
   * Esta verificação deve ser feita no backend em um cron job:
   *
   * // Exemplo de cron job (Node.js com node-cron)
   * cron.schedule('0 0 * * *', async () => {
   *   const inactiveDays = 30
   *   const cutoffDate = new Date()
   *   cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
   *
   *   await db.query(`
   *     UPDATE contacts
   *     SET is_active = false
   *     WHERE last_message_date < ? AND is_active = true
   *   `, [cutoffDate])
   * })
   */
  useEffect(() => {
    checkInactiveContacts()
  }, [inactivityDays])

  /**
   * Verifica e desativa contatos que não interagiram há X dias
   * Cria notificações para cada contato desativado
   */
  const checkInactiveContacts = () => {
    const today = new Date()
    const cutoffDate = new Date()
    cutoffDate.setDate(today.getDate() - inactivityDays)

    // Filtra contatos que devem ser desativados
    const contactsToDeactivate = contacts.filter((contact) => {
      if (!contact.lastMessageDate || !contact.isActive) return false

      const lastMessage = new Date(contact.lastMessageDate)
      return lastMessage < cutoffDate
    })

    // Se houver contatos para desativar
    if (contactsToDeactivate.length > 0) {
      // Atualiza o status dos contatos
      setContacts((prev) =>
        prev.map((contact) => {
          const shouldDeactivate = contactsToDeactivate.find((c) => c.id === contact.id)
          if (shouldDeactivate) {
            return { ...contact, isActive: false }
          }
          return contact
        }),
      )

      // Cria notificações para cada contato desativado
      const newNotifications: Notification[] = contactsToDeactivate.map((contact) => ({
        id: Date.now() + contact.id,
        message: `Contato "${contact.name}" foi desativado por inatividade de ${inactivityDays} dias`,
        type: "warning",
        timestamp: new Date().toLocaleString("pt-BR"),
      }))

      setNotifications((prev) => [...newNotifications, ...prev])
    }
  }

  /**
   * Remove uma notificação da lista
   */
  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  /**
   * Reativa um contato manualmente
   * Atualiza a data da última mensagem para hoje
   */
  const handleReactivateContact = (contactId: number) => {
    setContacts((prev) =>
      prev.map((contact) => {
        if (contact.id === contactId) {
          return {
            ...contact,
            isActive: true,
            lastMessageDate: new Date().toISOString().split("T")[0],
          }
        }
        return contact
      }),
    )

    // Adiciona notificação de reativação
    const contact = contacts.find((c) => c.id === contactId)
    if (contact) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: `Contato "${contact.name}" foi reativado com sucesso`,
          type: "info",
          timestamp: new Date().toLocaleString("pt-BR"),
        },
        ...prev,
      ])
    }
  }

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO (Handler Functions)
  // ============================================

  /**
   * Cria uma nova lista de contatos
   * 1. Valida se o nome foi preenchido
   * 2. Simula criação no servidor
   * 3. Adiciona a nova lista ao estado
   * 4. Fecha o modal e limpa o formulário
   */
  const handleCreateList = async () => {
    // Validação: verifica se o nome foi preenchido
    if (!newListName.trim()) {
      alert("Por favor, digite um nome para a lista.")
      return
    }

    // Atualiza status para "criando"
    setCreatingList(true)

    try {
      // Simula delay de criação no servidor (500ms)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Cria a nova lista com ID único
      const newList: ContactList = {
        id: lists.length + 1,
        name: newListName,
        count: 0, // Nova lista começa vazia
      }

      // Adiciona a nova lista ao estado
      setLists([...lists, newList])

      // Fecha o modal e limpa o formulário
      setShowCreateListModal(false)
      setNewListName("")

      // Mostra mensagem de sucesso
      alert(`Lista "${newListName}" criada com sucesso!`)
    } catch (error) {
      console.error("[v0] Erro ao criar lista:", error)
      alert("Erro ao criar lista. Tente novamente.")
    } finally {
      // Reseta o status de criação
      setCreatingList(false)
    }
  }

  /**
   * Cancela a criação de uma nova lista
   * Fecha o modal e limpa o formulário
   */
  const handleCancelCreateList = () => {
    setShowCreateListModal(false)
    setNewListName("")
  }

  /**
   * Abre o modal de detalhes do contato
   * Exibe todas as informações disponíveis do contato selecionado
   *
   * @param contact - Contato a ser visualizado
   */
  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact)
  }

  /**
   * Fecha o modal de detalhes do contato
   */
  const handleCloseDetails = () => {
    setSelectedContact(null)
  }

  /**
   * Abre o modal de edição do contato
   * Preenche o formulário com os dados atuais do contato
   *
   * @param contact - Contato a ser editado
   */
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setEditForm({ ...contact }) // Cria uma cópia para edição
    setSelectedContact(null) // Fecha o modal de detalhes se estiver aberto
  }

  /**
   * Atualiza os campos do formulário de edição
   *
   * @param field - Campo a ser atualizado
   * @param value - Novo valor do campo
   */
  const handleEditFormChange = (field: keyof Contact, value: string | string[] | number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      })
    }
  }

  /**
   * Salva as alterações do contato
   * 1. Valida os campos obrigatórios
   * 2. Simula requisição ao backend
   * 3. Atualiza o estado local
   * 4. Fecha o modal de edição
   *
   * INTEGRAÇÃO COM BACKEND:
   * Substitua a simulação por uma chamada real à API:
   *
   * const response = await fetch(`/api/contacts/${editForm.id}`, {
   *   method: 'PUT',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify(editForm)
   * })
   *
   * BANCO DE DADOS:
   * No backend, execute um UPDATE na tabela de contatos:
   *
   * UPDATE contacts
   * SET name = ?, number = ?, email = ?, company = ?, notes = ?, tags = ?
   * WHERE id = ?
   */
  const handleSaveContact = async () => {
    // Validação: verifica campos obrigatórios
    if (!editForm?.name.trim() || !editForm?.number.trim()) {
      alert("Nome e número são obrigatórios.")
      return
    }

    setSaving(true)

    try {
      // Simula delay de salvamento no servidor (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // AQUI: Integração com backend
      // const response = await fetch(`/api/contacts/${editForm.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editForm)
      // })
      // const updatedContact = await response.json()

      // Atualiza o contato no estado local
      setContacts(contacts.map((c) => (c.id === editForm.id ? editForm : c)))

      // Fecha o modal e limpa o formulário
      setEditingContact(null)
      setEditForm(null)

      alert("Contato atualizado com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao salvar contato:", error)
      alert("Erro ao salvar contato. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Cancela a edição do contato
   * Fecha o modal e descarta as alterações
   */
  const handleCancelEdit = () => {
    setEditingContact(null)
    setEditForm(null)
  }

  /**
   * Abre o modal de confirmação de exclusão
   *
   * @param contact - Contato a ser excluído
   */
  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact)
    setSelectedContact(null) // Fecha o modal de detalhes se estiver aberto
  }

  /**
   * Confirma e executa a exclusão do contato
   * 1. Simula requisição ao backend
   * 2. Remove o contato do estado local
   * 3. Fecha o modal de confirmação
   *
   * INTEGRAÇÃO COM BACKEND:
   * Substitua a simulação por uma chamada real à API:
   *
   * await fetch(`/api/contacts/${deletingContact.id}`, {
   *   method: 'DELETE'
   * })
   *
   * BANCO DE DADOS:
   * No backend, execute um DELETE na tabela de contatos:
   *
   * DELETE FROM contacts WHERE id = ?
   *
   * IMPORTANTE: Considere usar "soft delete" (marcar como inativo)
   * em vez de deletar permanentemente para manter histórico:
   *
   * UPDATE contacts SET deleted_at = NOW() WHERE id = ?
   */
  const handleConfirmDelete = async () => {
    if (!deletingContact) return

    setDeleting(true)

    try {
      // Simula delay de exclusão no servidor (600ms)
      await new Promise((resolve) => setTimeout(resolve, 600))

      // AQUI: Integração com backend
      // await fetch(`/api/contacts/${deletingContact.id}`, {
      //   method: 'DELETE'
      // })

      // Remove o contato do estado local
      setContacts(contacts.filter((c) => c.id !== deletingContact.id))

      // Fecha o modal de confirmação
      setDeletingContact(null)

      alert(`Contato "${deletingContact.name}" excluído com sucesso!`)
    } catch (error) {
      console.error("[v0] Erro ao excluir contato:", error)
      alert("Erro ao excluir contato. Tente novamente.")
    } finally {
      setDeleting(false)
    }
  }

  /**
   * Cancela a exclusão do contato
   * Fecha o modal de confirmação
   */
  const handleCancelDelete = () => {
    setDeletingContact(null)
  }

  // ============================================
  // RENDERIZAÇÃO DA INTERFACE (UI Rendering)
  // ============================================

  return (
    <div className="min-h-screen bg-neutral-100 font-mono">
      {/* ============================================ */}
      {/* SIDEBAR ESQUERDA - Navegação */}
      {/* ============================================ */}
      <Sidebar />

      {notifications.length > 0 && (
        <div className="fixed right-4 top-4 z-50 w-96 space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`border-2 bg-white p-4 shadow-lg ${
                notification.type === "warning"
                  ? "border-yellow-600"
                  : notification.type === "error"
                    ? "border-red-600"
                    : "border-blue-600"
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${
                    notification.type === "warning"
                      ? "text-yellow-600"
                      : notification.type === "error"
                        ? "text-red-600"
                        : "text-blue-600"
                  }`}
                >
                  {notification.type === "warning" ? "⚠️ Aviso" : notification.type === "error" ? "❌ Erro" : "ℹ️ Info"}
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-neutral-900">{notification.message}</p>
              <p className="mt-2 text-xs text-neutral-600">{notification.timestamp}</p>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ============================================ */}
      <main className="ml-64 flex min-h-screen transition-all duration-300">
        {/* Área da Tabela de Contatos */}
        <div className="max-h-screen flex-1 overflow-y-auto p-8">
          {/* Barra Superior */}
          <div className="mb-6 flex items-center justify-between border-b-2 border-neutral-900 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900">Contatos</h1>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 border-2 border-neutral-400 bg-white px-4 py-2">
                <label className="text-xs font-bold uppercase text-neutral-700">Inatividade (dias):</label>
                <input
                  type="number"
                  value={inactivityDays}
                  onChange={(e) => setInactivityDays(Number(e.target.value))}
                  min="1"
                  max="365"
                  className="w-16 border-2 border-neutral-300 bg-neutral-50 px-2 py-1 text-sm text-neutral-900"
                />
              </div>
              <button className="border-2 border-neutral-900 bg-white px-6 py-2 text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white">
                Importar Contatos (Planilha)
              </button>
            </div>
          </div>

          {/* Tabela de Contatos */}
          <div className="border-2 border-neutral-900 bg-white">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] border-b-2 border-neutral-900 bg-neutral-200">
              <div className="border-r-2 border-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                Nome
              </div>
              <div className="border-r-2 border-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                Número
              </div>
              <div className="border-r-2 border-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                Pedidos
              </div>
              <div className="border-r-2 border-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                Última Msg
              </div>
              <div className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-900">Ações</div>
            </div>

            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] ${index !== contacts.length - 1 ? "border-b-2 border-neutral-300" : ""} ${!contact.isActive ? "bg-neutral-100 opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2 border-r-2 border-neutral-300 px-4 py-3">
                  <span className="text-sm text-neutral-900">{contact.name}</span>
                  {!contact.isActive && (
                    <span className="border border-red-600 bg-red-50 px-2 py-0.5 text-xs font-bold uppercase text-red-600">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="border-r-2 border-neutral-300 px-4 py-3 text-sm text-neutral-700">{contact.number}</div>
                <div className="border-r-2 border-neutral-300 px-4 py-3 text-center text-sm font-bold text-neutral-900">
                  {contact.ordersCount || 0}
                </div>
                <div className="border-r-2 border-neutral-300 px-4 py-3 text-xs text-neutral-600">
                  {contact.lastMessageDate ? new Date(contact.lastMessageDate).toLocaleDateString("pt-BR") : "Nunca"}
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  {!contact.isActive ? (
                    <button
                      onClick={() => handleReactivateContact(contact.id)}
                      className="border border-green-600 bg-green-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-green-700"
                      title="Reativar contato"
                    >
                      Reativar
                    </button>
                  ) : (
                    <>
                      {/* Botão Ver Detalhes */}
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="border border-neutral-400 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50"
                        title="Ver detalhes"
                      >
                        Ver
                      </button>
                      {/* Botão Editar */}
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="border border-neutral-900 bg-neutral-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                        title="Editar contato"
                      >
                        Editar
                      </button>
                      {/* Botão Excluir */}
                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="border border-red-600 bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700"
                        title="Excluir contato"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* SIDEBAR DIREITA - Listas de Clientes */}
        {/* ============================================ */}
        <aside className="w-80 border-l-2 border-neutral-900 bg-white p-6">
          <div className="mb-4 border-b-2 border-neutral-900 pb-3">
            <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900">Listas de Clientes</h2>
          </div>

          <button
            onClick={() => setShowCreateListModal(true)}
            className="mb-6 w-full border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            + Criar Nova Lista
          </button>

          {/* Lista de listas existentes */}
          <div className="space-y-2">
            {lists.map((list) => (
              <div key={list.id} className="border-2 border-neutral-400 bg-neutral-50 p-4 hover:border-neutral-900">
                <div className="mb-1 text-sm font-bold text-neutral-900">{list.name}</div>
                <div className="text-xs text-neutral-600">{list.count} contatos</div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* ============================================ */}
      {/* MODAL: Criar Nova Lista */}
      {/* ============================================ */}
      {showCreateListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50">
          <div className="w-full max-w-md border-4 border-neutral-900 bg-white p-6">
            {/* Cabeçalho do Modal */}
            <h2 className="mb-6 border-b-2 border-neutral-900 pb-3 text-xl font-bold uppercase tracking-wider text-neutral-900">
              Criar Nova Lista
            </h2>

            {/* Formulário */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                Nome da Lista
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                disabled={creatingList}
                placeholder="Ex: Clientes VIP"
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                onKeyDown={(e) => {
                  // Permite criar lista pressionando Enter
                  if (e.key === "Enter" && !creatingList) {
                    handleCreateList()
                  }
                }}
              />
              <p className="mt-2 text-xs text-neutral-600">
                Dica: Use nomes descritivos como "Clientes Premium" ou "Leads 2024"
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelCreateList}
                disabled={creatingList}
                className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateList}
                disabled={creatingList || !newListName.trim()}
                className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingList ? "Criando..." : "Criar Lista"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Detalhes do Contato */}
      {/* Exibe todas as informações disponíveis do contato */}
      {/* ============================================ */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-4 border-neutral-900 bg-white p-4 sm:p-6">
            {/* Cabeçalho do Modal */}
            <div className="mb-4 flex flex-col gap-3 border-b-2 border-neutral-900 pb-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold uppercase tracking-wider text-neutral-900 sm:text-xl">
                Detalhes do Contato
              </h2>
              <button
                onClick={handleCloseDetails}
                className="w-full border-2 border-neutral-400 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 sm:w-auto"
              >
                Fechar
              </button>
            </div>

            {/* Informações do Contato */}
            <div className="space-y-3 sm:space-y-4">
              {/* Nome */}
              <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Nome</div>
                <div className="break-words text-base font-bold text-neutral-900 sm:text-lg">
                  {selectedContact.name}
                </div>
              </div>

              {/* Número */}
              <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Número</div>
                <div className="break-words text-base text-neutral-900 sm:text-lg">{selectedContact.number}</div>
              </div>

              {/* Email (se disponível) */}
              {selectedContact.email && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Email</div>
                  <div className="break-words text-base text-neutral-900 sm:text-lg">{selectedContact.email}</div>
                </div>
              )}

              {/* Empresa (se disponível) */}
              {selectedContact.company && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Empresa</div>
                  <div className="break-words text-base text-neutral-900 sm:text-lg">{selectedContact.company}</div>
                </div>
              )}

              {/* Notas (se disponível) */}
              {selectedContact.notes && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Notas</div>
                  <div className="break-words text-sm text-neutral-900">{selectedContact.notes}</div>
                </div>
              )}

              {/* Data de Criação (se disponível) */}
              {selectedContact.createdAt && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Data de Criação
                  </div>
                  <div className="text-sm text-neutral-900">
                    {new Date(selectedContact.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              )}

              {selectedContact.lastMessageDate && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Última Mensagem
                  </div>
                  <div className="text-sm text-neutral-900">
                    {new Date(selectedContact.lastMessageDate).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    {Math.floor(
                      (new Date().getTime() - new Date(selectedContact.lastMessageDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    dias atrás
                  </div>
                </div>
              )}

              <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Status</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`border-2 px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      selectedContact.isActive
                        ? "border-green-600 bg-green-50 text-green-600"
                        : "border-red-600 bg-red-50 text-red-600"
                    }`}
                  >
                    {selectedContact.isActive ? "✓ Ativo" : "✕ Inativo"}
                  </span>
                </div>
              </div>

              {/* Tags (se disponível) */}
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="border-2 border-neutral-900 bg-neutral-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-900"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Número de Pedidos */}
              <div className="border-2 border-neutral-300 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Número de Pedidos
                </div>
                <div className="text-base font-bold text-neutral-900 sm:text-lg">
                  {selectedContact.ordersCount || 0}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
              <button
                onClick={() => handleEditContact(selectedContact)}
                className="w-full border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 sm:flex-1"
              >
                Editar Contato
              </button>
              <button
                onClick={() => handleDeleteContact(selectedContact)}
                className="w-full border-2 border-red-600 bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-700 sm:w-auto sm:px-6"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Editar Contato */}
      {/* Formulário completo para edição de todas as informações */}
      {/* ============================================ */}
      {editingContact && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/50 p-4">
          <div className="my-8 w-full max-w-2xl border-4 border-neutral-900 bg-white p-6">
            {/* Cabeçalho do Modal */}
            <h2 className="mb-6 border-b-2 border-neutral-900 pb-3 text-xl font-bold uppercase tracking-wider text-neutral-900">
              Editar Contato
            </h2>

            {/* Formulário de Edição */}
            <div className="space-y-4">
              {/* Nome (obrigatório) */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Nome *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                  disabled={saving}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="Nome completo"
                />
              </div>

              {/* Número (obrigatório) */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Número *
                </label>
                <input
                  type="tel"
                  value={editForm.number}
                  onChange={(e) => handleEditFormChange("number", e.target.value)}
                  disabled={saving}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="+55 11 98765-4321"
                />
              </div>

              {/* Email (opcional) */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Email</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => handleEditFormChange("email", e.target.value)}
                  disabled={saving}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Empresa (opcional) */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Empresa
                </label>
                <input
                  type="text"
                  value={editForm.company || ""}
                  onChange={(e) => handleEditFormChange("company", e.target.value)}
                  disabled={saving}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="Nome da empresa"
                />
              </div>

              {/* Notas (opcional) */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Notas</label>
                <textarea
                  value={editForm.notes || ""}
                  onChange={(e) => handleEditFormChange("notes", e.target.value)}
                  disabled={saving}
                  rows={3}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="Observações sobre o contato..."
                />
              </div>

              {/* Tags (opcional) */}
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={editForm.tags?.join(", ") || ""}
                  onChange={(e) =>
                    handleEditFormChange(
                      "tags",
                      e.target.value.split(",").map((tag) => tag.trim()),
                    )
                  }
                  disabled={saving}
                  className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                  placeholder="VIP, Ativo, Lead"
                />
                <p className="mt-1 text-xs text-neutral-600">Exemplo: VIP, Ativo, Lead</p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveContact}
                disabled={saving || !editForm.name.trim() || !editForm.number.trim()}
                className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Confirmar Exclusão */}
      {/* Modal de confirmação antes de excluir permanentemente */}
      {/* ============================================ */}
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50">
          <div className="w-full max-w-md border-4 border-red-600 bg-white p-6">
            {/* Cabeçalho do Modal */}
            <h2 className="mb-4 border-b-2 border-red-600 pb-3 text-xl font-bold uppercase tracking-wider text-red-600">
              Confirmar Exclusão
            </h2>

            {/* Mensagem de Confirmação */}
            <div className="mb-6">
              <p className="mb-3 text-sm text-neutral-900">
                Tem certeza que deseja excluir o contato <strong>{deletingContact.name}</strong>?
              </p>
              <div className="border-2 border-red-200 bg-red-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-red-800">⚠️ Atenção</p>
                <p className="mt-1 text-xs text-red-700">
                  Esta ação não pode ser desfeita. Todos os dados do contato serão permanentemente removidos.
                </p>
              </div>
            </div>

            {/* Informações do Contato a ser Excluído */}
            <div className="mb-6 border-2 border-neutral-300 bg-neutral-50 p-4">
              <div className="mb-2 text-sm font-bold text-neutral-900">{deletingContact.name}</div>
              <div className="text-xs text-neutral-700">{deletingContact.number}</div>
              {deletingContact.email && <div className="text-xs text-neutral-700">{deletingContact.email}</div>}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 border-2 border-red-600 bg-red-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
