-- Remove the trigger that's causing duplicate financial transactions
DROP TRIGGER IF EXISTS create_sale_financial_transactions_trigger ON public.vendas;

-- Clean up duplicate financial transactions from sales
-- Keep only the oldest transaction for each sale (the one created by the application logic)
DELETE FROM public.transacoes_financeiras tf1
WHERE tf1.tipo = 'receita' 
AND tf1.venda_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf2 
    WHERE tf2.venda_id = tf1.venda_id 
    AND tf2.tipo = 'receita'
    AND tf2.created_at < tf1.created_at
);

-- Clean up duplicate commission payables 
-- Keep only the oldest commission payable for each commission
DELETE FROM public.transacoes_financeiras tf1
WHERE tf1.tipo = 'despesa' 
AND tf1.comissao_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf2 
    WHERE tf2.comissao_id = tf1.comissao_id 
    AND tf2.tipo = 'despesa'
    AND tf2.created_at < tf1.created_at
);

-- Sync all existing commissions to financial transactions (for any missing ones)
SELECT sync_all_commissions_to_financial();