-- Vamos corrigir o contrato específico que estava com problemas
-- Primeiro deletar todas as contas restantes relacionadas a este contrato para recriar limpo
DELETE FROM public.transacoes_financeiras 
WHERE contrato_id = '8141a9fd-06ef-4237-8734-37937e27393a' 
   OR descricao LIKE '%Contrato Fulano Company #001%';

-- Também deletar comissões relacionadas
DELETE FROM public.comissoes 
WHERE contrato_id = '8141a9fd-06ef-4237-8734-37937e27393a';

-- Agora vamos chamar a função para recriar as contas corretamente
SELECT public.generate_contract_future_accounts('8141a9fd-06ef-4237-8734-37937e27393a');