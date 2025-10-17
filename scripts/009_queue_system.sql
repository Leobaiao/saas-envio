-- Sistema de fila de mensagens

CREATE TABLE IF NOT EXISTS public.queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('envio_mensagem', 'envio_campanha', 'processamento_webhook')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'falha')),
  tentativas INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 3,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processado_em TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON public.queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_tipo ON public.queue_jobs(tipo);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_created ON public.queue_jobs(created_at);

-- RLS
ALTER TABLE public.queue_jobs ENABLE ROW LEVEL SECURITY;

-- Apenas sistema pode acessar a fila
CREATE POLICY "Service role can manage queue"
  ON public.queue_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- Função para limpar jobs antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION limpar_queue_jobs_antigos()
RETURNS void AS $$
BEGIN
  DELETE FROM public.queue_jobs
  WHERE status IN ('concluido', 'falha')
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
