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
  comissaoPendente: number;
  comissaoPaga: number;
  numeroVendas: number;
}

export function useComissoesVendedor(selectedDate?: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['comissoes-vendedor', user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('comissoes')
        .select('*')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by month if selectedDate is provided
      if (selectedDate) {
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        query = query
          .gte('mes_referencia', startOfMonth.toISOString().split('T')[0])
          .lte('mes_referencia', endOfMonth.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query;
      
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
      const comissaoPendente = comissoes
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + (c.valor_comissao || 0), 0);
      const comissaoPaga = comissoes
        .filter(c => c.status === 'paga')
        .reduce((sum, c) => sum + (c.valor_comissao || 0), 0);

      return {
        totalComissao,
        comissaoPendente,
        comissaoPaga,
        numeroVendas: comissoes.length,
      };
    },
    enabled: !!user?.id,
  });
}

export function useComissoesMes(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['comissoes-mes', user?.id, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async (): Promise<ComissaoMesAtual> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('comissoes')
        .select('valor_comissao, status')
        .eq('vendedor_id', user.id)
        .gte('mes_referencia', startOfMonth.toISOString().split('T')[0])
        .lte('mes_referencia', endOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const comissoes = data || [];
      const totalComissao = comissoes.reduce((sum, c) => sum + Number(c.valor_comissao), 0);
      const comissaoPendente = comissoes
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + Number(c.valor_comissao), 0);
      const comissaoPaga = comissoes
        .filter(c => c.status === 'paga')
        .reduce((sum, c) => sum + Number(c.valor_comissao), 0);
      const numeroVendas = comissoes.length;
      
      return {
        totalComissao,
        comissaoPendente,
        comissaoPaga,
        numeroVendas
      };
    },
    enabled: !!user?.id,
  });
}