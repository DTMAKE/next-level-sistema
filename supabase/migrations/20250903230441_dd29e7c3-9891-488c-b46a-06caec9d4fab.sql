-- Criar função para gerar números sequenciais de contratos
CREATE OR REPLACE FUNCTION public.generate_contract_sequential_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    next_number integer;
    formatted_number text;
BEGIN
    -- Buscar o próximo número sequencial baseado em contratos existentes
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN numero_contrato ~ '^CONTRATO-[0-9]+$'
                THEN CAST(
                    regexp_replace(numero_contrato, '^CONTRATO-([0-9]+)$', '\1')
                    AS integer
                )
                ELSE 0
            END
        ), 0
    ) + 1 INTO next_number
    FROM public.contratos;
    
    -- Formatar o número com zeros à esquerda
    formatted_number := LPAD(next_number::text, 3, '0');
    
    -- Retornar o número completo
    RETURN 'CONTRATO-' || formatted_number;
END;
$$;

-- Criar função trigger para aplicar número sequencial automaticamente
CREATE OR REPLACE FUNCTION public.set_contract_sequential_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Se numero_contrato não foi fornecido, gerar automaticamente
    IF NEW.numero_contrato IS NULL OR NEW.numero_contrato = '' THEN
        NEW.numero_contrato := generate_contract_sequential_number();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para aplicar a numeração automaticamente
DROP TRIGGER IF EXISTS trigger_set_contract_sequential_number ON public.contratos;
CREATE TRIGGER trigger_set_contract_sequential_number
    BEFORE INSERT ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION set_contract_sequential_number();

-- Atualizar contratos existentes que não têm numeração sequencial
DO $$
DECLARE
    contrato_record record;
    next_number integer := 1;
BEGIN
    -- Atualizar contratos existentes para ter numeração sequencial
    FOR contrato_record IN 
        SELECT id 
        FROM public.contratos 
        WHERE numero_contrato IS NULL 
           OR numero_contrato = '' 
           OR numero_contrato NOT LIKE 'CONTRATO-%'
        ORDER BY created_at ASC
    LOOP
        UPDATE public.contratos 
        SET numero_contrato = 'CONTRATO-' || LPAD(next_number::text, 3, '0')
        WHERE id = contrato_record.id;
        
        next_number := next_number + 1;
    END LOOP;
END
$$;