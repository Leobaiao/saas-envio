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
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Edit } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Resposta {
  id: string
  gatilho: string
  resposta: string
  is_active: boolean
  uso_count: number
  created_at: string
}

export default function RespostasClient({ initialRespostas }: { initialRespostas: Resposta[] }) {
  const [respostas, setRespostas] = useState<Resposta[]>(initialRespostas)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResposta, setEditingResposta] = useState<Resposta | null>(null)

  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    gatilho: "",
    resposta: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (editingResposta) {
      const { data, error } = await supabase
        .from("respostas_automaticas")
        .update({
          gatilho: formData.gatilho,
          resposta: formData.resposta,
        })
        .eq("id", editingResposta.id)
        .select()
        .single()

      if (!error && data) {
        setRespostas(respostas.map((r) => (r.id === data.id ? data : r)))
      }
    } else {
      const { data, error } = await supabase
        .from("respostas_automaticas")
        .insert({
          user_id: user.id,
          gatilho: formData.gatilho,
          resposta: formData.resposta,
          is_active: true,
        })
        .select()
        .single()

      if (!error && data) {
        setRespostas([data, ...respostas])
      }
    }

    setIsDialogOpen(false)
    setEditingResposta(null)
    setFormData({ gatilho: "", resposta: "" })
  }

  const handleToggle = async (id: string, currentState: boolean) => {
    const { data, error } = await supabase
      .from("respostas_automaticas")
      .update({ is_active: !currentState })
      .eq("id", id)
      .select()
      .single()

    if (!error && data) {
      setRespostas(respostas.map((r) => (r.id === data.id ? data : r)))
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("respostas_automaticas").delete().eq("id", id)

    if (!error) {
      setRespostas(respostas.filter((r) => r.id !== id))
    }
  }

  const handleEdit = (resposta: Resposta) => {
    setEditingResposta(resposta)
    setFormData({
      gatilho: resposta.gatilho,
      resposta: resposta.resposta,
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Respostas Automáticas</h1>
          <p className="text-muted-foreground">Configure respostas automáticas para palavras-chave</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingResposta(null)
                setFormData({ gatilho: "", resposta: "" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Resposta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingResposta ? "Editar Resposta" : "Nova Resposta Automática"}</DialogTitle>
              <DialogDescription>
                Quando alguém enviar uma mensagem contendo o gatilho, a resposta será enviada automaticamente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gatilho">Palavra-chave (Gatilho)</Label>
                <Input
                  id="gatilho"
                  value={formData.gatilho}
                  onChange={(e) => setFormData({ ...formData, gatilho: e.target.value })}
                  placeholder="Ex: horário, preço, catálogo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resposta">Resposta Automática</Label>
                <Textarea
                  id="resposta"
                  value={formData.resposta}
                  onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
                  placeholder="Ex: Nosso horário de atendimento é de segunda a sexta, das 9h às 18h."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingResposta ? "Atualizar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {respostas.map((resposta) => (
          <Card key={resposta.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    Gatilho: <span className="text-primary">{resposta.gatilho}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">{resposta.resposta}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={resposta.is_active}
                    onCheckedChange={() => handleToggle(resposta.id, resposta.is_active)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(resposta)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(resposta.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>Status: {resposta.is_active ? "Ativa" : "Inativa"}</span>
                <span>•</span>
                <span>Usada {resposta.uso_count} vezes</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {respostas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhuma resposta automática configurada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
