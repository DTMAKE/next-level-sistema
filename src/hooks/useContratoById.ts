import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContratoById(contratoId: string | null) {
  return useQuery({
    queryKey: ['contrato', contratoId],
    queryFn: async () => {
      if (!contratoId) return null;
      
      const { data, error } = await supabase
        .from('contratos')
        .select('numero_contrato, clientes(nome)')
        .eq('id', contratoId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!contratoId,
  });
}