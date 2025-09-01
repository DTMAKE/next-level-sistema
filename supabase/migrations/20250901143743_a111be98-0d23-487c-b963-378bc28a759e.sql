-- Update process_contract_recurrences to work with existing pending accounts
CREATE OR REPLACE FUNCTION public.process_contract_recurrences(target_month date DEFAULT date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))
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
    recorrencia_id uuid;
    vendedor_percentual numeric;
    comissao_valor numeric;
    existing_receivable_id uuid;
    existing_commission_payable_id uuid;
    comissao_id_var uuid;
BEGIN
    -- Get first admin user for financial transactions
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Find "Venda" category or create it
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF categoria_venda_id IS NULL THEN
        IF admin_user_id IS NULL THEN
            RAISE EXCEPTION 'No admin user found to create financial category';
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    -- Find "Comissões de Vendas" category or create it
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas'
    AND tipo = 'despesa'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF categoria_comissao_id IS NULL THEN
        IF admin_user_id IS NULL THEN
            admin_user_id := (SELECT user_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1);
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

    -- Process each recurring contract that should generate revenue this month
    FOR contract_record IN
        SELECT c.*, cl.nome as cliente_nome, p.percentual_comissao, p.name as vendedor_nome, p.role
        FROM public.contratos c
        LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
        LEFT JOIN public.profiles p ON p.user_id = c.user_id
        WHERE c.tipo_contrato = 'recorrente'
        AND c.status = 'ativo'
        AND c.data_inicio <= target_month
        AND (c.data_fim IS NULL OR c.data_fim >= target_month)
        AND NOT EXISTS (
            SELECT 1 FROM public.contratos_recorrencias cr
            WHERE cr.contrato_id = c.id 
            AND cr.mes_referencia = target_month
            AND cr.status = 'processado'
        )
    LOOP
        -- Create or update recurrence record
        INSERT INTO public.contratos_recorrencias (
            contrato_id, mes_referencia, valor_mes, status
        ) VALUES (
            contract_record.id, target_month, contract_record.valor, 'processado'
        )
        ON CONFLICT (contrato_id, mes_referencia) 
        DO UPDATE SET 
            status = 'processado',
            data_processamento = now(),
            valor_mes = contract_record.valor
        RETURNING id INTO recorrencia_id;
        
        -- Check if there's an existing pending receivable for this contract and month
        SELECT id INTO existing_receivable_id
        FROM public.transacoes_financeiras
        WHERE tipo = 'receita'
        AND data_transacao = target_month
        AND descricao LIKE '%Contrato%' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || '%'
        AND status = 'pendente'
        AND user_id = contract_record.user_id
        LIMIT 1;

        IF existing_receivable_id IS NOT NULL THEN
            -- Update existing pending receivable to confirmed
            UPDATE public.transacoes_financeiras
            SET 
                status = 'confirmada',
                updated_at = now()
            WHERE id = existing_receivable_id;
        ELSE
            -- Create new financial transaction for revenue if no pending one exists
            INSERT INTO public.transacoes_financeiras (
                user_id,
                tipo,
                data_transacao,
                descricao,
                valor,
                categoria_id,
                status
            ) VALUES (
                contract_record.user_id,
                'receita',
                target_month,
                'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
                contract_record.valor,
                categoria_venda_id,
                'confirmada'
            );
        END IF;
        
        -- Create commission if user is a salesperson
        IF contract_record.role = 'vendedor' THEN
            vendedor_percentual := COALESCE(contract_record.percentual_comissao, 5.00);
            comissao_valor := contract_record.valor * (vendedor_percentual / 100);
            
            -- Create commission record
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
                contract_record.id,
                contract_record.valor,
                vendedor_percentual,
                comissao_valor,
                target_month,
                'pendente',
                'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
            ) RETURNING id INTO comissao_id_var;

            -- Check if there's an existing pending commission payable for this contract and month
            SELECT id INTO existing_commission_payable_id
            FROM public.transacoes_financeiras
            WHERE tipo = 'despesa'
            AND data_transacao = target_month
            AND comissao_id IS NOT NULL
            AND descricao LIKE '%Comissão%' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || '%'
            AND status = 'pendente'
            AND user_id = admin_user_id
            LIMIT 1;

            IF existing_commission_payable_id IS NOT NULL THEN
                -- Update existing pending commission payable
                UPDATE public.transacoes_financeiras
                SET 
                    comissao_id = comissao_id_var,
                    valor = comissao_valor,
                    updated_at = now()
                WHERE id = existing_commission_payable_id;
            ELSE
                -- Create new financial transaction for commission expense
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
                    target_month,
                    (target_month + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente'
                );
            END IF;
        END IF;
    END LOOP;
END;
$function$;

-- Function to generate future receivables and payables for recurring contracts
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

    -- Calculate date range
    current_month := DATE_TRUNC('month', contract_record.data_inicio);
    end_month := COALESCE(contract_record.data_fim, (CURRENT_DATE + INTERVAL '2 years'))::date;
    due_day := COALESCE(contract_record.dia_vencimento, 1);

    -- Generate monthly receivables and payables
    WHILE current_month <= end_month LOOP
        -- Calculate due date for this month
        due_date := DATE_TRUNC('month', current_month)::date + (due_day - 1);
        
        -- Ensure due date doesn't exceed month end
        IF due_date > (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date THEN
            due_date := (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date;
        END IF;

        -- Create receivable (pending status)
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
            contract_record.user_id,
            'receita',
            current_month,
            due_date,
            'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
            contract_record.valor,
            categoria_venda_id,
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

-- Function to cancel future accounts when contract is cancelled/finalized
CREATE OR REPLACE FUNCTION public.cancel_future_contract_accounts(p_contrato_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    contract_record record;
BEGIN
    -- Get contract details
    SELECT c.*, cl.nome as cliente_nome, p.name as vendedor_nome
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    LEFT JOIN public.profiles p ON p.user_id = c.user_id
    WHERE c.id = p_contrato_id;

    -- Delete future pending receivables for this contract
    DELETE FROM public.transacoes_financeiras
    WHERE tipo = 'receita'
    AND status = 'pendente'
    AND data_transacao > CURRENT_DATE
    AND descricao LIKE '%Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || '%';

    -- Delete future pending commission payables for this contract
    DELETE FROM public.transacoes_financeiras
    WHERE tipo = 'despesa'
    AND status = 'pendente'
    AND data_transacao > CURRENT_DATE
    AND descricao LIKE '%Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || '%';
END;
$function$;