-- Also fix the sync_commissions_to_financial function to prevent future duplications
CREATE OR REPLACE FUNCTION public.sync_commissions_to_financial(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_comissao_id uuid;
    commission_record record;
    admin_user_id uuid;
BEGIN
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
            admin_user_id := p_user_id;
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

    -- Get the first admin user for all financial transactions
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Fallback to current user if no admin exists
    IF admin_user_id IS NULL THEN
        admin_user_id := p_user_id;
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
        -- Create ONLY ONE financial transaction per commission
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
END;
$function$;