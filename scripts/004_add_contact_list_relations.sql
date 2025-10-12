-- Script para adicionar relacionamento entre contatos e listas
-- Permite que um contato pertença a múltiplas listas

-- Criar tabela de relacionamento contatos-listas
CREATE TABLE IF NOT EXISTS contatos_listas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  lista_id UUID NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contato_id, lista_id)
);

-- Habilitar RLS
ALTER TABLE contatos_listas ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem seus próprios relacionamentos
CREATE POLICY "Users can view their own contact-list relations"
  ON contatos_listas FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários podem inserir relacionamentos
CREATE POLICY "Users can insert their own contact-list relations"
  ON contatos_listas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem deletar relacionamentos
CREATE POLICY "Users can delete their own contact-list relations"
  ON contatos_listas FOR DELETE
  USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contatos_listas_contato ON contatos_listas(contato_id);
CREATE INDEX IF NOT EXISTS idx_contatos_listas_lista ON contatos_listas(lista_id);
CREATE INDEX IF NOT EXISTS idx_contatos_listas_user ON contatos_listas(user_id);

-- Função para atualizar contador de contatos na lista
CREATE OR REPLACE FUNCTION atualizar_contador_lista()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listas 
    SET total_contatos = (
      SELECT COUNT(*) 
      FROM contatos_listas 
      WHERE lista_id = NEW.lista_id
    )
    WHERE id = NEW.lista_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listas 
    SET total_contatos = (
      SELECT COUNT(*) 
      FROM contatos_listas 
      WHERE lista_id = OLD.lista_id
    )
    WHERE id = OLD.lista_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_contador_lista ON contatos_listas;
CREATE TRIGGER trigger_atualizar_contador_lista
AFTER INSERT OR DELETE ON contatos_listas
FOR EACH ROW
EXECUTE FUNCTION atualizar_contador_lista();
