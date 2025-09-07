import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useProcessRecurringTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-recurring-transactions');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas a transações financeiras
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      
      toast({
        title: "Sucesso!",
        description: `Processamento concluído. ${data.created} novas transações recorrentes foram criadas.`,
      });
    },
    onError: (error: any) => {
      console.error('Error processing recurring transactions:', error);
      toast({
        title: "Erro!",
        description: "Erro ao processar transações recorrentes.",
        variant: "destructive",
      });
    },
  });
}

export function useCancelRecurringTransaction() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      // Marcar a transação como não recorrente
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({ 
          recorrente: false,
          frequencia: null,
          data_fim_recorrencia: null
        })
        .eq('id', transactionId);

      if (error) throw error;

      // Deletar futuras transações pendentes desta recorrência
      const { error: deleteError } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('recorrencia_origem_id', transactionId)
        .eq('status', 'pendente');

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      
      toast({
        title: "Sucesso!",
        description: "Recorrência cancelada com sucesso. Transações futuras foram removidas.",
      });
    },
    onError: (error: any) => {
      console.error('Error canceling recurring transaction:', error);
      toast({
        title: "Erro!",
        description: "Erro ao cancelar recorrência.",
        variant: "destructive",
      });
    },
  });
}