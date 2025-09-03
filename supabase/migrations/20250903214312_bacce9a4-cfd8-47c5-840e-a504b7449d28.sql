-- Fix this specific sale to have a proper salesperson
UPDATE vendas 
SET vendedor_id = 'a57a9731-2495-4d8a-bbf1-299dbcde0882' -- Teste (vendedor)
WHERE id = 'cef90a57-a8c6-4a35-98ec-1e89c483fd9b';