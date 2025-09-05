-- Fix existing commissions to use correct vendedor_id
UPDATE public.comissoes 
SET vendedor_id = CASE 
    WHEN venda_id IS NOT NULL THEN 
        COALESCE(
            (SELECT vendedor_id FROM public.vendas WHERE id = comissoes.venda_id),
            (SELECT user_id FROM public.vendas WHERE id = comissoes.venda_id)
        )
    WHEN contrato_id IS NOT NULL THEN
        COALESCE(
            (SELECT vendedor_id FROM public.contratos WHERE id = comissoes.contrato_id),
            (SELECT user_id FROM public.contratos WHERE id = comissoes.contrato_id)
        )
    ELSE vendedor_id
END
WHERE EXISTS (
    SELECT 1 FROM public.vendas v WHERE v.id = comissoes.venda_id AND v.vendedor_id IS NOT NULL AND v.vendedor_id != comissoes.vendedor_id
) OR EXISTS (
    SELECT 1 FROM public.contratos c WHERE c.id = comissoes.contrato_id AND c.vendedor_id IS NOT NULL AND c.vendedor_id != comissoes.vendedor_id
);

-- Drop and recreate the sale commission trigger function to use correct vendedor_id
DROP FUNCTION IF EXISTS public.create_sale_financial_transactions() CASCADE;

CREATE OR REPLACE FUNCTION public.create_sale_financial_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    vendedor_percentual numeric;
    comissao_valor numeric;
    cliente_nome text;
    vendedor_nome text;
    vendedor_role text;
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    comissao_id_var uuid;
    mes_referencia_date date;
    admin_user_id uuid;
    actual_vendedor_id uuid;
BEGIN
    -- Only process if sale is being marked as 'fechada' or inserted as 'fechada'
    IF NEW.status = 'fechada' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'fechada') THEN
        
        -- Determine the correct vendedor_id (prefer NEW.vendedor_id, fallback to NEW.user_id)
        actual_vendedor_id := COALESCE(NEW.vendedor_id, NEW.user_id);
        
        -- Get client name
        SELECT nome INTO cliente_nome
        FROM public.clientes
        WHERE id = NEW.cliente_id;
        
        -- Get seller info using the actual vendedor_id
        SELECT percentual_comissao, name, role 
        INTO vendedor_percentual, vendedor_nome, vendedor_role
        FROM public.profiles
        WHERE user_id = actual_vendedor_id;
        
        -- Get first admin user for commission expenses
        SELECT user_id INTO admin_user_id
        FROM public.profiles
        WHERE role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Find or create "Venda" category for revenue
        SELECT id INTO categoria_venda_id
        FROM public.categorias_financeiras
        WHERE nome = 'Venda' 
        AND tipo = 'receita'
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF categoria_venda_id IS NULL THEN
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (COALESCE(admin_user_id, NEW.user_id), 'Venda', 'receita', 'hsl(142, 76%, 36%)', true)
            RETURNING id INTO categoria_venda_id;
        END IF;
        
        -- Create revenue transaction using sale number and client name
        INSERT INTO public.transacoes_financeiras (
            user_id,
            tipo,
            data_transacao,
            descricao,
            valor,
            categoria_id,
            venda_id,
            status
        ) VALUES (
            NEW.user_id,
            'receita',
            NEW.data_venda,
            COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            NEW.valor,
            categoria_venda_id,
            NEW.id,
            'confirmada'
        );
        
        -- Create commission only if user has a commission percentage set
        IF vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 THEN
            -- Calculate commission
            comissao_valor := NEW.valor * (vendedor_percentual / 100);
            mes_referencia_date := DATE_TRUNC('month', NEW.data_venda)::date;
            
            -- Create commission record using the correct vendedor_id
            INSERT INTO public.comissoes (
                user_id,
                vendedor_id,
                venda_id,
                valor_venda,
                percentual,
                valor_comissao,
                mes_referencia,
                status,
                observacoes
            ) VALUES (
                NEW.user_id,
                actual_vendedor_id, -- Use the correct vendedor_id
                NEW.id,
                NEW.valor,
                vendedor_percentual,
                comissao_valor,
                mes_referencia_date,
                'pendente',
                'Comissão de ' || COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8))
            ) RETURNING id INTO comissao_id_var;
            
            -- Find or create commission category
            SELECT id INTO categoria_comissao_id
            FROM public.categorias_financeiras
            WHERE nome = 'Comissões de Vendas'
            AND tipo = 'despesa'
            ORDER BY created_at ASC
            LIMIT 1;
            
            IF categoria_comissao_id IS NULL THEN
                INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                VALUES (COALESCE(admin_user_id, NEW.user_id), 'Comissões de Vendas', 'despesa', 'hsl(271, 91%, 65%)', true)
                RETURNING id INTO categoria_comissao_id;
            END IF;
            
            -- Create commission payable using admin user and correct vendedor name
            IF admin_user_id IS NOT NULL THEN
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
                    NEW.data_venda,
                    (DATE_TRUNC('month', NEW.data_venda) + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)),
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente'
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Drop and recreate the contract commission function to use correct vendedor_id
DROP FUNCTION IF EXISTS public.generate_contract_future_accounts(uuid) CASCADE;

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
    actual_vendedor_id uuid;
    vendedor_nome text;
    vendedor_role text;
BEGIN
    -- Get contract details with proper vendedor info
    SELECT c.*, cl.nome as cliente_nome
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    WHERE c.id = p_contrato_id;

    -- Only process recurring active contracts
    IF contract_record.tipo_contrato != 'recorrente' OR contract_record.status != 'ativo' THEN
        RETURN;
    END IF;

    -- Determine the actual salesperson - ALWAYS use vendedor_id if it exists, otherwise user_id
    actual_vendedor_id := COALESCE(contract_record.vendedor_id, contract_record.user_id);
    
    -- Get vendedor info and commission percentage from the actual vendedor
    SELECT name, role, COALESCE(percentual_comissao_contrato, percentual_comissao, 5.00)
    INTO vendedor_nome, vendedor_role, vendedor_percentual
    FROM public.profiles
    WHERE user_id = actual_vendedor_id;

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

    -- Only create commission if there's a salesperson
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_comissao_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, contract_record.user_id), 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

    comissao_valor := contract_record.valor * (vendedor_percentual / 100);

    -- Calculate date range (only future months)
    current_month := GREATEST(
        DATE_TRUNC('month', contract_record.data_inicio), 
        DATE_TRUNC('month', CURRENT_DATE)
    );
    end_month := COALESCE(contract_record.data_fim, (CURRENT_DATE + INTERVAL '2 years'))::date;
    due_day := COALESCE(contract_record.dia_vencimento, 5); -- Default to 5th day if not set

    -- Generate monthly receivables and payables (only for future months)
    WHILE current_month <= end_month LOOP
        -- Calculate due date for this month using the correct day
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
                due_date, -- Use the calculated due date, not first day of month
                due_date,
                'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
                contract_record.valor,
                categoria_venda_id,
                p_contrato_id,
                'pendente'
            );
        END IF;

        -- Create commission payable if salesperson and doesn't exist
        IF admin_user_id IS NOT NULL THEN
            -- Check if commission already exists for this month and contract
            SELECT COUNT(*) INTO existing_payable_count
            FROM public.comissoes c
            WHERE c.contrato_id = p_contrato_id
            AND c.mes_referencia >= current_month
            AND c.mes_referencia < (current_month + INTERVAL '1 month');

            IF existing_payable_count = 0 THEN
                -- Create commission record first - ALWAYS use the actual vendedor from contract
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
                    actual_vendedor_id, -- CRITICAL: Always use the contract's vendedor_id
                    p_contrato_id,
                    contract_record.valor,
                    vendedor_percentual,
                    comissao_valor,
                    current_month,
                    'pendente',
                    'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
                ) RETURNING id INTO comissao_id_var;

                -- Create the financial transaction with correct due date
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
                    due_date, -- Use the same due date as the receivable
                    due_date,
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text),
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

-- Recreate triggers
CREATE TRIGGER create_sale_financial_transactions
    AFTER INSERT OR UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.create_sale_financial_transactions();