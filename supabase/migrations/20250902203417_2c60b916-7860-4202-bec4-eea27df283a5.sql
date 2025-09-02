-- Update the commission creation functions to not create commissions for admin-created contracts

-- Update the trigger function for sales to exclude admin creators
CREATE OR REPLACE FUNCTION public.calculate_commission_and_expense_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
                NEW.data_venda,
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
                admin_user_id,
                'despesa',
                NEW.data_venda,
                (NEW.data_venda + INTERVAL '30 days')::date,
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
$$;

-- Update the contract creation function to exclude admin creators
CREATE OR REPLACE FUNCTION public.create_financial_transactions_from_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    cliente_nome text;
    vendedor_nome text;
    vendedor_role text;
    creator_role text;
    vendedor_percentual numeric;
    comissao_valor numeric;
    admin_user_id uuid;
    comissao_id_var uuid;
    due_date date;
    transaction_date date;
    target_vendedor_id uuid;
    current_month date;
    end_month date;
    due_day integer;
    loop_count integer := 0;
    max_iterations integer := 60;
BEGIN
    -- Get contract creator's role
    SELECT role INTO creator_role
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Get client name
    SELECT nome INTO cliente_nome
    FROM public.clientes
    WHERE id = NEW.cliente_id;
    
    -- Get due day for calculations
    due_day := COALESCE(NEW.dia_vencimento, 1);
    
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
    
    -- Get first admin for ALL commission-related transactions
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Determine which vendedor should get the commission (ONLY if creator is NOT admin)
    IF creator_role != 'admin' THEN
        IF NEW.vendedor_id IS NOT NULL THEN
            target_vendedor_id := NEW.vendedor_id;
        ELSE
            -- Check if contract creator is a vendedor
            SELECT role INTO vendedor_role
            FROM public.profiles
            WHERE user_id = NEW.user_id;
            
            IF vendedor_role = 'vendedor' THEN
                target_vendedor_id := NEW.user_id;
            END IF;
        END IF;
        
        -- Get vendedor info if we have a target
        IF target_vendedor_id IS NOT NULL THEN
            SELECT name, role, percentual_comissao_contrato 
            INTO vendedor_nome, vendedor_role, vendedor_percentual
            FROM public.profiles
            WHERE user_id = target_vendedor_id;
            
            -- Only create commission if user is actually a vendedor
            IF vendedor_role = 'vendedor' THEN
                -- Default to 1% if no percentage is set for contracts
                IF vendedor_percentual IS NULL THEN
                    vendedor_percentual := 1.00;
                END IF;
                
                -- Calculate commission value
                comissao_valor := NEW.valor * (vendedor_percentual / 100);
                
                -- Find or create commission category
                SELECT id INTO categoria_comissao_id
                FROM public.categorias_financeiras
                WHERE nome = 'Comissões de Vendas'
                AND tipo = 'despesa'
                ORDER BY created_at ASC
                LIMIT 1;
                
                IF categoria_comissao_id IS NULL THEN
                    IF admin_user_id IS NULL THEN
                        admin_user_id := NEW.user_id;
                    END IF;
                    
                    INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                    VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
                    RETURNING id INTO categoria_comissao_id;
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- For unique contracts, create single receivable and commission (if applicable)
    IF NEW.tipo_contrato = 'unico' THEN
        transaction_date := NEW.data_inicio;
        due_date := NEW.data_inicio + (due_day - 1);
        
        -- Ensure due date doesn't exceed month end
        IF due_date > (DATE_TRUNC('month', NEW.data_inicio) + INTERVAL '1 month - 1 day')::date THEN
            due_date := (DATE_TRUNC('month', NEW.data_inicio) + INTERVAL '1 month - 1 day')::date;
        END IF;
        
        -- Create single receivable
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
            transaction_date,
            due_date,
            'Receita do contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente'),
            NEW.valor,
            categoria_venda_id,
            'pendente'
        );
        
        -- Create single commission if vendedor exists AND creator is not admin
        IF target_vendedor_id IS NOT NULL AND vendedor_role = 'vendedor' AND creator_role != 'admin' THEN
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
                target_vendedor_id,
                NEW.id,
                NEW.valor,
                vendedor_percentual,
                comissao_valor,
                DATE_TRUNC('month', NEW.data_inicio)::date,
                'pendente',
                'Comissão do contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente')
            ) RETURNING id INTO comissao_id_var;
            
            -- Create commission payable (ALWAYS assigned to admin)
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
                    transaction_date,
                    (DATE_TRUNC('month', NEW.data_inicio) + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(cliente_nome, 'Cliente'),
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
$$;

-- Create function to clean up orphaned commission payables automatically
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_commission_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- When a contract is deleted, remove its related commission transactions
    DELETE FROM public.transacoes_financeiras
    WHERE tipo = 'despesa'
    AND comissao_id IN (
        SELECT id FROM public.comissoes 
        WHERE contrato_id = OLD.id
    );
    
    -- Remove the commissions themselves
    DELETE FROM public.comissoes
    WHERE contrato_id = OLD.id;
    
    RETURN OLD;
END;
$$;

-- Create trigger to automatically clean up orphaned commissions when contracts are deleted
DROP TRIGGER IF EXISTS cleanup_orphaned_commissions_on_contract_delete ON public.contratos;
CREATE TRIGGER cleanup_orphaned_commissions_on_contract_delete
    BEFORE DELETE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_orphaned_commission_transactions();