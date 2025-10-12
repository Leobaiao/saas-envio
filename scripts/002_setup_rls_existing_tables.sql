-- Configura Row Level Security para as tabelas existentes
-- Garante que cada usuário veja apenas seus próprios dados

-- ============================================
-- TABELA: listas
-- ============================================

-- Habilita RLS se ainda não estiver habilitado
ALTER TABLE public.listas ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "listas_select_own" ON public.listas;
DROP POLICY IF EXISTS "listas_insert_own" ON public.listas;
DROP POLICY IF EXISTS "listas_update_own" ON public.listas;
DROP POLICY IF EXISTS "listas_delete_own" ON public.listas;

-- Cria novas políticas
CREATE POLICY "listas_select_own"
  ON public.listas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "listas_insert_own"
  ON public.listas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listas_update_own"
  ON public.listas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "listas_delete_own"
  ON public.listas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA: contatos
-- ============================================

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contatos_select_own" ON public.contatos;
DROP POLICY IF EXISTS "contatos_insert_own" ON public.contatos;
DROP POLICY IF EXISTS "contatos_update_own" ON public.contatos;
DROP POLICY IF EXISTS "contatos_delete_own" ON public.contatos;

CREATE POLICY "contatos_select_own"
  ON public.contatos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contatos_insert_own"
  ON public.contatos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contatos_update_own"
  ON public.contatos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "contatos_delete_own"
  ON public.contatos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA: campanhas
-- ============================================

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campanhas_select_own" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_insert_own" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_update_own" ON public.campanhas;
DROP POLICY IF EXISTS "campanhas_delete_own" ON public.campanhas;

CREATE POLICY "campanhas_select_own"
  ON public.campanhas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "campanhas_insert_own"
  ON public.campanhas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campanhas_update_own"
  ON public.campanhas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "campanhas_delete_own"
  ON public.campanhas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA: mensagens
-- ============================================

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_select_own" ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_insert_own" ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_update_own" ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_delete_own" ON public.mensagens;

CREATE POLICY "mensagens_select_own"
  ON public.mensagens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mensagens_insert_own"
  ON public.mensagens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mensagens_update_own"
  ON public.mensagens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "mensagens_delete_own"
  ON public.mensagens FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA: mensagens_agendadas
-- ============================================

ALTER TABLE public.mensagens_agendadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_agendadas_select_own" ON public.mensagens_agendadas;
DROP POLICY IF EXISTS "mensagens_agendadas_insert_own" ON public.mensagens_agendadas;
DROP POLICY IF EXISTS "mensagens_agendadas_update_own" ON public.mensagens_agendadas;
DROP POLICY IF EXISTS "mensagens_agendadas_delete_own" ON public.mensagens_agendadas;

CREATE POLICY "mensagens_agendadas_select_own"
  ON public.mensagens_agendadas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mensagens_agendadas_insert_own"
  ON public.mensagens_agendadas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mensagens_agendadas_update_own"
  ON public.mensagens_agendadas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "mensagens_agendadas_delete_own"
  ON public.mensagens_agendadas FOR DELETE
  USING (auth.uid() = user_id);
