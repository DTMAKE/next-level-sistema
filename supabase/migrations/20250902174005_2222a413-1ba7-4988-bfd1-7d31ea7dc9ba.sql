-- Function to fix existing contracts that should be recurring
CREATE OR REPLACE FUNCTION public.fix_contract_types_and_generate_missing_installments()
RETURNS TABLE(
    contrato_id uuid,
    numero_contrato text,
    months_duration integer,
    action_taken text,
    installments_created integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    contract_record record;
    installments_count integer := 0;
    current_month date;
    end_month date;
    due_day integer;
    due_date date;
    categoria_venda_id uuid;
    admin_user_id uuid;
    months_diff integer;
BEGIN
    -- Get first admin user and revenue category
    SELECT user_id INTO admin_user_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO categoria_venda_id FROM public.categorias_financeiras WHERE nome = 'Venda' AND tipo = 'receita' ORDER BY created_at ASC LIMIT 1;
    
    -- If no revenue category exists, create one
    IF categoria_venda_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, (SELECT user_id FROM public.profiles LIMIT 1)), 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    -- Process contracts that should be recurring but are marked as 'unico'
    FOR contract_record IN
        SELECT c.*, cl.nome as cliente_nome
        FROM public.contratos c
        LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
        WHERE c.tipo_contrato = 'unico'
        AND c.data_inicio IS NOT NULL
        AND c.data_fim IS NOT NULL
        AND c.status = 'ativo'
        -- Calculate if duration is more than 1 month
        AND (
            (EXTRACT(year FROM c.data_fim) - EXTRACT(year FROM c.data_inicio)) * 12 +
            (EXTRACT(month FROM c.data_fim) - EXTRACT(month FROM c.data_inicio))
        ) > 0
    LOOP
        -- Calculate months duration
        months_diff := (
            (EXTRACT(year FROM contract_record.data_fim) - EXTRACT(year FROM contract_record.data_inicio)) * 12 +
            (EXTRACT(month FROM contract_record.data_fim) - EXTRACT(month FROM contract_record.data_inicio))
        )::integer;
        
        -- Update contract type to recurring
        UPDATE public.contratos 
        SET tipo_contrato = 'recorrente', 
            updated_at = now()
        WHERE id = contract_record.id;
        
        -- Generate missing installments
        installments_count := 0;
        current_month := DATE_TRUNC('month', contract_record.data_inicio);
        end_month := contract_record.data_fim;
        due_day := COALESCE(contract_record.dia_vencimento, 1);
        
        -- Create installments for each month
        WHILE current_month <= end_month LOOP
            -- Calculate due date for this month
            due_date := current_month::date + (due_day - 1);
            
            -- Ensure due date doesn't exceed month end
            IF due_date > (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date THEN
                due_date := (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date;
            END IF;

            -- Create receivable if it doesn't exist
            INSERT INTO public.transacoes_financeiras (
                user_id, tipo, data_transacao, data_vencimento, descricao, valor, categoria_id, status
            )
            SELECT 
                contract_record.user_id,
                'receita',
                current_month,
                due_date,
                'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
                contract_record.valor,
                categoria_venda_id,
                CASE 
                    WHEN current_month <= DATE_TRUNC('month', CURRENT_DATE) THEN 'confirmada'
                    ELSE 'pendente'
                END
            WHERE NOT EXISTS (
                SELECT 1 FROM public.transacoes_financeiras tf 
                WHERE tf.tipo = 'receita' 
                AND tf.data_transacao = current_month
                AND tf.descricao LIKE '%Contrato%' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || '%'
                AND tf.user_id = contract_record.user_id
            );
            
            -- Count if we inserted
            IF FOUND THEN
                installments_count := installments_count + 1;
            END IF;
            
            current_month := current_month + INTERVAL '1 month';
        END LOOP;
        
        -- Return results
        RETURN QUERY SELECT 
            contract_record.id,
            contract_record.numero_contrato,
            months_diff + 1,
            ('Convertido para recorrente e geradas ' || installments_count || ' parcelas')::text,
            installments_count;
    END LOOP;
END;
$function$;