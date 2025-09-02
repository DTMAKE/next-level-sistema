-- Create trigger to automatically generate financial transactions when contracts are created
CREATE OR REPLACE FUNCTION public.create_contract_financial_transactions_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    categoria_venda_id uuid;
    categoria_comissao_id uuid;
    cliente_nome text;
    vendedor_nome text;
    vendedor_role text;
    vendedor_percentual numeric;
    comissao_valor numeric;
    admin_user_id uuid;
    comissao_id_var uuid;
    current_month date;
    end_month date;
    due_day integer;
    due_date date;
    target_vendedor_id uuid;
BEGIN
    -- Get client name
    SELECT nome INTO cliente_nome
    FROM public.clientes
    WHERE id = NEW.cliente_id;
    
    -- Get due day for calculations
    due_day := COALESCE(NEW.dia_vencimento, 1);
    
    -- Find or create "Venda" category for receivables
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF categoria_venda_id IS NULL THEN
        -- Get first admin user
        SELECT user_id INTO admin_user_id
        FROM public.profiles
        WHERE role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF admin_user_id IS NULL THEN
            admin_user_id := NEW.user_id;
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;
    
    -- Get first admin for ALL commission-related transactions
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Determine which vendedor should get the commission
    IF NEW.vendedor_id IS NOT NULL THEN
        target_vendedor_id := NEW.vendedor_id;
    ELSE
        -- Check if contract creator is a vendedor
        SELECT role INTO vendedor_role
        FROM public.profiles
        WHERE user_id = NEW.user_id;
        
        IF vendedor_role = 'vendedor' THEN
            target_vendedor_id := NEW.user_id;
        END IF;
    END IF;
    
    -- Get vendedor info if we have a target
    IF target_vendedor_id IS NOT NULL THEN
        SELECT name, role, percentual_comissao_contrato 
        INTO vendedor_nome, vendedor_role, vendedor_percentual
        FROM public.profiles
        WHERE user_id = target_vendedor_id;
        
        -- Only create commission if user is actually a vendedor
        IF vendedor_role = 'vendedor' THEN
            -- Default to 1% if no percentage is set for contracts
            IF vendedor_percentual IS NULL THEN
                vendedor_percentual := 1.00;
            END IF;
            
            -- Calculate commission value
            comissao_valor := NEW.valor * (vendedor_percentual / 100);
            
            -- Find or create commission category
            SELECT id INTO categoria_comissao_id
            FROM public.categorias_financeiras
            WHERE nome = 'Comissões de Vendas'
            AND tipo = 'despesa'
            ORDER BY created_at ASC
            LIMIT 1;
            
            IF categoria_comissao_id IS NULL THEN
                IF admin_user_id IS NULL THEN
                    admin_user_id := NEW.user_id;
                END IF;
                
                INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
                VALUES (admin_user_id, 'Comissões de Vendas', 'despesa', '#9333EA', true)
                RETURNING id INTO categoria_comissao_id;
            END IF;
        END IF;
    END IF;
    
    -- For unique contracts, create single receivable and commission
    IF NEW.tipo_contrato = 'unico' THEN
        due_date := NEW.data_inicio::date + (due_day - 1);
        
        -- Ensure due date doesn't exceed month end
        IF due_date > (DATE_TRUNC('month', NEW.data_inicio::date) + INTERVAL '1 month - 1 day')::date THEN
            due_date := (DATE_TRUNC('month', NEW.data_inicio::date) + INTERVAL '1 month - 1 day')::date;
        END IF;
        
        -- Create single receivable
        INSERT INTO public.transacoes_financeiras (
            user_id,
            tipo,
            data_transacao,
            data_vencimento,
            descricao,
            valor,
            categoria_id,
            status
        ) VALUES (
            NEW.user_id,
            'receita',
            NEW.data_inicio::date,
            due_date,
            'Receita do contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente'),
            NEW.valor,
            categoria_venda_id,
            'pendente'
        );
        
        -- Create single commission if vendedor exists
        IF target_vendedor_id IS NOT NULL AND vendedor_role = 'vendedor' THEN
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
                NEW.user_id,
                target_vendedor_id,
                NEW.id,
                NEW.valor,
                vendedor_percentual,
                comissao_valor,
                DATE_TRUNC('month', NEW.data_inicio::date)::date,
                'pendente',
                'Comissão do contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente')
            ) RETURNING id INTO comissao_id_var;
            
            -- Create commission payable (ALWAYS assigned to admin)
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
                    NEW.data_inicio::date,
                    (DATE_TRUNC('month', NEW.data_inicio::date) + INTERVAL '1 month - 1 day')::date,
                    'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text),
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente'
                );
            END IF;
        END IF;
        
    -- For recurring contracts, create multiple receivables and commissions
    ELSIF NEW.tipo_contrato = 'recorrente' AND NEW.data_fim IS NOT NULL THEN
        current_month := DATE_TRUNC('month', NEW.data_inicio::date);
        end_month := NEW.data_fim::date;
        
        -- Create installments for each month
        WHILE current_month <= end_month LOOP
            -- Calculate due date for this month
            due_date := current_month::date + (due_day - 1);
            
            -- Ensure due date doesn't exceed month end
            IF due_date > (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date THEN
                due_date := (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date;
            END IF;

            -- Create receivable
            INSERT INTO public.transacoes_financeiras (
                user_id,
                tipo,
                data_transacao,
                data_vencimento,
                descricao,
                valor,
                categoria_id,
                status
            ) VALUES (
                NEW.user_id,
                'receita',
                current_month,
                due_date,
                'Receita recorrente - Contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || COALESCE(cliente_nome, 'Cliente'),
                NEW.valor,
                categoria_venda_id,
                CASE 
                    WHEN current_month <= DATE_TRUNC('month', CURRENT_DATE) THEN 'confirmada'
                    ELSE 'pendente'
                END
            );
            
            -- Create commission if vendedor exists (one per month)
            IF target_vendedor_id IS NOT NULL AND vendedor_role = 'vendedor' THEN
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
                    NEW.user_id,
                    target_vendedor_id,
                    NEW.id,
                    NEW.valor,
                    vendedor_percentual,
                    comissao_valor,
                    current_month::date,
                    'pendente',
                    'Comissão recorrente - Contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - Mês ' || TO_CHAR(current_month, 'MM/YYYY')
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
                        status
                    ) VALUES (
                        admin_user_id,
                        'despesa',
                        current_month,
                        (DATE_TRUNC('month', current_month) + INTERVAL '1 month - 1 day')::date,
                        'Comissão de ' || COALESCE(vendedor_nome, 'Vendedor') || ' - Contrato ' || COALESCE(NEW.numero_contrato, NEW.id::text) || ' - ' || TO_CHAR(current_month, 'MM/YYYY'),
                        comissao_valor,
                        categoria_comissao_id,
                        comissao_id_var,
                        'pendente'
                    );
                END IF;
            END IF;
            
            current_month := current_month + INTERVAL '1 month';
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS contract_financial_transactions_trigger ON public.contratos;
CREATE TRIGGER contract_financial_transactions_trigger
    AFTER INSERT ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.create_contract_financial_transactions_trigger();