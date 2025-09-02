-- Function to identify and fix sales financial transaction inconsistencies
CREATE OR REPLACE FUNCTION public.fix_sales_financial_transactions()
RETURNS TABLE(
    action_type text,
    venda_id uuid,
    cliente_nome text,
    data_venda date,
    valor numeric,
    message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    admin_user_id uuid;
    sale_record record;
    receivable_record record;
    payable_record record;
    vendedor_info record;
    comissao_valor numeric;
    vendedor_percentual numeric;
    comissao_id_var uuid;
BEGIN
    -- Get first admin user
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Get or create "Venda" category
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' AND tipo = 'receita'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_venda_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, (SELECT user_id FROM public.profiles LIMIT 1)), 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    -- Get or create "Comissões de Vendas" category
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_comissao_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, (SELECT user_id FROM public.profiles LIMIT 1)), 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

    -- 1. IDENTIFY AND CREATE MISSING FINANCIAL TRANSACTIONS FOR CLOSED SALES
    FOR sale_record IN
        SELECT v.*, c.nome as cliente_nome, p.name as vendedor_nome, p.role as vendedor_role, p.percentual_comissao
        FROM public.vendas v
        LEFT JOIN public.clientes c ON c.id = v.cliente_id
        LEFT JOIN public.profiles p ON p.user_id = v.user_id
        WHERE v.status = 'fechada'
        AND NOT EXISTS (
            SELECT 1 FROM public.transacoes_financeiras tf 
            WHERE tf.venda_id = v.id AND tf.tipo = 'receita'
        )
    LOOP
        -- Create missing receivable
        INSERT INTO public.transacoes_financeiras (
            user_id, tipo, data_transacao, descricao, valor, categoria_id, venda_id, status
        ) VALUES (
            sale_record.user_id,
            'receita',
            sale_record.data_venda,
            'Receita da venda para cliente ' || COALESCE(sale_record.cliente_nome, 'Cliente não encontrado'),
            sale_record.valor,
            categoria_venda_id,
            sale_record.id,
            'confirmada'
        );

        -- Create commission if vendedor
        IF sale_record.vendedor_role = 'vendedor' THEN
            vendedor_percentual := COALESCE(sale_record.percentual_comissao, 5.00);
            comissao_valor := sale_record.valor * (vendedor_percentual / 100);

            -- Create commission record if not exists
            IF NOT EXISTS (SELECT 1 FROM public.comissoes WHERE venda_id = sale_record.id) THEN
                INSERT INTO public.comissoes (
                    user_id, vendedor_id, venda_id, valor_venda, percentual, valor_comissao,
                    mes_referencia, status, observacoes
                ) VALUES (
                    sale_record.user_id, sale_record.user_id, sale_record.id, sale_record.valor,
                    vendedor_percentual, comissao_valor, DATE_TRUNC('month', sale_record.data_venda)::date,
                    'pendente', 'Comissão da venda para cliente ' || COALESCE(sale_record.cliente_nome, 'Cliente não encontrado')
                ) RETURNING id INTO comissao_id_var;

                -- Create commission payable
                IF admin_user_id IS NOT NULL THEN
                    INSERT INTO public.transacoes_financeiras (
                        user_id, tipo, data_transacao, data_vencimento, descricao, valor,
                        categoria_id, comissao_id, status
                    ) VALUES (
                        admin_user_id, 'despesa', sale_record.data_venda,
                        (DATE_TRUNC('month', sale_record.data_venda) + INTERVAL '1 month - 1 day')::date,
                        'Comissão de ' || COALESCE(sale_record.vendedor_nome, 'Vendedor') || ' - ' || COALESCE(sale_record.cliente_nome, 'Cliente'),
                        comissao_valor, categoria_comissao_id, comissao_id_var, 'pendente'
                    );
                END IF;
            END IF;
        END IF;

        RETURN QUERY SELECT 
            'CREATED_MISSING'::text,
            sale_record.id,
            sale_record.cliente_nome,
            sale_record.data_venda,
            sale_record.valor,
            'Transações financeiras criadas para venda sem transações'::text;
    END LOOP;

    -- 2. FIX RECEIVABLES WITH INCORRECT DATES (first day of month instead of sale date)
    FOR receivable_record IN
        SELECT tf.*, v.data_venda, c.nome as cliente_nome
        FROM public.transacoes_financeiras tf
        JOIN public.vendas v ON v.id = tf.venda_id
        LEFT JOIN public.clientes c ON c.id = v.cliente_id
        WHERE tf.tipo = 'receita'
        AND tf.data_transacao != v.data_venda
        AND tf.data_transacao = DATE_TRUNC('month', v.data_venda)::date
        AND v.status = 'fechada'
    LOOP
        -- Update receivable date to match sale date
        UPDATE public.transacoes_financeiras
        SET data_transacao = receivable_record.data_venda,
            updated_at = now()
        WHERE id = receivable_record.id;

        RETURN QUERY SELECT 
            'FIXED_RECEIVABLE_DATE'::text,
            receivable_record.venda_id,
            receivable_record.cliente_nome,
            receivable_record.data_venda,
            receivable_record.valor,
            ('Data corrigida de ' || receivable_record.data_transacao || ' para ' || receivable_record.data_venda)::text;
    END LOOP;

    -- 3. FIX COMMISSION PAYABLES WITH INCORRECT DATES
    FOR payable_record IN
        SELECT tf.*, v.data_venda, c.nome as cliente_nome, p.name as vendedor_nome
        FROM public.transacoes_financeiras tf
        JOIN public.comissoes com ON com.id = tf.comissao_id
        JOIN public.vendas v ON v.id = com.venda_id
        LEFT JOIN public.clientes c ON c.id = v.cliente_id
        LEFT JOIN public.profiles p ON p.user_id = com.vendedor_id
        WHERE tf.tipo = 'despesa'
        AND tf.comissao_id IS NOT NULL
        AND tf.data_transacao != v.data_venda
        AND tf.data_transacao = DATE_TRUNC('month', v.data_venda)::date
        AND v.status = 'fechada'
    LOOP
        -- Update payable date to match sale date
        UPDATE public.transacoes_financeiras
        SET data_transacao = payable_record.data_venda,
            updated_at = now()
        WHERE id = payable_record.id;

        RETURN QUERY SELECT 
            'FIXED_PAYABLE_DATE'::text,
            payable_record.venda_id,
            payable_record.cliente_nome,
            payable_record.data_venda,
            payable_record.valor,
            ('Data de comissão corrigida de ' || payable_record.data_transacao || ' para ' || payable_record.data_venda)::text;
    END LOOP;
END;
$function$;

-- Function to get summary of financial transaction issues
CREATE OR REPLACE FUNCTION public.get_sales_financial_issues_summary()
RETURNS TABLE(
    issue_type text,
    count_issues bigint,
    description text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Missing receivables for closed sales
    RETURN QUERY 
    SELECT 
        'MISSING_RECEIVABLES'::text,
        COUNT(*)::bigint,
        'Vendas fechadas sem conta a receber'::text
    FROM public.vendas v
    WHERE v.status = 'fechada'
    AND NOT EXISTS (
        SELECT 1 FROM public.transacoes_financeiras tf 
        WHERE tf.venda_id = v.id AND tf.tipo = 'receita'
    );

    -- Wrong dates in receivables
    RETURN QUERY 
    SELECT 
        'WRONG_RECEIVABLE_DATES'::text,
        COUNT(*)::bigint,
        'Contas a receber com data incorreta (primeiro dia do mês)'::text
    FROM public.transacoes_financeiras tf
    JOIN public.vendas v ON v.id = tf.venda_id
    WHERE tf.tipo = 'receita'
    AND tf.data_transacao != v.data_venda
    AND tf.data_transacao = DATE_TRUNC('month', v.data_venda)::date
    AND v.status = 'fechada';

    -- Wrong dates in commission payables
    RETURN QUERY 
    SELECT 
        'WRONG_PAYABLE_DATES'::text,
        COUNT(*)::bigint,
        'Contas a pagar de comissão com data incorreta'::text
    FROM public.transacoes_financeiras tf
    JOIN public.comissoes com ON com.id = tf.comissao_id
    JOIN public.vendas v ON v.id = com.venda_id
    WHERE tf.tipo = 'despesa'
    AND tf.comissao_id IS NOT NULL
    AND tf.data_transacao != v.data_venda
    AND tf.data_transacao = DATE_TRUNC('month', v.data_venda)::date
    AND v.status = 'fechada';
END;
$function$;