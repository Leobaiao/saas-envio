// app/templates/page.tsx

import { createClient } from "@/lib/supabase/server"; // <-- Mude aqui
import { redirect } from "next/navigation";
import TemplatesClient from "@/components/templates-client";
export const dynamic = 'force-dynamic'
export default async function TemplatesPage() {
  const supabase = await createClient(); // <-- E aqui

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Buscar templates do usuário
  const { data: templates, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar templates:", error);
  }

  return <TemplatesClient initialTemplates={templates || []} />;
}
