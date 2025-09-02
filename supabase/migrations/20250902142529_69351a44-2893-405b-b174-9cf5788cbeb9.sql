-- Check if trigger exists and recreate it
DROP TRIGGER IF EXISTS after_venda_insert ON public.vendas;

-- Recreate the trigger
CREATE TRIGGER after_venda_insert
  AFTER INSERT ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.create_financial_transaction_from_sale();

-- Now let's fix the existing wrong transaction and create the correct ones
DO $$
DECLARE
    venda_record record;
    categoria_venda_id uuid;
    cliente_nome text;
    valorParcela numeric;
    i integer;
    data_parcela date;
BEGIN
    -- Get the sale data for the test sale we just created
    SELECT * INTO venda_record 
    FROM public.vendas 
    WHERE id = '64294f45-5192-49b1-8081-c0fa7042267b';
    
    -- Delete the incorrect transaction first
    DELETE FROM public.transacoes_financeiras 
    WHERE venda_id = '64294f45-5192-49b1-8081-c0fa7042267b';
    
    -- Get client name
    SELECT nome INTO cliente_nome
    FROM public.clientes
    WHERE id = venda_record.cliente_id;
    
    -- Find the global "Venda" category
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Create the correct installment transactions
    valorParcela := venda_record.valor / venda_record.parcelas;
    
    FOR i IN 1..venda_record.parcelas LOOP
        -- Calculate the date for each installment (spread across months)
        data_parcela := venda_record.data_venda + (i - 1) * INTERVAL '1 month';
        
        INSERT INTO public.transacoes_financeiras (
            user_id,
            tipo,
            data_transacao,
            data_vencimento,
            descricao,
            valor,
            categoria_id,
            venda_id,
            forma_pagamento,
            parcelas,
            parcela_atual,
            status
        ) VALUES (
            venda_record.user_id,
            'receita',
            data_parcela,
            data_parcela,
            'Receita da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado') || ' (' || i || '/' || venda_record.parcelas || ')',
            valorParcela,
            categoria_venda_id,
            venda_record.id,
            'parcelado',
            venda_record.parcelas,
            i,
            'pendente'
        );
    END LOOP;
END $$;