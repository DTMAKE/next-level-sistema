import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ContaPagar {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  data_transacao: string;
  data_vencimento?: string;
  status: string;
  forma_pagamento: string;
  parcelas: number;
  parcela_atual: number;
  comprovante_url?: string;
  observacoes?: string;
  comissao_id?: string;
  created_at: string;
  updated_at: string;
  categorias_financeiras?: {
    nome: string;
    cor: string;
  } | null;
  comissoes?: {
    id: string;
    vendedor_id: string;
    venda_id: string | null;
    contrato_id: string | null;
    mes_referencia: string;
    percentual: number;
    vendas?: {
      numero_venda: string;
      clientes?: {
        nome: string;
      } | null;
    }[] | null;
    contratos?: {
      numero_contrato: string;
      clientes?: {
        nome: string;
      } | null;
    }[] | null;
  } | null;
}

export interface CreateContaPagarData {
  descricao: string;
  valor: number;
  data_transacao: string;
  data_vencimento?: string;
  forma_pagamento: 'a_vista' | 'parcelado';
  parcelas?: number;
  observacoes?: string;
  comprovante_file?: File;
}

export function useContasPagar(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['contas-pagar', user?.id, user?.role, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async (): Promise<ContaPagar[]> => {
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
          comissoes (
            id,
            vendedor_id,
            venda_id,
            contrato_id,
            mes_referencia,
            percentual,
            vendas (
              numero_venda,
              clientes (
                nome
              )
            ),
            contratos (
              numero_contrato,
              clientes (
                nome
              )
            )
          )
        `)
        .eq('tipo', 'despesa')
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

export function useCreateContaPagar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContaPagarData) => {
      if (!user?.id) throw new Error('User not authenticated');

      let comprovante_url = null;

      // Upload comprovante if provided
      if (data.comprovante_file) {
        const fileExt = data.comprovante_file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(fileName, data.comprovante_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('expense-receipts')
          .getPublicUrl(fileName);
        
        comprovante_url = publicUrl;
      }

      // Create transactions based on payment method
      const transactions: any[] = [];
      
      if (data.forma_pagamento === 'a_vista') {
        transactions.push({
          user_id: user.id,
          tipo: 'despesa',
          descricao: data.descricao,
          valor: data.valor,
          data_transacao: data.data_transacao,
          data_vencimento: data.data_vencimento,
          forma_pagamento: 'a_vista',
          parcelas: 1,
          parcela_atual: 1,
          comprovante_url,
          observacoes: data.observacoes,
          status: 'pendente'
        });
      } else {
        // Create multiple transactions for installments
        const valorParcela = data.valor / (data.parcelas || 1);
        const baseDate = new Date(data.data_transacao);
        
        for (let i = 1; i <= (data.parcelas || 1); i++) {
          const dataTransacao = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i - 1), baseDate.getDate());
          const dataVencimento = data.data_vencimento 
            ? new Date(new Date(data.data_vencimento).getFullYear(), new Date(data.data_vencimento).getMonth() + (i - 1), new Date(data.data_vencimento).getDate())
            : null;

          transactions.push({
            user_id: user.id,
            tipo: 'despesa',
            descricao: `${data.descricao} (${i}/${data.parcelas})`,
            valor: valorParcela,
            data_transacao: dataTransacao.toISOString().split('T')[0],
            data_vencimento: dataVencimento ? dataVencimento.toISOString().split('T')[0] : null,
            forma_pagamento: 'parcelado',
            parcelas: data.parcelas || 1,
            parcela_atual: i,
            comprovante_url: i === 1 ? comprovante_url : null, // Only first installment gets the receipt
            observacoes: data.observacoes,
            status: 'pendente'
          });
        }
      }

      const { data: result, error } = await supabase
        .from('transacoes_financeiras')
        .insert(transactions)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Sucesso!",
        description: "Conta a pagar criada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating conta a pagar:', error);
      toast({
        title: "Erro!",
        description: "Erro ao criar conta a pagar.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContaPagar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContaPagar> }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Atualizando conta:', { id, data, user_id: user.id });
      
      const { data: result, error } = await supabase
        .from('transacoes_financeiras')
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Erro na atualização:', error);
        throw error;
      }
      
      console.log('Conta atualizada com sucesso:', result);
      return { id, data: result };
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['contas-pagar'] });

      // Snapshot the previous value
      const previousContas = queryClient.getQueriesData({ queryKey: ['contas-pagar'] });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['contas-pagar'] }, (old: ContaPagar[] | undefined) => {
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
      
      let errorMessage = "Erro ao atualizar conta a pagar.";
      
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
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    },
  });
}

export function useDeleteContaPagar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Primeiro verificar se a conta tem origem e validar se pode ser excluída
      const { data: conta, error: fetchError } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          comissoes(
            id,
            venda_id,
            contrato_id
          )
        `)
        .eq('id', id)
        .eq('tipo', 'despesa')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Se tem comissão relacionada, verificar se pode excluir
      if (conta?.comissoes) {
        const comissao = conta.comissoes;
        
        // Verificar se tem venda relacionada ativa
        if (comissao.venda_id) {
          const { data: venda } = await supabase
            .from('vendas')
            .select('status')
            .eq('id', comissao.venda_id)
            .maybeSingle();
            
          if (venda?.status === 'fechada') {
            throw new Error('Não é possível excluir: existe venda relacionada. Exclua a venda primeiro.');
          }
        }
        
        // Verificar se tem contrato relacionado ativo
        if (comissao.contrato_id) {
          const { data: contrato } = await supabase
            .from('contratos')
            .select('status')
            .eq('id', comissao.contrato_id)
            .maybeSingle();
            
          if (contrato?.status === 'ativo') {
            throw new Error('Não é possível excluir: existe contrato ativo relacionado. Exclua o contrato primeiro.');
          }
        }
      }

      // Se chegou até aqui, pode usar a edge function
      const { data, error } = await supabase.functions.invoke('delete-conta-pagar', {
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
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Sucesso!",
        description: "Conta excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting conta a pagar:', error);
      
      // Mostrar mensagem específica do erro de validação
      const errorMessage = error.message?.includes('contrato ativo') 
        ? "Não é possível excluir: existe contrato ativo relacionado"
        : error.message?.includes('venda relacionada')
        ? "Não é possível excluir: existe venda relacionada"
        : error.message || "Erro ao excluir conta a pagar.";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function useToggleStatusContaPagar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'confirmada' ? 'pendente' : 'confirmada';
      
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      return { id, newStatus };
    },
    onSuccess: ({ newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Sucesso!",
        description: newStatus === 'confirmada' ? "Conta marcada como paga." : "Conta marcada como pendente.",
      });
    },
    onError: (error) => {
      console.error('Error toggling conta status:', error);
      toast({
        title: "Erro!",
        description: "Erro ao alterar status da conta.",
        variant: "destructive",
      });
    },
  });
}