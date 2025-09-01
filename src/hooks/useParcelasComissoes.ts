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
  contrato?: {
    id: string;
    numero_contrato: string;
    cliente: {
      nome: string;
    };
  };
}

export interface ComissaoVendedor {
  id: string;
  parcela_id: string;
  vendedor_id: string;
  valor_comissao: number;
  percentual_comissao: number;
  status_comissao: 'pendente' | 'paga' | 'cancelada';
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  parcela?: {
    id: string;
    data_vencimento: string;
    contrato: {
      id: string;
      numero_contrato: string;
      cliente: {
        nome: string;
      };
    };
  };
  vendedor?: {
    id: string;
    name: string;
    email: string;
  };
}

// Hook para buscar todas as parcelas (para contas a receber)
export function useParcelasContrato() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['parcelas', 'all', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('parcelas_contrato')
        .select(`
          *,
          contrato:contratos(
            id,
            numero_contrato,
            cliente:clientes(nome)
          )
        `);

      // Only filter by user_id if user is not admin
      if (user.role !== 'admin') {
        query = query.eq('contrato.user_id', user.id);
      }
      
      query = query.order('data_vencimento', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });
}

// Hook para buscar parcelas de um contrato específico
export function useParcelasContratoById(contratoId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['parcelas', contratoId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!contratoId) throw new Error('Contrato ID is required');
      
      const { data, error } = await supabase
        .from('parcelas_contrato')
        .select(`
          *,
          contrato:contratos(
            id,
            numero_contrato,
            cliente:clientes(nome)
          )
        `)
        .eq('contrato_id', contratoId)
        .order('numero_parcela', { ascending: true });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id && !!contratoId,
  });
}

// Hook para buscar comissões de vendedores
export function useComissoesVendedor(vendedorId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['comissoes', vendedorId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('comissoes_vendedor')
        .select(`
          *,
          parcela:parcelas_contrato(
            id,
            data_vencimento,
            contrato:contratos(
              id,
              numero_contrato,
              cliente:clientes(nome)
            )
          ),
          vendedor:profiles(name, email)
        `);

      if (vendedorId) {
        query = query.eq('vendedor_id', vendedorId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });
}

// Hook para marcar parcela como paga
export function useMarcarParcelaComoPaga() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (parcelaId: string) => {
      const { data, error } = await supabase
        .from('parcelas_contrato')
        .update({
          status_parcela: 'paga',
          data_pagamento: new Date().toISOString().split('T')[0],
          valor_pago: 0 // Será preenchido com o valor da parcela
        })
        .eq('id', parcelaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({
        title: "Parcela marcada como paga",
        description: "Status da parcela atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar parcela",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para marcar comissão como paga
export function useMarcarComissaoComoPaga() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (comissaoId: string) => {
      const { data, error } = await supabase
        .from('comissoes_vendedor')
        .update({
          status_comissao: 'paga',
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .eq('id', comissaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({
        title: "Comissão marcada como paga",
        description: "Status da comissão atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar comissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para buscar estatísticas de parcelas
export function useEstatisticasParcelas() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['estatisticas-parcelas', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('parcelas_contrato')
        .select(`
          status_parcela,
          valor_parcela,
          data_vencimento
        `);

      // Only filter by user_id if user is not admin
      if (user.role !== 'admin') {
        query = query.eq('contrato.user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calcular estatísticas
      const total = data.length;
      const pendentes = data.filter(p => p.status_parcela === 'pendente').length;
      const pagas = data.filter(p => p.status_parcela === 'paga').length;
      const atrasadas = data.filter(p => p.status_parcela === 'atrasada').length;
      const canceladas = data.filter(p => p.status_parcela === 'cancelada').length;
      
      const valorTotal = data.reduce((sum, p) => sum + Number(p.valor_parcela), 0);
      const valorPendente = data
        .filter(p => p.status_parcela === 'pendente')
        .reduce((sum, p) => sum + Number(p.valor_parcela), 0);
      const valorPago = data
        .filter(p => p.status_parcela === 'paga')
        .reduce((sum, p) => sum + Number(p.valor_parcela), 0);
      
      return {
        total,
        pendentes,
        pagas,
        atrasadas,
        canceladas,
        valorTotal,
        valorPendente,
        valorPago
      };
    },
    enabled: !!user?.id,
  });
}

// Hook para buscar estatísticas de comissões
export function useEstatisticasComissoes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['estatisticas-comissoes', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('comissoes_vendedor')
        .select(`
          status_comissao,
          valor_comissao
        `);

      // Only filter by user_id if user is not admin
      if (user.role !== 'admin') {
        query = query.eq('contrato.user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calcular estatísticas
      const total = data.length;
      const pendentes = data.filter(c => c.status_comissao === 'pendente').length;
      const pagas = data.filter(c => c.status_comissao === 'paga').length;
      const canceladas = data.filter(c => c.status_comissao === 'cancelada').length;
      
      const valorTotal = data.reduce((sum, c) => sum + Number(c.valor_comissao), 0);
      const valorPendente = data
        .filter(c => c.status_comissao === 'pendente')
        .reduce((sum, c) => sum + Number(c.valor_comissao), 0);
      const valorPago = data
        .filter(c => c.status_comissao === 'paga')
        .reduce((sum, c) => sum + Number(c.valor_comissao), 0);
      
      return {
        total,
        pendentes,
        pagas,
        canceladas,
        valorTotal,
        valorPendente,
        valorPago
      };
    },
    enabled: !!user?.id,
  });
}
