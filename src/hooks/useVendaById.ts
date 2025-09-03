import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendaById(vendaId: string | null) {
  return useQuery({
    queryKey: ['venda', vendaId],
    queryFn: async () => {
      if (!vendaId) return null;
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          numero_venda,
          clientes:cliente_id (
            nome
          )
        `)
        .eq('id', vendaId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!vendaId,
  });
}