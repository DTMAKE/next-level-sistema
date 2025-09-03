import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreateComissao } from '@/hooks/useComissoes';

export interface Venda {
  id: string;
  cliente_id: string;
  valor: number;
  status: 'proposta' | 'negociacao' | 'fechada' | 'perdida';
  descricao?: string;
  data_venda: string;
  user_id: string;
  vendedor_id?: string;
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
  vendedor_id?: string;
  valor: number;
  status: 'proposta' | 'negociacao' | 'fechada' | 'perdida';
  descricao?: string;
  data_venda: string;
  forma_pagamento?: string;
  parcelas?: number;
  servicos?: Array<{
    servico_id: string;
    nome: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
  }>;
}

export interface UpdateVendaData extends Omit<CreateVendaData, 'servicos'> {
  id: string;
  servicos?: Array<{
    servico_id: string;
    nome: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
  }>;
}

export interface VendasResponse {
  data: Venda[];
  total: number;
  totalPages: number;
}

export function useVendas(searchTerm?: string, page: number = 1, limit: number = 25, selectedDate?: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendas', user?.id, user?.role, searchTerm, page, limit, selectedDate],
    queryFn: async (): Promise<VendasResponse> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone, endereco)
        `, { count: 'exact' });

      // Only filter by user_id if user is not admin
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      query = query
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
    queryKey: ['venda', vendaId, user?.id, user?.role],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!vendaId) throw new Error('Venda ID is required');
      
      let query = supabase
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
        .eq('id', vendaId);

      // Only filter by user_id if user is not admin
      if (user.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.single();
      
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
  const createComissao = useCreateComissao();

  return useMutation({
    mutationFn: async (vendaData: CreateVendaData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { servicos, ...vendaInfo } = vendaData;

      console.log('useCreateVenda: Dados recebidos:', vendaData);
      console.log('useCreateVenda: vendedor_id recebido:', vendaData.vendedor_id);
      console.log('useCreateVenda: Dados que serão salvos:', {
        ...vendaInfo,
        user_id: user.id,
      });
      
      // Validação crítica: garantir que vendedor_id não seja perdido
      if (!vendaData.vendedor_id) {
        console.error('useCreateVenda: ERRO - vendedor_id está vazio!');
        toast({
          title: "Erro de validação",
          description: "Vendedor deve ser selecionado antes de salvar a venda.",
          variant: "destructive",
        });
        throw new Error('Vendedor é obrigatório');
      }

      const { data, error } = await supabase
        .from('vendas')
        .insert({
          ...vendaInfo,
          user_id: user.id,
        })
        .select(`
          *,
          cliente:clientes(id, nome, email, telefone)
        `)
        .single();

      if (error) {
        console.error('useCreateVenda: Erro ao inserir venda:', error);
        throw error;
      }

      console.log('useCreateVenda: Venda criada:', data);

      // Salvar serviços associados se existirem
      if (servicos && servicos.length > 0) {
        const vendaServicos = servicos
          .filter(s => s.servico_id !== 'generic') // Filtrar serviços genéricos
          .map(servico => ({
            venda_id: data.id,
            servico_id: servico.servico_id,
            quantidade: servico.quantidade,
            valor_unitario: servico.valor_unitario,
            valor_total: servico.valor_total,
          }));

        if (vendaServicos.length > 0) {
          const { error: servicosError } = await supabase
            .from('venda_servicos')
            .insert(vendaServicos);

          if (servicosError) {
            console.error('Erro ao salvar serviços:', servicosError);
            throw servicosError;
          }
        }
      }

      // 3. Criar comissão se a venda for fechada e o usuário for vendedor
      if (vendaData.status === 'fechada') {
        await createComissaoForVenda(data as Venda, createComissao);
      }

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
  const createComissao = useCreateComissao();

  return useMutation({
    mutationFn: async ({ id, servicos, ...vendaData }: UpdateVendaData) => {
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

      // Atualizar serviços associados
      if (servicos) {
        // Primeiro, deletar serviços existentes
        await supabase
          .from('venda_servicos')
          .delete()
          .eq('venda_id', id);

        // Depois, inserir novos serviços (se não forem genéricos)
        const vendaServicos = servicos
          .filter(s => s.servico_id !== 'generic') // Filtrar serviços genéricos
          .map(servico => ({
            venda_id: id,
            servico_id: servico.servico_id,
            quantidade: servico.quantidade,
            valor_unitario: servico.valor_unitario,
            valor_total: servico.valor_total,
          }));

        if (vendaServicos.length > 0) {
          const { error: servicosError } = await supabase
            .from('venda_servicos')
            .insert(vendaServicos);

          if (servicosError) {
            console.error('Erro ao atualizar serviços:', servicosError);
            throw servicosError;
          }
        }
      }

      // Criar comissão se a venda foi marcada como fechada agora
      if (vendaData.status === 'fechada') {
        await createComissaoForVenda(data as Venda, createComissao);
      }

      return data as Venda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['venda'] });
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

// Função auxiliar para criar comissão
async function createComissaoForVenda(venda: Venda, createComissao: any) {
  try {
    // Verificar se já existe comissão para esta venda
    const { data: existingComissao } = await supabase
      .from('comissoes')
      .select('id')
      .eq('venda_id', venda.id)
      .single();

    if (existingComissao) {
      console.log('Comissão já existe para esta venda');
      return;
    }

    // Usar vendedor_id se existir, caso contrário user_id
    const vendedorResponsavelId = venda.vendedor_id || venda.user_id;

    // Buscar informações do vendedor responsável
    const { data: vendedor } = await supabase
      .from('profiles')
      .select('role, percentual_comissao, name')
      .eq('user_id', vendedorResponsavelId)
      .single();

    // Só criar comissão se for vendedor ou admin configurado para receber comissão
    if (vendedor?.role === 'vendedor' || (vendedor?.role === 'admin' && vendedor?.percentual_comissao > 0)) {
      const percentualComissao = vendedor.percentual_comissao || 5.0;
      const valorComissao = venda.valor * (percentualComissao / 100);

      // Buscar nome do cliente para observações
      const { data: cliente } = await supabase
        .from('clientes')
        .select('nome')
        .eq('id', venda.cliente_id)
        .single();

      const vendedorNome = vendedor.name || 'Vendedor';
      const clienteNome = cliente?.nome || 'Cliente não informado';

      await createComissao.mutateAsync({
        vendedor_id: vendedorResponsavelId,
        venda_id: venda.id,
        valor_venda: venda.valor,
        percentual: percentualComissao,
        valor_comissao: valorComissao,
        mes_referencia: new Date(venda.data_venda).toISOString().split('T')[0],
        observacoes: `Comissão de ${vendedorNome} - Venda para ${clienteNome}`
      });
    }
  } catch (error) {
    console.error('Erro ao criar comissão:', error);
    // Não falhar a venda por causa da comissão
  }
}