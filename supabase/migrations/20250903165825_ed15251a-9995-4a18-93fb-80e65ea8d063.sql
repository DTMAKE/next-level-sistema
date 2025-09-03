-- Corrigir o tipo do contrato atual e gerar contas mensais
-- Primeiro, corrigir contratos que têm data_fim definida para serem recorrentes
UPDATE public.contratos 
SET tipo_contrato = 'recorrente'
WHERE data_fim IS NOT NULL 
  AND tipo_contrato = 'unico'
  AND status = 'ativo';

-- Executar processamento de recorrências para o mês atual e próximos meses
-- Processar setembro 2025
SELECT process_contract_recurrences('2025-09-01'::date);

-- Processar outubro 2025
SELECT process_contract_recurrences('2025-10-01'::date);

-- Processar novembro 2025
SELECT process_contract_recurrences('2025-11-01'::date);

-- Criar função para gerar contas futuras automaticamente para novos contratos
CREATE OR REPLACE FUNCTION public.generate_contract_future_accounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for um contrato recorrente ativo, gerar contas futuras
    IF NEW.tipo_contrato = 'recorrente' AND NEW.status = 'ativo' THEN
        -- Chamar função para gerar contas a receber e a pagar futuras
        PERFORM generate_future_receivables_and_payables(NEW.id);
    END IF;
    
    -- Se status mudou para cancelado/suspenso, cancelar contas futuras
    IF OLD.status != NEW.status AND NEW.status IN ('cancelado', 'suspenso') THEN
        PERFORM cancel_future_contract_accounts(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para gerar contas automaticamente
DROP TRIGGER IF EXISTS generate_contract_accounts_trigger ON public.contratos;
CREATE TRIGGER generate_contract_accounts_trigger
    AFTER INSERT OR UPDATE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_contract_future_accounts();