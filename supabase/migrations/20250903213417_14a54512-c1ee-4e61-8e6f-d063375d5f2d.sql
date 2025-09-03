-- Fix the current sale to have a proper salesperson
UPDATE vendas 
SET vendedor_id = 'a57a9731-2495-4d8a-bbf1-299dbcde0882' -- Teste (vendedor)
WHERE id = '613b273c-4c43-41e2-837b-338b9176f5df';