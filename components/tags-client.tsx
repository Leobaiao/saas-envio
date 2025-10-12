"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Tag } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface TagType {
  id: string
  nome: string
  cor: string
  total_contatos: number
  created_at: string
}

export default function TagsClient({ initialTags }: { initialTags: TagType[] }) {
  const [tags, setTags] = useState<TagType[]>(initialTags)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    nome: "",
    cor: "#3B82F6",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("tags")
      .insert({
        user_id: user.id,
        nome: formData.nome,
        cor: formData.cor,
      })
      .select()
      .single()

    if (!error && data) {
      setTags([...tags, data])
      setIsDialogOpen(false)
      setFormData({ nome: "", cor: "#3B82F6" })
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id)

    if (!error) {
      setTags(tags.filter((t) => t.id !== id))
    }
  }

  const filteredTags = tags.filter((tag) => tag.nome.toLowerCase().includes(searchTerm.toLowerCase()))

  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#84CC16",
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Tags</h1>
          <p className="text-muted-foreground">Organize seus contatos com tags</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tag</DialogTitle>
              <DialogDescription>Crie uma tag para organizar seus contatos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Tag</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: VIP, Leads, Clientes"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-8 w-8 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: color,
                        borderColor: formData.cor === color ? "#000" : "transparent",
                        transform: formData.cor === color ? "scale(1.1)" : "scale(1)",
                      }}
                      onClick={() => setFormData({ ...formData, cor: color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Tag</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Buscar tags..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTags.map((tag) => (
          <Card key={tag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.cor }} />
                  <CardTitle className="text-lg">{tag.nome}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Tag className="h-4 w-4" />
                <span>{tag.total_contatos} contatos</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTags.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhuma tag encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
