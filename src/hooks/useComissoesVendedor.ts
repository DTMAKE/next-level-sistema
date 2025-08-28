import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ComissaoVendedor {
  id: string;
  valor_comissao: number;
  valor_venda: number;
  percentual: number;
  mes_referencia: string;
  status: 'pendente' | 'paga';
  observacoes?: string;
  created_at: string;
  venda_id: string;
  vendedor_id: string;
}

export interface ComissaoMesAtual {
  totalComissao: number;
  totalPendente: number;
  totalPago: number;
  quantidadeVendas: number;
}

export function useComissoesVendedor() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comissoes-vendedor', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comissoes')
        .select('*')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ComissaoVendedor[];
    },
    enabled: !!user?.id,
  });
}

export function useComissoesMesAtual() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comissoes-mes-atual', user?.id],
    queryFn: async (): Promise<ComissaoMesAtual> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current month start and end
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('comissoes')
        .select('valor_comissao, status')
        .eq('vendedor_id', user.id)
        .gte('mes_referencia', startOfMonth.toISOString().split('T')[0])
        .lte('mes_referencia', endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const comissoes = data || [];
      
      const totalComissao = comissoes.reduce((sum, c) => sum + (c.valor_comissao || 0), 0);
      const totalPendente = comissoes
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + (c.valor_comissao || 0), 0);
      const totalPago = comissoes
        .filter(c => c.status === 'paga')
        .reduce((sum, c) => sum + (c.valor_comissao || 0), 0);

      return {
        totalComissao,
        totalPendente,
        totalPago,
        quantidadeVendas: comissoes.length,
      };
    },
    enabled: !!user?.id,
  });
}