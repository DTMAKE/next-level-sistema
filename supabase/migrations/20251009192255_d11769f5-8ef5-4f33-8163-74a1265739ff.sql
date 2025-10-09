-- Remove propostas table
DROP TABLE IF EXISTS public.propostas CASCADE;

-- Create senhas table for password management
CREATE TABLE public.senhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  usuario TEXT,
  senha TEXT NOT NULL,
  url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.senhas ENABLE ROW LEVEL SECURITY;

-- Only admins can view senhas
CREATE POLICY "Admins can view all senhas"
ON public.senhas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can create senhas
CREATE POLICY "Admins can create senhas"
ON public.senhas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
  AND auth.uid() = user_id
);

-- Only admins can update senhas
CREATE POLICY "Admins can update senhas"
ON public.senhas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete senhas
CREATE POLICY "Admins can delete senhas"
ON public.senhas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_senhas_updated_at
BEFORE UPDATE ON public.senhas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();