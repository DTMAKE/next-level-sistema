-- Corrigir função com search_path fixo para segurança
CREATE OR REPLACE FUNCTION public.create_financial_transaction_from_closed_sale()
RETURNS TRIGGER AS $$
DECLARE
    categoria_venda_id uuid;
    cliente_nome text;
    admin_user_id uuid;
BEGIN
    -- Só processar se a venda está sendo marcada como 'fechada'
    IF NEW.status = 'fechada' AND (OLD.status IS NULL OR OLD.status != 'fechada') THEN
        -- Buscar nome do cliente
        SELECT nome INTO cliente_nome
        FROM public.clientes
        WHERE id = NEW.cliente_id;
        
        -- Buscar categoria "Venda" global (primeira criada)
        SELECT id INTO categoria_venda_id
        FROM public.categorias_financeiras
        WHERE nome = 'Venda' 
        AND tipo = 'receita'
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Se não existe categoria "Venda" global, criar uma
        IF categoria_venda_id IS NULL THEN
            -- Buscar primeiro admin
            SELECT user_id INTO admin_user_id
            FROM public.profiles
            WHERE role = 'admin'
            LIMIT 1;
            
            -- Se não há admin, usar o usuário atual
            IF admin_user_id IS NULL THEN
                admin_user_id := NEW.user_id;
            END IF;
            
            INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
            VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
            RETURNING id INTO categoria_venda_id;
        END IF;
        
        -- Criar transação financeira
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
            'Receita da venda para cliente ' || COALESCE(cliente_nome, 'Cliente não encontrado'),
            NEW.valor,
            categoria_venda_id,
            NEW.id,
            'confirmada'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';