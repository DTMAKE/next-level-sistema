-- Limpeza de dados fake/teste do sistema financeiro

-- 1. Excluir transações financeiras relacionadas a vendas fake
DELETE FROM public.transacoes_financeiras 
WHERE venda_id IN (
    SELECT v.id 
    FROM vendas v 
    JOIN clientes c ON v.cliente_id = c.id 
    WHERE c.nome ILIKE '%fulano%' 
       OR c.nome ILIKE '%teste%' 
       OR c.email ILIKE '%teste%' 
       OR c.email ILIKE '%@example%'
);

-- 2. Excluir transações financeiras relacionadas a comissões fake
DELETE FROM public.transacoes_financeiras 
WHERE comissao_id IN (
    SELECT co.id 
    FROM comissoes co
    JOIN vendas v ON co.venda_id = v.id
    JOIN clientes c ON v.cliente_id = c.id 
    WHERE c.nome ILIKE '%fulano%' 
       OR c.nome ILIKE '%teste%' 
       OR c.email ILIKE '%teste%' 
       OR c.email ILIKE '%@example%'
);

-- 3. Excluir transações financeiras com descrições de teste
DELETE FROM public.transacoes_financeiras 
WHERE descricao ILIKE '%fulano%' 
   OR descricao ILIKE '%teste%'
   OR descricao ILIKE '%exemplo%';

-- 4. Excluir comissões relacionadas a vendas fake
DELETE FROM public.comissoes 
WHERE venda_id IN (
    SELECT v.id 
    FROM vendas v 
    JOIN clientes c ON v.cliente_id = c.id 
    WHERE c.nome ILIKE '%fulano%' 
       OR c.nome ILIKE '%teste%' 
       OR c.email ILIKE '%teste%' 
       OR c.email ILIKE '%@example%'
);

-- 5. Excluir comissões com observações de teste
DELETE FROM public.comissoes 
WHERE observacoes ILIKE '%fulano%' 
   OR observacoes ILIKE '%teste%'
   OR observacoes ILIKE '%exemplo%';

-- 6. Excluir venda_servicos relacionados a vendas fake
DELETE FROM public.venda_servicos 
WHERE venda_id IN (
    SELECT v.id 
    FROM vendas v 
    JOIN clientes c ON v.cliente_id = c.id 
    WHERE c.nome ILIKE '%fulano%' 
       OR c.nome ILIKE '%teste%' 
       OR c.email ILIKE '%teste%' 
       OR c.email ILIKE '%@example%'
);

-- 7. Excluir vendas fake
DELETE FROM public.vendas 
WHERE cliente_id IN (
    SELECT id FROM clientes 
    WHERE nome ILIKE '%fulano%' 
       OR nome ILIKE '%teste%' 
       OR email ILIKE '%teste%' 
       OR email ILIKE '%@example%'
);

-- 8. Excluir clientes fake/teste
DELETE FROM public.clientes 
WHERE nome ILIKE '%fulano%' 
   OR nome ILIKE '%teste%' 
   OR email ILIKE '%teste%' 
   OR email ILIKE '%@example%';

-- 9. Limpar categorias financeiras desnecessárias (apenas se não tiverem transações reais associadas)
DELETE FROM public.categorias_financeiras 
WHERE id NOT IN (
    SELECT DISTINCT categoria_id 
    FROM transacoes_financeiras 
    WHERE categoria_id IS NOT NULL
) AND nome NOT IN ('Venda', 'Comissões de Vendas');

-- 10. Recalcular comissões para vendas reais que possam ter ficado sem comissão
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
)
SELECT 
    v.user_id,
    v.user_id as vendedor_id,
    v.id as venda_id,
    v.valor as valor_venda,
    COALESCE(p.percentual_comissao, 5.00) as percentual,
    v.valor * (COALESCE(p.percentual_comissao, 5.00) / 100) as valor_comissao,
    DATE_TRUNC('month', v.data_venda)::date as mes_referencia,
    'pendente' as status,
    'Comissão recalculada após limpeza de dados' as observacoes
FROM public.vendas v
LEFT JOIN public.profiles p ON p.user_id = v.user_id
WHERE v.status = 'fechada'
AND NOT EXISTS (
    SELECT 1 FROM public.comissoes c 
    WHERE c.venda_id = v.id
);

-- 11. Criar transações financeiras para vendas reais fechadas que não têm transação
DO $$
DECLARE
    venda_record record;
    categoria_venda_id uuid;
    cliente_nome text;
    admin_user_id uuid;
BEGIN
    -- Buscar categoria "Venda" global
    SELECT id INTO categoria_venda_id
    FROM public.categorias_financeiras
    WHERE nome = 'Venda' 
    AND tipo = 'receita'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Se não existe categoria "Venda" global, criar uma
    IF categoria_venda_id IS NULL THEN
        SELECT user_id INTO admin_user_id
        FROM public.profiles
        WHERE role = 'admin'
        LIMIT 1;
        
        IF admin_user_id IS NULL THEN
            SELECT user_id INTO admin_user_id
            FROM public.profiles
            LIMIT 1;
        END IF;
        
        INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
        VALUES (admin_user_id, 'Venda', 'receita', '#10B981', true)
        RETURNING id INTO categoria_venda_id;
    END IF;
    
    -- Criar transações para vendas fechadas sem transação financeira
    FOR venda_record IN
        SELECT v.*, c.nome as cliente_nome
        FROM public.vendas v
        JOIN public.clientes c ON v.cliente_id = c.id
        WHERE v.status = 'fechada'
        AND NOT EXISTS (
            SELECT 1 FROM public.transacoes_financeiras tf 
            WHERE tf.venda_id = v.id
        )
    LOOP
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
            venda_record.user_id,
            'receita',
            venda_record.data_venda,
            'Receita da venda para cliente ' || venda_record.cliente_nome,
            venda_record.valor,
            categoria_venda_id,
            venda_record.id,
            'confirmada'
        );
    END LOOP;
END;
$$;