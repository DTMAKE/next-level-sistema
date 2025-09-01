import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface MetaFaturamento {
  id: string;
  user_id: string;
  mes_ano: string;
  meta_faturamento: number;
  meta_vendas: number;
  meta_novos_clientes: number;
  meta_contratos: number;
  bonus_meta: number;
  descricao?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMetaData {
  mes_ano: string;
  meta_faturamento: number;
  meta_vendas: number;
  meta_novos_clientes: number;
  meta_contratos: number;
  bonus_meta?: number;
  descricao?: string;
  vendedorId?: string;
}

export interface ProgressoMeta {
  faturamento_atual: number;
  vendas_atual: number;
  clientes_atual: number;
  contratos_atual: number;
  percentual_faturamento: number;
  percentual_vendas: number;
  percentual_clientes: number;
  percentual_contratos: number;
  meta: MetaFaturamento;
}

export function useMetas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['metas', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return [];

      if (user.role === 'admin') {
        // Admin vê metas de faturamento
        const { data, error } = await supabase
          .from('metas_faturamento')
          .select('*')
          .eq('user_id', user.id)
          .order('mes_ano', { ascending: false });

        if (error) throw error;
        return data as MetaFaturamento[];
      } else {
        // Vendedores vêem suas metas individuais da tabela metas_vendedores
        const { data, error } = await supabase
          .from('metas_vendedores')
          .select('*')
          .eq('vendedor_id', user.id)
          .order('mes_ano', { ascending: false });

        if (error) throw error;
        // Mapear para o formato compatível com MetaFaturamento
        return data.map(meta => ({
          id: meta.id,
          user_id: meta.user_id,
          mes_ano: meta.mes_ano,
          meta_faturamento: Number(meta.meta_vendas), // Usar meta_vendas como faturamento
          meta_vendas: Number(meta.meta_vendas),
          meta_novos_clientes: meta.meta_clientes || 0,
          meta_contratos: 0, // Vendedores não têm meta de contratos
          bonus_meta: Number(meta.bonus_meta) || 0,
          descricao: `Meta individual para ${user.name}`,
          status: meta.status || 'ativa',
          created_at: meta.created_at,
          updated_at: meta.updated_at,
        })) as MetaFaturamento[];
      }
    },
    enabled: !!user,
  });
}

export function useMetaAtual() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meta-atual', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return null;

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

      if (user.role === 'admin') {
        // Admin busca meta de faturamento
        const { data: meta, error } = await supabase
          .from('metas_faturamento')
          .select('*')
          .eq('user_id', user.id)
          .eq('mes_ano', currentMonth)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        if (!meta) return null;

        // Buscar dados reais do mês atual
        const inicio = startOfMonth(new Date());
        const fim = endOfMonth(new Date());

        const [vendas, clientes, contratos] = await Promise.all([
          supabase
            .from('vendas')
            .select('valor')
            .eq('user_id', user.id)
            .eq('status', 'fechada')
            .gte('data_venda', inicio.toISOString().split('T')[0])
            .lte('data_venda', fim.toISOString().split('T')[0]),
          supabase
            .from('clientes')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', inicio.toISOString())
            .lte('created_at', fim.toISOString()),
          supabase
            .from('contratos')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', inicio.toISOString())
            .lte('created_at', fim.toISOString())
        ]);

        const faturamento_atual = vendas.data?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
        const vendas_atual = vendas.data?.length || 0;
        const clientes_atual = clientes.data?.length || 0;
        const contratos_atual = contratos.data?.length || 0;

        const percentual_faturamento = (faturamento_atual / Number(meta.meta_faturamento)) * 100;
        const percentual_vendas = (vendas_atual / meta.meta_vendas) * 100;
        const percentual_clientes = (clientes_atual / meta.meta_novos_clientes) * 100;
        const percentual_contratos = (contratos_atual / meta.meta_contratos) * 100;

        return {
          faturamento_atual,
          vendas_atual,
          clientes_atual,
          contratos_atual,
          percentual_faturamento: Math.min(percentual_faturamento, 100),
          percentual_vendas: Math.min(percentual_vendas, 100),
          percentual_clientes: Math.min(percentual_clientes, 100),
          percentual_contratos: Math.min(percentual_contratos, 100),
          meta: meta as MetaFaturamento,
        } as ProgressoMeta;
      } else {
        // Vendedor busca meta individual
        const { data: meta, error } = await supabase
          .from('metas_vendedores')
          .select('*')
          .eq('vendedor_id', user.id)
          .eq('mes_ano', currentMonth)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        if (!meta) return null;

        // Buscar dados reais do vendedor
        const inicio = startOfMonth(new Date());
        const fim = endOfMonth(new Date());

        const [vendas, clientes] = await Promise.all([
          supabase
            .from('vendas')
            .select('valor')
            .eq('user_id', user.id)
            .eq('status', 'fechada')
            .gte('data_venda', inicio.toISOString().split('T')[0])
            .lte('data_venda', fim.toISOString().split('T')[0]),
          supabase
            .from('clientes')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', inicio.toISOString())
            .lte('created_at', fim.toISOString())
        ]);

        const faturamento_atual = vendas.data?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
        const vendas_atual = vendas.data?.length || 0;
        const clientes_atual = clientes.data?.length || 0;

        const percentual_faturamento = (faturamento_atual / Number(meta.meta_vendas)) * 100;
        const percentual_vendas = (vendas_atual / Number(meta.meta_vendas)) * 100;
        const percentual_clientes = (clientes_atual / (meta.meta_clientes || 1)) * 100;

        // Mapear para formato compatível
        const metaFormatada: MetaFaturamento = {
          id: meta.id,
          user_id: meta.user_id,
          mes_ano: meta.mes_ano,
          meta_faturamento: Number(meta.meta_vendas),
          meta_vendas: Number(meta.meta_vendas),
          meta_novos_clientes: meta.meta_clientes || 0,
          meta_contratos: 0,
          bonus_meta: Number(meta.bonus_meta) || 0,
          descricao: `Meta individual para ${user.name}`,
          status: meta.status || 'ativa',
          created_at: meta.created_at,
          updated_at: meta.updated_at,
        };

        return {
          faturamento_atual,
          vendas_atual,
          clientes_atual,
          contratos_atual: 0,
          percentual_faturamento: Math.min(percentual_faturamento, 100),
          percentual_vendas: Math.min(percentual_vendas, 100),
          percentual_clientes: Math.min(percentual_clientes, 100),
          percentual_contratos: 0,
          meta: metaFormatada,
        } as ProgressoMeta;
      }
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}

export function useCreateMeta() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateMetaData) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar metas');
      }

      // If vendedorId is provided, create meta for specific salesperson
      if (data.vendedorId) {
        const { data: meta, error } = await supabase
          .from('metas_vendedores')
          .insert({
            user_id: user.id, // Admin who created the goal
            vendedor_id: data.vendedorId, // Salesperson for whom the goal is set
            mes_ano: data.mes_ano,
            meta_vendas: data.meta_faturamento, // Using faturamento as vendas for salesperson
            meta_clientes: data.meta_novos_clientes,
            bonus_meta: data.bonus_meta,
          })
          .select()
          .single();

        if (error) throw error;
        return meta;
      } else {
        // Create agency-wide meta
        const { data: meta, error } = await supabase
          .from('metas_faturamento')
          .insert({
            ...data,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return meta;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      queryClient.invalidateQueries({ queryKey: ['meta-atual'] });
      queryClient.invalidateQueries({ queryKey: ['metas-vendedores'] });
      toast({
        title: 'Meta criada',
        description: 'A meta foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMeta() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data, vendedorId, isVendedorMeta }: { 
      id: string; 
      data: Partial<CreateMetaData>; 
      vendedorId?: string;
      isVendedorMeta?: boolean;
    }) => {
      // Check if this is a salesperson meta by checking if user is not admin or if explicitly marked as vendedor meta
      const isUpdatingVendedorMeta = isVendedorMeta || (user?.role !== 'admin');
      
      if (isUpdatingVendedorMeta) {
        // Update in metas_vendedores (individual salesperson goals)
        const updateData: any = {};
        
        if (data.meta_faturamento !== undefined) {
          updateData.meta_vendas = data.meta_faturamento;
        }
        if (data.meta_novos_clientes !== undefined) {
          updateData.meta_clientes = data.meta_novos_clientes;
        }
        if (data.bonus_meta !== undefined) {
          updateData.bonus_meta = data.bonus_meta;
        }
        if (data.mes_ano !== undefined) {
          updateData.mes_ano = data.mes_ano;
        }
        
        const { data: meta, error } = await supabase
          .from('metas_vendedores')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return meta;
      } else {
        // Update in metas_faturamento (agency goals)
        const { data: meta, error } = await supabase
          .from('metas_faturamento')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return meta;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      queryClient.invalidateQueries({ queryKey: ['meta-atual'] });
      queryClient.invalidateQueries({ queryKey: ['metas-vendedores'] });
      toast({
        title: 'Meta atualizada',
        description: 'A meta foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para buscar metas dos vendedores
export function useMetasVendedores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['metas-vendedores'],
    queryFn: async () => {
      if (!user || user.role !== 'admin') {
        return [];
      }

      // First get metas_vendedores
      const { data: metas, error: metasError } = await supabase
        .from('metas_vendedores')
        .select('*')
        .order('mes_ano', { ascending: false });

      if (metasError) throw metasError;
      if (!metas || metas.length === 0) return [];

      // Get vendedor profiles separately
      const vendedorIds = [...new Set(metas.map(meta => meta.vendedor_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', vendedorIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return metas.map(meta => ({
        ...meta,
        vendedor: profiles?.find(p => p.user_id === meta.vendedor_id) || { name: 'Vendedor não encontrado', role: 'vendedor' }
      }));
    },
    enabled: !!user && user.role === 'admin',
  });
}