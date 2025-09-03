-- Fix duplicate receivables in first month for recurring contracts
-- Modify generate_future_receivables_and_payables to start from second month for recurring contracts

CREATE OR REPLACE FUNCTION public.generate_future_receivables_and_payables(p_contrato_id uuid)
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

    -- Calculate date range - START FROM SECOND MONTH for recurring contracts
    -- This prevents duplication with the immediate transaction created by contract_financial_transactions_trigger
    current_month := DATE_TRUNC('month', contract_record.data_inicio) + INTERVAL '1 month';
    end_month := COALESCE(contract_record.data_fim, (CURRENT_DATE + INTERVAL '2 years'))::date;
    due_day := COALESCE(contract_record.dia_vencimento, 1);

    -- Generate monthly receivables and payables starting from SECOND month
    WHILE current_month <= end_month LOOP
        -- Calculate due date for this month
        due_date := DATE_TRUNC('month', current_month)::date + (due_day - 1);
        
        -- Ensure due date doesn't exceed month end
        IF due_date > (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date THEN
            due_date := (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date;
        END IF;

        -- Create receivable (pending status) with contrato_id
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
        )
        ON CONFLICT DO NOTHING; -- Avoid duplicates

        -- Create commission payable if salesperson
        IF contract_record.role = 'vendedor' AND admin_user_id IS NOT NULL THEN
            INSERT INTO public.transacoes_financeiras (
                user_id,
                tipo,
                data_transacao,
                data_vencimento,
                descricao,
                valor,
                categoria_id,
                status
            ) VALUES (
                admin_user_id,
                'despesa',
                current_month,
                (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text),
                comissao_valor,
                categoria_comissao_id,
                'pendente'
            )
            ON CONFLICT DO NOTHING; -- Avoid duplicates
        END IF;

        current_month := current_month + INTERVAL '1 month';
    END LOOP;
END;
$function$;