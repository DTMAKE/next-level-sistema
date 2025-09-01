-- First remove duplicate financial transactions (keep the oldest one)
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

-- Now remove orphaned commissions that don't have any financial transactions
-- This will not cause foreign key violations since we're only removing unused commissions
DELETE FROM public.comissoes
WHERE id NOT IN (
  SELECT DISTINCT comissao_id 
  FROM public.transacoes_financeiras 
  WHERE comissao_id IS NOT NULL
);

-- Drop any remaining duplicate triggers that might exist
DROP TRIGGER IF EXISTS calculate_commission_and_expense_from_contract_trigger ON public.contratos;
DROP TRIGGER IF EXISTS create_financial_transactions_from_contract_trigger ON public.contratos;
DROP TRIGGER IF EXISTS duplicate_commission_trigger ON public.contratos;
DROP TRIGGER IF EXISTS calculate_commission_from_sale_trigger ON public.vendas;
DROP TRIGGER IF EXISTS calculate_commission_and_expense_from_sale_trigger ON public.vendas;

-- Ensure we have the correct triggers in place
CREATE TRIGGER create_financial_transactions_from_contract_trigger
AFTER INSERT ON public.contratos
FOR EACH ROW 
EXECUTE FUNCTION public.create_financial_transactions_from_contract();

CREATE TRIGGER calculate_commission_and_expense_from_sale_trigger
AFTER INSERT OR UPDATE ON public.vendas
FOR EACH ROW 
EXECUTE FUNCTION public.calculate_commission_and_expense_from_sale();