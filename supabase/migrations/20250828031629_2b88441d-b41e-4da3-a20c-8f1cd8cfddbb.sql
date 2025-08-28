-- Create function to manually calculate missing commissions
CREATE OR REPLACE FUNCTION public.calculate_missing_commissions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert commissions for closed sales that don't have commissions yet
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
      'Comissão recalculada manualmente' as observacoes
  FROM public.vendas v
  LEFT JOIN public.profiles p ON p.user_id = v.user_id
  WHERE v.status = 'fechada'
  AND v.user_id = p_user_id
  AND NOT EXISTS (
      SELECT 1 FROM public.comissoes c 
      WHERE c.venda_id = v.id
  );
END;
$function$