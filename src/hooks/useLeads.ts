import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  user_id: string;
  vendedor_id?: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  origem: string;
  status: string;
  temperatura: string;
  valor_estimado?: number;
  observacoes?: string;
  data_contato: string;
  proxima_acao?: string;
  data_proxima_acao?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadData {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  origem?: string;
  temperatura?: string;
  valor_estimado?: number;
  observacoes?: string;
  proxima_acao?: string;
  data_proxima_acao?: string;
}

export function useLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });
}

export function useCreateLead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLeadData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          ...data,
          user_id: user.id,
          vendedor_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Lead criado com sucesso',
        description: 'O lead foi adicionado ao pipeline.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar lead',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateLeadData & { status: string }> }) => {
      const { data: lead, error } = await supabase
        .from('leads')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Lead atualizado',
        description: 'As informações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar lead',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useComissoes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comissoes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('comissoes')
        .select(`
          *,
          vendas(valor, data_venda, status),
          profiles!comissoes_vendedor_id_fkey(name)
        `)
        .eq(user.role === 'admin' ? 'user_id' : 'vendedor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-stats', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // For sellers, filter by their own data. For admins, get all data
      const userFilter = user.role === 'admin' ? {} : { user_id: user.id };

      // Vendas do mês atual
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor, status, user_id')
        .match(userFilter)
        .gte('data_venda', startOfMonth.toISOString().split('T')[0])
        .lte('data_venda', endOfMonth.toISOString().split('T')[0]);

      if (vendasError) throw vendasError;

      // Total de clientes
      const { count: totalClientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .match(userFilter);

      if (clientesError) throw clientesError;

      // Contratos ativos
      const { count: contratosAtivos, error: contratosError } = await supabase
        .from('contratos')
        .select('id', { count: 'exact' })
        .match(userFilter)
        .eq('status', 'ativo');

      if (contratosError) throw contratosError;

      // Leads para cálculo de conversão
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('status')
        .match(userFilter);

      if (leadsError) throw leadsError;

      const vendasMes = vendas?.filter(v => v.status === 'fechada').reduce((sum, v) => sum + (v.valor || 0), 0) || 0;
      const totalLeads = leads?.length || 0;
      const vendasConvertidas = leads?.filter(l => l.status === 'convertido').length || 0;
      const taxaConversao = totalLeads > 0 ? (vendasConvertidas / totalLeads) * 100 : 0;

      // For sellers, also get commission stats
      let comissaoMes = 0;
      if (user.role === 'vendedor') {
        const { data: comissoes, error: comissoesError } = await supabase
          .from('comissoes')
          .select('valor_comissao')
          .eq('vendedor_id', user.id)
          .gte('mes_referencia', startOfMonth.toISOString().split('T')[0])
          .lte('mes_referencia', endOfMonth.toISOString().split('T')[0]);

        if (comissoesError) throw comissoesError;
        comissaoMes = comissoes?.reduce((sum, c) => sum + (c.valor_comissao || 0), 0) || 0;
      }

      return {
        vendasMes,
        totalClientes: totalClientes || 0,
        contratosAtivos: contratosAtivos || 0,
        taxaConversao,
        comissaoMes, // New field for sellers
      };
    },
    enabled: !!user,
  });
}