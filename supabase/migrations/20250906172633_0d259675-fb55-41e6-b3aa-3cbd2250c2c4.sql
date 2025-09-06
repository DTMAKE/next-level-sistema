-- Remove the old trigger and function that's causing duplicates
DROP TRIGGER IF EXISTS after_venda_insert ON public.vendas;
DROP FUNCTION IF EXISTS public.create_financial_transaction_from_sale();
DROP FUNCTION IF EXISTS public.create_financial_transaction_from_closed_sale();

-- Clean up duplicate receivables - keep only the installment transactions for parcelado sales
-- and keep only the single transaction for a_vista sales
WITH duplicates_to_remove AS (
    SELECT tf1.id
    FROM public.transacoes_financeiras tf1
    INNER JOIN public.vendas v ON v.id = tf1.venda_id
    WHERE tf1.tipo = 'receita'
    AND v.forma_pagamento = 'parcelado'
    AND tf1.parcelas = 1  -- These are the incorrect "total value" transactions
    AND tf1.parcela_atual = 1
    AND EXISTS (
        -- Check if there are proper installment transactions for the same sale
        SELECT 1 FROM public.transacoes_financeiras tf2
        WHERE tf2.venda_id = tf1.venda_id
        AND tf2.tipo = 'receita'
        AND tf2.parcelas > 1
        AND tf2.id != tf1.id
    )
)
DELETE FROM public.transacoes_financeiras
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Also clean up any other duplicates where we have multiple transactions 
-- with the same venda_id, valor, and data_transacao but different ids
WITH ranked_duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY venda_id, valor, data_transacao, parcela_atual 
               ORDER BY created_at ASC
           ) as rn
    FROM public.transacoes_financeiras
    WHERE tipo = 'receita' 
    AND venda_id IS NOT NULL
)
DELETE FROM public.transacoes_financeiras
WHERE id IN (
    SELECT id FROM ranked_duplicates WHERE rn > 1
);