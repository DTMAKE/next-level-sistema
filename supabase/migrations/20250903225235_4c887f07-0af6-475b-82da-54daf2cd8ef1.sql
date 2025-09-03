-- Adicionar campo numero_venda na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN numero_venda text UNIQUE;

-- Criar função para gerar números de venda sequenciais
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    next_number integer;
    formatted_number text;
BEGIN
    -- Get the highest sale number and increment
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN numero_venda ~ '^VENDA-[0-9]+$'
                THEN CAST(
                    regexp_replace(numero_venda, '^VENDA-([0-9]+)$', '\1')
                    AS integer
                )
                ELSE 0
            END
        ), 0
    ) + 1 INTO next_number
    FROM public.vendas;
    
    -- Format the number with leading zeros (3 digits)
    formatted_number := LPAD(next_number::text, 3, '0');
    
    -- Return the full sale number
    RETURN 'VENDA-' || formatted_number;
END;
$$;

-- Criar trigger para gerar número da venda automaticamente
CREATE OR REPLACE FUNCTION public.set_sale_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Generate sale number if not provided
    IF NEW.numero_venda IS NULL THEN
        NEW.numero_venda := generate_sale_number();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger que executa antes do insert
CREATE TRIGGER set_sale_number_trigger
    BEFORE INSERT ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.set_sale_number();

-- Função para atualizar vendas existentes com números sequenciais
CREATE OR REPLACE FUNCTION public.update_existing_sales_numbers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    sale_record record;
    counter integer := 1;
BEGIN
    -- Update existing sales without numero_venda in order of creation
    FOR sale_record IN 
        SELECT id FROM public.vendas 
        WHERE numero_venda IS NULL 
        ORDER BY created_at
    LOOP
        UPDATE public.vendas 
        SET numero_venda = 'VENDA-' || LPAD(counter::text, 3, '0')
        WHERE id = sale_record.id;
        
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Executar a função para atualizar vendas existentes
SELECT public.update_existing_sales_numbers();