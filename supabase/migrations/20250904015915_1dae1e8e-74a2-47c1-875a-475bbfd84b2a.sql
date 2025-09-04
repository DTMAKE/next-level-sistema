-- Fix existing commissions to use vendedor_id instead of user_id
UPDATE public.comissoes 
SET vendedor_id = c.vendedor_id
FROM public.contratos c
WHERE public.comissoes.contrato_id = c.id 
AND c.vendedor_id IS NOT NULL 
AND public.comissoes.vendedor_id != c.vendedor_id;

-- Update commission descriptions to reflect correct salesperson
UPDATE public.transacoes_financeiras tf
SET descricao = 'Comissão de ' || COALESCE(pv.name, 'Vendedor') || ' - Contrato ' || COALESCE(c.numero_contrato, c.id::text)
FROM public.comissoes co
JOIN public.contratos c ON c.id = co.contrato_id
LEFT JOIN public.profiles pv ON pv.user_id = co.vendedor_id
WHERE tf.comissao_id = co.id
AND c.vendedor_id IS NOT NULL;