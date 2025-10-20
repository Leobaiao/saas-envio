import { z } from "zod"

export const ContactSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255),
  telefone: z.string().min(10, "Telefone inválido").max(20),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  empresa: z.string().max(255).optional(),
  notas: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
})

export const CampaignSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255),
  mensagem: z.string().min(1, "Mensagem é obrigatória").max(4096),
  lista_id: z.string().uuid("ID de lista inválido"),
  agendada_para: z.string().datetime().optional(),
  media_url: z.string().url().optional(),
  media_type: z.enum(["image", "video", "document", "audio"]).optional(),
})

export const MessageSchema = z.object({
  contato_id: z.string().uuid("ID de contato inválido"),
  conteudo: z.string().min(1, "Mensagem é obrigatória").max(4096),
  tem_midia: z.boolean().optional(),
  midia_url: z.string().url().optional(),
  midia_tipo: z.string().optional(),
  agendada_para: z.string().datetime().optional(),
})

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: "Dados inválidos" }
  }
}
