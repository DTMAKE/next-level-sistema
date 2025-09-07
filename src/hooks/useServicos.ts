import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interfaces
interface Servico {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  valor: number;
  custo?: number;
  ativo: boolean;
  categoria?: string;
  nivel_complexidade?: string;
  tempo_entrega_dias?: number;
  tipo_cobranca?: string;
  created_at: string;
  updated_at: string;
}

interface CreateServicoData {
  nome: string;
  descricao?: string;
  valor: number;
  custo?: number;
  ativo?: boolean;
  categoria?: string;
  nivel_complexidade?: string;
  tempo_entrega_dias?: number;
  tipo_cobranca?: string;
}

interface UpdateServicoData {
  nome?: string;
  descricao?: string;
  valor?: number;
  custo?: number;
  ativo?: boolean;
  categoria?: string;
  nivel_complexidade?: string;
  tempo_entrega_dias?: number;
  tipo_cobranca?: string;
}

interface VendaServico {
  id: string;
  venda_id: string;
  servico_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
  servico?: Servico;
}

interface CreateVendaServicoData {
  venda_id: string;
  servico_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

// Hook para buscar serviços
export function useServicos(searchTerm?: string) {
  return useQuery({
    queryKey: ["servicos", searchTerm],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let query = supabase
        .from("servicos")
        .select("*")
        .order("nome");

      if (searchTerm) {
        query = query.ilike("nome", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Servico[];
    },
  });
}

// Hook para buscar um serviço específico
export function useServico(servicoId: string) {
  return useQuery({
    queryKey: ["servico", servicoId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

        const { data, error } = await supabase
          .from("servicos")
          .select("*")
          .eq("id", servicoId)
          .maybeSingle();

      if (error) throw error;
      return data as Servico;
    },
    enabled: !!servicoId,
  });
}

// Hook para criar serviço
export function useCreateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServicoData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: servico, error } = await supabase
        .from("servicos")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return servico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar serviço. Tente novamente.");
    },
  });
}

// Hook para atualizar serviço
export function useUpdateServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateServicoData & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: servico, error } = await supabase
        .from("servicos")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return servico;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      queryClient.invalidateQueries({ queryKey: ["servico", variables.id] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar serviço. Tente novamente.");
    },
  });
}

// Hook para deletar serviço
export function useDeleteServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (servicoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("servicos")
        .delete()
        .eq("id", servicoId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço deletado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar serviço. Tente novamente.");
    },
  });
}

// Hook para buscar serviços de uma venda
export function useVendaServicos(vendaId: string) {
  return useQuery({
    queryKey: ["venda-servicos", vendaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venda_servicos")
        .select(`
          *,
          servico:servicos(*)
        `)
        .eq("venda_id", vendaId);

      if (error) throw error;
      return data as VendaServico[];
    },
    enabled: !!vendaId,
  });
}

// Hook para criar venda_servico
export function useCreateVendaServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVendaServicoData) => {
      const { data: vendaServico, error } = await supabase
        .from("venda_servicos")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return vendaServico;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["venda-servicos", variables.venda_id] });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar serviço à venda. Tente novamente.");
    },
  });
}

// Hook para deletar venda_servico
export function useDeleteVendaServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendaServicoId: string) => {
      const { error } = await supabase
        .from("venda_servicos")
        .delete()
        .eq("id", vendaServicoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venda-servicos"] });
    },
    onError: (error) => {
      toast.error("Erro ao remover serviço da venda. Tente novamente.");
    },
  });
}

// Export the types for external use
export type { Servico, CreateServicoData, UpdateServicoData, VendaServico, CreateVendaServicoData };