-- Permitir que usuários criem transacoes financeiras para comissões
-- Adicionar política para permitir criação de transações de comissão por usuários autorizados

-- Remover política existente se houver
DROP POLICY IF EXISTS "Users can create commission transactions" ON transacoes_financeiras;

-- Criar nova política para permitir criação de transações de comissão
CREATE POLICY "Users can create commission transactions" 
ON transacoes_financeiras 
FOR INSERT 
WITH CHECK (
  -- Usuário pode criar sua própria transação OU
  -- É uma transação de comissão sendo criada por um vendedor/admin
  (auth.uid() = user_id) OR
  (
    comissao_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('vendedor', 'admin')
    )
  )
);