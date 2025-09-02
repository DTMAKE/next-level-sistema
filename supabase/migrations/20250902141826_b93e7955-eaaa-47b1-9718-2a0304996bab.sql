-- Fix existing incorrect transaction for the installment sale
-- Delete the incorrect single transaction for the installment sale
DELETE FROM public.transacoes_financeiras 
WHERE venda_id = '3b8e374f-ff3b-426b-990b-76aaecd3c699';

-- Now we need to manually trigger the creation of correct transactions
-- by updating the sale to trigger the function again
DO $$
DECLARE
    venda_record record;
    categoria_venda_id uuid;
    cliente_nome text;
    valorParcela numeric;
    i integer;
    data_parcela date;
BEGIN
    -- Get the sale data
    SELECT * INTO venda_record 
    FROM public.vendas 
    WHERE id = '3b8e374f-ff3b-426b-990b-76aaecd3c699';
    
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
    
    -- Create multiple transactions for the installment sale
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