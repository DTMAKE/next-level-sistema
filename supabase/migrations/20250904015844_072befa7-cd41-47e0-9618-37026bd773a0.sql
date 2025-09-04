-- Fix commission logic to use vendedor_id instead of user_id for contracts
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
    vendedor_info record;
BEGIN
    -- Get contract details with vendedor info
    SELECT c.*, cl.nome as cliente_nome, 
           COALESCE(pv.percentual_comissao_contrato, pv.percentual_comissao, 5.00) as percentual_comissao, 
           pv.name as vendedor_nome, pv.role as vendedor_role,
           pu.name as user_nome
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    LEFT JOIN public.profiles pv ON pv.user_id = COALESCE(c.vendedor_id, c.user_id) -- Use vendedor_id if available, fallback to user_id
    LEFT JOIN public.profiles pu ON pu.user_id = c.user_id
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

    -- Only create commission if there's a vendedor and they are a salesperson
    IF contract_record.vendedor_role = 'vendedor' OR (contract_record.vendedor_role = 'admin' AND contract_record.percentual_comissao > 0) THEN
        SELECT id INTO categoria_comissao_id
        FROM public.categorias_financeiras
        WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
        ORDER BY created_at ASC LIMIT 1;

        IF categoria_comissao_id IS NULL THEN
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (COALESCE(admin_user_id, contract_record.user_id), 'Comissões de Vendas', 'despesa', '#9333EA', true)
            RETURNING id INTO categoria_comissao_id;
        END IF;

        vendedor_percentual := contract_record.percentual_comissao;
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
        IF (contract_record.vendedor_role = 'vendedor' OR (contract_record.vendedor_role = 'admin' AND contract_record.percentual_comissao > 0)) AND admin_user_id IS NOT NULL THEN
            -- Check if commission already exists for this month and contract
            SELECT COUNT(*) INTO existing_payable_count
            FROM public.comissoes c
            WHERE c.contrato_id = p_contrato_id
            AND c.mes_referencia >= current_month
            AND c.mes_referencia < (current_month + INTERVAL '1 month');

            IF existing_payable_count = 0 THEN
                -- Create commission record first - Use vendedor_id or user_id as fallback
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
                    COALESCE(contract_record.vendedor_id, contract_record.user_id), -- Use vendedor_id if available
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