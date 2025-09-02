import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  comissoes?: any;
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
  
  const startOfMonth = format(selectedDate, 'yyyy-MM-01');
  const endOfMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['contas-pagar', user?.id, user?.role, startOfMonth, endOfMonth],
    queryFn: async (): Promise<ContaPagar[]> => {
      if (!user?.id) throw new Error('User not authenticated');

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
            percentual
          )
        `)
        .eq('tipo', 'despesa')
        .gte('data_transacao', startOfMonth)
        .lte('data_transacao', endOfMonth);

      // Filter by user_id unless user is admin
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('data_transacao', { ascending: false });

      if (error) throw error;
      
      const transactions = (data || []) as ContaPagar[];

      // Enrich commission data with seller profile information and contract details
      for (const transaction of transactions) {
        if (transaction.comissoes && transaction.comissoes.vendedor_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('user_id', transaction.comissoes.vendedor_id)
            .single();
          
          if (profile) {
            transaction.comissoes.vendedor_profile = profile;
          }

          // If commission is from a sale, get client name from venda
          if (transaction.comissoes.venda_id) {
            const { data: venda } = await supabase
              .from('vendas')
              .select('clientes(nome)')
              .eq('id', transaction.comissoes.venda_id)
              .single();
            
            if (venda?.clientes?.nome) {
              transaction.comissoes.cliente_nome = venda.clientes.nome;
            }
          }

          // If commission is from a contract, get contract details for proper parcel calculation
          if (transaction.comissoes.contrato_id) {
            const { data: contract } = await supabase
              .from('contratos')
              .select('numero_contrato, tipo_contrato, data_inicio, data_fim, cliente_id, clientes(nome)')
              .eq('id', transaction.comissoes.contrato_id)
              .single();

            if (contract) {
              transaction.comissoes.contrato = contract;
              
              // Calculate parcel information for recurring contracts
              if (contract.tipo_contrato === 'recorrente' && contract.data_inicio && contract.data_fim) {
                const startDate = new Date(contract.data_inicio);
                const endDate = new Date(contract.data_fim);
                const transactionDate = new Date(transaction.data_transacao);
                
                // Calculate total months
                const totalMonths = Math.max(1, 
                  (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (endDate.getMonth() - startDate.getMonth()) + 1
                );
                
                // Calculate current month (parcel)
                const currentMonth = Math.max(1,
                  (transactionDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (transactionDate.getMonth() - startDate.getMonth()) + 1
                );
                
                // Update description with proper parcel format
                const baseDescription = `Comissão de ${profile.name || 'Vendedor'} - ${contract.clientes?.nome || 'Cliente'}`;
                transaction.descricao = `${baseDescription} (${Math.min(currentMonth, totalMonths)}/${totalMonths})`;
                
                // Store parcel info for UI usage
                transaction.parcela_atual = Math.min(currentMonth, totalMonths);
                transaction.parcelas = totalMonths;
              }
            }
          }
        }
      }

      return transactions;
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
            data_transacao: format(dataTransacao, 'yyyy-MM-dd'),
            data_vencimento: dataVencimento ? format(dataVencimento, 'yyyy-MM-dd') : null,
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ContaPagar> & { id: string }) => {
      console.log('Executando mutação update:', { id, data });
      
      const { data: result, error } = await supabase
        .from('transacoes_financeiras')
        .update(data)
        .eq('id', id)
        .select();

      console.log('Resultado da mutação:', { result, error });

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      console.log('Mutação bem-sucedida:', data);
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Sucesso!",
        description: "Conta a pagar atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating conta a pagar:', error);
      toast({
        title: "Erro!",
        description: "Erro ao atualizar conta a pagar.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContaPagar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
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

// Add cleanup function for orphan commission payables
export const useCleanupOrphanPayables = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Call the database function to cleanup orphan commission payables
      const { data, error } = await supabase
        .rpc('cleanup_orphan_commission_payables');

      if (error) throw error;
      return data;
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Limpeza concluída!",
        description: `${deletedCount || 0} conta(s) órfã(s) removida(s).`,
      });
    },
    onError: (error) => {
      console.error('Error cleaning up orphan payables:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar contas órfãs. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

// Add function to generate future commissions for active contracts
export const useGenerateFutureCommissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contratoId?: string) => {
      if (contratoId) {
        // Generate for specific contract
        const { data, error } = await supabase
          .rpc('generate_future_contract_commissions', { p_contrato_id: contratoId });

        if (error) throw error;
        return data;
      } else {
        // Generate for all active recurring contracts
        const { data: contratos } = await supabase
          .from('contratos')
          .select('id')
          .eq('tipo_contrato', 'recorrente')
          .eq('status', 'ativo');

        if (contratos && contratos.length > 0) {
          for (const contrato of contratos) {
            const { error } = await supabase
              .rpc('generate_future_contract_commissions', { p_contrato_id: contrato.id });
            
            if (error) {
              console.error(`Erro ao gerar comissões para contrato ${contrato.id}:`, error);
            }
          }
        }
        
        return contratos?.length || 0;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Comissões geradas!",
        description: "Comissões futuras dos contratos foram geradas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error generating future commissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar comissões futuras. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};