-- Remove ALL duplicate triggers that are causing commission duplications

-- Contratos table - remove duplicate triggers
DROP TRIGGER IF EXISTS trigger_create_financial_transactions_from_contract ON public.contratos;

-- Vendas table - remove ALL duplicate triggers
DROP TRIGGER IF EXISTS calculate_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_create_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS update_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_delete_financial_transaction_from_sale ON public.vendas;

-- Clean up any existing duplicate commissions and financial transactions
WITH duplicate_transactions AS (
  SELECT id, 
         comissao_id,
         ROW_NUMBER() OVER (PARTITION BY comissao_id ORDER BY created_at ASC) as rn
  FROM public.transacoes_financeiras
  WHERE tipo = 'despesa' 
  AND comissao_id IS NOT NULL
)
DELETE FROM public.transacoes_financeiras 
WHERE id IN (
  SELECT id FROM duplicate_transactions WHERE rn > 1
);

-- Remove duplicate commissions (keep the oldest one)
WITH duplicate_commissions AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY vendedor_id, contrato_id, venda_id, valor_venda, mes_referencia 
           ORDER BY created_at ASC
         ) as rn
  FROM public.comissoes
  WHERE contrato_id IS NOT NULL OR venda_id IS NOT NULL
)
DELETE FROM public.comissoes 
WHERE id IN (
  SELECT id FROM duplicate_commissions WHERE rn > 1
);