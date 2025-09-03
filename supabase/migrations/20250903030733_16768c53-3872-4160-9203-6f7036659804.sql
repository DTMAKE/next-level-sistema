-- Migration para implementar sistema completo de comissões e contas a pagar

-- 1. Primeiro, garantir que todos os dados estão corretos
-- Limpar comissões duplicadas se existirem
DELETE FROM public.comissoes c1
WHERE EXISTS (
    SELECT 1 FROM public.comissoes c2 
    WHERE c2.venda_id = c1.venda_id 
    AND c2.venda_id IS NOT NULL
    AND c2.created_at < c1.created_at
);

-- Limpar transações financeiras de comissão órfãs
DELETE FROM public.transacoes_financeiras 
WHERE comissao_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM public.comissoes 
    WHERE id = transacoes_financeiras.comissao_id
);

-- 2. Criar comissões para vendas fechadas que não têm comissão
WITH vendas_sem_comissao AS (
    SELECT 
        v.*,
        p.role,
        p.percentual_comissao,
        p.name as vendedor_nome,
        c.nome as cliente_nome
    FROM public.vendas v
    JOIN public.profiles p ON p.user_id = v.user_id
    LEFT JOIN public.clientes c ON c.id = v.cliente_id
    WHERE v.status = 'fechada'
    AND NOT EXISTS (
        SELECT 1 FROM public.comissoes 
        WHERE venda_id = v.id
    )
    AND (p.role = 'vendedor' OR (p.role = 'admin' AND p.percentual_comissao > 0))
),
comissoes_inseridas AS (
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
        v.user_id,
        v.id,
        v.valor,
        COALESCE(v.percentual_comissao, 5.0),
        v.valor * (COALESCE(v.percentual_comissao, 5.0) / 100),
        DATE_TRUNC('month', v.data_venda)::date,
        'pendente',
        'Comissão da venda para cliente ' || COALESCE(v.cliente_nome, 'Cliente não informado')
    FROM vendas_sem_comissao v
    RETURNING *
)
-- 3. Criar contas a pagar para as comissões criadas
INSERT INTO public.transacoes_financeiras (
    user_id,
    tipo,
    data_transacao,
    data_vencimento,
    descricao,
    valor,
    categoria_id,
    comissao_id,
    status,
    forma_pagamento,
    parcelas,
    parcela_atual
)
SELECT 
    (SELECT user_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
    'despesa',
    c.mes_referencia,
    (DATE_TRUNC('month', c.mes_referencia::timestamp) + INTERVAL '1 month - 1 day')::date,
    'Comissão de ' || COALESCE(p.name, 'Vendedor') || ' - ' || c.observacoes,
    c.valor_comissao,
    (SELECT id FROM public.categorias_financeiras WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa' ORDER BY created_at ASC LIMIT 1),
    c.id,
    'pendente',
    'a_vista',
    1,
    1
FROM comissoes_inseridas c
LEFT JOIN public.profiles p ON p.user_id = c.vendedor_id;

-- 4. Criar categoria "Comissões de Vendas" se não existir
INSERT INTO public.categorias_financeiras (user_id, nome, tipo, cor, ativo)
SELECT 
    (SELECT user_id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
    'Comissões de Vendas',
    'despesa',
    '#9333EA',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.categorias_financeiras 
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa'
);

-- 5. Atualizar contas a pagar de comissões existentes que não têm categoria
UPDATE public.transacoes_financeiras 
SET categoria_id = (
    SELECT id FROM public.categorias_financeiras 
    WHERE nome = 'Comissões de Vendas' AND tipo = 'despesa' 
    ORDER BY created_at ASC LIMIT 1
)
WHERE tipo = 'despesa' 
AND comissao_id IS NOT NULL 
AND categoria_id IS NULL;