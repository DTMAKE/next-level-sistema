-- Create propostas table for storing generated proposals
CREATE TABLE public.propostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contexto TEXT NOT NULL,
  slides_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'finalizada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

-- Only admins can view propostas
CREATE POLICY "Admins can view all propostas"
ON public.propostas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can create propostas
CREATE POLICY "Admins can create propostas"
ON public.propostas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
  AND auth.uid() = created_by
);

-- Only admins can update propostas
CREATE POLICY "Admins can update propostas"
ON public.propostas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete propostas
CREATE POLICY "Admins can delete propostas"
ON public.propostas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_propostas_updated_at
BEFORE UPDATE ON public.propostas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();