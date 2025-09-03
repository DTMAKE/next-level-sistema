-- Correct the sale to have a proper salesperson responsible (different from creator)
-- Set vendedor_id to a real salesperson, not the admin who created it
UPDATE vendas 
SET vendedor_id = 'a57a9731-2495-4d8a-bbf1-299dbcde0882' -- Teste (vendedor)
WHERE id = 'ac00accc-f231-46f1-a085-d857324dbd65';