-- Remove duplicate commissions and financial transactions

-- First, let's see if there are any triggers that might be causing duplicates
SELECT trigger_schema, event_object_table, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('contratos', 'vendas', 'comissoes')
ORDER BY event_object_table, trigger_name;

-- Remove duplicate commission transactions (keep the oldest one for each comissao_id)
WITH duplicate_transactions AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY comissao_id ORDER BY created_at ASC) as rn
  FROM public.transacoes_financeiras
  WHERE tipo = 'despesa' 
  AND comissao_id IS NOT NULL
)
DELETE FROM public.transacoes_financeiras 
WHERE id IN (
  SELECT id FROM duplicate_transactions WHERE rn > 1
);

-- Remove duplicate commissions (keep the oldest one for each contrato_id + mes_referencia combination)
WITH duplicate_commissions AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY contrato_id, mes_referencia, vendedor_id 
           ORDER BY created_at ASC
         ) as rn
  FROM public.comissoes
  WHERE contrato_id IS NOT NULL
)
DELETE FROM public.comissoes 
WHERE id IN (
  SELECT id FROM duplicate_commissions WHERE rn > 1
);

-- Also remove duplicate commissions for vendas (keep the oldest one for each venda_id)
WITH duplicate_sale_commissions AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY venda_id, vendedor_id 
           ORDER BY created_at ASC
         ) as rn
  FROM public.comissoes
  WHERE venda_id IS NOT NULL
)
DELETE FROM public.comissoes 
WHERE id IN (
  SELECT id FROM duplicate_sale_commissions WHERE rn > 1
);

-- Drop any remaining duplicate triggers that might exist
DROP TRIGGER IF EXISTS calculate_commission_and_expense_from_contract_trigger ON public.contratos;
DROP TRIGGER IF EXISTS create_financial_transactions_from_contract_trigger ON public.contratos;
DROP TRIGGER IF EXISTS duplicate_commission_trigger ON public.contratos;

-- Create the single trigger for contracts
CREATE TRIGGER create_financial_transactions_from_contract_trigger
AFTER INSERT ON public.contratos
FOR EACH ROW 
EXECUTE FUNCTION public.create_financial_transactions_from_contract();