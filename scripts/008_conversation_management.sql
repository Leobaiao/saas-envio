-- Script para gerenciamento avançado de conversas
-- Adiciona suporte para transferência de conversas e modo "sala de reunião"

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  proprietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'arquivada', 'transferida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_mensagem_em TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de participantes da conversa (para modo "sala de reunião")
CREATE TABLE IF NOT EXISTS public.conversa_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'observador' CHECK (tipo IN ('proprietario', 'participante', 'observador')),
  adicionado_por UUID REFERENCES auth.users(id),
  adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removido_em TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(conversa_id, user_id)
);

-- Tabela de histórico de transferências
CREATE TABLE IF NOT EXISTS public.conversa_transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  de_user_id UUID NOT NULL REFERENCES auth.users(id),
  para_user_id UUID NOT NULL REFERENCES auth.users(id),
  motivo TEXT,
  transferido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Caixa de entrada intermediária (para contatos não atribuídos)
CREATE TABLE IF NOT EXISTS public.caixa_entrada_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  mensagem_id UUID REFERENCES public.mensagens(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atribuido', 'ignorado')),
  atribuido_para UUID REFERENCES auth.users(id),
  atribuido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  prioridade INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_proprietario ON public.conversas(proprietario_id);
CREATE INDEX IF NOT EXISTS idx_conversas_contato ON public.conversas(contato_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status ON public.conversas(status);
CREATE INDEX IF NOT EXISTS idx_conversa_participantes_conversa ON public.conversa_participantes(conversa_id);
CREATE INDEX IF NOT EXISTS idx_conversa_participantes_user ON public.conversa_participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_caixa_entrada_status ON public.caixa_entrada_geral(status);

-- RLS Policies
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversa_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversa_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_entrada_geral ENABLE ROW LEVEL SECURITY;

-- Conversas: usuário vê conversas onde é proprietário ou participante
CREATE POLICY "Users can view their conversations"
  ON public.conversas FOR SELECT
  USING (
    proprietario_id = auth.uid() OR
    id IN (
      SELECT conversa_id FROM public.conversa_participantes
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversas FOR INSERT
  WITH CHECK (proprietario_id = auth.uid());

CREATE POLICY "Owners can update their conversations"
  ON public.conversas FOR UPDATE
  USING (proprietario_id = auth.uid());

-- Participantes: usuário vê participantes das conversas que tem acesso
CREATE POLICY "Users can view conversation participants"
  ON public.conversa_participantes FOR SELECT
  USING (
    conversa_id IN (
      SELECT id FROM public.conversas
      WHERE proprietario_id = auth.uid() OR
      id IN (
        SELECT conversa_id FROM public.conversa_participantes
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Owners can manage participants"
  ON public.conversa_participantes FOR ALL
  USING (
    conversa_id IN (
      SELECT id FROM public.conversas WHERE proprietario_id = auth.uid()
    )
  );

-- Transferências: usuário vê transferências relacionadas a ele
CREATE POLICY "Users can view related transfers"
  ON public.conversa_transferencias FOR SELECT
  USING (de_user_id = auth.uid() OR para_user_id = auth.uid());

CREATE POLICY "Users can create transfers"
  ON public.conversa_transferencias FOR INSERT
  WITH CHECK (de_user_id = auth.uid());

-- Caixa de entrada: todos os usuários autenticados podem ver
CREATE POLICY "Authenticated users can view inbox"
  ON public.caixa_entrada_geral FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update inbox items"
  ON public.caixa_entrada_geral FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversas_updated_at
  BEFORE UPDATE ON public.conversas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar conversa automaticamente quando contato envia mensagem
CREATE OR REPLACE FUNCTION criar_conversa_automatica()
RETURNS TRIGGER AS $$
DECLARE
  conversa_existente UUID;
BEGIN
  -- Verifica se já existe conversa ativa para este contato
  SELECT id INTO conversa_existente
  FROM public.conversas
  WHERE contato_id = NEW.contato_id AND status = 'ativa'
  LIMIT 1;

  -- Se não existe conversa, adiciona à caixa de entrada geral
  IF conversa_existente IS NULL THEN
    INSERT INTO public.caixa_entrada_geral (contato_id, mensagem_id, status)
    VALUES (NEW.contato_id, NEW.id, 'pendente');
  ELSE
    -- Atualiza última mensagem da conversa
    UPDATE public.conversas
    SET ultima_mensagem_em = NEW.created_at
    WHERE id = conversa_existente;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_conversa_automatica
  AFTER INSERT ON public.mensagens
  FOR EACH ROW
  WHEN (NEW.tipo = 'recebida')
  EXECUTE FUNCTION criar_conversa_automatica();
