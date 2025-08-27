-- Add status column to clientes table
ALTER TABLE public.clientes 
ADD COLUMN status text DEFAULT 'cliente' CHECK (status IN ('cliente', 'lead'));

-- Add index for better performance on status filtering
CREATE INDEX idx_clientes_status ON public.clientes(status);

-- Update existing records to have default status
UPDATE public.clientes 
SET status = 'cliente' 
WHERE status IS NULL;