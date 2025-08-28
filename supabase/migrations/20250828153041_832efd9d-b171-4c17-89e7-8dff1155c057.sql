-- First, let's create an updated version of the commission calculation function
-- that creates financial transactions for admins instead of the seller

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
    categoria_comissao_id uuid;
    comissao_id_var uuid;
    mes_referencia_date date;
    admin_record record;
BEGIN
    -- Only process if sale is being marked as 'fechada'
    IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
        -- Get the seller's commission percentage from profiles
        SELECT percentual_comissao, name INTO vendedor_percentual, vendedor_nome
        FROM public.profiles
        WHERE user_id = NEW.user_id;
        
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
        
        -- Now create financial transactions for each admin user
        FOR admin_record IN
            SELECT user_id 
            FROM public.profiles 
            WHERE role = 'admin'
        LOOP
            -- Find or create the "Comissões de Vendas" category for each admin
            SELECT id INTO categoria_comissao_id
            FROM public.categorias_financeiras
            WHERE user_id = admin_record.user_id
            AND tipo = 'despesa' 
            AND nome ILIKE '%comiss%'
            LIMIT 1;
            
            -- If no commission category exists for this admin, create one
            IF categoria_comissao_id IS NULL THEN
                INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                VALUES (admin_record.user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
                RETURNING id INTO categoria_comissao_id;
            END IF;
            
            -- Create the financial transaction for the commission expense for each admin
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
                admin_record.user_id, -- Create transaction for admin, not seller
                'despesa',
                mes_referencia_date,
                (mes_referencia_date + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
                comissao_valor,
                categoria_comissao_id,
                comissao_id_var,
                'pendente'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Update the sync_commissions_to_financial function as well
CREATE OR REPLACE FUNCTION public.sync_commissions_to_financial(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_comissao_id uuid;
    commission_record record;
    vendedor_nome text;
    cliente_nome text;
    admin_record record;
BEGIN
    -- Process each commission that doesn't have a financial transaction
    FOR commission_record IN
        SELECT c.*, v.data_venda, cl.nome as cliente_nome, p.name as vendedor_nome
        FROM public.comissoes c
        LEFT JOIN public.vendas v ON v.id = c.venda_id
        LEFT JOIN public.clientes cl ON cl.id = v.cliente_id
        LEFT JOIN public.profiles p ON p.user_id = c.vendedor_id
        WHERE c.user_id = p_user_id
        AND NOT EXISTS (
            SELECT 1 FROM public.transacoes_financeiras tf 
            WHERE tf.comissao_id = c.id
        )
    LOOP
        -- Create financial transactions for each admin user
        FOR admin_record IN
            SELECT user_id 
            FROM public.profiles 
            WHERE role = 'admin'
        LOOP
            -- Find or create the "Comissões de Vendas" category for each admin
            SELECT id INTO categoria_comissao_id
            FROM public.categorias_financeiras
            WHERE user_id = admin_record.user_id
            AND tipo = 'despesa' 
            AND nome ILIKE '%comiss%'
            LIMIT 1;
            
            -- If no commission category exists for this admin, create one
            IF categoria_comissao_id IS NULL THEN
                INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                VALUES (admin_record.user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
                RETURNING id INTO categoria_comissao_id;
            END IF;
            
            -- Create financial transaction for each admin using mes_referencia
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
                admin_record.user_id, -- Create transaction for admin, not seller
                'despesa',
                commission_record.mes_referencia,
                (commission_record.mes_referencia + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(commission_record.vendedor_nome, 'Vendedor') || ' - ' || COALESCE(commission_record.cliente_nome, 'Cliente'),
                commission_record.valor_comissao,
                categoria_comissao_id,
                commission_record.id,
                CASE 
                    WHEN commission_record.status = 'paga' THEN 'confirmada'
                    ELSE 'pendente'
                END
            );
        END LOOP;
    END LOOP;
END;
$function$;

-- Create a function to mark commission as paid and sync with financial transactions
CREATE OR REPLACE FUNCTION public.mark_commission_as_paid(p_comissao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if current user is admin
    IF get_current_user_role() != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can mark commissions as paid';
    END IF;
    
    -- Update commission status
    UPDATE public.comissoes
    SET 
        status = 'paga',
        data_pagamento = CURRENT_DATE,
        updated_at = now()
    WHERE id = p_comissao_id;
    
    -- Update all related financial transactions
    UPDATE public.transacoes_financeiras
    SET 
        status = 'confirmada',
        updated_at = now()
    WHERE comissao_id = p_comissao_id;
END;
$function$;

-- Create a function to mark financial transaction as confirmed and sync commission
CREATE OR REPLACE FUNCTION public.sync_financial_transaction_to_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- If this is a commission-related transaction being marked as confirmed
    IF NEW.comissao_id IS NOT NULL AND NEW.status = 'confirmada' AND (OLD.status IS NULL OR OLD.status != 'confirmada') THEN
        -- Update the commission status
        UPDATE public.comissoes
        SET 
            status = 'paga',
            data_pagamento = NEW.data_transacao,
            updated_at = now()
        WHERE id = NEW.comissao_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for financial transaction updates
DROP TRIGGER IF EXISTS sync_financial_transaction_to_commission_trigger ON public.transacoes_financeiras;
CREATE TRIGGER sync_financial_transaction_to_commission_trigger
    AFTER UPDATE ON public.transacoes_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_financial_transaction_to_commission();