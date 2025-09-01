-- Step 1: Remove duplicate triggers (already done in previous migration but let's be sure)
DROP TRIGGER IF EXISTS trigger_create_financial_transactions_from_contract ON public.contratos;
DROP TRIGGER IF EXISTS calculate_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_create_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS update_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_delete_financial_transaction_from_sale ON public.vendas;

-- Step 2: Find and update orphaned financial transactions to point to the correct commission
-- This will consolidate duplicate financial transactions to point to a single commission each
WITH duplicated_commissions AS (
  -- Find groups of duplicate commissions
  SELECT 
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids,
    contrato_id,
    venda_id,
    vendedor_id,
    valor_venda,
    mes_referencia
  FROM public.comissoes
  GROUP BY contrato_id, venda_id, vendedor_id, valor_venda, mes_referencia
  HAVING COUNT(*) > 1
),
commission_mapping AS (
  -- Create mapping from duplicate IDs to the ID we want to keep
  SELECT 
    unnest(all_ids) as old_id,
    keep_id as new_id
  FROM duplicated_commissions
)
-- Update financial transactions to point to the commission we're keeping
UPDATE public.transacoes_financeiras 
SET comissao_id = cm.new_id
FROM commission_mapping cm
WHERE transacoes_financeiras.comissao_id = cm.old_id
AND cm.old_id != cm.new_id;

-- Step 3: Now safely delete duplicate commissions (they should have no references now)
WITH duplicated_commissions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY contrato_id, venda_id, vendedor_id, valor_venda, mes_referencia 
      ORDER BY created_at ASC
    ) as rn
  FROM public.comissoes
)
DELETE FROM public.comissoes 
WHERE id IN (
  SELECT id FROM duplicated_commissions WHERE rn > 1
);

-- Step 4: Remove any remaining duplicate financial transactions
WITH duplicate_transactions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY comissao_id, valor, data_transacao 
      ORDER BY created_at ASC
    ) as rn
  FROM public.transacoes_financeiras
  WHERE tipo = 'despesa' AND comissao_id IS NOT NULL
)
DELETE FROM public.transacoes_financeiras 
WHERE id IN (
  SELECT id FROM duplicate_transactions WHERE rn > 1
);