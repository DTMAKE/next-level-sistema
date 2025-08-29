-- Add new fields to transacoes_financeiras for payment method and installments
ALTER TABLE public.transacoes_financeiras 
ADD COLUMN IF NOT EXISTS forma_pagamento text DEFAULT 'a_vista',
ADD COLUMN IF NOT EXISTS parcelas integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS parcela_atual integer DEFAULT 1;

-- Add check constraints for the new fields
ALTER TABLE public.transacoes_financeiras 
ADD CONSTRAINT check_forma_pagamento 
CHECK (forma_pagamento IN ('a_vista', 'parcelado'));

ALTER TABLE public.transacoes_financeiras 
ADD CONSTRAINT check_parcelas_positive 
CHECK (parcelas > 0);

ALTER TABLE public.transacoes_financeiras 
ADD CONSTRAINT check_parcela_atual_valid 
CHECK (parcela_atual > 0 AND parcela_atual <= parcelas);

-- Create storage bucket for expense receipts/invoices if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for expense receipts
DO $$
BEGIN
    -- Policy for viewing own receipts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own expense receipts'
    ) THEN
        CREATE POLICY "Users can view their own expense receipts"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Policy for uploading own receipts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own expense receipts'
    ) THEN
        CREATE POLICY "Users can upload their own expense receipts"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Policy for updating own receipts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own expense receipts'
    ) THEN
        CREATE POLICY "Users can update their own expense receipts"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Policy for deleting own receipts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own expense receipts'
    ) THEN
        CREATE POLICY "Users can delete their own expense receipts"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;