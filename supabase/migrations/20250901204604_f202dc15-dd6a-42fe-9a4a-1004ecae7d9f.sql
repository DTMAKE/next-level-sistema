-- Step 1: Remove all duplicate triggers
DROP TRIGGER IF EXISTS trigger_create_financial_transactions_from_contract ON public.contratos;
DROP TRIGGER IF EXISTS calculate_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_create_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS update_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_delete_financial_transaction_from_sale ON public.vendas;

-- Step 2: Simple approach - delete duplicate financial transactions based on exact match
DELETE FROM public.transacoes_financeiras a
WHERE a.tipo = 'despesa' 
AND a.comissao_id IS NOT NULL
AND a.id NOT IN (
    SELECT DISTINCT ON (comissao_id, valor, data_transacao, descricao) id
    FROM public.transacoes_financeiras
    WHERE tipo = 'despesa' AND comissao_id IS NOT NULL
    ORDER BY comissao_id, valor, data_transacao, descricao, created_at ASC
);

-- Step 3: Delete duplicate commissions based on exact match
DELETE FROM public.comissoes a
WHERE a.id NOT IN (
    SELECT DISTINCT ON (COALESCE(contrato_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                        COALESCE(venda_id, '00000000-0000-0000-0000-000000000000'::uuid), 
                        vendedor_id, valor_venda, mes_referencia) id
    FROM public.comissoes
    ORDER BY COALESCE(contrato_id, '00000000-0000-0000-0000-000000000000'::uuid), 
             COALESCE(venda_id, '00000000-0000-0000-0000-000000000000'::uuid), 
             vendedor_id, valor_venda, mes_referencia, created_at ASC
);