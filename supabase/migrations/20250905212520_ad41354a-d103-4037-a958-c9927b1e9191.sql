-- Criar função para deletar transações financeiras relacionadas ao contrato quando ele for deletado
CREATE OR REPLACE FUNCTION public.delete_contract_financial_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Delete financial transactions related to commissions of this contract
    DELETE FROM public.transacoes_financeiras
    WHERE comissao_id IN (
        SELECT id FROM public.comissoes 
        WHERE contrato_id = OLD.id
    );
    
    -- Delete commissions related to this contract
    DELETE FROM public.comissoes
    WHERE contrato_id = OLD.id;
    
    -- Delete financial transactions directly related to this contract
    DELETE FROM public.transacoes_financeiras
    WHERE contrato_id = OLD.id;
    
    -- Delete contract services
    DELETE FROM public.contrato_servicos
    WHERE contrato_id = OLD.id;
    
    RETURN OLD;
END;
$$;

-- Criar trigger que executa a função quando um contrato for deletado
CREATE TRIGGER delete_contract_financial_data_trigger
    BEFORE DELETE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_contract_financial_data();