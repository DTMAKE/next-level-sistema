-- Remover transações de receita sem fonte (órfãs)
-- Essas são receitas que não têm venda_id, ou seja, não têm origem definida

DELETE FROM public.transacoes_financeiras 
WHERE tipo = 'receita' 
AND venda_id IS NULL 
AND (descricao IS NULL OR descricao = '' OR descricao = 'Receita sem descrição');

-- Garantir que futuras receitas devem ter uma fonte (venda_id ou ser criadas manualmente)
-- Não vamos adicionar constraint pois receitas manuais são válidas, mas vamos melhorar a validação no código