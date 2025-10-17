// Tipos para webhooks Wuzapi
import { z } from "zod"

export const WuzapiMessageSchema = z.object({
  event: z.string(),
  instanceId: z.string(),
  data: z.object({
    from: z.string(),
    to: z.string(),
    body: z.string().optional(),
    type: z.string(),
    timestamp: z.number(),
    id: z.string(),
    sender: z
      .object({
        name: z.string().optional(),
        pushname: z.string().optional(),
      })
      .optional(),
    media_url: z.string().optional(),
    media_type: z.string().optional(),
    caption: z.string().optional(),
  }),
})

export type WuzapiMessage = z.infer<typeof WuzapiMessageSchema>

export interface WebhookLog {
  id: string
  tipo: string
  payload: Record<string, any>
  processado: boolean
  erro?: string
  created_at: string
}
