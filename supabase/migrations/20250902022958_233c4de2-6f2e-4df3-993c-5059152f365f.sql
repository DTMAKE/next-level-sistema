-- Criar função para validar exclusão de contas a receber
CREATE OR REPLACE FUNCTION public.validate_delete_conta_receber(conta_id uuid)
RETURNS TABLE(can_delete boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    conta_record record;
    active_contract_exists boolean;
    related_sale_exists boolean;
BEGIN
    -- Buscar a conta
    SELECT * INTO conta_record
    FROM public.transacoes_financeiras
    WHERE id = conta_id AND tipo = 'receita';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Conta não encontrada'::text;
        RETURN;
    END IF;
    
    -- Verificar se existe contrato ativo relacionado
    IF conta_record.descricao LIKE '%Contrato%' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.contratos c
            WHERE c.status = 'ativo'
            AND conta_record.descricao LIKE '%' || COALESCE(c.numero_contrato, c.id::text) || '%'
        ) INTO active_contract_exists;
        
        IF active_contract_exists THEN
            RETURN QUERY SELECT false, 'Não é possível excluir: existe contrato ativo relacionado'::text;
            RETURN;
        END IF;
    END IF;
    
    -- Verificar se existe venda relacionada
    IF conta_record.venda_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.vendas v
            WHERE v.id = conta_record.venda_id
            AND v.status = 'fechada'
        ) INTO related_sale_exists;
        
        IF related_sale_exists THEN
            RETURN QUERY SELECT false, 'Não é possível excluir: existe venda relacionada'::text;
            RETURN;
        END IF;
    END IF;
    
    -- Se chegou até aqui, pode deletar
    RETURN QUERY SELECT true, 'Pode ser excluída'::text;
END;
$$;

-- Criar função para limpar contas órfãs (contratos desativados)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_receivables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Deletar contas a receber de contratos inativos (apenas as pendentes)
    DELETE FROM public.transacoes_financeiras
    WHERE tipo = 'receita'
    AND status = 'pendente'
    AND descricao LIKE '%Contrato%'
    AND NOT EXISTS (
        SELECT 1 FROM public.contratos c
        WHERE c.status = 'ativo'
        AND transacoes_financeiras.descricao LIKE '%' || COALESCE(c.numero_contrato, c.id::text) || '%'
    );
    
    -- Log da limpeza (opcional)
    INSERT INTO public.audit_logs (
        action,
        table_name,
        record_id,
        new_values
    ) VALUES (
        'CLEANUP',
        'transacoes_financeiras',
        'batch_cleanup',
        jsonb_build_object('message', 'Cleaned up orphan receivables from inactive contracts')
    );
END;
$$;