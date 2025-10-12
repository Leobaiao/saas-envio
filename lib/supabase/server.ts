import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Cria um cliente Supabase para uso no servidor
 * Importante: Sempre criar um novo cliente em cada função (Fluid compute)
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Método chamado de um Server Component
          // Pode ser ignorado se houver middleware atualizando sessões
        }
      },
    },
  })
}

export { createSupabaseServerClient as createServerClient }
