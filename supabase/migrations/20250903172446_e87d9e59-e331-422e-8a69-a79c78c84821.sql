-- Desativar sistema antigo e corrigir duplicações de contas (versão corrigida)

-- 1. Limpar contas a receber duplicadas (manter apenas as com contrato_id)
DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'receita'
AND status = 'pendente'
AND contrato_id IS NULL
AND descricao LIKE '%Contrato%'
AND EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf2
    WHERE tf2.tipo = 'receita'
    AND tf2.contrato_id IS NOT NULL
    AND tf2.data_transacao = transacoes_financeiras.data_transacao
    AND tf2.valor = transacoes_financeiras.valor
);

-- 2. Limpar contas de comissão duplicadas (manter apenas as vinculadas a comissões válidas)
DELETE FROM public.transacoes_financeiras
WHERE tipo = 'despesa'
AND descricao LIKE '%Comissão%'
AND comissao_id IS NULL
AND EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf2
    WHERE tf2.tipo = 'despesa'
    AND tf2.comissao_id IS NOT NULL
    AND tf2.data_transacao = transacoes_financeiras.data_transacao
    AND tf2.descricao LIKE '%Comissão%'
    AND ABS(tf2.valor - transacoes_financeiras.valor) < 0.01
);

-- 3. Atualizar função para evitar duplicações futuras
CREATE OR REPLACE FUNCTION public.generate_contract_future_accounts(p_contrato_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    contract_record record;
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    admin_user_id uuid;
    current_month date;
    end_month date;
    vendedor_percentual numeric;
    comissao_valor numeric;
    due_day integer;
    due_date date;
    comissao_id_var uuid;
    existing_receivable_count integer;
    existing_payable_count integer;
BEGIN
    -- Get contract details
    SELECT c.*, cl.nome as cliente_nome, p.percentual_comissao, p.name as vendedor_nome, p.role
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    LEFT JOIN public.profiles p ON p.user_id = c.user_id
    WHERE c.id = p_contrato_id;

    -- Only process recurring active contracts
    IF contract_record.tipo_contrato != 'recorrente' OR contract_record.status != 'ativo' THEN
        RETURN;
    END IF;

    -- Get first admin user
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Get or create categories
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' AND tipo = 'receita'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_venda_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, contract_record.user_id), 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    IF contract_record.role = 'vendedor' THEN
        SELECT id INTO categoria_comissao_id
        FROM public.categorias_financeiras
        WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
        ORDER BY created_at ASC LIMIT 1;

        IF categoria_comissao_id IS NULL THEN
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (COALESCE(admin_user_id, contract_record.user_id), 'Comissões de Vendas', 'despesa', '#9333EA', true)
            RETURNING id INTO categoria_comissao_id;
        END IF;

        vendedor_percentual := COALESCE(contract_record.percentual_comissao, 5.00);
        comissao_valor := contract_record.valor * (vendedor_percentual / 100);
    END IF;

    -- Calculate date range (only future months)
    current_month := GREATEST(
        DATE_TRUNC('month', contract_record.data_inicio), 
        DATE_TRUNC('month', CURRENT_DATE)
    );
    end_month := COALESCE(contract_record.data_fim, (CURRENT_DATE + INTERVAL '2 years'))::date;
    due_day := COALESCE(contract_record.dia_vencimento, 1);

    -- Generate monthly receivables and payables (only for future months)
    WHILE current_month <= end_month LOOP
        -- Calculate due date for this month
        due_date := DATE_TRUNC('month', current_month)::date + (due_day - 1);
        
        -- Ensure due date doesn't exceed month end
        IF due_date > (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date THEN
            due_date := (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date;
        END IF;

        -- Check if receivable already exists for this month and contract
        SELECT COUNT(*) INTO existing_receivable_count
        FROM public.transacoes_financeiras
        WHERE tipo = 'receita'
        AND contrato_id = p_contrato_id
        AND data_transacao >= current_month
        AND data_transacao < (current_month + INTERVAL '1 month');

        -- Create receivable only if it doesn't exist
        IF existing_receivable_count = 0 THEN
            INSERT INTO public.transacoes_financeiras (
                user_id,
                tipo,
                data_transacao,
                data_vencimento,
                descricao,
                valor,
                categoria_id,
                contrato_id,
                status
            ) VALUES (
                contract_record.user_id,
                'receita',
                current_month,
                due_date,
                'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
                contract_record.valor,
                categoria_venda_id,
                p_contrato_id,
                'pendente'
            );
        END IF;

        -- Create commission payable if salesperson and doesn't exist
        IF contract_record.role = 'vendedor' AND admin_user_id IS NOT NULL THEN
            -- Check if commission already exists for this month and contract
            SELECT COUNT(*) INTO existing_payable_count
            FROM public.comissoes c
            WHERE c.contrato_id = p_contrato_id
            AND c.mes_referencia >= current_month
            AND c.mes_referencia < (current_month + INTERVAL '1 month');

            IF existing_payable_count = 0 THEN
                -- Create commission record first
                INSERT INTO public.comissoes (
                    user_id,
                    vendedor_id,
                    contrato_id,
                    valor_venda,
                    percentual,
                    valor_comissao,
                    mes_referencia,
                    status,
                    observacoes
                ) VALUES (
                    contract_record.user_id,
                    contract_record.user_id,
                    p_contrato_id,
                    contract_record.valor,
                    vendedor_percentual,
                    comissao_valor,
                    current_month,
                    'pendente',
                    'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
                ) RETURNING id INTO comissao_id_var;

                -- Then create the financial transaction
                INSERT INTO public.transacoes_financeiras (
                    user_id,
                    tipo,
                    data_transacao,
                    data_vencimento,
                    descricao,
                    valor,
                    categoria_id,
                    comissao_id,
                    status
                ) VALUES (
                    admin_user_id,
                    'despesa',
                    current_month,
                    (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text),
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente'
                );
            END IF;
        END IF;

        current_month := current_month + INTERVAL '1 month';
    END LOOP;
END;
$function$;

-- 4. Executar limpeza final de órfãs
SELECT public.cleanup_orphan_contract_receivables();

-- 5. Log da operação
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'FIX_DUPLICATE_ACCOUNTS',
    'transacoes_financeiras',
    'bulk_cleanup',
    jsonb_build_object(
        'message', 'Sistema de duplicação corrigido - contas órfãs removidas, trigger atualizado para evitar futuras duplicações',
        'timestamp', now()
    )
);