import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendasMesData {
  totalVendas: number;
  vendasFechadas: number;
  vendasNegociacao: number;
  totalFaturamento: number;
  faturamentoFechado: number;
  ticketMedio: number;
}

export function useVendasMes(selectedDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vendas-mes', user?.id, selectedDate.getFullYear(), selectedDate.getMonth()],
    queryFn: async (): Promise<VendasMesData> => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('vendas')
        .select('valor, status')
        .eq('user_id', user.id)
        .gte('data_venda', startOfMonth.toISOString().split('T')[0])
        .lte('data_venda', endOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const vendas = data || [];
      const totalVendas = vendas.length;
      const vendasFechadas = vendas.filter(v => v.status === 'fechada').length;
      const vendasNegociacao = vendas.filter(v => v.status === 'negociacao').length;
      
      const totalFaturamento = vendas.reduce((sum, venda) => sum + Number(venda.valor), 0);
      const faturamentoFechado = vendas
        .filter(v => v.status === 'fechada')
        .reduce((sum, venda) => sum + Number(venda.valor), 0);
      
      const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;
      
      return {
        totalVendas,
        vendasFechadas,
        vendasNegociacao,
        totalFaturamento,
        faturamentoFechado,
        ticketMedio
      };
    },
    enabled: !!user?.id,
  });
}