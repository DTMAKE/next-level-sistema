-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_financial_transactions_on_contract_insert ON public.contratos;

-- Create trigger function to generate financial transactions when a contract is created
CREATE OR REPLACE FUNCTION public.create_financial_transactions_from_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    cliente_nome text;
    vendedor_nome text;
    vendedor_role text;
    vendedor_percentual numeric;
    comissao_valor numeric;
    admin_user_id uuid;
    comissao_id_var uuid;
    due_date date;
BEGIN
    -- Get client name
    SELECT nome INTO cliente_nome
    FROM public.clientes
    WHERE id = NEW.cliente_id;
    
    -- Get seller info
    SELECT name, role, percentual_comissao 
    INTO vendedor_nome, vendedor_role, vendedor_percentual
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Find or create "Venda" category for receivables
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF categoria_venda_id IS NULL THEN
        -- Get first admin user
        SELECT user_id INTO admin_user_id
        FROM public.profiles
        WHERE role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF admin_user_id IS NULL THEN
            admin_user_id := NEW.user_id;
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;
    
    -- Calculate due date (use dia_vencimento or default to contract start date)
    due_date := NEW.data_inicio + (COALESCE(NEW.dia_vencimento, 1) - 1);
    
    -- For unique contracts, create immediate receivable
    IF NEW.tipo_contrato = 'unico' THEN
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
            NEW.user_id,
            'receita',
            NEW.data_inicio,
            due_date,
            'Receita do contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente'),
            NEW.valor,
            categoria_venda_id,
            'pendente'
        );
    ELSE
        -- For recurring contracts, create first month receivable
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
            NEW.user_id,
            'receita',
            NEW.data_inicio,
            due_date,
            'Receita recorrente - Contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente'),
            NEW.valor,
            categoria_venda_id,
            'pendente'
        );
    END IF;
    
    -- Only create commission if user is a salesperson
    IF vendedor_role = 'vendedor' THEN
        -- Default to 5% if no percentage is set
        IF vendedor_percentual IS NULL THEN
            vendedor_percentual := 5.00;
        END IF;
        
        -- Calculate commission value
        IF NEW.tipo_contrato = 'unico' THEN
            comissao_valor := NEW.valor * (vendedor_percentual / 100);
        ELSE
            -- For recurring contracts, commission is based on monthly value
            comissao_valor := NEW.valor * (vendedor_percentual / 100);
        END IF;
        
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
            NEW.user_id,
            NEW.user_id,
            NEW.id,
            NEW.valor,
            vendedor_percentual,
            comissao_valor,
            DATE_TRUNC('month', NEW.data_inicio)::date,
            'pendente',
            'Comissão do contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente')
        ) RETURNING id INTO comissao_id_var;
        
        -- Find or create commission category
        SELECT id INTO categoria_comissao_id
        FROM public.categorias_financeiras
        WHERE nome = 'Comissões de Vendas'
        AND tipo = 'despesa'
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF categoria_comissao_id IS NULL THEN
            SELECT user_id INTO admin_user_id
            FROM public.profiles
            WHERE role = 'admin'
            ORDER BY created_at ASC
            LIMIT 1;
            
            IF admin_user_id IS NULL THEN
                admin_user_id := NEW.user_id;
            END IF;
            
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
            RETURNING id INTO categoria_comissao_id;
        END IF;
        
        -- Get first admin for commission payable
        SELECT user_id INTO admin_user_id
        FROM public.profiles
        WHERE role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF admin_user_id IS NULL THEN
            admin_user_id := NEW.user_id;
        END IF;
        
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
            NEW.data_inicio,
            due_date,
            'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text),
            comissao_valor,
            categoria_comissao_id,
            comissao_id_var,
            'pendente'
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for contract financial transactions
CREATE TRIGGER create_financial_transactions_on_contract_insert
    AFTER INSERT ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.create_financial_transactions_from_contract();