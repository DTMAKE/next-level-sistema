-- First, drop existing problematic triggers
DROP TRIGGER IF EXISTS calculate_commission_and_expense_from_sale_trigger ON public.vendas;
DROP TRIGGER IF EXISTS create_financial_transaction_from_closed_sale_trigger ON public.vendas;
DROP TRIGGER IF EXISTS create_financial_transaction_from_sale_trigger ON public.vendas;

-- Create improved function to handle both revenue and commission creation
CREATE OR REPLACE FUNCTION public.create_sale_financial_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        
        -- Create revenue transaction (Conta a Receber)
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
            'Receita da venda - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            NEW.valor,
            categoria_venda_id,
            NEW.id,
            'confirmada'
        );
        
        -- Create commission only if user has a commission percentage set (regardless of role)
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
                'Comissão da venda - ' || COALESCE(cliente_nome, 'Cliente não encontrado')
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
            
            -- Create commission expense transaction (Conta a Pagar) - assigned to admin
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
                    mes_referencia_date,
                    (mes_referencia_date + INTERVAL '1 month - 1 day')::date,
                    'Comissão - ' || COALESCE(vendedor_nome, 'Vendedor') || ' - ' || COALESCE(cliente_nome, 'Cliente'),
                    comissao_valor,
                    categoria_comissao_id,
                    comissao_id_var,
                    'pendente'
                );
            END IF;
        END IF;
        
        -- Log the transaction creation
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            NEW.user_id,
            'TRIGGER_EXECUTED',
            'vendas_financial_transactions',
            NEW.id::text,
            jsonb_build_object(
                'venda_id', NEW.id,
                'revenue_created', true,
                'commission_created', (vendedor_percentual IS NOT NULL AND vendedor_percentual > 0),
                'commission_percentage', vendedor_percentual
            )
        );
        
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER create_sale_financial_transactions_trigger
    AFTER INSERT OR UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.create_sale_financial_transactions();

-- Also create a function to handle sale updates (value changes)
CREATE OR REPLACE FUNCTION public.update_sale_financial_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    cliente_nome text;
    vendedor_percentual numeric;
    comissao_valor numeric;
BEGIN
    -- Only update if sale is closed and value or date changed
    IF NEW.status = 'fechada' AND (OLD.valor != NEW.valor OR OLD.data_venda != NEW.data_venda OR OLD.cliente_id != NEW.cliente_id) THEN
        
        -- Get client name
        SELECT nome INTO cliente_nome
        FROM public.clientes
        WHERE id = NEW.cliente_id;
        
        -- Update revenue transaction
        UPDATE public.transacoes_financeiras
        SET 
            valor = NEW.valor,
            data_transacao = NEW.data_venda,
            descricao = 'Receita da venda - ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            updated_at = now()
        WHERE venda_id = NEW.id AND tipo = 'receita';
        
        -- Update commission if exists
        IF EXISTS (SELECT 1 FROM public.comissoes WHERE venda_id = NEW.id) THEN
            -- Get seller commission percentage
            SELECT percentual_comissao INTO vendedor_percentual
            FROM public.profiles
            WHERE user_id = NEW.user_id;
            
            IF vendedor_percentual IS NOT NULL THEN
                comissao_valor := NEW.valor * (vendedor_percentual / 100);
                
                -- Update commission record
                UPDATE public.comissoes
                SET 
                    valor_venda = NEW.valor,
                    valor_comissao = comissao_valor,
                    percentual = vendedor_percentual,
                    updated_at = now()
                WHERE venda_id = NEW.id;
                
                -- Update commission expense transaction
                UPDATE public.transacoes_financeiras
                SET 
                    valor = comissao_valor,
                    updated_at = now()
                WHERE comissao_id = (SELECT id FROM public.comissoes WHERE venda_id = NEW.id LIMIT 1);
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the update trigger
CREATE TRIGGER update_sale_financial_transactions_trigger
    AFTER UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sale_financial_transactions();