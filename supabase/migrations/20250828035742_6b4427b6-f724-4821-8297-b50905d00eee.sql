-- Create the sync_commissions_to_financial function that's being called by the frontend
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
BEGIN
    -- Find or create the "Comissões de Vendas" category
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE user_id = p_user_id 
    AND tipo = 'despesa' 
    AND nome ILIKE '%comiss%'
    LIMIT 1;
    
    -- If no commission category exists for this user, create one
    IF categoria_comissao_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (p_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
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
        -- Create financial transaction for each commission using mes_referencia
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
            p_user_id,
            'despesa',
            commission_record.mes_referencia, -- Use mes_referencia as transaction date
            (commission_record.mes_referencia + INTERVAL '1 month - 1 day')::date, -- Last day of reference month
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
END;
$function$;

-- Update the trigger to use mes_referencia for commission expense transactions
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
        
        -- Insert commission record and get the ID
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
        
        -- Find or create the "Comissões de Vendas" category
        SELECT id INTO categoria_comissao_id
        FROM public.categorias_financeiras
        WHERE user_id = NEW.user_id 
        AND tipo = 'despesa' 
        AND nome ILIKE '%comiss%'
        LIMIT 1;
        
        -- If no commission category exists for this user, create one
        IF categoria_comissao_id IS NULL THEN
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (NEW.user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
            RETURNING id INTO categoria_comissao_id;
        END IF;
        
        -- Create the financial transaction for the commission expense using mes_referencia
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
            NEW.user_id,
            'despesa',
            mes_referencia_date, -- Use mes_referencia as transaction date
            (mes_referencia_date + INTERVAL '1 month - 1 day')::date, -- Last day of reference month
            'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            comissao_valor,
            categoria_comissao_id,
            comissao_id_var,
            'pendente'
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix existing commission transactions to use correct dates
UPDATE public.transacoes_financeiras 
SET 
    data_transacao = c.mes_referencia,
    data_vencimento = (c.mes_referencia + INTERVAL '1 month - 1 day')::date
FROM public.comissoes c
WHERE transacoes_financeiras.comissao_id = c.id
AND transacoes_financeiras.tipo = 'despesa'
AND transacoes_financeiras.data_transacao != c.mes_referencia;