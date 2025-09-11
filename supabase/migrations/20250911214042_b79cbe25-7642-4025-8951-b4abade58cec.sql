-- Add new pricing fields to servicos table
ALTER TABLE public.servicos 
ADD COLUMN valor_minimo numeric DEFAULT 0,
ADD COLUMN valor_maximo numeric DEFAULT 0,
ADD COLUMN valor_medio numeric DEFAULT 0;

-- Update existing records to populate the new fields based on current valor
UPDATE public.servicos 
SET valor_minimo = valor * 0.8,  -- 20% below current value
    valor_maximo = valor * 1.2,  -- 20% above current value  
    valor_medio = valor          -- current value becomes the medium value
WHERE valor > 0;

-- For records with valor = 0, set all to 0
UPDATE public.servicos 
SET valor_minimo = 0,
    valor_maximo = 0, 
    valor_medio = 0
WHERE valor = 0;