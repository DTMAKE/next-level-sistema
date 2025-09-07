import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Função utilitária para gerar transações recorrentes
async function generateRecurringTransactions(originalTransaction: any, frequencia: string, dataFim?: string) {
  const endDate = dataFim ? new Date(dataFim) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano se não especificado
  const startDate = new Date(originalTransaction.data_transacao);
  const transactions = [];
  
  let currentDate = new Date(startDate);
  
  // Definir incremento baseado na frequência
  const incrementMonths = {
    'mensal': 1,
    'trimestral': 3,
    'semestral': 6,
    'anual': 12
  }[frequencia] || 1;
  
  // Gerar até 24 transações futuras ou até a data fim
  for (let i = 1; i <= 24 && currentDate <= endDate; i++) {
    currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + (incrementMonths * i));
    
    if (currentDate > endDate) break;
    
    const dataVencimento = originalTransaction.data_vencimento ? 
      new Date(new Date(originalTransaction.data_vencimento).getTime() + (incrementMonths * i * 30 * 24 * 60 * 60 * 1000)) : 
      null;
    
    transactions.push({
      user_id: originalTransaction.user_id,
      tipo: originalTransaction.tipo,
      descricao: originalTransaction.descricao,
      valor: originalTransaction.valor,
      data_transacao: currentDate.toISOString().split('T')[0],
      data_vencimento: dataVencimento ? dataVencimento.toISOString().split('T')[0] : null,
      forma_pagamento: originalTransaction.forma_pagamento,
      parcelas: originalTransaction.parcelas,
      parcela_atual: originalTransaction.parcela_atual,
      observacoes: originalTransaction.observacoes,
      status: 'pendente',
      recorrencia_origem_id: originalTransaction.id,
    });
  }
  
  if (transactions.length > 0) {
    const { error } = await supabase
      .from('transacoes_financeiras')
      .insert(transactions);
    
    if (error) {
      console.error('Erro ao gerar transações recorrentes:', error);
    }
  }
}

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
  contrato_id: string | null;
  created_at: string;
  updated_at: string;
  categorias_financeiras?: {
    nome: string;
    cor: string;
  } | null;
  vendas?: {
    id: string;
    numero_venda: string | null;
    cliente_id: string;
    user_id: string;
    vendedor_id?: string;
    clientes?: {
      nome: string;
    } | null;
  } | null;
  contratos?: {
    id: string;
    numero_contrato: string | null;
    cliente_id: string;
    vendedor_id?: string;
    clientes?: {
      nome: string;
    } | null;
    vendedor?: {
      user_id: string;
      name: string;
      role: string;
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
  recorrente?: boolean;
  frequencia?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  data_fim_recorrencia?: string;
}

export function useContasReceber(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['contas-receber', user?.id, user?.role, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async (): Promise<ContaReceber[]> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categorias_financeiras (
            nome,
            cor
          ),
          vendas (
            id,
            numero_venda,
            cliente_id,
            user_id,
            vendedor_id,
            clientes (
              nome
            )
          ),
          contratos (
            id,
            numero_contrato,
            cliente_id,
            vendedor_id,
            clientes (
              nome
            ),
            vendedor:profiles!contratos_vendedor_id_fkey(user_id, name, role)
          )
        `)
        .eq('tipo', 'receita')
        .gte('data_transacao', startOfMonth.toISOString().split('T')[0])
        .lte('data_transacao', endOfMonth.toISOString().split('T')[0]);

      // Filter by user_id unless user is admin
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      
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
        const { data: result, error } = await supabase
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
            recorrente: data.recorrente || false,
            frequencia: data.recorrente ? data.frequencia : null,
            data_fim_recorrencia: data.recorrente ? data.data_fim_recorrencia : null,
          }])
          .select();
        
        if (error) throw error;

        // Se é recorrente, criar as próximas transações automaticamente
        if (data.recorrente && result && result.length > 0) {
          await generateRecurringTransactions(result[0], data.frequencia!, data.data_fim_recorrencia);
        }
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
            // Para parcelado, só a primeira parcela é marcada como recorrente
            recorrente: (i === 1 && data.recorrente) || false,
            frequencia: (i === 1 && data.recorrente) ? data.frequencia : null,
            data_fim_recorrencia: (i === 1 && data.recorrente) ? data.data_fim_recorrencia : null,
          });
        }
        
        const { data: result, error } = await supabase
          .from('transacoes_financeiras')
          .insert(transactions)
          .select();
        
        if (error) throw error;

        // Se é recorrente, criar as próximas transações automaticamente
        if (data.recorrente && result && result.length > 0) {
          await generateRecurringTransactions(result[0], data.frequencia!, data.data_fim_recorrencia);
        }
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContaReceber> }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Atualizando conta:', { id, data, user_id: user.id });
      
      const { data: result, error } = await supabase
        .from('transacoes_financeiras')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro na atualização:', error);
        throw error;
      }
      
      console.log('Conta atualizada com sucesso:', result);
      return { id, data: result };
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['contas-receber'] });

      // Snapshot the previous value
      const previousContas = queryClient.getQueriesData({ queryKey: ['contas-receber'] });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['contas-receber'] }, (old: ContaReceber[] | undefined) => {
        if (!old) return old;
        return old.map(conta => 
          conta.id === id ? { ...conta, ...data } : conta
        );
      });

      // Return a context object with the snapshotted value
      return { previousContas };
    },
    onError: (err: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContas) {
        context.previousContas.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Erro completo ao atualizar conta:', err);
      
      let errorMessage = "Erro ao atualizar conta a receber.";
      
      if (err.message?.includes('permission denied') || err.message?.includes('row-level security')) {
        errorMessage = "Você não tem permissão para alterar esta conta.";
      } else if (err.message?.includes('not found')) {
        errorMessage = "Conta não encontrada.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to make sure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
    },
  });
}

export function useDeleteContaReceber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('delete-conta-receber', {
        body: { conta_id: id }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
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
      
      // Mostrar mensagem específica do erro de validação
      const errorMessage = error.message?.includes('contrato ativo') 
        ? "Não é possível excluir: existe contrato ativo relacionado"
        : error.message?.includes('venda relacionada')
        ? "Não é possível excluir: existe venda relacionada"
        : error.message || "Erro ao excluir conta a receber.";
      
      toast({
        title: "Erro",
        description: errorMessage,
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

export function useCleanupOrphanReceivables() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cleanup-orphan-receivables');
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      
      const { deletedCount, details, message } = data || {};
      
      toast({
        title: deletedCount > 0 ? "Sucesso!" : "Informação",
        description: message || `${deletedCount || 0} conta(s) órfã(s) removida(s).`,
        variant: deletedCount > 0 ? "default" : "default",
      });
      
      // Log details for debugging
      if (details && details.length > 0) {
        console.log('Cleanup details:', details);
      }
    },
    onError: (error: any) => {
      console.error('Error cleaning up orphan receivables:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar contas órfãs. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    },
  });
}

export function useCleanupOrphanContractReceivables() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cleanup_orphan_contract_receivables');
      
      if (error) {
        console.error('Error calling cleanup function:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      
      const result = Array.isArray(data) ? data[0] : data;
      const { deleted_count = 0, message = 'Operação concluída' } = result || {};
      
      toast({
        title: deleted_count > 0 ? "Sucesso!" : "Informação",
        description: message || `${deleted_count} conta(s) órfã(s) de contratos removida(s).`,
        variant: deleted_count > 0 ? "default" : "default",
      });
    },
    onError: (error: any) => {
      console.error('Error cleaning up orphan contract receivables:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar contas órfãs de contratos. Tente novamente.",
        variant: "destructive",
      });
    },
  });
}