-- Script para criar dados de exemplo para testes
-- IMPORTANTE: Este script deve ser executado APÓS o usuário confirmar o email e fazer login
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário autenticado

-- Exemplo de como obter o user_id:
-- SELECT auth.uid(); -- Execute isso quando estiver logado

-- ============================================
-- CRIAR LISTAS DE EXEMPLO
-- ============================================

-- Insere listas de exemplo (substitua USER_ID_AQUI pelo ID real)
-- INSERT INTO public.listas (id, user_id, nome, descricao, total_contatos)
-- VALUES 
--   (gen_random_uuid(), 'USER_ID_AQUI', 'Clientes Ativos', 'Lista de clientes ativos', 0),
--   (gen_random_uuid(), 'USER_ID_AQUI', 'Novos Leads', 'Leads recentes', 0),
--   (gen_random_uuid(), 'USER_ID_AQUI', 'Inativos', 'Clientes inativos', 0);

-- ============================================
-- CRIAR CONTATOS DE EXEMPLO
-- ============================================

-- Insere contatos de exemplo (substitua USER_ID_AQUI e LISTA_ID_AQUI pelos IDs reais)
-- INSERT INTO public.contatos (id, user_id, lista_id, nome, telefone, email, empresa, is_active, numero_pedidos, ultima_mensagem)
-- VALUES 
--   (gen_random_uuid(), 'USER_ID_AQUI', 'LISTA_ID_AQUI', 'João Silva', '+55 11 98765-4321', 'joao@email.com', 'Tech Corp', true, 12, NOW() - INTERVAL '2 days'),
--   (gen_random_uuid(), 'USER_ID_AQUI', 'LISTA_ID_AQUI', 'Maria Santos', '+55 21 97654-3210', 'maria@email.com', 'Design Studio', true, 3, NOW() - INTERVAL '5 days');

-- NOTA: Para criar dados de teste reais, você deve:
-- 1. Fazer login na aplicação
-- 2. Obter seu user_id executando: SELECT auth.uid();
-- 3. Substituir 'USER_ID_AQUI' pelo valor retornado
-- 4. Executar os comandos INSERT acima
