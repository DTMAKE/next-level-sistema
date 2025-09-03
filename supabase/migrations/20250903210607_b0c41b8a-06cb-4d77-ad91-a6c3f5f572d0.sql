-- Update existing sales to set vendedor_id = user_id where vendedor_id is null
UPDATE vendas 
SET vendedor_id = user_id 
WHERE vendedor_id IS NULL;