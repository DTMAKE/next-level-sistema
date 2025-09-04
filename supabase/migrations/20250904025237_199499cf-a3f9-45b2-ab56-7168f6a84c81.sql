-- Fix contract financial transactions to generate for the entire contract period

CREATE OR REPLACE FUNCTION public.create_contract_financial_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    contract_record record;
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    admin_user_id uuid;
    vendedor_percentual numeric;
    comissao_valor numeric;
    comissao_id_var uuid;
    current_month date;
    end_month date;
    due_date date;
    installment_number integer;
BEGIN
    -- Only process recurring active contracts
    IF NEW.tipo_contrato != 'recorrente' OR NEW.status != 'ativo' THEN
        RETURN NEW;
    END IF;

    -- Get contract details with vendedor info
    SELECT c.*, cl.nome as cliente_nome, 
           COALESCE(pv.percentual_comissao_contrato, pv.percentual_comissao, 5.00) as percentual_comissao, 
           pv.name as vendedor_nome, pv.role as vendedor_role
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    LEFT JOIN public.profiles pv ON pv.user_id = COALESCE(c.vendedor_id, c.user_id)
    WHERE c.id = NEW.id;

    -- Skip if no data_fim is set (indefinite contract)
    IF contract_record.data_fim IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get first admin user
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Get or create revenue category
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' AND tipo = 'receita'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_venda_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, contract_record.user_id), 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    -- Calculate the start and end months for the contract period
    current_month := DATE_TRUNC('month', contract_record.data_inicio)::date;
    end_month := DATE_TRUNC('month', contract_record.data_fim)::date;
    installment_number := 1;

    -- Generate receivables for each month in the contract period
    WHILE current_month <= end_month LOOP
        -- Calculate due date for this month (using dia_vencimento)
        due_date := current_month + (COALESCE(contract_record.dia_vencimento, 1) - 1);
        
        -- Make sure due date doesn't exceed the month
        IF EXTRACT(DAY FROM due_date) > EXTRACT(DAY FROM (current_month + INTERVAL '1 month - 1 day')) THEN
            due_date := current_month + INTERVAL '1 month - 1 day';
        END IF;

        -- Check if receivable already exists for this month to prevent duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.transacoes_financeiras
            WHERE tipo = 'receita'
            AND contrato_id = NEW.id
            AND data_transacao >= current_month
            AND data_transacao < (current_month + INTERVAL '1 month')
        ) THEN
            -- Create receivable for this month
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
                due_date, -- Use due date as transaction date
                due_date, -- Due date
                'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || 
                ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente') || 
                ' (' || installment_number || 'ª parcela)',
                contract_record.valor,
                categoria_venda_id,
                NEW.id,
                'pendente'
            );
        END IF;

        -- Create commission if there's a salesperson
        IF (contract_record.vendedor_role = 'vendedor' OR (contract_record.vendedor_role = 'admin' AND contract_record.percentual_comissao > 0)) AND admin_user_id IS NOT NULL THEN
            SELECT id INTO categoria_comissao_id
            FROM public.categorias_financeiras
            WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
            ORDER BY created_at ASC LIMIT 1;

            IF categoria_comissao_id IS NULL THEN
                INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
                RETURNING id INTO categoria_comissao_id;
            END IF;

            vendedor_percentual := contract_record.percentual_comissao;
            comissao_valor := contract_record.valor * (vendedor_percentual / 100);

            -- Check if commission already exists for this month
            IF NOT EXISTS (
                SELECT 1 FROM public.comissoes c
                WHERE c.contrato_id = NEW.id
                AND c.mes_referencia >= current_month
                AND c.mes_referencia < (current_month + INTERVAL '1 month')
            ) THEN
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
                    COALESCE(contract_record.vendedor_id, contract_record.user_id),
                    NEW.id,
                    contract_record.valor,
                    vendedor_percentual,
                    comissao_valor,
                    current_month,
                    'pendente',
                    'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || 
                    ' (' || installment_number || 'ª parcela)'
                ) RETURNING id INTO comissao_id_var;

                -- Create commission payable
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
                    due_date,
                    (current_month + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || 
                    ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || 
                    ' (' || installment_number || 'ª parcela)',
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente'
                );
            END IF;
        END IF;

        -- Move to next month
        current_month := current_month + INTERVAL '1 month';
        installment_number := installment_number + 1;
    END LOOP;

    RETURN NEW;
END;
$function$;

-- Add logging for this fix
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'FIX_CONTRACT_DATES',
    'transacoes_financeiras',
    'date_calculation_fix',
    jsonb_build_object(
        'message', 'Fixed contract financial transactions to generate for entire contract period with correct dates',
        'timestamp', now()
    )
);