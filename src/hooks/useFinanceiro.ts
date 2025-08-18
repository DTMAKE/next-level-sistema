import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  created_at: string;
  updated_at: string;
  categoria?: CategoriaFinanceira;
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
  return useQuery({
    queryKey: ["categorias-financeiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
  });
}

// Hook para buscar transações financeiras do mês
export function useTransacoesMes(data: Date) {
  const inicioMes = format(startOfMonth(data), 'yyyy-MM-dd');
  const fimMes = format(endOfMonth(data), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ["transacoes-financeiras", inicioMes, fimMes],
    queryFn: async () => {
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .gte("data_transacao", inicioMes)
        .lte("data_transacao", fimMes)
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      return transacoes as TransacaoFinanceira[];
    },
  });
}

// Hook para buscar resumo financeiro do mês
export function useResumoFinanceiro(data: Date) {
  const inicioMes = format(startOfMonth(data), 'yyyy-MM-dd');
  const fimMes = format(endOfMonth(data), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ["resumo-financeiro", inicioMes, fimMes],
    queryFn: async () => {
      // Buscar receitas
      const { data: receitas, error: errorReceitas } = await supabase
        .from("transacoes_financeiras")
        .select("valor")
        .eq("tipo", "receita")
        .gte("data_transacao", inicioMes)
        .lte("data_transacao", fimMes);

      if (errorReceitas) throw errorReceitas;

      // Buscar despesas
      const { data: despesas, error: errorDespesas } = await supabase
        .from("transacoes_financeiras")
        .select("valor")
        .eq("tipo", "despesa")
        .gte("data_transacao", inicioMes)
        .lte("data_transacao", fimMes);

      if (errorDespesas) throw errorDespesas;

      const receita_total = receitas?.reduce((acc, item) => acc + Number(item.valor), 0) || 0;
      const despesa_total = despesas?.reduce((acc, item) => acc + Number(item.valor), 0) || 0;
      const lucro_liquido = receita_total - despesa_total;
      const margem_lucro = receita_total > 0 ? (lucro_liquido / receita_total) * 100 : 0;

      return {
        receita_total,
        despesa_total,
        lucro_liquido,
        margem_lucro,
      } as ResumoFinanceiro;
    },
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

      // Buscar vendas que não estão sincronizadas
      const { data: vendas, error: errorVendas } = await supabase
        .from("vendas")
        .select("id, valor, data_venda, cliente_id")
        .eq("status", "fechada")
        .not("id", "in", `(
          SELECT venda_id 
          FROM transacoes_financeiras 
          WHERE venda_id IS NOT NULL
        )`);

      if (errorVendas) throw errorVendas;

      if (!vendas || vendas.length === 0) {
        toast({
          title: "Info",
          description: "Todas as vendas já estão sincronizadas.",
        });
        return;
      }

      // Criar transações para as vendas
      const transacoes = vendas.map(venda => ({
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

      return vendas.length;
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