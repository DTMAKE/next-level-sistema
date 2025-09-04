-- Fix commission due date to match sale date in create_sale_financial_transactions function

CREATE OR REPLACE FUNCTION create_sale_financial_transactions()
RETURNS TRIGGER AS $$
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
BEGIN
    -- Only process if sale is being marked as 'fechada' or inserted as 'fechada'
    IF NEW.status = 'fechada' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'fechada') THEN
        
        -- Get client name
        SELECT nome INTO cliente_nome
        FROM public.clientes
        WHERE id = NEW.cliente_id;
        
        -- Get seller info
        SELECT percentual_comissao, name, role 
        INTO vendedor_percentual, vendedor_nome, vendedor_role
        FROM public.profiles
        WHERE user_id = NEW.user_id;
        
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
        
        -- Create revenue transaction using sale number and client name
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
            NEW.data_venda,
            COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || ' - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            NEW.valor,
            categoria_venda_id,
            NEW.id,
            'confirmada'
        );
        
        -- Create commission only if user has a commission percentage set
        IF vendedor_percentual IS NOT NULL AND vendedor_percentual > 0 THEN
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
                NEW.user_id,
                NEW.id,
                NEW.valor,
                vendedor_percentual,
                comissao_valor,
                mes_referencia_date,
                'pendente',
                'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || ' (' || COALESCE(cliente_nome, 'Cliente') || ')'
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
            
            -- Create commission expense transaction - USE SALE DATE for due date, same as receivable
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
                    NEW.data_venda,
                    NEW.data_venda, -- FIXED: Use sale date instead of end of month
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(NEW.numero_venda, 'VENDA-' || SUBSTRING(NEW.id::text FROM 1 FOR 8)) || ' (' || COALESCE(cliente_nome, 'Cliente') || ')',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;