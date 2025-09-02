-- Fix RLS policies to allow admins to update financial transactions
DROP POLICY IF EXISTS "Users can update their own transacoes_financeiras" ON public.transacoes_financeiras;

CREATE POLICY "Users can update transacoes based on role"
ON public.transacoes_financeiras
FOR UPDATE
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'::text));