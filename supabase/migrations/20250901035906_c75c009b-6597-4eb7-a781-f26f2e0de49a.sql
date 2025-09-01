-- Remove existing commissions that were incorrectly created for admins
-- First, delete the financial transactions linked to admin commissions
DELETE FROM transacoes_financeiras 
WHERE comissao_id IN (
    SELECT c.id 
    FROM comissoes c 
    JOIN profiles p ON c.vendedor_id = p.user_id 
    WHERE p.role = 'admin'
);

-- Then delete the admin commissions themselves
DELETE FROM comissoes 
WHERE vendedor_id IN (
    SELECT user_id 
    FROM profiles 
    WHERE role = 'admin'
);