-- Script para criar tabelas relacionadas à integração com WhatsApp

-- Tabela de configurações de WhatsApp por usuário
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

-- Tabela de mensagens enviadas/recebidas
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('enviada', 'recebida')),
  conteudo TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'entregue', 'lida', 'falhou')),
  tem_midia BOOLEAN DEFAULT false,
  midia_url TEXT,
  midia_tipo VARCHAR(50),
  agendada_para_ TIMESTAMP WITH TIME ZONE,
  enviada_em TIMESTAMP WITH TIME ZONE,
  entregue_em TIMESTAMP WITH TIME ZONE,
  lida_em TIMESTAMP WITH TIME ZONE,
  erro_mensagem TEXT,
  whatsapp_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_config
CREATE POLICY "Users can view their own WhatsApp config"
  ON whatsapp_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp config"
  ON whatsapp_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp config"
  ON whatsapp_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para mensagens
CREATE POLICY "Users can view their own messages"
  ON mensagens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON mensagens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON mensagens FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_user ON mensagens(user_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_contato ON mensagens(contato_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_campanha ON mensagens(campanha_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_status ON mensagens(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_agendada ON mensagens(agendada_para) WHERE agendada_para IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_created ON mensagens(created_at DESC);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION atualizar_whatsapp_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_atualizar_whatsapp_config ON whatsapp_config;
CREATE TRIGGER trigger_atualizar_whatsapp_config
BEFORE UPDATE ON whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION atualizar_whatsapp_config_timestamp();
