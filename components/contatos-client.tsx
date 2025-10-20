"use client"

import type React from "react"

import { useState, useRef, useMemo } from "react"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Modal } from "@/components/ui/modal"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

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
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showListManagementModal, setShowListManagementModal] = useState(false)
  const [selectedContactForLists, setSelectedContactForLists] = useState<Contact | null>(null)
  const [contactLists, setContactLists] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [addingContact, setAddingContact] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [sortBy, setSortBy] = useState<"name" | "recent" | "orders">("name")

  const [newContact, setNewContact] = useState({
    name: "",
    number: "",
    email: "",
    company: "",
    notes: "",
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const filteredContacts = useMemo(() => {
    let filtered = [...contacts]

    if (debouncedSearchTerm.trim()) {
      const search = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(search) ||
          contact.number.includes(search) ||
          contact.email?.toLowerCase().includes(search) ||
          contact.company?.toLowerCase().includes(search),
      )
    }

    // Apply status filter
    if (filterStatus === "active") {
      filtered = filtered.filter((c) => c.is_active)
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((c) => !c.is_active)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "recent") {
        const dateA = a.last_message_date ? new Date(a.last_message_date).getTime() : 0
        const dateB = b.last_message_date ? new Date(b.last_message_date).getTime() : 0
        return dateB - dateA
      } else if (sortBy === "orders") {
        return (b.orders_count || 0) - (a.orders_count || 0)
      }
      return 0
    })

    return filtered
  }, [contacts, debouncedSearchTerm, filterStatus, sortBy])

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      showToast("Por favor, digite um nome para a lista.", "error")
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
      showToast(`Lista "${newListName}" criada com sucesso!`, "success")
    } catch (error) {
      console.error("Erro ao criar lista:", error)
      showToast("Erro ao criar lista. Tente novamente.", "error")
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
      showToast("Nome e número são obrigatórios.", "error")
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
      showToast("Contato atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao salvar contato:", error)
      showToast("Erro ao salvar contato. Tente novamente.", "error")
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
      showToast(`Contato "${deletingContact.name}" excluído com sucesso!`, "success")
    } catch (error) {
      console.error("Erro ao excluir contato:", error)
      showToast("Erro ao excluir contato. Tente novamente.", "error")
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingContact(null)
  }

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.number.trim()) {
      showToast("Nome e número são obrigatórios.", "error")
      return
    }

    setAddingContact(true)

    try {
      const { data, error } = await supabase
        .from("contatos")
        .insert({
          user_id: userId,
          nome: newContact.name,
          telefone: newContact.number,
          email: newContact.email || null,
          empresa: newContact.company || null,
          notas: newContact.notes || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      const addedContact: Contact = {
        id: data.id,
        name: data.nome,
        number: data.telefone,
        email: data.email,
        company: data.empresa,
        notes: data.notas,
        created_at: data.created_at,
        tags: [],
        orders_count: 0,
        is_active: true,
        nome: data.nome,
        telefone: data.telefone,
        empresa: data.empresa,
        notas: data.notas,
        numero_pedidos: 0,
      }

      setContacts([addedContact, ...contacts])
      setShowAddContactModal(false)
      setNewContact({ name: "", number: "", email: "", company: "", notes: "" })
      showToast("Contato adicionado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao adicionar contato:", error)
      showToast("Erro ao adicionar contato. Tente novamente.", "error")
    } finally {
      setAddingContact(false)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      // Skip header if exists
      const startIndex = lines[0].toLowerCase().includes("nome") || lines[0].toLowerCase().includes("name") ? 1 : 0

      const contactsToImport = []

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // CSV format: nome,telefone,email,empresa,notas
        const parts = line.split(",").map((p) => p.trim())

        if (parts.length >= 2 && parts[0] && parts[1]) {
          contactsToImport.push({
            user_id: userId,
            nome: parts[0],
            telefone: parts[1],
            email: parts[2] || null,
            empresa: parts[3] || null,
            notas: parts[4] || null,
            is_active: true,
          })
        }
      }

      if (contactsToImport.length === 0) {
        showToast("Nenhum contato válido encontrado no arquivo.", "warning")
        setImporting(false)
        return
      }

      const { data, error } = await supabase.from("contatos").insert(contactsToImport).select()

      if (error) throw error

      const newContacts: Contact[] = data.map((c) => ({
        id: c.id,
        name: c.nome,
        number: c.telefone,
        email: c.email,
        company: c.empresa,
        notes: c.notas,
        created_at: c.created_at,
        tags: [],
        orders_count: 0,
        is_active: true,
        nome: c.nome,
        telefone: c.telefone,
        empresa: c.empresa,
        notas: c.notas,
        numero_pedidos: 0,
      }))

      setContacts([...newContacts, ...contacts])
      setShowImportModal(false)
      showToast(`${newContacts.length} contatos importados com sucesso!`, "success")

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Erro ao importar contatos:", error)
      showToast("Erro ao importar contatos. Verifique o formato do arquivo.", "error")
    } finally {
      setImporting(false)
    }
  }

  const handleManageContactLists = async (contact: Contact) => {
    setSelectedContactForLists(contact)

    // Fetch current lists for this contact
    const { data, error } = await supabase.from("contatos_listas").select("lista_id").eq("contato_id", contact.id)

    if (!error && data) {
      setContactLists(data.map((cl) => cl.lista_id))
    }

    setShowListManagementModal(true)
  }

  const handleToggleList = async (listId: string) => {
    if (!selectedContactForLists) return

    const isInList = contactLists.includes(listId)

    try {
      if (isInList) {
        // Remove from list
        const { error } = await supabase
          .from("contatos_listas")
          .delete()
          .eq("contato_id", selectedContactForLists.id)
          .eq("lista_id", listId)

        if (error) throw error
        setContactLists(contactLists.filter((id) => id !== listId))
      } else {
        // Add to list
        const { error } = await supabase.from("contatos_listas").insert({
          contato_id: selectedContactForLists.id,
          lista_id: listId,
          user_id: userId,
        })

        if (error) throw error
        setContactLists([...contactLists, listId])
      }
    } catch (error) {
      console.error("Erro ao atualizar listas:", error)
      showToast("Erro ao atualizar listas. Tente novamente.", "error")
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-neutral-100 font-mono">
        <main className="flex min-h-screen transition-all duration-300">
          <div className="max-h-screen flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mb-6 flex flex-col gap-4 border-b-2 border-neutral-900 pb-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-xl font-bold uppercase tracking-wider text-neutral-900 md:text-2xl">Contatos</h1>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowImportModal(true)}
                  aria-label="Importar contatos via CSV"
                  className="border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-50"
                >
                  📥 Importar CSV
                </button>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  aria-label="Adicionar novo contato"
                  className="border-2 border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
                >
                  + Adicionar Contato
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-4 border-4 border-neutral-900 bg-white p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nome, número, email ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setSearchTerm("")}
                  className="border-2 border-neutral-400 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 md:w-auto"
                >
                  Limpar
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 md:flex-row">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-neutral-700">Status:</span>
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`border-2 px-3 py-1 text-xs font-bold uppercase ${
                      filterStatus === "all"
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-400 bg-white text-neutral-700 hover:border-neutral-900"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterStatus("active")}
                    className={`border-2 px-3 py-1 text-xs font-bold uppercase ${
                      filterStatus === "active"
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-neutral-400 bg-white text-neutral-700 hover:border-neutral-900"
                    }`}
                  >
                    Ativos
                  </button>
                  <button
                    onClick={() => setFilterStatus("inactive")}
                    className={`border-2 px-3 py-1 text-xs font-bold uppercase ${
                      filterStatus === "inactive"
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-neutral-400 bg-white text-neutral-700 hover:border-neutral-900"
                    }`}
                  >
                    Inativos
                  </button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-neutral-700">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border-2 border-neutral-400 bg-white px-3 py-2 text-xs font-bold uppercase text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  >
                    <option value="name">Nome (A-Z)</option>
                    <option value="recent">Mais Recentes</option>
                    <option value="orders">Mais Pedidos</option>
                  </select>
                </div>
              </div>

              <div className="border-t-2 border-neutral-300 pt-3 text-xs text-neutral-600">
                Mostrando {filteredContacts.length} de {contacts.length} contatos
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-neutral-900 bg-white">
              <div className="min-w-[800px]">
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

                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-neutral-600">
                      {searchTerm || filterStatus !== "all"
                        ? "Nenhum contato encontrado com os filtros aplicados."
                        : "Nenhum contato cadastrado ainda."}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {searchTerm || filterStatus !== "all"
                        ? "Tente ajustar os filtros de busca."
                        : "Importe contatos ou adicione manualmente para começar."}
                    </p>
                  </div>
                ) : (
                  filteredContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] ${index !== filteredContacts.length - 1 ? "border-b-2 border-neutral-300" : ""} ${!contact.is_active ? "bg-neutral-100 opacity-60" : ""}`}
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
                          onClick={() => handleManageContactLists(contact)}
                          className="border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700"
                          title="Gerenciar listas"
                        >
                          Listas
                        </button>
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="hidden w-80 border-l-2 border-neutral-900 bg-white p-6 lg:block">
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

        <Modal isOpen={showCreateListModal} onClose={handleCancelCreateList} title="Criar Nova Lista" size="md">
          <div className="mb-6">
            <label
              htmlFor="list-name"
              className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900"
            >
              Nome da Lista
            </label>
            <input
              id="list-name"
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
              {creatingList ? <LoadingSpinner size="sm" /> : "Criar Lista"}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={selectedContact && !editingContact}
          onClose={handleCloseDetails}
          title="Detalhes do Contato"
          size="lg"
        >
          <div className="space-y-4">
            <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Nome</div>
              <div className="text-lg font-bold text-neutral-900">{selectedContact?.name}</div>
            </div>

            <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Número</div>
              <div className="text-lg text-neutral-900">{selectedContact?.number}</div>
            </div>

            {selectedContact?.email && (
              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Email</div>
                <div className="text-lg text-neutral-900">{selectedContact.email}</div>
              </div>
            )}

            {selectedContact?.company && (
              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Empresa</div>
                <div className="text-lg text-neutral-900">{selectedContact.company}</div>
              </div>
            )}

            {selectedContact?.notes && (
              <div className="border-2 border-neutral-300 bg-neutral-50 p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-600">Notas</div>
                <div className="text-sm text-neutral-900">{selectedContact.notes}</div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleEditContact(selectedContact!)}
              className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              Editar Contato
            </button>
            <button
              onClick={() => handleDeleteContact(selectedContact!)}
              className="border-2 border-red-600 bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </Modal>

        <Modal isOpen={!!editingContact && !!editForm} onClose={handleCancelEdit} title="Editar Contato" size="lg">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Nome *</label>
              <input
                type="text"
                value={editForm!.name}
                onChange={(e) => handleEditFormChange("name", e.target.value)}
                disabled={saving}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Número *</label>
              <input
                type="tel"
                value={editForm!.number}
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
                value={editForm!.email || ""}
                onChange={(e) => handleEditFormChange("email", e.target.value)}
                disabled={saving}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Empresa</label>
              <input
                type="text"
                value={editForm!.company || ""}
                onChange={(e) => handleEditFormChange("company", e.target.value)}
                disabled={saving}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Notas</label>
              <textarea
                value={editForm!.notes || ""}
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
                value={editForm!.tags?.join(", ") || ""}
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
              disabled={saving || !editForm!.name.trim() || !editForm!.number.trim()}
              className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" /> : "Salvar Alterações"}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={!!deletingContact}
          onClose={handleCancelDelete}
          title="Confirmar Exclusão"
          size="md"
          titleStyle="border-red-600 text-red-600"
        >
          <div className="mb-6">
            <p className="mb-3 text-sm text-neutral-900">
              Tem certeza que deseja excluir o contato <strong>{deletingContact?.name}</strong>?
            </p>
            <div className="border-2 border-red-200 bg-red-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-red-800">Atenção</p>
              <p className="mt-1 text-xs text-red-700">
                Esta ação não pode ser desfeita. Todos os dados do contato serão permanentemente removidos.
              </p>
            </div>
          </div>

          <div className="mb-6 border-2 border-neutral-300 bg-neutral-50 p-4">
            <div className="mb-2 text-sm font-bold text-neutral-900">{deletingContact?.name}</div>
            <div className="text-xs text-neutral-700">{deletingContact?.number}</div>
            {deletingContact?.email && <div className="text-xs text-neutral-700">{deletingContact.email}</div>}
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
              {deleting ? <LoadingSpinner size="sm" /> : "Sim, Excluir"}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={showAddContactModal}
          onClose={() => {
            setShowAddContactModal(false)
            setNewContact({ name: "", number: "", email: "", company: "", notes: "" })
          }}
          title="Adicionar Novo Contato"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Nome *</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                disabled={addingContact}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Número *</label>
              <input
                type="tel"
                value={newContact.number}
                onChange={(e) => setNewContact({ ...newContact, number: e.target.value })}
                disabled={addingContact}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="+55 11 98765-4321"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Email</label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                disabled={addingContact}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Empresa</label>
              <input
                type="text"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                disabled={addingContact}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">Notas</label>
              <textarea
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                disabled={addingContact}
                rows={3}
                className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
                placeholder="Observações sobre o contato..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowAddContactModal(false)
                setNewContact({ name: "", number: "", email: "", company: "", notes: "" })
              }}
              disabled={addingContact}
              className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddContact}
              disabled={addingContact || !newContact.name.trim() || !newContact.number.trim()}
              className="flex-1 border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingContact ? <LoadingSpinner size="sm" /> : "Adicionar Contato"}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}
          title="Importar Contatos via CSV"
          size="xl"
        >
          <div className="mb-6 border-2 border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-800">Formato do arquivo CSV</p>
            <p className="mb-3 text-xs text-blue-700">
              O arquivo deve conter uma linha por contato com os campos separados por vírgula:
            </p>
            <code className="block border border-blue-300 bg-white p-2 text-xs text-neutral-900">
              nome,telefone,email,empresa,notas
            </code>
            <p className="mt-3 text-xs text-blue-700">
              Exemplo: João Silva,+55 11 98765-4321,joao@email.com,Empresa XYZ,Cliente VIP
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-neutral-900">
              Selecione o arquivo CSV
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              disabled={importing}
              className="w-full border-2 border-neutral-400 bg-neutral-50 p-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:opacity-50"
            />
          </div>

          {importing && (
            <div className="mb-6 border-2 border-green-200 bg-green-50 p-4">
              <p className="text-sm font-bold text-green-800">Importando contatos...</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowImportModal(false)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
              disabled={importing}
              className="flex-1 border-2 border-neutral-400 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
            >
              Fechar
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={showListManagementModal}
          onClose={() => {
            setShowListManagementModal(false)
            setSelectedContactForLists(null)
            setContactLists([])
          }}
          title="Gerenciar Listas"
          size="md"
        >
          <div className="mb-6">
            <p className="mb-4 text-sm text-neutral-700">
              Contato: <strong>{selectedContactForLists?.name}</strong>
            </p>

            {lists.length === 0 ? (
              <div className="border-2 border-neutral-300 bg-neutral-50 p-4 text-center">
                <p className="text-sm text-neutral-600">Nenhuma lista criada ainda.</p>
                <p className="mt-1 text-xs text-neutral-500">Crie uma lista primeiro para adicionar contatos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const isInList = contactLists.includes(list.id)
                  return (
                    <button
                      key={list.id}
                      onClick={() => handleToggleList(list.id)}
                      className={`flex w-full items-center justify-between border-2 p-3 text-left transition-colors ${
                        isInList
                          ? "border-green-600 bg-green-50 hover:bg-green-100"
                          : "border-neutral-400 bg-white hover:border-neutral-900"
                      }`}
                    >
                      <span className="text-sm font-bold text-neutral-900">{list.name}</span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isInList ? "text-green-700" : "text-neutral-500"
                        }`}
                      >
                        {isInList ? "✓ Na lista" : "+ Adicionar"}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setShowListManagementModal(false)
              setSelectedContactForLists(null)
              setContactLists([])
            }}
            className="w-full border-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            Fechar
          </button>
        </Modal>
      </div>
    </AuthenticatedLayout>
  )
}
