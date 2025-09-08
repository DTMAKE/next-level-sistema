-- Verificar a constraint atual e corrigir os valores aceitos para forma_pagamento
-- Primeiro, remover a constraint existente se houver
ALTER TABLE transacoes_financeiras DROP CONSTRAINT IF EXISTS check_forma_pagamento;

-- Criar nova constraint com todos os valores aceitos
ALTER TABLE transacoes_financeiras 
ADD CONSTRAINT check_forma_pagamento 
CHECK (forma_pagamento IN (
  'a_vista', 
  'parcelado', 
  'pix', 
  'dinheiro', 
  'cartao_credito', 
  'cartao_debito', 
  'boleto', 
  'transferencia'
));

-- Também atualizar a constraint da tabela vendas se existir
ALTER TABLE vendas DROP CONSTRAINT IF EXISTS check_forma_pagamento;

ALTER TABLE vendas 
ADD CONSTRAINT check_forma_pagamento 
CHECK (forma_pagamento IN (
  'a_vista', 
  'parcelado', 
  'pix', 
  'dinheiro', 
  'cartao_credito', 
  'cartao_debito', 
  'boleto', 
  'transferencia'
));