import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Venda {
  id: string;
  cliente_id: string;
  valor: number;
  status: 'proposta' | 'negociacao' | 'fechada' | 'perdida';
  descricao?: string;
  data_venda: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  forma_pagamento?: string;
  parcelas?: number;
  // Dados do cliente via join
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    endereco?: string;
  };
  // Serviços associados
  venda_servicos?: Array<{
    id: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    servico: {
      id: string;
      nome: string;
      descricao?: string;
      categoria?: string;
    };
  }>;
}

export interface CreateVendaData {
  cliente_id: string;
  valor: number;
  status: 'proposta' | 'negociacao' | 'fechada' | 'perdida';
  descricao?: string;
  data_venda: string;
  forma_pagamento?: string;
  parcelas?: number;
}

export interface UpdateVendaData extends CreateVendaData {
  id: string;
}

export interface VendasResponse {
  data: Venda[];
  total: number;
  totalPages: number;
}

export function useVendas(searchTerm?: string, page: number = 1, limit: number = 25, selectedDate?: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendas', user?.id, searchTerm, page, limit, selectedDate],
    queryFn: async (): Promise<VendasResponse> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone, endereco)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by month if selectedDate is provided
      if (selectedDate) {
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        query = query
          .gte('data_venda', startOfMonth.toISOString().split('T')[0])
          .lte('data_venda', endOfMonth.toISOString().split('T')[0]);
      }

      if (searchTerm && searchTerm.trim()) {
        // Buscar por valor, status ou nome do cliente
        query = query.or(`status.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: data as Venda[],
        total,
        totalPages
      };
    },
    enabled: !!user?.id,
  });
}

export function useVenda(vendaId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['venda', vendaId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!vendaId) throw new Error('Venda ID is required');
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone, endereco),
          venda_servicos(
            id,
            quantidade,
            valor_unitario,
            valor_total,
            servico:servicos(id, nome, descricao, categoria)
          )
        `)
        .eq('id', vendaId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as Venda;
    },
    enabled: !!user?.id && !!vendaId,
  });
}

export function useCreateVenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (vendaData: CreateVendaData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('vendas')
        .insert({
          ...vendaData,
          user_id: user.id,
        })
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone)
        `)
        .single();

      if (error) throw error;
      return data as Venda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: "Venda criada",
        description: "Venda adicionada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateVenda() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...vendaData }: UpdateVendaData) => {
      const { data, error } = await supabase
        .from('vendas')
        .update(vendaData)
        .eq('id', id)
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone)
        `)
        .single();

      if (error) throw error;
      return data as Venda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: "Venda atualizada",
        description: "Informações da venda atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteVenda() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (vendaId: string) => {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: "Venda removida",
        description: "Venda removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}