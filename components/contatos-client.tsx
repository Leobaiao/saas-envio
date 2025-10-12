"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import { createClient } from "@/lib/supabase/client"

interface Contact {
  id: string
  name: string
  number: string
  email?: string
  company?: string
  notes?: string
  created_at?: string
  tags?: string[]
  orders_count?: number
  last_message_date?: string
  is_active?: boolean
  nome: string
  telefone: string
  empresa?: string
  notas?: string
  numero_pedidos?: number
  ultima_mensagem?: string
}

interface ContactList {
  id: string
  name: string
  count: number
  nome: string
  total_contatos: number
}

interface ContatosClientProps {
  initialContatos: any[]
  initialListas: any[]
  userId: string
}

export default function ContatosClient({ initialContatos, initialListas, userId }: ContatosClientProps) {
  const supabase = createClient()

  const [contacts, setContacts] = useState<Contact[]>(
    initialContatos.map((c) => ({
      id: c.id,
      name: c.nome,
      number: c.telefone,
      email: c.email,
      company: c.empresa,
      notes: c.notas,
      created_at: c.created_at,
      tags: c.tags || [],
      orders_count: c.numero_pedidos || 0,
      last_message_date: c.ultima_mensagem,
      is_active: c.is_active ?? true,
      nome: c.nome,
      telefone: c.telefone,
      empresa: c.empresa,
      notas: c.notas,
      numero_pedidos: c.numero_pedidos,
      ultima_mensagem: c.ultima_mensagem,
    })),
  )

  const [lists, setLists] = useState<ContactList[]>(
    initialListas.map((l) => ({
      id: l.id,
      name: l.nome,
      count: l.total_contatos || 0,
      nome: l.nome,
      total_contatos: l.total_contatos || 0,
    })),
  )

  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [creatingList, setCreatingList] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editForm, setEditForm] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert("Por favor, digite um nome para a lista.")
      return
    }

    setCreatingList(true)

    try {
      const { data, error } = await supabase
        .from("listas")
        .insert({
          user_id: userId,
          nome: newListName,
          descricao: "",
          total_contatos: 0,
        })
        .select()
        .single()

      if (error) throw error

      const newList: ContactList = {
        id: data.id,
        name: data.nome,
        count: 0,
        nome: data.nome,
        total_contatos: 0,
      }

      setLists([...lists, newList])
      setShowCreateListModal(false)
      setNewListName("")
      alert(`Lista "${newListName}" criada com sucesso!`)
    } catch (error) {
      console.error("[v0] Erro ao criar lista:", error)
      alert("Erro ao criar lista. Tente novamente.")
    } finally {
      setCreatingList(false)
    }
  }

  const handleCancelCreateList = () => {
    setShowCreateListModal(false)
    setNewListName("")
  }

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact)
  }

  const handleCloseDetails = () => {
    setSelectedContact(null)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setEditForm({ ...contact })
    setSelectedContact(null)
  }

  const handleEditFormChange = (field: keyof Contact, value: string | string[] | number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value,
      })
    }
  }

  const handleSaveContact = async () => {
    if (!editForm?.name.trim() || !editForm?.number.trim()) {
      alert("Nome e número são obrigatórios.")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from("contatos")
        .update({
          nome: editForm.name,
          telefone: editForm.number,
          email: editForm.email,
          empresa: editForm.company,
          notas: editForm.notes,
          tags: editForm.tags,
        })
        .eq("id", editForm.id)

      if (error) throw error

      setContacts(contacts.map((c) => (c.id === editForm.id ? editForm : c)))
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

  const handleCancelEdit = () => {
    setEditingContact(null)
    setEditForm(null)
  }

  const handleDeleteContact = (contact: Contact) => {
    setDeletingContact(contact)
    setSelectedContact(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingContact) return

    setDeleting(true)

    try {
      const { error } = await supabase.from("contatos").delete().eq("id", deletingContact.id)

      if (error) throw error

      setContacts(contacts.filter((c) => c.id !== deletingContact.id))
      setDeletingContact(null)
      alert(`Contato "${deletingContact.name}" excluído com sucesso!`)
    } catch (error) {
      console.error("[v0] Erro ao excluir contato:", error)
      alert("Erro ao excluir contato. Tente novamente.")
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingContact(null)
  }

  return (
    <div className="min-h-screen bg-neutral-100 font-mono">
      <Sidebar />

      <main className="ml-64 flex min-h-screen transition-all duration-300">
        <div className="max-h-screen flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between border-b-2 border-neutral-900 pb-4">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900">Contatos</h1>
          </div>

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

            {contacts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-neutral-600">Nenhum contato cadastrado ainda.</p>
                <p className="mt-2 text-xs text-neutral-500">Importe contatos ou adicione manualmente para começar.</p>
              </div>
            ) : (
              contacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] ${index !== contacts.length - 1 ? "border-b-2 border-neutral-300" : ""} ${!contact.is_active ? "bg-neutral-100 opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2 border-r-2 border-neutral-300 px-4 py-3">
                    <span className="text-sm text-neutral-900">{contact.name}</span>
                    {!contact.is_active && (
                      <span className="border border-red-600 bg-red-50 px-2 py-0.5 text-xs font-bold uppercase text-red-600">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="border-r-2 border-neutral-300 px-4 py-3 text-sm text-neutral-700">
                    {contact.number}
                  </div>
                  <div className="border-r-2 border-neutral-300 px-4 py-3 text-center text-sm font-bold text-neutral-900">
                    {contact.orders_count || 0}
                  </div>
                  <div className="border-r-2 border-neutral-300 px-4 py-3 text-xs text-neutral-600">
                    {contact.last_message_date
                      ? new Date(contact.last_message_date).toLocaleDateString("pt-BR")
                      : "Nunca"}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => handleViewContact(contact)}
                      className="border border-neutral-400 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50"
                      title="Ver detalhes"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="border border-neutral-900 bg-neutral-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                      title="Editar contato"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact)}
                      className="border border-red-600 bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700"
                      title="Excluir contato"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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

      {/* Modais permanecem iguais */}
      {showCreateListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50">
          <div className="w-full max-w-md border-4 border-neutral-900 bg-white p-6">
            <h2 className="mb-6 border-b-2 border-neutral-900 pb-3 text-xl font-bold uppercase tracking-wider text-neutral-900">
              Criar Nova Lista
            </h2>

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
                  if (e.key === "Enter" && !creatingList) {
                    handleCreateList()
                  }
                }}
              />
            </div>

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

      {/* Modal de detalhes */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-4 border-neutral-900 bg-white p-6">
            <div className="mb-6 flex items-center justify-between border-b-2 border-neutral-900 pb-3">
              <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900">Detalhes do Contato</h2>
              <button
                onClick={handleCloseDetails}
                className="border-2 border-neutral-400 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Nome</div>
                <div className="text-lg font-bold text-neutral-900">{selectedContact.name}</div>
              </div>

              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Número</div>
                <div className="text-lg text-neutral-900">{selectedContact.number}</div>
              </div>

              {selectedContact.email && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Email</div>
                  <div className="text-lg text-neutral-900">{selectedContact.email}</div>
                </div>
              )}

              {selectedContact.company && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Empresa</div>
                  <div className="text-lg text-neutral-900">{selectedContact.company}</div>
                </div>
              )}

              {selectedContact.notes && (
                <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Notas</div>
                  <div className="text-sm text-neutral-900">{selectedContact.notes}</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleEditContact(selectedContact)}
                className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
              >
                Editar Contato
              </button>
              <button
                onClick={() => handleDeleteContact(selectedContact)}
                className="border-2 border-red-600 bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editingContact && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/50 p-4">
          <div className="my-8 w-full max-w-2xl border-4 border-neutral-900 bg-white p-6">
            <h2 className="mb-6 border-b-2 border-neutral-900 pb-3 text-xl font-bold uppercase tracking-wider text-neutral-900">
              Editar Contato
            </h2>

            <div className="space-y-4">
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
              </div>
            </div>

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

      {/* Modal de confirmação de exclusão */}
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50">
          <div className="w-full max-w-md border-4 border-red-600 bg-white p-6">
            <h2 className="mb-4 border-b-2 border-red-600 pb-3 text-xl font-bold uppercase tracking-wider text-red-600">
              Confirmar Exclusão
            </h2>

            <div className="mb-6">
              <p className="mb-3 text-sm text-neutral-900">
                Tem certeza que deseja excluir o contato <strong>{deletingContact.name}</strong>?
              </p>
              <div className="border-2 border-red-200 bg-red-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-red-800">Atenção</p>
                <p className="mt-1 text-xs text-red-700">
                  Esta ação não pode ser desfeita. Todos os dados do contato serão permanentemente removidos.
                </p>
              </div>
            </div>

            <div className="mb-6 border-2 border-neutral-300 bg-neutral-50 p-4">
              <div className="mb-2 text-sm font-bold text-neutral-900">{deletingContact.name}</div>
              <div className="text-xs text-neutral-700">{deletingContact.number}</div>
              {deletingContact.email && <div className="text-xs text-neutral-700">{deletingContact.email}</div>}
            </div>

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
