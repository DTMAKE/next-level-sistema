-- Add columns to contratos table for recurring functionality
ALTER TABLE public.contratos 
ADD COLUMN IF NOT EXISTS tipo_contrato text DEFAULT 'unico' CHECK (tipo_contrato IN ('unico', 'recorrente')),
ADD COLUMN IF NOT EXISTS dia_vencimento integer DEFAULT 1 CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
ADD COLUMN IF NOT EXISTS observacoes text;

-- Create contratos_recorrencias table
CREATE TABLE IF NOT EXISTS public.contratos_recorrencias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contrato_id UUID NOT NULL,
    mes_referencia DATE NOT NULL,
    valor_mes NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processado', 'cancelado')),
    data_processamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contrato_id, mes_referencia)
);

-- Enable RLS on contratos_recorrencias
ALTER TABLE public.contratos_recorrencias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contratos_recorrencias
CREATE POLICY "Users can view recorrencias based on role" 
ON public.contratos_recorrencias 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.contratos c 
        WHERE c.id = contratos_recorrencias.contrato_id 
        AND (c.user_id = auth.uid() OR get_current_user_role() = 'admin')
    )
);

CREATE POLICY "Users can create recorrencias based on role" 
ON public.contratos_recorrencias 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.contratos c 
        WHERE c.id = contratos_recorrencias.contrato_id 
        AND (c.user_id = auth.uid() OR get_current_user_role() = 'admin')
    )
);

CREATE POLICY "Users can update recorrencias based on role" 
ON public.contratos_recorrencias 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.contratos c 
        WHERE c.id = contratos_recorrencias.contrato_id 
        AND (c.user_id = auth.uid() OR get_current_user_role() = 'admin')
    )
);

-- Add contrato_id to comissoes table (nullable since it can be from venda or contrato)
ALTER TABLE public.comissoes 
ADD COLUMN IF NOT EXISTS contrato_id UUID;

-- Make venda_id nullable since now commission can be from contrato too
ALTER TABLE public.comissoes 
ALTER COLUMN venda_id DROP NOT NULL;

-- Create trigger for updating updated_at on contratos_recorrencias
CREATE TRIGGER update_contratos_recorrencias_updated_at
    BEFORE UPDATE ON public.contratos_recorrencias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate recurring contract revenues and commissions
CREATE OR REPLACE FUNCTION public.process_contract_recurrences(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    contract_record record;
    categoria_venda_id uuid;
    admin_user_id uuid;
    recorrencia_id uuid;
    vendedor_percentual numeric;
    comissao_valor numeric;
BEGIN
    -- Get first admin user for financial transactions
    SELECT user_id INTO admin_user_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Find "Venda" category or create it
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF categoria_venda_id IS NULL THEN
        IF admin_user_id IS NULL THEN
            RAISE EXCEPTION 'No admin user found to create financial category';
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;

    -- Process each recurring contract that should generate revenue this month
    FOR contract_record IN
        SELECT c.*, cl.nome as cliente_nome, p.percentual_comissao, p.name as vendedor_nome
        FROM public.contratos c
        LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
        LEFT JOIN public.profiles p ON p.user_id = c.user_id
        WHERE c.tipo_contrato = 'recorrente'
        AND c.status = 'ativo'
        AND c.data_inicio <= target_month
        AND (c.data_fim IS NULL OR c.data_fim >= target_month)
        AND NOT EXISTS (
            SELECT 1 FROM public.contratos_recorrencias cr
            WHERE cr.contrato_id = c.id 
            AND cr.mes_referencia = target_month
            AND cr.status = 'processado'
        )
    LOOP
        -- Create or update recurrence record
        INSERT INTO public.contratos_recorrencias (
            contrato_id, mes_referencia, valor_mes, status
        ) VALUES (
            contract_record.id, target_month, contract_record.valor, 'processado'
        )
        ON CONFLICT (contrato_id, mes_referencia) 
        DO UPDATE SET 
            status = 'processado',
            data_processamento = now(),
            valor_mes = contract_record.valor
        RETURNING id INTO recorrencia_id;
        
        -- Create financial transaction for revenue
        INSERT INTO public.transacoes_financeiras (
            user_id,
            tipo,
            data_transacao,
            descricao,
            valor,
            categoria_id,
            status
        ) VALUES (
            contract_record.user_id,
            'receita',
            target_month,
            'Receita recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text) || ' - ' || COALESCE(contract_record.cliente_nome, 'Cliente'),
            contract_record.valor,
            categoria_venda_id,
            'confirmada'
        );
        
        -- Create commission if user is a salesperson
        IF contract_record.role = 'vendedor' THEN
            vendedor_percentual := COALESCE(contract_record.percentual_comissao, 5.00);
            comissao_valor := contract_record.valor * (vendedor_percentual / 100);
            
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
                target_month,
                'pendente',
                'Comissão recorrente - Contrato ' || COALESCE(contract_record.numero_contrato, contract_record.id::text)
            );
        END IF;
    END LOOP;
END;
$$;