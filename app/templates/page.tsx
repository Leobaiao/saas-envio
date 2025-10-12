<<<<<<< HEAD
// app/templates/page.tsx

import { createClient } from "@/lib/supabase/server"; // <-- Mude aqui
import { redirect } from "next/navigation";
import TemplatesClient from "@/components/templates-client";
=======
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TemplatesClient from "@/components/templates-client"
export const dynamic = 'force-dynamic'
>>>>>>> cc2f3f157633c8e4eef4c0b91f50853fd2d91ddf

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