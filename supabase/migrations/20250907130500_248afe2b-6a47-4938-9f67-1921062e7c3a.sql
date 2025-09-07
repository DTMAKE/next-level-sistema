-- Fix commission calculation for installment sales
-- The function was creating one commission for the total sale value
-- Now it will create proportional commissions for each installment

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
    installment_commission_value numeric;
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
        
        -- Find or create commission category if needed
        IF vendedor_role = 'vendedor' AND vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 THEN
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
        END IF;
        
        -- Create revenue transactions and commissions - handle installments correctly
        IF NEW.forma_pagamento = 'parcelado' AND NEW.parcelas > 1 THEN
            -- Create multiple installment transactions and commissions
            installment_value := NEW.valor / NEW.parcelas;
            
            -- Calculate commission per installment
            IF vendedor_role = 'vendedor' AND vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 THEN
                installment_commission_value := installment_value * (vendedor_percentual / 100);
            END IF;
            
            FOR i IN 1..NEW.parcelas LOOP
                -- Calculate due date for each installment (monthly intervals)
                due_date := NEW.data_venda + (i - 1) * INTERVAL '1 month';
                mes_referencia_date := DATE_TRUNC('month', due_date)::date;
                
                -- Create revenue transaction for this installment
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
                
                -- Create commission for this installment if applicable
                IF vendedor_role = 'vendedor' AND vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 AND admin_user_id IS NOT NULL THEN
                    -- Create commission record for this installment
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
                        installment_value, -- Commission based on installment value
                        vendedor_percentual,
                        installment_commission_value,
                        mes_referencia_date,
                        'pendente',
                        'Comissão de ' || COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || 
                        ' (Parcela ' || i || '/' || NEW.parcelas || ')'
                    ) RETURNING id INTO comissao_id_var;
                    
                    -- Create commission payable for this installment
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
                        due_date,
                        (DATE_TRUNC('month', due_date) + INTERVAL '1 month - 1 day')::date,
                        'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || 
                        COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || 
                        ' (Parcela ' || i || '/' || NEW.parcelas || ')',
                        installment_commission_value,
                        categoria_comissao_id,
                        comissao_id_var,
                        'pendente',
                        'a_vista'
                    );
                END IF;
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
            
            -- Create single commission for cash sales
            IF vendedor_role = 'vendedor' AND vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 THEN
                -- Calculate commission
                comissao_valor := NEW.valor * (vendedor_percentual / 100);
                mes_referencia_date := DATE_TRUNC('month', NEW.data_venda)::date;
                
                -- Create commission record
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
                
                -- Create commission payable
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
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Clean up existing incorrect commissions for installment sales
-- Delete commission-related transactions first
DELETE FROM public.transacoes_financeiras 
WHERE comissao_id IN (
    SELECT c.id 
    FROM public.comissoes c
    JOIN public.vendas v ON v.id = c.venda_id
    WHERE v.forma_pagamento = 'parcelado' 
    AND v.parcelas > 1
    AND v.status = 'fechada'
);

-- Delete the incorrect commissions
DELETE FROM public.comissoes 
WHERE venda_id IN (
    SELECT id FROM public.vendas 
    WHERE forma_pagamento = 'parcelado' 
    AND parcelas > 1
    AND status = 'fechada'
);

-- Log the cleanup
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'CLEANUP_INSTALLMENT_COMMISSIONS',
    'comissoes',
    'bulk_operation',
    jsonb_build_object(
        'message', 'Cleaned up incorrect single commissions for installment sales',
        'cleanup_timestamp', now()
    )
);