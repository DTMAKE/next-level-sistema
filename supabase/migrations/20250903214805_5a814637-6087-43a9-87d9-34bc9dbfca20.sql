-- Fix this specific sale to have a proper salesperson
UPDATE vendas 
SET vendedor_id = 'a57a9731-2495-4d8a-bbf1-299dbcde0882' -- Teste (vendedor)
WHERE id = 'ed99fe9e-e161-4ffa-82c6-b50f87947816';