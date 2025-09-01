-- Clean up duplicate commission transactions
-- Keep only one transaction per commission (the one from the first admin created)

WITH first_admin AS (
  SELECT user_id FROM profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1
),
duplicates_to_delete AS (
  SELECT tf.id
  FROM transacoes_financeiras tf
  CROSS JOIN first_admin fa
  WHERE tf.comissao_id IS NOT NULL
    AND tf.user_id != fa.user_id
    AND tf.tipo = 'despesa'
    AND tf.descricao LIKE '%Comissão%'
)
DELETE FROM transacoes_financeiras 
WHERE id IN (SELECT id FROM duplicates_to_delete);