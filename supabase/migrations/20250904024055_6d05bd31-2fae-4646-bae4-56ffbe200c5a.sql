-- Step 1: Check and remove duplicate triggers that create contract financial transactions
-- First, let's see what triggers exist on the contratos table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'contratos';

-- Remove the duplicate trigger if it exists
DROP TRIGGER IF EXISTS generate_contract_accounts_trigger ON public.contratos;

-- Step 2: Clean up orphaned transactions (without contrato_id but related to contracts)
-- Delete duplicate receivables that don't have contrato_id but mention "Contrato" in description
DELETE FROM public.transacoes_financeiras
WHERE tipo = 'receita'
AND contrato_id IS NULL
AND descricao LIKE '%Contrato%'
AND EXISTS (
    -- Only delete if there's already a proper transaction with contrato_id for the same contract
    SELECT 1 FROM public.transacoes_financeiras tf2
    WHERE tf2.tipo = 'receita'
    AND tf2.contrato_id IS NOT NULL
    AND tf2.descricao LIKE '%' || 
        SUBSTRING(transacoes_financeiras.descricao FROM 'Contrato ([^-]+)') || '%'
    AND DATE_TRUNC('month', tf2.data_transacao) = DATE_TRUNC('month', transacoes_financeiras.data_transacao)
);

-- Step 3: Clean up orphaned commission transactions related to contracts
DELETE FROM public.transacoes_financeiras
WHERE tipo = 'despesa'
AND comissao_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM public.comissoes c
    WHERE c.id = transacoes_financeiras.comissao_id
    AND c.contrato_id IS NOT NULL
    AND NOT EXISTS (
        -- Delete if there's no proper receivable transaction for this contract
        SELECT 1 FROM public.transacoes_financeiras tf2
        WHERE tf2.tipo = 'receita'
        AND tf2.contrato_id = c.contrato_id
        AND DATE_TRUNC('month', tf2.data_transacao) = DATE_TRUNC('month', transacoes_financeiras.data_transacao)
    )
);

-- Step 4: Update the main contract financial function to ensure it always fills contrato_id
CREATE OR REPLACE FUNCTION public.create_contract_financial_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    contract_record record;
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    admin_user_id uuid;
    vendedor_percentual numeric;
    comissao_valor numeric;
    comissao_id_var uuid;
BEGIN
    -- Only process recurring active contracts
    IF NEW.tipo_contrato != 'recorrente' OR NEW.status != 'ativo' THEN
        RETURN NEW;
    END IF;

    -- Get contract details with vendedor info
    SELECT c.*, cl.nome as cliente_nome, 
           COALESCE(pv.percentual_comissao_contrato, pv.percentual_comissao, 5.00) as percentual_comissao, 
           pv.name as vendedor_nome, pv.role as vendedor_role
    INTO contract_record
    FROM public.contratos c
    LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
    LEFT JOIN public.profiles pv ON pv.user_id = COALESCE(c.vendedor_id, c.user_id)
    WHERE c.id = NEW.id;

    -- Get first admin user
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Get or create revenue category
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' AND tipo = 'receita'
    ORDER BY created_at ASC LIMIT 1;

    IF categoria_venda_id IS NULL THEN
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (COALESCE(admin_user_id, contract_record.user_id), 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    -- Check if receivable already exists for current month to prevent duplicates
    IF NOT EXISTS (
        SELECT 1 FROM public.transacoes_financeiras
        WHERE tipo = 'receita'
        AND contrato_id = NEW.id
        AND data_transacao >= DATE_TRUNC('month', NEW.data_inicio)
        AND data_transacao < (DATE_TRUNC('month', NEW.data_inicio) + INTERVAL '1 month')
    ) THEN
        -- Create the first month's receivable with CRITICAL: contrato_id populated
        INSERT INTO public.transacoes_financeiras (
            user_id,
            tipo,
            data_transacao,
            data_vencimento,
            descricao,
            valor,
            categoria_id,
            contrato_id, -- CRITICAL: Always populate this
            status
        ) VALUES (
            contract_record.user_id,
            'receita',
            contract_record.data_inicio,
            contract_record.data_inicio + (COALESCE(contract_record.dia_vencimento, 1) - 1),
            'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
            contract_record.valor,
            categoria_venda_id,
            NEW.id, -- CRITICAL: Always populate this
            'pendente'
        );
    END IF;

    -- Create commission if there's a salesperson
    IF (contract_record.vendedor_role = 'vendedor' OR (contract_record.vendedor_role = 'admin' AND contract_record.percentual_comissao > 0)) AND admin_user_id IS NOT NULL THEN
        SELECT id INTO categoria_comissao_id
        FROM public.categorias_financeiras
        WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
        ORDER BY created_at ASC LIMIT 1;

        IF categoria_comissao_id IS NULL THEN
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
            RETURNING id INTO categoria_comissao_id;
        END IF;

        vendedor_percentual := contract_record.percentual_comissao;
        comissao_valor := contract_record.valor * (vendedor_percentual / 100);

        -- Check if commission already exists for current month
        IF NOT EXISTS (
            SELECT 1 FROM public.comissoes c
            WHERE c.contrato_id = NEW.id
            AND c.mes_referencia >= DATE_TRUNC('month', contract_record.data_inicio)
            AND c.mes_referencia < (DATE_TRUNC('month', contract_record.data_inicio) + INTERVAL '1 month')
        ) THEN
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
                COALESCE(contract_record.vendedor_id, contract_record.user_id),
                NEW.id,
                contract_record.valor,
                vendedor_percentual,
                comissao_valor,
                DATE_TRUNC('month', contract_record.data_inicio)::date,
                'pendente',
                'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
            ) RETURNING id INTO comissao_id_var;

            -- Create commission payable
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
                contract_record.data_inicio,
                (DATE_TRUNC('month', contract_record.data_inicio) + INTERVAL '1 month - 1 day')::date,
                'Comissão de ' || COALESCE(contract_record.vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text),
                comissao_valor,
                categoria_comissao_id,
                comissao_id_var,
                'pendente'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Step 5: Ensure the correct trigger is in place
DROP TRIGGER IF EXISTS contract_financial_transactions_trigger ON public.contratos;
CREATE TRIGGER contract_financial_transactions_trigger
    AFTER INSERT OR UPDATE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION create_contract_financial_transactions();

-- Step 6: Add logging for monitoring
INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    new_values
) VALUES (
    'FIX_DUPLICATE_CONTRACTS',
    'transacoes_financeiras',
    'cleanup_operation',
    jsonb_build_object(
        'message', 'Fixed duplicate contract transactions and ensured contrato_id is always populated',
        'timestamp', now()
    )
);