-- Fix the function that creates financial transactions from sales to handle installments properly

CREATE OR REPLACE FUNCTION public.create_financial_transaction_from_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    categoria_venda_id uuid;
    cliente_nome text;
    admin_user_id uuid;
    valorParcela numeric;
    i integer;
    data_parcela date;
BEGIN
    -- Get the client name
    SELECT nome INTO cliente_nome
    FROM public.clientes
    WHERE id = NEW.cliente_id;
    
    -- Find the global "Venda" category (first one created)
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If no global "Venda" category exists, create one with first admin as owner
    IF categoria_venda_id IS NULL THEN
        -- Get first admin user
        SELECT user_id INTO admin_user_id
        FROM public.profiles
        WHERE role = 'admin'
        LIMIT 1;
        
        -- Fallback to current user if no admin exists
        IF admin_user_id IS NULL THEN
            admin_user_id := NEW.user_id;
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;
    
    -- Check if it's a cash sale or installment sale
    IF NEW.forma_pagamento = 'a_vista' OR NEW.forma_pagamento IS NULL OR NEW.parcelas <= 1 THEN
        -- Create single transaction for cash sales
        INSERT INTO public.transacoes_financeiras (
            user_id,
            tipo,
            data_transacao,
            descricao,
            valor,
            categoria_id,
            venda_id,
            forma_pagamento,
            parcelas,
            parcela_atual
        ) VALUES (
            NEW.user_id,
            'receita',
            NEW.data_venda,
            'Receita da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            NEW.valor,
            categoria_venda_id,
            NEW.id,
            'a_vista',
            1,
            1
        );
    ELSE
        -- Create multiple transactions for installment sales
        valorParcela := NEW.valor / NEW.parcelas;
        
        FOR i IN 1..NEW.parcelas LOOP
            -- Calculate the date for each installment (spread across months)
            data_parcela := NEW.data_venda + (i - 1) * INTERVAL '1 month';
            
            INSERT INTO public.transacoes_financeiras (
                user_id,
                tipo,
                data_transacao,
                data_vencimento,
                descricao,
                valor,
                categoria_id,
                venda_id,
                forma_pagamento,
                parcelas,
                parcela_atual,
                status
            ) VALUES (
                NEW.user_id,
                'receita',
                data_parcela,
                data_parcela,
                'Receita da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado') || ' (' || i || '/' || NEW.parcelas || ')',
                valorParcela,
                categoria_venda_id,
                NEW.id,
                'parcelado',
                NEW.parcelas,
                i,
                'pendente'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;