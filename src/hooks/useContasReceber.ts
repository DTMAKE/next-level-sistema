import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ContaReceber {
  id: string;
  descricao: string | null;
  valor: number;
  data_transacao: string;
  data_vencimento: string | null;
  status: string | null;
  forma_pagamento: string | null;
  parcelas: number | null;
  parcela_atual: number | null;
  observacoes: string | null;
  comprovante_url: string | null;
  user_id: string;
  categoria_id: string | null;
  venda_id: string | null;
  created_at: string;
  updated_at: string;
  categorias_financeiras?: {
    nome: string;
    cor: string;
  } | null;
  vendas?: {
    id: string;
    cliente_id: string;
    clientes?: {
      nome: string;
    } | null;
  } | null;
}

export interface CreateContaReceberData {
  descricao: string;
  valor: number;
  data_transacao: string;
  data_vencimento?: string;
  forma_pagamento: 'a_vista' | 'parcelado';
  parcelas?: number;
  observacoes?: string;
  comprovante_file?: File;
}

export function useContasReceber(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['contas-receber', user?.id, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async (): Promise<ContaReceber[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categorias_financeiras (
            nome,
            cor
          ),
          vendas (
            id,
            cliente_id,
            clientes (
              nome
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('tipo', 'receita')
        .gte('data_transacao', startOfMonth.toISOString().split('T')[0])
        .lte('data_transacao', endOfMonth.toISOString().split('T')[0])
        .order('data_transacao', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useCreateContaReceber() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateContaReceberData) => {
      if (!user?.id) throw new Error('User not authenticated');

      let comprovante_url = null;
      
      // Upload do comprovante se fornecido
      if (data.comprovante_file) {
        const fileExt = data.comprovante_file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(fileName, data.comprovante_file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(fileName);
        
        comprovante_url = publicUrl;
      }

      if (data.forma_pagamento === 'a_vista') {
        // Criar uma única transação
        const { error } = await supabase
          .from('transacoes_financeiras')
          .insert([{
            user_id: user.id,
            descricao: data.descricao,
            valor: data.valor,
            data_transacao: data.data_transacao,
            data_vencimento: data.data_vencimento,
            tipo: 'receita',
            status: 'pendente',
            forma_pagamento: data.forma_pagamento,
            parcelas: 1,
            parcela_atual: 1,
            observacoes: data.observacoes,
            comprovante_url,
          }]);
        
        if (error) throw error;
      } else {
        // Criar múltiplas transações para parcelamento
        const parcelas = data.parcelas || 2;
        const valorParcela = data.valor / parcelas;
        const transactions = [];
        
        for (let i = 1; i <= parcelas; i++) {
          const dataVencimento = new Date(data.data_transacao);
          dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
          
          transactions.push({
            user_id: user.id,
            descricao: `${data.descricao} (${i}/${parcelas})`,
            valor: valorParcela,
            data_transacao: data.data_transacao,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            tipo: 'receita',
            status: 'pendente',
            forma_pagamento: data.forma_pagamento,
            parcelas,
            parcela_atual: i,
            observacoes: data.observacoes,
            comprovante_url: i === 1 ? comprovante_url : null,
          });
        }
        
        const { error } = await supabase
          .from('transacoes_financeiras')
          .insert(transactions);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: "Sucesso!",
        description: "Conta a receber criada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating conta a receber:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conta a receber. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContaReceber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContaReceber> }) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: "Sucesso!",
        description: "Conta atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating conta a receber:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta a receber.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContaReceber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: "Sucesso!",
        description: "Conta excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting conta a receber:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conta a receber.",
        variant: "destructive",
      });
    },
  });
}

export function useMarcarComoRecebida() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({ status: 'confirmada' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: "Sucesso!",
        description: "Conta marcada como recebida.",
      });
    },
    onError: (error: any) => {
      console.error('Error marking conta as received:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar conta como recebida.",
        variant: "destructive",
      });
    },
  });
}