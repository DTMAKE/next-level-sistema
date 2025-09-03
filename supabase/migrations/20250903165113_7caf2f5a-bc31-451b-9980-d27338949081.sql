-- Identificar e remover triggers duplicados que criam contas a receber

-- Ver todos os triggers na tabela contratos que podem estar causando duplicação
-- Primeiro, vamos desabilitar o trigger antigo que pode estar criando duplicações
DROP TRIGGER IF EXISTS create_financial_transactions_from_contract_trigger ON public.contratos;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.create_financial_transactions_from_contract();

-- Garantir que apenas o trigger mais recente esteja ativo
-- O trigger contract_financial_transactions_trigger já está correto e deve permanecer