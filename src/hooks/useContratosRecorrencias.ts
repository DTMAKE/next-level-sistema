import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ContratoRecorrencia {
  id: string;
  contrato_id: string;
  mes_referencia: string;
  valor_mes: number;
  status: 'pendente' | 'processado' | 'cancelado';
  data_processamento?: string;
  created_at: string;
  updated_at: string;
  // Dados do contrato via join
  contrato?: {
    id: string;
    numero_contrato?: string;
    titulo?: string;
    valor: number;
    cliente?: {
      id: string;
      nome: string;
    };
  };
}

export function useContratosRecorrencias(contratoId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['contratos-recorrencias', contratoId, user?.id, user?.role],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('contratos_recorrencias')
        .select(`
          *,
          contrato:contratos(
            id,
            numero_contrato,
            titulo,
            valor,
            cliente:clientes(id, nome)
          )
        `);

      if (contratoId) {
        query = query.eq('contrato_id', contratoId);
      }
      
      query = query.order('mes_referencia', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!user?.id,
  });
}

export function useProcessContractRecurrences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (targetMonth?: string) => {
      const { data, error } = await supabase.functions.invoke('process-contract-recurrences', {
        body: { target_month: targetMonth }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-recorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes_financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      toast({
        title: "Recorrências processadas",
        description: "Receitas e comissões recorrentes foram geradas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar recorrências",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para obter estatísticas de contratos recorrentes
export function useRecurringContractsStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recurring-contracts-stats', user?.id, user?.role],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('contratos')
        .select('id, valor, status, tipo_contrato, data_inicio, data_fim, cliente:clientes(nome)');

      // Only filter by user_id if user is not admin
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      query = query.eq('tipo_contrato', 'recorrente').eq('status', 'ativo');

      const { data, error } = await query;
      
      if (error) throw error;

      const totalContratos = data?.length || 0;
      const mrr = data?.reduce((acc, contrato) => acc + (contrato.valor || 0), 0) || 0;
      const contratos = data || [];

      return {
        totalContratos,
        mrr,
        contratos: contratos.map(c => ({
          id: c.id,
          valor: c.valor,
          cliente_nome: c.cliente?.nome || 'Cliente não encontrado'
        }))
      };
    },
    enabled: !!user?.id,
  });
}