-- Update RLS policies to allow admins full access to all data

-- Update contratos policies for admin access
DROP POLICY IF EXISTS "Users can view their own contratos" ON public.contratos;
CREATE POLICY "Users can view contratos based on role" 
ON public.contratos 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can update their own contratos" ON public.contratos;
CREATE POLICY "Users can update contratos based on role" 
ON public.contratos 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can delete their own contratos" ON public.contratos;
CREATE POLICY "Users can delete contratos based on role" 
ON public.contratos 
FOR DELETE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update vendas policies for admin access
DROP POLICY IF EXISTS "Users can view their own vendas" ON public.vendas;
CREATE POLICY "Users can view vendas based on role" 
ON public.vendas 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can update their own vendas" ON public.vendas;
CREATE POLICY "Users can update vendas based on role" 
ON public.vendas 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can delete their own vendas" ON public.vendas;
CREATE POLICY "Users can delete vendas based on role" 
ON public.vendas 
FOR DELETE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update servicos policies for admin access
DROP POLICY IF EXISTS "Users can update their own servicos" ON public.servicos;
CREATE POLICY "Users can update servicos based on role" 
ON public.servicos 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can delete their own servicos" ON public.servicos;
CREATE POLICY "Users can delete servicos based on role" 
ON public.servicos 
FOR DELETE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update leads policies for admin access
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view leads based on role" 
ON public.leads 
FOR SELECT 
USING ((auth.uid() = user_id) OR (auth.uid() = vendedor_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update leads based on role" 
ON public.leads 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (auth.uid() = vendedor_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete leads based on role" 
ON public.leads 
FOR DELETE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update eventos policies for admin access
DROP POLICY IF EXISTS "Users can view their own eventos" ON public.eventos;
CREATE POLICY "Users can view eventos based on role" 
ON public.eventos 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can update their own eventos" ON public.eventos;
CREATE POLICY "Users can update eventos based on role" 
ON public.eventos 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can delete their own eventos" ON public.eventos;
CREATE POLICY "Users can delete eventos based on role" 
ON public.eventos 
FOR DELETE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update metas_faturamento policies for admin access
DROP POLICY IF EXISTS "Admins can view metas_faturamento" ON public.metas_faturamento;
CREATE POLICY "Users can view metas_faturamento based on role" 
ON public.metas_faturamento 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Admins can update metas_faturamento" ON public.metas_faturamento;
CREATE POLICY "Users can update metas_faturamento based on role" 
ON public.metas_faturamento 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Admins can delete metas_faturamento" ON public.metas_faturamento;
CREATE POLICY "Users can delete metas_faturamento based on role" 
ON public.metas_faturamento 
FOR DELETE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Update metas_vendedores policies for admin access
DROP POLICY IF EXISTS "Users can view their own metas" ON public.metas_vendedores;
CREATE POLICY "Users can view metas based on role" 
ON public.metas_vendedores 
FOR SELECT 
USING ((auth.uid() = user_id) OR (auth.uid() = vendedor_id) OR (get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "Users can update their own metas" ON public.metas_vendedores;
CREATE POLICY "Users can update metas based on role" 
ON public.metas_vendedores 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Allow admins to create metas for any user
DROP POLICY IF EXISTS "Users can create their own metas" ON public.metas_vendedores;
CREATE POLICY "Users can create metas based on role" 
ON public.metas_vendedores 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Allow admins to delete metas
CREATE POLICY "Admins can delete metas" 
ON public.metas_vendedores 
FOR DELETE 
USING (get_current_user_role() = 'admin');