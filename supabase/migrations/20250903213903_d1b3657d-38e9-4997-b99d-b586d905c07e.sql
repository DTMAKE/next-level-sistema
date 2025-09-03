-- Fix the current sale to have a proper salesperson
UPDATE vendas 
SET vendedor_id = 'a57a9731-2495-4d8a-bbf1-299dbcde0882' -- Teste (vendedor)
WHERE id = '0f099dfb-0733-459e-b993-651e22036eeb';