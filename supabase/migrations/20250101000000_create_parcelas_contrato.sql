-- Criar tabela de parcelas de contratos
CREATE TABLE public.parcelas_contrato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor_parcela NUMERIC NOT NULL CHECK (valor_parcela > 0),
  data_vencimento DATE NOT NULL,
  status_parcela TEXT NOT NULL DEFAULT 'pendente' CHECK (status_parcela IN ('pendente', 'paga', 'atrasada', 'cancelada')),
  data_pagamento DATE,
  valor_pago NUMERIC,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de comissões de vendedores
CREATE TABLE public.comissoes_vendedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcela_id UUID NOT NULL REFERENCES public.parcelas_contrato(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  valor_comissao NUMERIC NOT NULL CHECK (valor_comissao > 0),
  percentual_comissao NUMERIC NOT NULL DEFAULT 10 CHECK (percentual_comissao > 0 AND percentual_comissao <= 100),
  status_comissao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_comissao IN ('pendente', 'paga', 'cancelada')),
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_parcelas_contrato_contrato_id ON public.parcelas_contrato(contrato_id);
CREATE INDEX idx_parcelas_contrato_data_vencimento ON public.parcelas_contrato(data_vencimento);
CREATE INDEX idx_parcelas_contrato_status ON public.parcelas_contrato(status_parcela);
CREATE INDEX idx_comissoes_vendedor_parcela_id ON public.comissoes_vendedor(parcela_id);
CREATE INDEX idx_comissoes_vendedor_vendedor_id ON public.comissoes_vendedor(vendedor_id);
CREATE INDEX idx_comissoes_vendedor_status ON public.comissoes_vendedor(status_comissao);

-- Habilitar RLS nas tabelas
ALTER TABLE public.parcelas_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes_vendedor ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para parcelas_contrato
CREATE POLICY "Users can view parcelas_contrato from their contracts" 
ON public.parcelas_contrato 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contratos c 
    WHERE c.id = contrato_id 
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    ))
  )
);

CREATE POLICY "Users can create parcelas_contrato for their contracts" 
ON public.parcelas_contrato 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contratos c 
    WHERE c.id = contrato_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update parcelas_contrato from their contracts" 
ON public.parcelas_contrato 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contratos c 
    WHERE c.id = contrato_id 
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    ))
  )
);

-- Criar políticas RLS para comissoes_vendedor
CREATE POLICY "Users can view comissoes_vendedor from their contracts" 
ON public.comissoes_vendedor 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.parcelas_contrato pc
    JOIN public.contratos c ON c.id = pc.contrato_id
    WHERE pc.id = parcela_id 
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    ))
  )
);

CREATE POLICY "Users can create comissoes_vendedor for their contracts" 
ON public.comissoes_vendedor 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.parcelas_contrato pc
    JOIN public.contratos c ON c.id = pc.contrato_id
    WHERE pc.id = parcela_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update comissoes_vendedor from their contracts" 
ON public.comissoes_vendedor 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.parcelas_contrato pc
    JOIN public.contratos c ON c.id = pc.contrato_id
    WHERE pc.id = parcela_id 
    AND (c.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'admin'
    ))
  )
);

-- Criar triggers para updated_at
CREATE TRIGGER update_parcelas_contrato_updated_at
BEFORE UPDATE ON public.parcelas_contrato
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comissoes_vendedor_updated_at
BEFORE UPDATE ON public.comissoes_vendedor
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar parcelas automaticamente quando um contrato é criado
CREATE OR REPLACE FUNCTION generate_contract_installments()
RETURNS TRIGGER AS $$
DECLARE
  current_date DATE;
  end_date DATE;
  installment_date DATE;
  installment_number INTEGER := 1;
  monthly_value NUMERIC;
BEGIN
  -- Só gerar parcelas para contratos recorrentes
  IF NEW.tipo_contrato != 'recorrente' THEN
    RETURN NEW;
  END IF;

  -- Definir data de início da primeira parcela (próximo mês)
  current_date := NEW.data_inicio;
  installment_date := current_date + INTERVAL '1 month';
  
  -- Se não tiver data fim, gerar 12 parcelas por padrão
  IF NEW.data_fim IS NULL THEN
    end_date := current_date + INTERVAL '12 months';
  ELSE
    end_date := NEW.data_fim;
  END IF;

  -- Gerar parcelas mensais
  WHILE installment_date <= end_date LOOP
    -- Inserir parcela
    INSERT INTO public.parcelas_contrato (
      contrato_id,
      numero_parcela,
      valor_parcela,
      data_vencimento,
      status_parcela
    ) VALUES (
      NEW.id,
      installment_number,
      NEW.valor,
      installment_date,
      'pendente'
    );

    -- Se o contrato tem vendedor, criar comissão
    IF NEW.vendedor_id IS NOT NULL THEN
      INSERT INTO public.comissoes_vendedor (
        parcela_id,
        vendedor_id,
        valor_comissao,
        percentual_comissao,
        status_comissao
      ) VALUES (
        (SELECT id FROM public.parcelas_contrato WHERE contrato_id = NEW.id AND numero_parcela = installment_number),
        NEW.vendedor_id,
        NEW.valor * 0.10, -- 10% de comissão padrão
        10
      );
    END IF;

    installment_number := installment_number + 1;
    installment_date := installment_date + INTERVAL '1 month';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar parcelas automaticamente
CREATE TRIGGER trigger_generate_installments
  AFTER INSERT ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_installments();

-- Função para atualizar parcelas quando contrato é atualizado
CREATE OR REPLACE FUNCTION update_contract_installments()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o contrato foi cancelado ou finalizado, cancelar parcelas pendentes
  IF NEW.status IN ('cancelado', 'finalizado') AND OLD.status NOT IN ('cancelado', 'finalizado') THEN
    UPDATE public.parcelas_contrato 
    SET status_parcela = 'cancelada'
    WHERE contrato_id = NEW.id AND status_parcela = 'pendente';
    
    UPDATE public.comissoes_vendedor 
    SET status_comissao = 'cancelada'
    WHERE parcela_id IN (
      SELECT id FROM public.parcelas_contrato 
      WHERE contrato_id = NEW.id AND status_parcela = 'cancelada'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar parcelas quando contrato é atualizado
CREATE TRIGGER trigger_update_installments
  AFTER UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_installments();
