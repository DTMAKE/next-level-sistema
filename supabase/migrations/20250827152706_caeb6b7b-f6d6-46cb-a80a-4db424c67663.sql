-- Add status column to transacoes_financeiras for better accounts management
ALTER TABLE public.transacoes_financeiras 
ADD COLUMN status text DEFAULT 'confirmada' CHECK (status IN ('pendente', 'confirmada', 'cancelada'));

-- Add data_vencimento column for better payment control
ALTER TABLE public.transacoes_financeiras 
ADD COLUMN data_vencimento date;

-- Add observacoes column for additional notes
ALTER TABLE public.transacoes_financeiras 
ADD COLUMN observacoes text;