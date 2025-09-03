-- Criar trigger para gerar comissões automaticamente quando contratos recorrentes são ativados
CREATE OR REPLACE FUNCTION trigger_generate_contract_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Só executar se o contrato for recorrente e estiver sendo ativado
    IF NEW.tipo_contrato = 'recorrente' AND NEW.status = 'ativo' AND 
       (OLD IS NULL OR OLD.status != 'ativo' OR OLD.tipo_contrato != 'recorrente') THEN
        
        -- Executar a função de geração de comissões em background
        PERFORM public.generate_future_contract_commissions();
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar o trigger que será executado após insert ou update na tabela contratos
DROP TRIGGER IF EXISTS auto_generate_contract_commissions ON public.contratos;
CREATE TRIGGER auto_generate_contract_commissions
    AFTER INSERT OR UPDATE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_contract_commissions();