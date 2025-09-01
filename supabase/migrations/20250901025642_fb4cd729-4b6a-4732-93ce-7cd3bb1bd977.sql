-- Corrigir políticas RLS para projetos Kanban - restringir acesso baseado em ownership
DROP POLICY IF EXISTS "All authenticated users can view projetos" ON public.projetos;
DROP POLICY IF EXISTS "All authenticated users can create projetos" ON public.projetos;
DROP POLICY IF EXISTS "All authenticated users can update projetos" ON public.projetos;
DROP POLICY IF EXISTS "All authenticated users can delete projetos" ON public.projetos;

CREATE POLICY "Users can view their own projects and public projects"
ON public.projetos
FOR SELECT
USING (auth.uid() = user_id OR privado = false);

CREATE POLICY "Users can create their own projects"
ON public.projetos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projetos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projetos
FOR DELETE
USING (auth.uid() = user_id);

-- Corrigir políticas RLS para colunas Kanban
DROP POLICY IF EXISTS "All authenticated users can view colunas_kanban" ON public.colunas_kanban;
DROP POLICY IF EXISTS "All authenticated users can create colunas_kanban" ON public.colunas_kanban;
DROP POLICY IF EXISTS "All authenticated users can update colunas_kanban" ON public.colunas_kanban;
DROP POLICY IF EXISTS "All authenticated users can delete colunas_kanban" ON public.colunas_kanban;

CREATE POLICY "Users can view columns of accessible projects"
ON public.colunas_kanban
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND (p.user_id = auth.uid() OR p.privado = false)
  )
);

CREATE POLICY "Users can create columns in their own projects"
ON public.colunas_kanban
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns in their own projects"
ON public.colunas_kanban
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete columns in their own projects"
ON public.colunas_kanban
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND p.user_id = auth.uid()
  )
);

-- Corrigir políticas RLS para tarefas
DROP POLICY IF EXISTS "All authenticated users can view tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "All authenticated users can create tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "All authenticated users can update tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "All authenticated users can delete tarefas" ON public.tarefas;

CREATE POLICY "Users can view tasks of accessible projects"
ON public.tarefas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND (p.user_id = auth.uid() OR p.privado = false)
  )
);

CREATE POLICY "Users can create tasks in their own projects"
ON public.tarefas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks in their own projects"
ON public.tarefas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks in their own projects"
ON public.tarefas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projetos p 
    WHERE p.id = projeto_id 
    AND p.user_id = auth.uid()
  )
);

-- Remover função de verificação de senha insegura e criar uma mais segura
DROP FUNCTION IF EXISTS public.verify_admin_password(text);

CREATE OR REPLACE FUNCTION public.verify_admin_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles 
  WHERE user_id = current_user_id;
  
  RETURN COALESCE(is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;