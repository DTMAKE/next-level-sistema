-- Add valor_implementacao field to servicos table
ALTER TABLE public.servicos 
ADD COLUMN valor_implementacao numeric DEFAULT 0;