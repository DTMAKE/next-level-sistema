import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SalesIssue {
  issue_type: string;
  count_issues: number;
  description: string;
}

export interface SalesFixResult {
  action_type: string;
  venda_id: string;
  cliente_nome: string;
  data_venda: string;
  valor: number;
  message: string;
}

export function useSalesIssuesSummary() {
  return useQuery({
    queryKey: ['sales-issues-summary'],
    queryFn: async (): Promise<SalesIssue[]> => {
      const { data, error } = await supabase.rpc('get_sales_financial_issues_summary');
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFixSalesTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SalesFixResult[]> => {
      const { data, error } = await supabase.rpc('fix_sales_financial_transactions');
      
      if (error) throw error;
      return data || [];
    },
    onSuccess: (results) => {
      const totalFixed = results.length;
      const createdMissing = results.filter(r => r.action_type === 'CREATED_MISSING').length;
      const fixedReceivables = results.filter(r => r.action_type === 'FIXED_RECEIVABLE_DATE').length;
      const fixedPayables = results.filter(r => r.action_type === 'FIXED_PAYABLE_DATE').length;

      let message = `Correção concluída! Total de operações: ${totalFixed}`;
      if (createdMissing > 0) message += `\n• ${createdMissing} transações criadas`;
      if (fixedReceivables > 0) message += `\n• ${fixedReceivables} contas a receber corrigidas`;
      if (fixedPayables > 0) message += `\n• ${fixedPayables} contas a pagar corrigidas`;

      toast({
        title: "Dados Corrigidos com Sucesso",
        description: message,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sales-issues-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Correção",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}