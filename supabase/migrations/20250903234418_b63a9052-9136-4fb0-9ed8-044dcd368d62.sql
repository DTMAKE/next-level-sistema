-- Função para gerar comissões futuras de contratos recorrentes ativos
CREATE OR REPLACE FUNCTION public.generate_future_contract_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    contract_record record;
    categoria_comissao_id uuid;
    admin_user_id uuid;
    current_month date;
    end_month date;
    vendedor_percentual numeric;
    comissao_valor numeric;
    comissao_id_var uuid;
    existing_commission_count integer;
BEGIN
    -- Get first admin user
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Get or create commission category
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_comissao_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, (SELECT user_id FROM public.profiles LIMIT 1)), 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

    -- Process all active recurring contracts with salesperson
    FOR contract_record IN
        SELECT c.*, cl.nome as cliente_nome, p.percentual_comissao_contrato, p.name as vendedor_nome, p.role
        FROM public.contratos c
        LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
        LEFT JOIN public.profiles p ON p.user_id = c.user_id
        WHERE c.tipo_contrato = 'recorrente' 
        AND c.status = 'ativo'
        AND p.role IN ('vendedor', 'admin')
        AND p.percentual_comissao_contrato > 0
    LOOP
        vendedor_percentual := COALESCE(contract_record.percentual_comissao_contrato, 1.00);
        comissao_valor := contract_record.valor * (vendedor_percentual / 100);

        -- Calculate date range (current month to end of contract or 12 months ahead)
        current_month := DATE_TRUNC('month', CURRENT_DATE);
        end_month := COALESCE(
            DATE_TRUNC('month', contract_record.data_fim), 
            (CURRENT_DATE + INTERVAL '12 months')
        )::date;

        -- Generate monthly commissions for future months
        WHILE current_month <= end_month LOOP
            -- Check if commission already exists for this month and contract
            SELECT COUNT(*) INTO existing_commission_count
            FROM public.comissoes c
            WHERE c.contrato_id = contract_record.id
            AND c.mes_referencia >= current_month
            AND c.mes_referencia < (current_month + INTERVAL '1 month');

            -- Create commission only if it doesn't exist
            IF existing_commission_count = 0 THEN
                -- Create commission record
                INSERT INTO public.comissoes (
                    user_id,
                    vendedor_id,
                    contrato_id,
                    valor_venda,
                    percentual,
                    valor_comissao,
                    mes_referencia,
                    status,
                    observacoes
                ) VALUES (
                    contract_record.user_id,
                    contract_record.user_id,
                    contract_record.id,
                    contract_record.valor,
                    vendedor_percentual,
                    comissao_valor,
                    current_month,
                    'pendente',
                    'Comissão mensal - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
                ) RETURNING id INTO comissao_id_var;

                -- Create the financial payable transaction if admin exists
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
                        current_month,
                        (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date,
                        'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text),
                        comissao_valor,
                        categoria_comissao_id,
                        comissao_id_var,
                        'pendente'
                    );
                END IF;
            END IF;

            current_month := current_month + INTERVAL '1 month';
        END LOOP;
    END LOOP;
END;
$function$;