-- 1. Primeiro, limpar comissões existentes de administradores
DELETE FROM public.transacoes_financeiras 
WHERE comissao_id IN (
    SELECT c.id 
    FROM public.comissoes c
    JOIN public.profiles p ON p.user_id = c.vendedor_id
    WHERE p.role = 'admin'
);

DELETE FROM public.comissoes 
WHERE vendedor_id IN (
    SELECT user_id 
    FROM public.profiles 
    WHERE role = 'admin'
);

-- 2. Zerar percentuais de comissão para administradores
UPDATE public.profiles 
SET 
    percentual_comissao = 0,
    percentual_comissao_contrato = 0,
    updated_at = now()
WHERE role = 'admin';

-- 3. Atualizar função create_sale_financial_transactions para não criar comissão para admins
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
        
        -- CORREÇÃO: Create commission only if user is 'vendedor' AND has commission percentage > 0
        IF vendedor_role = 'vendedor' AND vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 THEN
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
                actual_vendedor_id,
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

-- 4. Atualizar função generate_contract_future_accounts para não criar comissão para admins
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

    -- CRITICAL FIX: Use vendedor_id from contract if exists, otherwise user_id
    actual_vendedor_id := COALESCE(contract_record.vendedor_id, contract_record.user_id);
    
    -- Get vendedor info and commission percentage from the actual vendedor
    SELECT name, role, COALESCE(percentual_comissao_contrato, percentual_comissao, 0)
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
    due_day := COALESCE(contract_record.dia_vencimento, 5);

    -- Generate monthly receivables and payables (only for future months)
    WHILE current_month <= end_month LOOP
        due_date := DATE_TRUNC('month', current_month)::date + (due_day - 1);
        
        IF due_date > (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date THEN
            due_date := (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date;
        END IF;

        -- Check if receivable already exists
        SELECT COUNT(*) INTO existing_receivable_count
        FROM public.transacoes_financeiras
        WHERE tipo = 'receita'
        AND contrato_id = p_contrato_id
        AND data_transacao >= current_month
        AND data_transacao < (current_month + INTERVAL '1 month');

        -- Create receivable only if it doesn't exist
        IF existing_receivable_count = 0 THEN
            INSERT INTO public.transacoes_financeiras (
                user_id, tipo, data_transacao, data_vencimento, descricao, valor,
                categoria_id, contrato_id, status
            ) VALUES (
                contract_record.user_id, 'receita', due_date, due_date,
                'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
                contract_record.valor, categoria_venda_id, p_contrato_id, 'pendente'
            );
        END IF;

        -- CORREÇÃO: Create commission payable only if vendedor_role = 'vendedor' AND vendedor_percentual > 0
        IF admin_user_id IS NOT NULL AND vendedor_role = 'vendedor' AND vendedor_percentual > 0 THEN
            SELECT COUNT(*) INTO existing_payable_count
            FROM public.comissoes c
            WHERE c.contrato_id = p_contrato_id
            AND c.mes_referencia >= current_month
            AND c.mes_referencia < (current_month + INTERVAL '1 month');

            IF existing_payable_count = 0 THEN
                -- CRITICAL: Create commission with correct vendedor_id
                INSERT INTO public.comissoes (
                    user_id, vendedor_id, contrato_id, valor_venda, percentual,
                    valor_comissao, mes_referencia, status, observacoes
                ) VALUES (
                    contract_record.user_id, actual_vendedor_id, p_contrato_id,
                    contract_record.valor, vendedor_percentual, comissao_valor,
                    current_month, 'pendente',
                    'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
                ) RETURNING id INTO comissao_id_var;

                -- Create financial transaction with correct vendedor name
                INSERT INTO public.transacoes_financeiras (
                    user_id, tipo, data_transacao, data_vencimento, descricao, valor,
                    categoria_id, comissao_id, status
                ) VALUES (
                    admin_user_id, 'despesa', due_date, due_date,
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text),
                    comissao_valor, categoria_comissao_id, comissao_id_var, 'pendente'
                );
            END IF;
        END IF;

        current_month := current_month + INTERVAL '1 month';
    END LOOP;
END;
$function$;