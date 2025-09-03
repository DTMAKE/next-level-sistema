-- Corrigir duplicação nas contas a pagar (versão corrigida)

-- 1. Remover contas a pagar de comissão duplicadas sem comissao_id
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'despesa'
AND descricao LIKE '%Comissão%'
AND comissao_id IS NULL
AND EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf2
    WHERE tf2.tipo = 'despesa'
    AND tf2.comissao_id IS NOT NULL
    AND tf2.descricao LIKE '%Comissão%'
    AND DATE_TRUNC('month', tf2.data_transacao) = DATE_TRUNC('month', transacoes_financeiras.data_transacao)
    AND ABS(tf2.valor - transacoes_financeiras.valor) < 0.01
);

-- 2. Desativar completamente a função antiga
CREATE OR REPLACE FUNCTION public.process_contract_recurrences(target_month date DEFAULT date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Função desativada - não faz nada
    RETURN;
END;
$function$;

-- 3. Recriar trigger com condição corrigida
DROP TRIGGER IF EXISTS generate_contract_accounts_trigger ON public.contratos;
CREATE TRIGGER generate_contract_accounts_trigger
    AFTER INSERT OR UPDATE OF status, tipo_contrato ON public.contratos
    FOR EACH ROW
    WHEN (NEW.tipo_contrato = 'recorrente' AND NEW.status = 'ativo')
    EXECUTE FUNCTION public.generate_contract_future_accounts();

-- 4. Limpar comissões órfãs
DELETE FROM public.comissoes 
WHERE contrato_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = comissoes.contrato_id
);

-- 5. Limpar transações órfãs
DELETE FROM public.transacoes_financeiras 
WHERE comissao_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.comissoes c
    WHERE c.id = transacoes_financeiras.comissao_id
);

-- 6. Log da operação
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'CLEAN_PAYABLE_DUPLICATES',
    'transacoes_financeiras',
    'final_cleanup',
    jsonb_build_object(
        'message', 'Limpeza final de contas a pagar duplicadas realizada',
        'timestamp', now()
    )
);