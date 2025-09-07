-- Update the create_sale_financial_transactions function to handle installments correctly
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
    installment_value numeric;
    due_date date;
    i integer;
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
        
        -- Create revenue transactions - handle installments correctly
        IF NEW.forma_pagamento = 'parcelado' AND NEW.parcelas > 1 THEN
            -- Create multiple installment transactions
            installment_value := NEW.valor / NEW.parcelas;
            
            FOR i IN 1..NEW.parcelas LOOP
                -- Calculate due date for each installment (monthly intervals)
                due_date := NEW.data_venda + (i - 1) * INTERVAL '1 month';
                
                INSERT INTO public.transacoes_financeiras (
                    user_id,
                    tipo,
                    data_transacao,
                    data_vencimento,
                    descricao,
                    valor,
                    categoria_id,
                    venda_id,
                    status,
                    forma_pagamento,
                    parcela_atual,
                    parcelas
                ) VALUES (
                    NEW.user_id,
                    'receita',
                    due_date,
                    due_date,
                    COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || ' - ' || 
                    COALESCE(cliente_nome, 'Cliente não encontrado') || ' (Parcela ' || i || '/' || NEW.parcelas || ')',
                    installment_value,
                    categoria_venda_id,
                    NEW.id,
                    CASE WHEN i = 1 THEN 'confirmada' ELSE 'pendente' END, -- First installment confirmed, others pending
                    NEW.forma_pagamento,
                    i,
                    NEW.parcelas
                );
            END LOOP;
        ELSE
            -- Create single transaction for cash sales
            INSERT INTO public.transacoes_financeiras (
                user_id,
                tipo,
                data_transacao,
                descricao,
                valor,
                categoria_id,
                venda_id,
                status,
                forma_pagamento,
                parcela_atual,
                parcelas
            ) VALUES (
                NEW.user_id,
                'receita',
                NEW.data_venda,
                COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
                NEW.valor,
                categoria_venda_id,
                NEW.id,
                'confirmada',
                COALESCE(NEW.forma_pagamento, 'a_vista'),
                1,
                1
            );
        END IF;
        
        -- Create commission only if user is 'vendedor' AND has commission percentage > 0
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
                    status,
                    forma_pagamento
                ) VALUES (
                    admin_user_id,
                    'despesa',
                    NEW.data_venda,
                    (DATE_TRUNC('month', NEW.data_venda) + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)),
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente',
                    'a_vista'
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Clean up existing incorrect transactions for parcelado sales
-- Delete transactions with total value for parcelado sales (these should be split into installments)
DELETE FROM public.transacoes_financeiras 
WHERE id IN (
    SELECT tf.id
    FROM public.transacoes_financeiras tf
    INNER JOIN public.vendas v ON v.id = tf.venda_id
    WHERE tf.tipo = 'receita'
    AND v.forma_pagamento = 'parcelado'
    AND v.parcelas > 1
    AND tf.valor = v.valor  -- Full value transaction (incorrect for parcelado)
    AND tf.parcelas = 1     -- Single installment flag (incorrect for parcelado)
);