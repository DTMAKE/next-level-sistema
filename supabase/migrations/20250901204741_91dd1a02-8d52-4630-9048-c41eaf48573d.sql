-- Only remove duplicate triggers first to stop new duplications
DROP TRIGGER IF EXISTS trigger_create_financial_transactions_from_contract ON public.contratos;
DROP TRIGGER IF EXISTS calculate_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_create_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_commission ON public.vendas;
DROP TRIGGER IF EXISTS trigger_update_financial_transaction_from_sale ON public.vendas;
DROP TRIGGER IF EXISTS update_commission_trigger ON public.vendas;
DROP TRIGGER IF EXISTS trigger_delete_financial_transaction_from_sale ON public.vendas;