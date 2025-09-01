-- Adicionar função para processar recorrências de contratos
CREATE OR REPLACE FUNCTION process_contract_recurrences(target_month DATE DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  current_month DATE;
  start_date DATE;
  end_date DATE;
  contract_record RECORD;
  installment_date DATE;
  installment_number INTEGER;
  existing_installment RECORD;
  result JSON;
BEGIN
  -- Se não foi especificado um mês, usar o mês atual
  IF target_month IS NULL THEN
    current_month := DATE_TRUNC('month', CURRENT_DATE);
  ELSE
    current_month := DATE_TRUNC('month', target_month);
  END IF;
  
  start_date := current_month;
  end_date := current_month + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Log para debug
  RAISE NOTICE 'Processing contract recurrences for month: % to %', start_date, end_date;
  
  -- Buscar contratos recorrentes ativos
  FOR contract_record IN 
    SELECT 
      c.id,
      c.valor,
      c.data_inicio,
      c.data_fim,
      c.vendedor_id,
      c.status
    FROM public.contratos c
    WHERE c.tipo_contrato = 'recorrente'
      AND c.status IN ('ativo', 'pendente')
      AND c.data_inicio <= end_date
      AND (c.data_fim IS NULL OR c.data_fim >= start_date)
  LOOP
    -- Calcular data da primeira parcela (próximo mês após data_inicio)
    installment_date := contract_record.data_inicio + INTERVAL '1 month';
    installment_number := 1;
    
    -- Gerar parcelas para este contrato até o mês atual
    WHILE installment_date <= end_date LOOP
      -- Verificar se a parcela já existe
      SELECT * INTO existing_installment
      FROM public.parcelas_contrato
      WHERE contrato_id = contract_record.id 
        AND numero_parcela = installment_number;
      
      -- Se a parcela não existe, criar
      IF existing_installment IS NULL THEN
        INSERT INTO public.parcelas_contrato (
          contrato_id,
          numero_parcela,
          valor_parcela,
          data_vencimento,
          status_parcela
        ) VALUES (
          contract_record.id,
          installment_number,
          contract_record.valor,
          installment_date,
          'pendente'
        );
        
        -- Se o contrato tem vendedor, criar comissão
        IF contract_record.vendedor_id IS NOT NULL THEN
          INSERT INTO public.comissoes_vendedor (
            parcela_id,
            vendedor_id,
            valor_comissao,
            percentual_comissao,
            status_comissao
          ) VALUES (
            (SELECT id FROM public.parcelas_contrato WHERE contrato_id = contract_record.id AND numero_parcela = installment_number),
            contract_record.vendedor_id,
            contract_record.valor * 0.10, -- 10% de comissão padrão
            10
          );
        END IF;
        
        RAISE NOTICE 'Created installment % for contract % with due date %', installment_number, contract_record.id, installment_date;
      END IF;
      
      installment_number := installment_number + 1;
      installment_date := installment_date + INTERVAL '1 month';
    END LOOP;
  END LOOP;
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'target_month', current_month,
    'message', 'Contract recurrences processed successfully'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro
    RAISE NOTICE 'Error processing contract recurrences: %', SQLERRM;
    
    -- Retornar erro
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'target_month', current_month
    );
END;
$$ LANGUAGE plpgsql;

-- Comentário na função
COMMENT ON FUNCTION process_contract_recurrences(DATE) IS 'Processa recorrências de contratos para um mês específico, criando parcelas e comissões automaticamente';
