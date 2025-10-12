-- Script para corrigir schema e adicionar funcionalidades essenciais

-- ============================================
-- TABELA: whatsapp_config (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT,
  phone_number TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- TABELA: templates (mensagens reutilizáveis)
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(100),
  variaveis TEXT[], -- Array de variáveis como {nome}, {empresa}, etc
  tem_midia BOOLEAN DEFAULT false,
  midia_url TEXT,
  midia_tipo VARCHAR(50),
  uso_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: tags (para segmentação de contatos)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hex
  total_contatos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, nome)
);

-- ============================================
-- TABELA: contatos_tags (relacionamento)
-- ============================================
CREATE TABLE IF NOT EXISTS contatos_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contato_id, tag_id)
);

-- ============================================
-- TABELA: respostas_automaticas
-- ============================================
CREATE TABLE IF NOT EXISTS respostas_automaticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gatilho TEXT NOT NULL, -- Palavra-chave que ativa a resposta
  resposta TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: webhooks_log (log de webhooks recebidos)
-- ============================================
CREATE TABLE IF NOT EXISTS webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tipo VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT false,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Habilitar RLS em todas as novas tabelas
-- ============================================
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_automaticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas RLS para whatsapp_config
-- ============================================
DROP POLICY IF EXISTS "whatsapp_config_select_own" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_insert_own" ON whatsapp_config;
DROP POLICY IF EXISTS "whatsapp_config_update_own" ON whatsapp_config;

CREATE POLICY "whatsapp_config_select_own"
  ON whatsapp_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "whatsapp_config_insert_own"
  ON whatsapp_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "whatsapp_config_update_own"
  ON whatsapp_config FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Políticas RLS para templates
-- ============================================
DROP POLICY IF EXISTS "templates_select_own" ON templates;
DROP POLICY IF EXISTS "templates_insert_own" ON templates;
DROP POLICY IF EXISTS "templates_update_own" ON templates;
DROP POLICY IF EXISTS "templates_delete_own" ON templates;

CREATE POLICY "templates_select_own"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "templates_insert_own"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_update_own"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "templates_delete_own"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Políticas RLS para tags
-- ============================================
DROP POLICY IF EXISTS "tags_select_own" ON tags;
DROP POLICY IF EXISTS "tags_insert_own" ON tags;
DROP POLICY IF EXISTS "tags_update_own" ON tags;
DROP POLICY IF EXISTS "tags_delete_own" ON tags;

CREATE POLICY "tags_select_own"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tags_insert_own"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags_update_own"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "tags_delete_own"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Políticas RLS para contatos_tags
-- ============================================
DROP POLICY IF EXISTS "contatos_tags_select_own" ON contatos_tags;
DROP POLICY IF EXISTS "contatos_tags_insert_own" ON contatos_tags;
DROP POLICY IF EXISTS "contatos_tags_delete_own" ON contatos_tags;

CREATE POLICY "contatos_tags_select_own"
  ON contatos_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contatos_tags_insert_own"
  ON contatos_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contatos_tags_delete_own"
  ON contatos_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Políticas RLS para respostas_automaticas
-- ============================================
DROP POLICY IF EXISTS "respostas_automaticas_select_own" ON respostas_automaticas;
DROP POLICY IF EXISTS "respostas_automaticas_insert_own" ON respostas_automaticas;
DROP POLICY IF EXISTS "respostas_automaticas_update_own" ON respostas_automaticas;
DROP POLICY IF EXISTS "respostas_automaticas_delete_own" ON respostas_automaticas;

CREATE POLICY "respostas_automaticas_select_own"
  ON respostas_automaticas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "respostas_automaticas_insert_own"
  ON respostas_automaticas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "respostas_automaticas_update_own"
  ON respostas_automaticas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "respostas_automaticas_delete_own"
  ON respostas_automaticas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Políticas RLS para webhooks_log
-- ============================================
DROP POLICY IF EXISTS "webhooks_log_select_own" ON webhooks_log;
DROP POLICY IF EXISTS "webhooks_log_insert_any" ON webhooks_log;

CREATE POLICY "webhooks_log_select_own"
  ON webhooks_log FOR SELECT
  USING (auth.uid() = user_id);

-- Permite inserção sem autenticação (para webhooks externos)
CREATE POLICY "webhooks_log_insert_any"
  ON webhooks_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_categoria ON templates(categoria);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tags_contato ON contatos_tags(contato_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tags_tag ON contatos_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_respostas_automaticas_user ON respostas_automaticas(user_id);
CREATE INDEX IF NOT EXISTS idx_respostas_automaticas_active ON respostas_automaticas(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_log_processado ON webhooks_log(processado) WHERE processado = false;

-- ============================================
-- Funções e Triggers
-- ============================================

-- Função para atualizar contador de tags
CREATE OR REPLACE FUNCTION atualizar_contador_tags()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET total_contatos = total_contatos + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET total_contatos = total_contatos - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_contador_tags ON contatos_tags;
CREATE TRIGGER trigger_atualizar_contador_tags
AFTER INSERT OR DELETE ON contatos_tags
FOR EACH ROW
EXECUTE FUNCTION atualizar_contador_tags();

-- Função para atualizar updated_at em templates
CREATE OR REPLACE FUNCTION atualizar_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_templates ON templates;
CREATE TRIGGER trigger_atualizar_templates
BEFORE UPDATE ON templates
FOR EACH ROW
EXECUTE FUNCTION atualizar_templates_timestamp();

-- Função para atualizar updated_at em respostas_automaticas
CREATE OR REPLACE FUNCTION atualizar_respostas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_respostas ON respostas_automaticas;
CREATE TRIGGER trigger_atualizar_respostas
BEFORE UPDATE ON respostas_automaticas
FOR EACH ROW
EXECUTE FUNCTION atualizar_respostas_timestamp();

-- Função para atualizar updated_at em whatsapp_config
CREATE OR REPLACE FUNCTION atualizar_whatsapp_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_whatsapp_config ON whatsapp_config;
CREATE TRIGGER trigger_atualizar_whatsapp_config
BEFORE UPDATE ON whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION atualizar_whatsapp_config_timestamp();
