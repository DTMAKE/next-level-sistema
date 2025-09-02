-- Trigger para gerar comissões automaticamente quando um contrato é criado
CREATE OR REPLACE FUNCTION public.auto_generate_contract_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Se o contrato for recorrente e estiver ativo, gerar comissões automaticamente
    IF NEW.tipo_contrato = 'recorrente' AND NEW.status = 'ativo' THEN
        -- Chama a função para gerar as comissões futuras
        PERFORM generate_future_contract_commissions(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar trigger que executa após inserção ou atualização de contratos
DROP TRIGGER IF EXISTS trigger_auto_generate_contract_commissions ON public.contratos;
CREATE TRIGGER trigger_auto_generate_contract_commissions
    AFTER INSERT OR UPDATE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_contract_commissions();