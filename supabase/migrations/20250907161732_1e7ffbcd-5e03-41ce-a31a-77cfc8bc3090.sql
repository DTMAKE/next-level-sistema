-- Adicionar colunas para sistema de recorrência na tabela transacoes_financeiras
ALTER TABLE public.transacoes_financeiras 
ADD COLUMN recorrente boolean DEFAULT false,
ADD COLUMN frequencia text,
ADD COLUMN data_fim_recorrencia date,
ADD COLUMN recorrencia_origem_id uuid;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN public.transacoes_financeiras.recorrente IS 'Indica se a transação é recorrente';
COMMENT ON COLUMN public.transacoes_financeiras.frequencia IS 'Frequência da recorrência: mensal, trimestral, semestral, anual';
COMMENT ON COLUMN public.transacoes_financeiras.data_fim_recorrencia IS 'Data limite para gerar transações recorrentes';
COMMENT ON COLUMN public.transacoes_financeiras.recorrencia_origem_id IS 'ID da transação original que gerou esta recorrência';

-- Adicionar check constraint para frequência
ALTER TABLE public.transacoes_financeiras 
ADD CONSTRAINT check_frequencia 
CHECK (frequencia IS NULL OR frequencia IN ('mensal', 'trimestral', 'semestral', 'anual'));

-- Adicionar índice para melhorar performance de consultas de recorrência
CREATE INDEX idx_transacoes_recorrencia ON public.transacoes_financeiras(recorrente, frequencia, data_fim_recorrencia) 
WHERE recorrente = true;