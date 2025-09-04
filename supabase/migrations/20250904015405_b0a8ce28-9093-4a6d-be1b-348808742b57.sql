-- Create trigger to generate financial transactions when a contract is created
-- This will create the first month's transaction that was missing

CREATE OR REPLACE TRIGGER contract_financial_transactions_trigger
    AFTER INSERT ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.create_contract_financial_transactions_trigger();

-- Also create missing first month transactions for existing recurring contracts
-- that don't have transactions for their start month

INSERT INTO public.transacoes_financeiras (
    user_id,
    tipo,
    data_transacao,
    data_vencimento,
    descricao,
    valor,
    categoria_id,
    contrato_id,
    status
)
SELECT 
    c.user_id,
    'receita',
    -- Use the due date (dia_vencimento) in the start month
    (DATE_TRUNC('month', c.data_inicio) + INTERVAL '1 day' * (COALESCE(c.dia_vencimento, 1) - 1))::date,
    (DATE_TRUNC('month', c.data_inicio) + INTERVAL '1 day' * (COALESCE(c.dia_vencimento, 1) - 1))::date,
    'Receita recorrente - Contrato ' || COALESCE(c.numero_contrato, c.id::text) || ' - ' || COALESCE(cl.nome, 'Cliente'),
    c.valor,
    (SELECT id FROM public.categorias_financeiras WHERE nome = 'Venda' AND tipo = 'receita' ORDER BY created_at ASC LIMIT 1),
    c.id,
    CASE 
        WHEN DATE_TRUNC('month', c.data_inicio) <= DATE_TRUNC('month', CURRENT_DATE) THEN 'pendente'
        ELSE 'pendente'
    END
FROM public.contratos c
LEFT JOIN public.clientes cl ON cl.id = c.cliente_id
WHERE c.tipo_contrato = 'recorrente'
AND c.status = 'ativo'
AND c.data_inicio IS NOT NULL
-- Only create if no transaction exists for the start month
AND NOT EXISTS (
    SELECT 1 
    FROM public.transacoes_financeiras tf 
    WHERE tf.contrato_id = c.id 
    AND tf.tipo = 'receita'
    AND DATE_TRUNC('month', tf.data_transacao) = DATE_TRUNC('month', c.data_inicio)
);