-- Create function to cleanup orphan commission payables
CREATE OR REPLACE FUNCTION public.cleanup_orphan_commission_payables()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count integer := 0;
BEGIN
    -- Delete commission-related payables where the commission no longer exists
    -- or the associated sale has been deleted
    WITH deleted_payables AS (
        DELETE FROM public.transacoes_financeiras
        WHERE tipo = 'despesa'
        AND comissao_id IS NOT NULL
        AND (
            -- Commission doesn't exist anymore
            NOT EXISTS (
                SELECT 1 FROM public.comissoes c 
                WHERE c.id = transacoes_financeiras.comissao_id
            )
            OR
            -- Sale associated with commission was deleted
            EXISTS (
                SELECT 1 FROM public.comissoes c 
                WHERE c.id = transacoes_financeiras.comissao_id
                AND c.venda_id IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM public.vendas v 
                    WHERE v.id = c.venda_id
                )
            )
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_payables;
    
    -- Log the cleanup operation
    INSERT INTO public.audit_logs (
        action,
        table_name,
        record_id,
        new_values
    ) VALUES (
        'CLEANUP_ORPHAN_PAYABLES',
        'transacoes_financeiras',
        'bulk_operation',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'cleanup_timestamp', now()
        )
    );
    
    RETURN deleted_count;
END;
$function$;