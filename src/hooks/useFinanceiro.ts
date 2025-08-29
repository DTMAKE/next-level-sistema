import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Interfaces
export interface CategoriaFinanceira {
  id: string;
  user_id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransacaoFinanceira {
  id: string;
  user_id: string;
  tipo: 'receita' | 'despesa';
  categoria_id: string | null;
  valor: number;
  descricao: string | null;
  data_transacao: string;
  venda_id: string | null;
  comprovante_url: string | null;
  status?: string;
  data_vencimento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  categoria?: CategoriaFinanceira;
  venda?: {
    id: string;
    cliente_id: string;
    user_id: string;
    profiles?: {
      id: string;
      name: string;
    };
  } | null;
}

export interface CreateTransacaoData {
  tipo: 'receita' | 'despesa';
  categoria_id?: string;
  valor: number;
  descricao?: string;
  data_transacao: string;
  venda_id?: string;
  comprovante_url?: string;
}

export interface CreateCategoriaData {
  nome: string;
  tipo: 'receita' | 'despesa';
  cor?: string;
}

export interface ResumoFinanceiro {
  receita_total: number;
  despesa_total: number;
  lucro_liquido: number;
  margem_lucro: number;
}

// Hook para buscar categorias financeiras
export function useCategorias() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["categorias-financeiras", user?.id],
    queryFn: async () => {
      console.log('🏷️ useCategorias - Executando query com os parâmetros:');
      console.log('- User:', user);
      console.log('- User ID:', user?.id);
      console.log('- User Role:', user?.role);

      let query = supabase
        .from("categorias_financeiras")
        .select("*")
        .eq("ativo", true);

      // Filter by user_id unless user is admin
      if (user && user.role !== 'admin') {
        console.log('🔒 Aplicando filtro de user_id para categorias (não é admin)');
        query = query.eq("user_id", user.id);
      } else {
        console.log('🔓 Admin mode para categorias - sem filtro de user_id');
      }

      const { data, error } = await query.order("nome");

      console.log('📂 Categorias encontradas:', data?.length || 0, data);
      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        throw error;
      }
      return data as CategoriaFinanceira[];
    },
    enabled: !!user,
  });
}

// Hook para buscar transações financeiras do mês
export function useTransacoesMes(data: Date) {
  const { user } = useAuth();
  const inicioMes = format(startOfMonth(data), 'yyyy-MM-dd');
  const fimMes = format(endOfMonth(data), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ["transacoes-financeiras", inicioMes, fimMes, user?.id],
    queryFn: async () => {
      console.log('🔍 useTransacoesMes - Parâmetros:', { user: user?.name, role: user?.role, inicioMes, fimMes });

      let query = supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          categoria:categorias_financeiras(*),
          venda:vendas(
            id,
            cliente_id,
            user_id
          )
        `)
        .gte("data_transacao", inicioMes)
        .lte("data_transacao", fimMes);

      // Filter by user_id unless user is admin
      if (user && user.role !== 'admin') {
        console.log('💡 Aplicando filtro por user_id (não é admin)');
        query = query.eq("user_id", user.id);
      } else {
        console.log('👑 Usuário é admin - sem filtro de user_id');
      }

      const { data: transacoes, error } = await query.order("data_transacao", { ascending: false });

      console.log('📊 Resultado:', { erro: !!error, quantidade: transacoes?.length || 0 });

      if (error) {
        console.error('❌ Erro na query de transações:', error);
        throw error;
      }
      return transacoes as any;
    },
    enabled: !!user,
  });
}

// Hook para buscar resumo financeiro do mês
export function useResumoFinanceiro(data: Date) {
  const { user } = useAuth();
  const inicioMes = format(startOfMonth(data), 'yyyy-MM-dd');
  const fimMes = format(endOfMonth(data), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ["resumo-financeiro", inicioMes, fimMes, user?.id],
    queryFn: async () => {
      console.log('💰 useResumoFinanceiro - Parâmetros:', { user: user?.name, role: user?.role, inicioMes, fimMes });

      // Buscar receitas
      let receitasQuery = supabase
        .from("transacoes_financeiras")
        .select("valor")
        .eq("tipo", "receita")
        .gte("data_transacao", inicioMes)
        .lte("data_transacao", fimMes);

      // Filter by user_id unless user is admin
      if (user && user.role !== 'admin') {
        console.log('🔒 Aplicando filtro de user_id para receitas (não é admin)');
        receitasQuery = receitasQuery.eq("user_id", user.id);
      } else {
        console.log('🔓 Admin mode para receitas - sem filtro de user_id');
      }

      const { data: receitas, error: errorReceitas } = await receitasQuery;
      console.log('💵 Receitas:', receitas?.length || 0);
      if (errorReceitas) {
        console.error('❌ Erro ao buscar receitas:', errorReceitas);
        throw errorReceitas;
      }

      // Buscar despesas
      let despesasQuery = supabase
        .from("transacoes_financeiras")
        .select("valor")
        .eq("tipo", "despesa")
        .gte("data_transacao", inicioMes)
        .lte("data_transacao", fimMes);

      // Filter by user_id unless user is admin
      if (user && user.role !== 'admin') {
        console.log('🔒 Aplicando filtro de user_id para despesas (não é admin)');
        despesasQuery = despesasQuery.eq("user_id", user.id);
      } else {
        console.log('🔓 Admin mode para despesas - sem filtro de user_id');
      }

      const { data: despesas, error: errorDespesas } = await despesasQuery;
      console.log('💸 Despesas:', despesas?.length || 0);
      if (errorDespesas) {
        console.error('❌ Erro ao buscar despesas:', errorDespesas);
        throw errorDespesas;
      }

      const receita_total = receitas?.reduce((acc, item) => acc + Number(item.valor), 0) || 0;
      const despesa_total = despesas?.reduce((acc, item) => acc + Number(item.valor), 0) || 0;
      const lucro_liquido = receita_total - despesa_total;
      const margem_lucro = receita_total > 0 ? (lucro_liquido / receita_total) * 100 : 0;

      const resumo = {
        receita_total,
        despesa_total,
        lucro_liquido,
        margem_lucro,
      } as ResumoFinanceiro;

      console.log('📈 Resumo calculado:', resumo);

      return resumo;
    },
    enabled: !!user,
  });
}

// Hook para criar transação financeira
export function useCreateTransacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTransacaoData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data: transacao, error } = await supabase
        .from("transacoes_financeiras")
        .insert({
          ...data,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return transacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] });
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar transação: " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para criar categoria financeira
export function useCreateCategoria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCategoriaData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data: categoria, error } = await supabase
        .from("categorias_financeiras")
        .insert({
          ...data,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return categoria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-financeiras"] });
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar categoria: " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para sincronizar vendas como receitas
export function useSincronizarVendas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Buscar todas as vendas fechadas
      const { data: vendas, error: errorVendas } = await supabase
        .from("vendas")
        .select("id, valor, data_venda, cliente_id")
        .eq("status", "fechada")
        .eq("user_id", user.user.id);

      if (errorVendas) throw errorVendas;

      // Buscar transações que já têm venda_id para filtrar as vendas já sincronizadas
      const { data: transacoesExistentes, error: errorTransacoes } = await supabase
        .from("transacoes_financeiras")
        .select("venda_id")
        .not("venda_id", "is", null)
        .eq("user_id", user.user.id);

      if (errorTransacoes) throw errorTransacoes;

      // Filtrar vendas que ainda não foram sincronizadas
      const vendasSincronizadas = new Set(transacoesExistentes?.map(t => t.venda_id) || []);
      const vendasParaSincronizar = vendas?.filter(venda => !vendasSincronizadas.has(venda.id)) || [];

      if (vendasParaSincronizar.length === 0) {
        toast({
          title: "Info",
          description: "Todas as vendas já estão sincronizadas.",
        });
        return 0;
      }

      // Criar transações para as vendas não sincronizadas
      const transacoes = vendasParaSincronizar.map(venda => ({
        user_id: user.user.id,
        tipo: 'receita' as const,
        valor: venda.valor,
        descricao: `Receita da venda para cliente`,
        data_transacao: venda.data_venda,
        venda_id: venda.id,
      }));

      const { error: errorInsert } = await supabase
        .from("transacoes_financeiras")
        .insert(transacoes);

      if (errorInsert) throw errorInsert;

      return vendasParaSincronizar.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] });
      toast({
        title: "Sucesso",
        description: `${count} vendas sincronizadas como receitas!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao sincronizar vendas: " + error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para sincronizar comissões como despesas  
export function useSincronizarComissoes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Chamar a função do banco para sincronizar comissões
      const { error } = await supabase.rpc('sync_commissions_to_financial', {
        p_user_id: user.id
      });

      if (error) throw error;

      return { message: 'Comissões sincronizadas com sucesso' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
      toast({
        title: "Sincronização concluída",
        description: data.message,
      });
    },
    onError: (error) => {
      console.error('Erro ao sincronizar comissões:', error);
      toast({
        title: "Erro ao sincronizar",
        description: "Erro ao sincronizar comissões com transações financeiras",
        variant: "destructive",
      });
    },
  });
}

// Hook para administradores sincronizarem comissões de todos os usuários
export function useSincronizarTodasComissoes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Chamar a função do banco para sincronizar todas as comissões
      const { error } = await supabase.rpc('sync_all_commissions_to_financial');

      if (error) throw error;

      return { message: 'Todas as comissões foram sincronizadas com sucesso' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-financeiras'] });
      toast({
        title: "Sincronização global concluída",
        description: data.message,
      });
    },
    onError: (error) => {
      console.error('Erro ao sincronizar todas as comissões:', error);
      toast({
        title: "Erro ao sincronizar",
        description: "Erro ao sincronizar todas as comissões do sistema",
        variant: "destructive",
      });
    },
  });
}

// Hook para marcar comissão como paga
export function useMarcarComissaoPaga() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comissaoId: string) => {
      const { error } = await supabase.rpc('mark_commission_as_paid', {
        p_comissao_id: comissaoId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["comissoes-vendedor"] });
      toast({
        title: "Sucesso",
        description: "Comissão marcada como paga!",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao marcar comissão como paga:", error);
      toast({
        title: "Erro",
        description: "Erro ao marcar comissão como paga",
        variant: "destructive",
      });
    },
  });

}

// Hook para atualizar status de transação financeira
export function useUpdateTransacaoStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // First, get the transaction details to check if it has a comissao_id
      const { data: transacao, error: fetchError } = await supabase
        .from('transacoes_financeiras')
        .select('comissao_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      // Update the transaction status
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;

      // If this is a commission transaction being marked as 'confirmada' (paid)
      // also update the commission status to 'paga'
      if (transacao?.comissao_id && status === 'confirmada') {
        const { error: comissaoError } = await supabase
          .from('comissoes')
          .update({ 
            status: 'paga',
            data_pagamento: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', transacao.comissao_id);
        
        if (comissaoError) {
          console.error('Erro ao atualizar status da comissão:', comissaoError);
          // Don't throw here to avoid breaking the main transaction update
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["comissoes-vendedor"] });
      queryClient.invalidateQueries({ queryKey: ["comissoes-mes-atual"] });
      queryClient.invalidateQueries({ queryKey: ["comissoes-mes"] });
      toast({
        title: "Sucesso",
        description: "Status da transação atualizado!",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar status da transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da transação",
        variant: "destructive",
      });
    },
  });
}

// Hook para atualizar transação financeira
export function useUpdateTransacao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateTransacaoData>) => {
      const { data: transacao, error } = await supabase
        .from('transacoes_financeiras')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return transacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] });
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação",
        variant: "destructive",
      });
    },
  });
}

// Hook para deletar transação financeira
export function useDeleteTransacao() {
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
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] });
      toast({
        title: "Sucesso",
        description: "Transação removida com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao deletar transação:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover transação",
        variant: "destructive",
      });
    },
  });
}