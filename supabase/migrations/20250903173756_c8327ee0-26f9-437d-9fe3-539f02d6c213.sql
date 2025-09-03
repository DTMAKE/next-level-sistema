-- Eliminar definitivamente a duplicação de comissões e contas a pagar

-- 1. Remover o trigger antigo que está causando duplicação
DROP TRIGGER IF EXISTS trigger_auto_generate_contract_commissions ON public.contratos;

-- 2. Desativar a função antiga do trigger removido
CREATE OR REPLACE FUNCTION public.generate_future_contract_commissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Função desativada - não faz nada para evitar duplicação
    RETURN NEW;
END;
$function$;

-- 3. Remover comissões duplicadas criadas pela função antiga (identificadas pela descrição)
DELETE FROM public.comissoes 
WHERE observacoes LIKE '%Comissão do contrato%'
AND EXISTS (
    SELECT 1 FROM public.comissoes c2
    WHERE c2.contrato_id = comissoes.contrato_id
    AND c2.mes_referencia = comissoes.mes_referencia
    AND c2.vendedor_id = comissoes.vendedor_id
    AND c2.observacoes LIKE '%Comissão recorrente - Contrato%'
    AND c2.id != comissoes.id
);

-- 4. Remover contas a pagar órfãs (aquelas que referenciam comissões que não existem mais)
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'despesa'
AND comissao_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.comissoes c
    WHERE c.id = transacoes_financeiras.comissao_id
);

-- 5. Remover contas a pagar duplicadas sem comissao_id mas com descrição de comissão
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'despesa'
AND comissao_id IS NULL
AND descricao LIKE '%Comissão%'
AND EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf2
    WHERE tf2.tipo = 'despesa'
    AND tf2.comissao_id IS NOT NULL
    AND tf2.descricao LIKE '%Comissão%'
    AND DATE_TRUNC('month', tf2.data_transacao) = DATE_TRUNC('month', transacoes_financeiras.data_transacao)
    AND ABS(tf2.valor - transacoes_financeiras.valor) < 0.01
);

-- 6. Log da operação para auditoria
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'ELIMINATE_COMMISSION_DUPLICATES',
    'transacoes_financeiras',
    'bulk_cleanup',
    jsonb_build_object(
        'message', 'Eliminação definitiva de duplicação de comissões e contas a pagar',
        'old_trigger_removed', 'trigger_auto_generate_contract_commissions',
        'timestamp', now()
    )
);