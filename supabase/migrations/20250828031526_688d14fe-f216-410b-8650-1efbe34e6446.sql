-- Create triggers for commission calculation
CREATE TRIGGER calculate_commission_trigger
  AFTER INSERT ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_from_sale();

CREATE TRIGGER update_commission_trigger
  AFTER UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_from_sale();

-- Manually calculate commissions for existing closed sales
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
    'Comissão calculada automaticamente para venda existente' as observacoes
FROM public.vendas v
LEFT JOIN public.profiles p ON p.user_id = v.user_id
WHERE v.status = 'fechada'
AND NOT EXISTS (
    SELECT 1 FROM public.comissoes c 
    WHERE c.venda_id = v.id
);