"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Copy, Edit } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Template {
  id: string
  nome: string
  conteudo: string
  categoria: string | null
  variaveis: string[] | null
  tem_midia: boolean
  midia_url: string | null
  midia_tipo: string | null
  uso_count: number
  created_at: string
}

export default function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    nome: "",
    conteudo: "",
    categoria: "",
    variaveis: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const variaveisArray = formData.variaveis
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)

    const templateData = {
      user_id: user.id,
      nome: formData.nome,
      conteudo: formData.conteudo,
      categoria: formData.categoria || null,
      variaveis: variaveisArray.length > 0 ? variaveisArray : null,
    }

    if (editingTemplate) {
      // Atualizar template existente
      const { data, error } = await supabase
        .from("templates")
        .update(templateData)
        .eq("id", editingTemplate.id)
        .select()
        .single()

      if (!error && data) {
        setTemplates(templates.map((t) => (t.id === data.id ? data : t)))
      }
    } else {
      // Criar novo template
      const { data, error } = await supabase.from("templates").insert(templateData).select().single()

      if (!error && data) {
        setTemplates([data, ...templates])
      }
    }

    setIsDialogOpen(false)
    setEditingTemplate(null)
    setFormData({ nome: "", conteudo: "", categoria: "", variaveis: "" })
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("templates").delete().eq("id", id)

    if (!error) {
      setTemplates(templates.filter((t) => t.id !== id))
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      nome: template.nome,
      conteudo: template.conteudo,
      categoria: template.categoria || "",
      variaveis: template.variaveis?.join(", ") || "",
    })
    setIsDialogOpen(true)
  }

  const handleCopy = (conteudo: string) => {
    navigator.clipboard.writeText(conteudo)
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.categoria === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(templates.map((t) => t.categoria).filter(Boolean)))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Templates de Mensagens</h1>
          <p className="text-muted-foreground">Crie e gerencie templates reutilizáveis</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTemplate(null)
                setFormData({ nome: "", conteudo: "", categoria: "", variaveis: "" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
              <DialogDescription>
                Crie templates com variáveis como {"{nome}"}, {"{empresa}"}, etc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Template</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Boas-vindas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Vendas, Suporte, Marketing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conteudo">Mensagem</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  placeholder="Olá {nome}, bem-vindo à {empresa}!"
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variaveis">Variáveis (separadas por vírgula)</Label>
                <Input
                  id="variaveis"
                  value={formData.variaveis}
                  onChange={(e) => setFormData({ ...formData, variaveis: e.target.value })}
                  placeholder="nome, empresa, telefone"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingTemplate ? "Atualizar" : "Criar"} Template</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Buscar templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat!}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.nome}</CardTitle>
                  {template.categoria && (
                    <CardDescription className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {template.categoria}
                      </span>
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(template.conteudo)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{template.conteudo}</p>
              {template.variaveis && template.variaveis.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variaveis.map((v, i) => (
                    <span key={i} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs">
                      {"{" + v + "}"}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-muted-foreground text-xs">Usado {template.uso_count} vezes</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum template encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
