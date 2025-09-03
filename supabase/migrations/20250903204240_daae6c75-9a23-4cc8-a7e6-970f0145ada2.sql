-- Add vendedor_id column to vendas table to track the selected salesperson
ALTER TABLE vendas ADD COLUMN vendedor_id uuid REFERENCES profiles(user_id);

-- Create index for better performance
CREATE INDEX idx_vendas_vendedor_id ON vendas(vendedor_id);

-- Update existing records to set vendedor_id = user_id where not already set
UPDATE vendas SET vendedor_id = user_id WHERE vendedor_id IS NULL;