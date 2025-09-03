import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGenerateContractCommissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Gerando comissões futuras de contratos ativos...');
      const { error } = await supabase.rpc('generate_future_contract_commissions');
      
      if (error) {
        console.error('Erro ao gerar comissões:', error);
        throw error;
      }
      
      console.log('Comissões futuras geradas com sucesso');
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      
      toast({
        title: "Sucesso!",
        description: "Comissões futuras de contratos geradas com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao gerar comissões:', error);
      toast({
        title: "Erro!",
        description: "Erro ao gerar comissões futuras de contratos.",
        variant: "destructive",
      });
    },
  });
}