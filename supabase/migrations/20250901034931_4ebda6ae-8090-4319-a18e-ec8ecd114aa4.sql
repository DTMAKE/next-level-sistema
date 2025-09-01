-- Remove the problematic unique constraint and add a new one that makes more sense
-- The current constraint is preventing updates to existing goals

-- First, let's check what constraints exist
ALTER TABLE public.metas_vendedores DROP CONSTRAINT IF EXISTS metas_vendedores_user_id_vendedor_id_mes_ano_key;

-- Add a more appropriate unique constraint
-- A salesperson should only have one goal per month, regardless of who created it
ALTER TABLE public.metas_vendedores ADD CONSTRAINT metas_vendedores_vendedor_mes_unique 
    UNIQUE (vendedor_id, mes_ano);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_metas_vendedores_vendedor_mes ON public.metas_vendedores(vendedor_id, mes_ano);