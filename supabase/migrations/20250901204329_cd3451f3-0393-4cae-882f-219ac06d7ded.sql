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

-- Clean up duplicate financial transactions first
DELETE FROM public.transacoes_financeiras 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           comissao_id,
           ROW_NUMBER() OVER (PARTITION BY comissao_id ORDER BY created_at ASC) as rn
    FROM public.transacoes_financeiras
    WHERE tipo = 'despesa' 
    AND comissao_id IS NOT NULL
  ) ranked WHERE rn > 1
);

-- Then clean up duplicate commissions
DELETE FROM public.comissoes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY COALESCE(contrato_id::text, '') || COALESCE(venda_id::text, '') || vendedor_id::text || valor_venda::text || mes_referencia::text 
             ORDER BY created_at ASC
           ) as rn
    FROM public.comissoes
  ) ranked WHERE rn > 1
);