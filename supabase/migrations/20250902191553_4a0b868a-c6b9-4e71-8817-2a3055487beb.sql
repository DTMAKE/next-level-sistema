-- Função para gerar comissões e contas a pagar futuras para contratos recorrentes
CREATE OR REPLACE FUNCTION public.generate_future_contract_commissions(p_contrato_id uuid)
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
    parcel_number integer;
    total_parcels integer;
BEGIN
    -- Get contract details
    SELECT c.*, cl.nome as cliente_nome, p.percentual_comissao_contrato, p.name as vendedor_nome, p.role
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    LEFT JOIN public.profiles p ON p.user_id = c.vendedor_id
    WHERE c.id = p_contrato_id;

    -- Only process recurring active contracts with a vendedor
    IF contract_record.tipo_contrato != 'recorrente' OR 
       contract_record.status != 'ativo' OR 
       contract_record.vendedor_id IS NULL OR
       contract_record.role != 'vendedor' THEN
        RETURN;
    END IF;

    -- Get first admin user
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Get or create commission category
    SELECT id INTO categoria_comissao_id
    FROM public.categorias_financeiras
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_comissao_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
        RETURNING id INTO categoria_comissao_id;
    END IF;

    -- Calculate commission parameters
    vendedor_percentual := COALESCE(contract_record.percentual_comissao_contrato, 1.00);
    comissao_valor := contract_record.valor * (vendedor_percentual / 100);

    -- Calculate date range and total parcels
    current_month := DATE_TRUNC('month', contract_record.data_inicio);
    end_month := COALESCE(contract_record.data_fim, (current_month + INTERVAL '11 months'))::date;
    
    -- Calculate total number of months
    total_parcels := (DATE_PART('year', end_month) - DATE_PART('year', current_month)) * 12 + 
                     (DATE_PART('month', end_month) - DATE_PART('month', current_month)) + 1;

    parcel_number := 1;

    -- Generate monthly commissions and payables
    WHILE current_month <= end_month LOOP
        -- Create commission record if it doesn't exist
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
            contract_record.vendedor_id,
            contract_record.id,
            contract_record.valor,
            vendedor_percentual,
            comissao_valor,
            current_month,
            'pendente',
            'Comissão do contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente')
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO comissao_id_var;

        -- If commission was created, create corresponding financial transaction
        IF comissao_id_var IS NOT NULL THEN
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
                parcela_atual,
                parcelas
            ) VALUES (
                admin_user_id,
                'despesa',
                current_month,
                (current_month + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente') || ' (' || parcel_number || '/' || total_parcels || ')',
                comissao_valor,
                categoria_comissao_id,
                comissao_id_var,
                'pendente',
                parcel_number,
                total_parcels
            );
        END IF;

        current_month := current_month + INTERVAL '1 month';
        parcel_number := parcel_number + 1;
    END LOOP;
END;
$function$;