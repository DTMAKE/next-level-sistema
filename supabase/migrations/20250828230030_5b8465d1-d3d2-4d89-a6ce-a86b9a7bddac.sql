-- First, create global categories if they don't exist
DO $$
DECLARE
    categoria_venda_global_id uuid;
    categoria_comissao_global_id uuid;
BEGIN
    -- Create or get global "Venda" category
    SELECT id INTO categoria_venda_global_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' AND tipo = 'receita' AND user_id IS NULL
    LIMIT 1;
    
    IF categoria_venda_global_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (NULL, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_global_id;
    END IF;
    
    -- Create or get global "Comissões de Vendas" category
    SELECT id INTO categoria_comissao_global_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa' AND user_id IS NULL
    LIMIT 1;
    
    IF categoria_comissao_global_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (NULL, 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_global_id;
    END IF;
END $$;

-- Update RLS policies to allow users to view global categories (user_id IS NULL)
DROP POLICY IF EXISTS "Users can view categorias based on role" ON public.categorias_financeiras;
CREATE POLICY "Users can view categorias based on role"
ON public.categorias_financeiras
FOR SELECT
USING (
    (auth.uid() = user_id) OR 
    (get_current_user_role() = 'admin'::text) OR 
    (user_id IS NULL) -- Allow viewing global categories
);

-- Recreate the create_financial_transaction_from_sale function to use global category
CREATE OR REPLACE FUNCTION public.create_financial_transaction_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_venda_id uuid;
    cliente_nome text;
BEGIN
    -- Get the client name
    SELECT nome INTO cliente_nome
    FROM public.clientes
    WHERE id = NEW.cliente_id;
    
    -- Find the global "Venda" category
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita' 
    AND user_id IS NULL
    LIMIT 1;
    
    -- If no global "Venda" category exists, create one
    IF categoria_venda_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (NULL, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;
    
    -- Create the financial transaction with client name using global category
    INSERT INTO public.transacoes_financeiras (
        user_id,
        tipo,
        data_transacao,
        descricao,
        valor,
        categoria_id,
        venda_id
    ) VALUES (
        NEW.user_id,
        'receita',
        NEW.data_venda,
        'Receita da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
        NEW.valor,
        categoria_venda_id,
        NEW.id
    );
    
    RETURN NEW;
END;
$function$;

-- Recreate the sync_commissions_to_financial function to use global category
CREATE OR REPLACE FUNCTION public.sync_commissions_to_financial(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_comissao_id uuid;
    commission_record record;
    admin_record record;
BEGIN
    -- Find the global "Comissões de Vendas" category
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas'
    AND tipo = 'despesa' 
    AND user_id IS NULL
    LIMIT 1;
    
    -- If no global commission category exists, create one
    IF categoria_comissao_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (NULL, 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

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
            -- Create financial transaction for each admin using global category
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
                admin_record.user_id,
                'despesa',
                commission_record.mes_referencia,
                (commission_record.mes_referencia + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(commission_record.vendedor_nome, 'Vendedor') || ' - ' || COALESCE(commission_record.cliente_nome, 'Cliente'),
                commission_record.valor_comissao,
                categoria_comissao_id, -- Use global category
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

-- Recreate the calculate_commission_and_expense_from_sale function to use global category
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
        
        -- Find the global "Comissões de Vendas" category
        SELECT id INTO categoria_comissao_id
        FROM public.categorias_financeiras
        WHERE nome = 'Comissões de Vendas'
        AND tipo = 'despesa' 
        AND user_id IS NULL
        LIMIT 1;
        
        -- If no global commission category exists, create one
        IF categoria_comissao_id IS NULL THEN
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (NULL, 'Comissões de Vendas', 'despesa', '#9333EA', true)
            RETURNING id INTO categoria_comissao_id;
        END IF;
        
        -- Now create financial transactions for each admin user
        FOR admin_record IN
            SELECT user_id 
            FROM public.profiles 
            WHERE role = 'admin'
        LOOP
            -- Create the financial transaction for the commission expense for each admin using global category
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
                admin_record.user_id,
                'despesa',
                mes_referencia_date,
                (mes_referencia_date + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
                comissao_valor,
                categoria_comissao_id, -- Use global category
                comissao_id_var,
                'pendente'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Clean up existing duplicate categories and update transactions to use global ones
DO $$
DECLARE
    categoria_venda_global_id uuid;
    categoria_comissao_global_id uuid;
    duplicate_record record;
BEGIN
    -- Get global category IDs
    SELECT id INTO categoria_venda_global_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' AND tipo = 'receita' AND user_id IS NULL
    LIMIT 1;
    
    SELECT id INTO categoria_comissao_global_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa' AND user_id IS NULL
    LIMIT 1;
    
    -- Update all transactions using duplicate "Venda" categories to use global one
    FOR duplicate_record IN
        SELECT id FROM public.categorias_financeiras
        WHERE nome ILIKE '%venda%' AND tipo = 'receita' AND user_id IS NOT NULL
    LOOP
        UPDATE public.transacoes_financeiras
        SET categoria_id = categoria_venda_global_id
        WHERE categoria_id = duplicate_record.id;
        
        -- Delete the duplicate category
        DELETE FROM public.categorias_financeiras WHERE id = duplicate_record.id;
    END LOOP;
    
    -- Update all transactions using duplicate "Comissões" categories to use global one
    FOR duplicate_record IN
        SELECT id FROM public.categorias_financeiras
        WHERE nome ILIKE '%comiss%' AND tipo = 'despesa' AND user_id IS NOT NULL
    LOOP
        UPDATE public.transacoes_financeiras
        SET categoria_id = categoria_comissao_global_id
        WHERE categoria_id = duplicate_record.id;
        
        -- Delete the duplicate category
        DELETE FROM public.categorias_financeiras WHERE id = duplicate_record.id;
    END LOOP;
END $$;