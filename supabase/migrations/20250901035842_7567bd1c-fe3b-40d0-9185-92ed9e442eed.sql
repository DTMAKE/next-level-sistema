-- Fix trigger to only create commissions for salespeople, not admins
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
    mes_referencia_date date;
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
            
            -- Calculate mes_referencia (first day of the sale month)
            mes_referencia_date := DATE_TRUNC('month', NEW.data_venda)::date;
            
            -- Insert commission record and get the ID (still linked to the seller)
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
                mes_referencia_date,
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
            
            -- Create ONLY ONE financial transaction for the commission expense
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
                mes_referencia_date,
                (mes_referencia_date + INTERVAL '1 month - 1 day')::date,
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