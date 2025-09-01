import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ParcelaContrato {
  id: string;
  contrato_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status_parcela: 'pendente' | 'paga' | 'atrasada' | 'cancelada';
  data_pagamento?: string;
  valor_pago?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  contratos?: {
    id: string;
    descricao: string;
    valor: number;
    data_inicio: string;
    data_fim?: string;
    tipo_contrato: string;
    status: string;
    clientes?: {
      nome: string;
    } | null;
  } | null;
}

export function useParcelasContrato(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['parcelas-contrato', user?.id, user?.role, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async (): Promise<ParcelaContrato[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('parcelas_contrato')
        .select(`
          *,
          contratos (
            id,
            descricao,
            valor,
            data_inicio,
            data_fim,
            tipo_contrato,
            status,
            clientes (
              nome
            )
          )
        `)
        .gte('data_vencimento', startOfMonth.toISOString().split('T')[0])
        .lte('data_vencimento', endOfMonth.toISOString().split('T')[0]);

      // Filter by user_id unless user is admin
      if (user.role !== 'admin') {
        query = query.eq('contratos.user_id', user.id);
      }

      const { data, error } = await query.order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useMarcarParcelaComoPaga() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (parcelaId: string) => {
      const { error } = await supabase
        .from('parcelas_contrato')
        .update({ 
          status_parcela: 'paga',
          data_pagamento: new Date().toISOString().split('T')[0],
          valor_pago: supabase
            .from('parcelas_contrato')
            .select('valor_parcela')
            .eq('id', parcelaId)
            .single()
            .then(result => result.data?.valor_parcela)
        })
        .eq('id', parcelaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas-contrato'] });
      toast({
        title: "Sucesso!",
        description: "Parcela marcada como paga.",
      });
    },
    onError: (error: any) => {
      console.error('Error marking parcela as paid:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar parcela como paga.",
        variant: "destructive",
      });
    },
  });
}

export function useEstatisticasParcelas(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['estatisticas-parcelas', user?.id, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('parcelas_contrato')
        .select('status_parcela, valor_parcela')
        .gte('data_vencimento', startOfMonth.toISOString().split('T')[0])
        .lte('data_vencimento', endOfMonth.toISOString().split('T')[0]);

      // Filter by user_id unless user is admin
      if (user.role !== 'admin') {
        query = query.eq('contratos.user_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const pendentes = data?.filter(p => p.status_parcela === 'pendente').length || 0;
      const pagas = data?.filter(p => p.status_parcela === 'paga').length || 0;
      const atrasadas = data?.filter(p => p.status_parcela === 'atrasada').length || 0;
      const valorTotal = data?.reduce((sum, p) => sum + Number(p.valor_parcela), 0) || 0;
      const valorPendente = data?.filter(p => p.status_parcela === 'pendente')
        .reduce((sum, p) => sum + Number(p.valor_parcela), 0) || 0;
      
      return {
        total,
        pendentes,
        pagas,
        atrasadas,
        valorTotal,
        valorPendente
      };
    },
    enabled: !!user?.id,
  });
}
