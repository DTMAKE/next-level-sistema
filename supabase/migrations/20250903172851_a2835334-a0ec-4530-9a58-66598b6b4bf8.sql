-- Corrigir duplicação específica nas contas a pagar de comissão

-- 1. Identificar e remover contas a pagar de comissão duplicadas
-- Manter apenas as que têm comissao_id preenchido (mais recentes e corretas)
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
    AND tf2.user_id = transacoes_financeiras.user_id
);

-- 2. Remover contas a pagar órfãs que não têm comissão correspondente
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'despesa'
AND comissao_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.comissoes c
    WHERE c.id = transacoes_financeiras.comissao_id
);

-- 3. Remover comissões órfãs sem contrato ou venda válida
DELETE FROM public.comissoes 
WHERE contrato_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = comissoes.contrato_id
    AND c.status = 'ativo'
);

-- 4. Atualizar função para evitar que o sistema antigo interfira
CREATE OR REPLACE FUNCTION public.process_contract_recurrences(target_month date DEFAULT date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Função desativada - agora usamos apenas o trigger generate_contract_future_accounts
    -- Esta função foi mantida para compatibilidade mas não faz nada
    RETURN;
END;
$function$;

-- 5. Garantir que trigger só roda uma vez por contrato
DROP TRIGGER IF EXISTS generate_contract_accounts_trigger ON public.contratos;
CREATE TRIGGER generate_contract_accounts_trigger
    AFTER INSERT OR UPDATE OF status, tipo_contrato ON public.contratos
    FOR EACH ROW
    WHEN (NEW.tipo_contrato = 'recorrente' AND NEW.status = 'ativo' AND 
          (TG_OP = 'INSERT' OR OLD.status != 'ativo' OR OLD.tipo_contrato != 'recorrente'))
    EXECUTE FUNCTION public.generate_contract_future_accounts();

-- 6. Log da operação
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'FIX_PAYABLE_DUPLICATES',
    'transacoes_financeiras',
    'payables_cleanup',
    jsonb_build_object(
        'message', 'Contas a pagar duplicadas removidas, sistema antigo desativado',
        'timestamp', now()
    )
);