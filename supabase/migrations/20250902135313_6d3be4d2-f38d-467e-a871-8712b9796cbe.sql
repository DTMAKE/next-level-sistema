-- Fix the trigger function to use correct sale date instead of month start date
CREATE OR REPLACE FUNCTION public.create_financial_transaction_from_closed_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    categoria_venda_id uuid;
    cliente_nome text;
    admin_user_id uuid;
BEGIN
    -- Só processar se a venda está sendo marcada como 'fechada'
    IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
        -- Buscar nome do cliente
        SELECT nome INTO cliente_nome
        FROM public.clientes
        WHERE id = NEW.cliente_id;
        
        -- Buscar categoria "Venda" global (primeira criada)
        SELECT id INTO categoria_venda_id
        FROM public.categorias_financeiras
        WHERE nome = 'Venda' 
        AND tipo = 'receita'
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Se não existe categoria "Venda" global, criar uma
        IF categoria_venda_id IS NULL THEN
            -- Buscar primeiro admin
            SELECT user_id INTO admin_user_id
            FROM public.profiles
            WHERE role = 'admin'
            LIMIT 1;
            
            -- Se não há admin, usar o usuário atual
            IF admin_user_id IS NULL THEN
                admin_user_id := NEW.user_id;
            END IF;
            
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
            RETURNING id INTO categoria_venda_id;
        END IF;
        
        -- Criar transação financeira usando a data da venda (NEW.data_venda)
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
            NEW.data_venda,  -- Usar a data da venda, não DATE_TRUNC
            'Receita da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            NEW.valor,
            categoria_venda_id,
            NEW.id,
            'confirmada'
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix the commission trigger to use correct sale date
CREATE OR REPLACE FUNCTION public.calculate_commission_and_expense_from_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    vendedor_percentual numeric;
    comissao_valor numeric;
    cliente_nome text;
    vendedor_nome text;
    vendedor_role text;
    categoria_comissao_id uuid;
    comissao_id_var uuid;
    admin_user_id uuid;
BEGIN
    -- Only process if sale is being marked as 'fechada'
    IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
        -- Get the seller's info: commission percentage, name, and role
        SELECT percentual_comissao, name, role INTO vendedor_percentual, vendedor_nome, vendedor_role
        FROM public.profiles
        WHERE user_id = NEW.user_id;
        
        -- ONLY CREATE COMMISSION IF THE USER IS A SALESPERSON (NOT ADMIN)
        IF vendedor_role = 'vendedor' THEN
            -- Default to 5% if no percentage is set
            IF vendedor_percentual IS NULL THEN
                vendedor_percentual := 5.00;
            END IF;
            
            -- Calculate commission value
            comissao_valor := NEW.valor * (vendedor_percentual / 100);
            
            -- Get client name for description
            SELECT nome INTO cliente_nome
            FROM public.clientes
            WHERE id = NEW.cliente_id;
            
            -- Insert commission record using sale date
            INSERT INTO public.comissoes (
                user_id,
                vendedor_id,
                venda_id,
                valor_venda,
                percentual,
                valor_comissao,
                mes_referencia,  -- Use sale date for reference month
                status,
                observacoes
            ) VALUES (
                NEW.user_id,
                NEW.user_id,
                NEW.id,
                NEW.valor,
                vendedor_percentual,
                comissao_valor,
                NEW.data_venda,  -- Use sale date, not DATE_TRUNC
                'pendente',
                'Comissão da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado')
            ) RETURNING id INTO comissao_id_var;
            
            -- Find the global "Comissões de Vendas" category (first one created)
            SELECT id INTO categoria_comissao_id
            FROM public.categorias_financeiras
            WHERE nome = 'Comissões de Vendas'
            AND tipo = 'despesa'
            ORDER BY created_at ASC
            LIMIT 1;
            
            -- If no global commission category exists, create one
            IF categoria_comissao_id IS NULL THEN
                -- Get first admin user
                SELECT user_id INTO admin_user_id
                FROM public.profiles
                WHERE role = 'admin'
                ORDER BY created_at ASC
                LIMIT 1;
                
                -- Fallback to current user if no admin exists
                IF admin_user_id IS NULL THEN
                    admin_user_id := NEW.user_id;
                END IF;
                
                INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
                RETURNING id INTO categoria_comissao_id;
            END IF;
            
            -- Get the first admin user for the financial transaction
            SELECT user_id INTO admin_user_id
            FROM public.profiles
            WHERE role = 'admin'
            ORDER BY created_at ASC
            LIMIT 1;
            
            -- Fallback to current user if no admin exists
            IF admin_user_id IS NULL THEN
                admin_user_id := NEW.user_id;
            END IF;
            
            -- Create financial transaction for commission expense using sale date
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
                admin_user_id, -- Use only the first admin
                'despesa',
                NEW.data_venda,  -- Use sale date, not DATE_TRUNC
                (NEW.data_venda + INTERVAL '30 days')::date,  -- Due date 30 days after sale
                'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
                comissao_valor,
                categoria_comissao_id,
                comissao_id_var,
                'pendente'
            );
        END IF;
        -- If user is admin, no commission is created, only the sale revenue transaction (handled by another trigger)
    END IF;
    
    RETURN NEW;
END;
$function$;