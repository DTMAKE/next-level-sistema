-- Add DELETE policy for candidaturas table
-- Allow admins to delete candidaturas
CREATE POLICY "Admins can delete candidaturas" ON public.candidaturas
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );