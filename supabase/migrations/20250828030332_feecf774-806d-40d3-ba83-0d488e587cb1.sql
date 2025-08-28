-- Create function to calculate and insert commission when a sale is closed
CREATE OR REPLACE FUNCTION public.calculate_commission_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    vendedor_percentual numeric;
    comissao_valor numeric;
    cliente_nome text;
BEGIN
    -- Only process if sale is being marked as 'fechada'
    IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
        -- Get the seller's commission percentage from profiles
        SELECT percentual_comissao INTO vendedor_percentual
        FROM public.profiles
        WHERE user_id = NEW.user_id;
        
        -- Default to 5% if no percentage is set
        IF vendedor_percentual IS NULL THEN
            vendedor_percentual := 5.00;
        END IF;
        
        -- Calculate commission value
        comissao_valor := NEW.valor * (vendedor_percentual / 100);
        
        -- Get client name for description
        SELECT nome INTO cliente_nome
        FROM public.clientes
        WHERE id = NEW.cliente_id;
        
        -- Insert commission record
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
            DATE_TRUNC('month', NEW.data_venda)::date,
            'pendente',
            'Comissão da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado')
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger to automatically calculate commissions when sales are closed
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.vendas;
CREATE TRIGGER trigger_calculate_commission
    AFTER INSERT OR UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_commission_from_sale();

-- Create function to update commission when sale value changes
CREATE OR REPLACE FUNCTION public.update_commission_from_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    vendedor_percentual numeric;
    comissao_valor numeric;
BEGIN
    -- Only update if sale is closed and value changed
    IF NEW.status = 'fechada' AND OLD.valor != NEW.valor THEN
        -- Get the seller's commission percentage
        SELECT percentual_comissao INTO vendedor_percentual
        FROM public.profiles
        WHERE user_id = NEW.user_id;
        
        -- Default to 5% if no percentage is set
        IF vendedor_percentual IS NULL THEN
            vendedor_percentual := 5.00;
        END IF;
        
        -- Calculate new commission value
        comissao_valor := NEW.valor * (vendedor_percentual / 100);
        
        -- Update existing commission record
        UPDATE public.comissoes
        SET 
            valor_venda = NEW.valor,
            valor_comissao = comissao_valor,
            percentual = vendedor_percentual
        WHERE venda_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger to update commissions when sale values change
DROP TRIGGER IF EXISTS trigger_update_commission ON public.vendas;
CREATE TRIGGER trigger_update_commission
    AFTER UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_commission_from_sale();