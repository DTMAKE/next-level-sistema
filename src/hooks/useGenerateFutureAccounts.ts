import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGenerateFutureAccounts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contratoId: string) => {
      const { data, error } = await supabase.rpc('generate_future_receivables_and_payables', {
        p_contrato_id: contratoId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      
      toast({
        title: "Contas futuras geradas",
        description: "Contas a receber e pagar do contrato foram criadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar contas futuras",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelFutureAccounts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contratoId: string) => {
      const { data, error } = await supabase.rpc('cancel_future_contract_accounts', {
        p_contrato_id: contratoId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      
      toast({
        title: "Contas futuras canceladas",
        description: "Contas futuras do contrato foram canceladas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar contas futuras",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}