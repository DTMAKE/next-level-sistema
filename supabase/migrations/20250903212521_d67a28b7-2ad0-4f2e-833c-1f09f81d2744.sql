-- Update specific sale to have vendedor_id set to user_id
UPDATE vendas 
SET vendedor_id = user_id 
WHERE id = 'ac00accc-f231-46f1-a085-d857324dbd65' 
AND vendedor_id IS NULL;