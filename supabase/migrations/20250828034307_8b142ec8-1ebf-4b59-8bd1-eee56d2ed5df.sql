-- Update RLS policies for financial tables to allow admin access

-- Update transacoes_financeiras SELECT policy
DROP POLICY IF EXISTS "Users can view their own transacoes_financeiras" ON public.transacoes_financeiras;

CREATE POLICY "Users can view transacoes based on role" 
ON public.transacoes_financeiras 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update categorias_financeiras SELECT policy
DROP POLICY IF EXISTS "Users can view their own categorias_financeiras" ON public.categorias_financeiras;

CREATE POLICY "Users can view categorias based on role" 
ON public.categorias_financeiras 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update comissoes SELECT policy
DROP POLICY IF EXISTS "Users can view their own comissoes" ON public.comissoes;

CREATE POLICY "Users can view comissoes based on role" 
ON public.comissoes 
FOR SELECT 
USING ((auth.uid() = user_id) OR (auth.uid() = vendedor_id) OR (get_current_user_role() = 'admin'));