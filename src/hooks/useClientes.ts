import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cnpj?: string;
  status?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClienteWithVendedor extends Cliente {
  vendedor?: {
    name: string;
    role: string;
  };
}

export interface CreateClienteData {
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cnpj?: string;
  status?: string;
}

export interface UpdateClienteData extends CreateClienteData {
  id: string;
}

export interface ClientesResponse {
  data: Cliente[];
  total: number;
  totalPages: number;
}

export function useClientes(searchTerm?: string, page: number = 1, limit: number = 25) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['clientes', user?.id, searchTerm, page, limit],
    queryFn: async (): Promise<ClientesResponse> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Build base query
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply user-specific filters based on role
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: data as Cliente[],
        total,
        totalPages
      };
    },
    enabled: !!user?.id,
  });
}

export function useCliente(clienteId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['cliente', clienteId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!clienteId) throw new Error('Cliente ID is required');
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Cliente;
    },
    enabled: !!user?.id && !!clienteId,
  });
}

export function useCreateCliente() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clienteData: CreateClienteData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          ...clienteData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Cliente criado",
        description: "Cliente adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...clienteData }: UpdateClienteData) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Cliente atualizado",
        description: "Informações do cliente atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clienteId: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Cliente removido",
        description: "Cliente removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}