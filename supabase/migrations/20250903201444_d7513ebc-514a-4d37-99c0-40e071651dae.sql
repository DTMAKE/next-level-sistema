-- Primeiro, vamos limpar as contas duplicadas existentes
-- Manter apenas as contas com contrato_id preenchido (sistema mais novo e confiável)

-- Deletar contas duplicadas que NÃO têm contrato_id mas têm referência na descrição
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'receita' 
AND contrato_id IS NULL 
AND status = 'pendente'
AND descricao LIKE '%Contrato Contrato Fulano Company #001%'
AND data_transacao >= '2025-10-01';

-- Também deletar comissões órfãs relacionadas
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'despesa' 
AND contrato_id IS NULL 
AND status = 'pendente'
AND descricao LIKE '%Contrato Contrato Fulano Company #001%'
AND data_transacao >= '2025-10-01';

-- Verificar se existem triggers duplicados e desabilitar os antigos
-- Vamos verificar se existe o trigger antigo que estava causando duplicação
DROP TRIGGER IF EXISTS contract_financial_transactions_trigger ON public.contratos;
DROP TRIGGER IF EXISTS create_contract_financial_transactions ON public.contratos;

-- Manter apenas o trigger correto que já foi corrigido
-- O trigger generate_contract_accounts_trigger deve ser o único ativo