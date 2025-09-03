import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreateComissao } from '@/hooks/useComissoes';

export function useSyncComissoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const createComissao = useCreateComissao();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || user.role !== 'admin') {
        throw new Error('Apenas administradores podem sincronizar comissões');
      }

      console.log('Iniciando sincronização de comissões...');

      // Buscar todas as vendas fechadas
      const { data: todasVendas, error: vendasError } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes(nome)
        `)
        .eq('status', 'fechada');

      if (vendasError) throw vendasError;

      // Buscar vendas que já têm comissão
      const { data: vendasComComissao } = await supabase
        .from('comissoes')
        .select('venda_id')
        .not('venda_id', 'is', null);

      // Filtrar vendas que não têm comissão
      const idsComComissao = new Set(vendasComComissao?.map(c => c.venda_id) || []);
      const vendasSemComissao = todasVendas?.filter(v => !idsComComissao.has(v.id)) || [];


      console.log(`Encontradas ${vendasSemComissao?.length || 0} vendas sem comissão`);

      let comissoesCriadas = 0;

      // Processar cada venda
      for (const venda of vendasSemComissao || []) {
        try {
          // Buscar informações do vendedor
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, percentual_comissao, name')
            .eq('user_id', venda.user_id)
            .maybeSingle();
          
          // Só criar comissão se for vendedor ou admin com percentual configurado
          if (profile && (profile.role === 'vendedor' || (profile.role === 'admin' && profile.percentual_comissao > 0))) {
            const percentualComissao = profile.percentual_comissao || 5.0;
            const valorComissao = venda.valor * (percentualComissao / 100);

            await createComissao.mutateAsync({
              vendedor_id: venda.user_id,
              venda_id: venda.id,
              valor_venda: venda.valor,
              percentual: percentualComissao,
              valor_comissao: valorComissao,
              mes_referencia: new Date(venda.data_venda).toISOString().split('T')[0],
              observacoes: `Comissão sincronizada - ${venda.clientes?.nome || 'Cliente não informado'}`
            });

            comissoesCriadas++;
          }
        } catch (error) {
          console.error(`Erro ao criar comissão para venda ${venda.id}:`, error);
        }
      }

      return { comissoesCriadas, totalVendas: vendasSemComissao?.length || 0 };
    },
    onSuccess: (result) => {
      toast({
        title: "Sincronização concluída",
        description: `${result.comissoesCriadas} comissões criadas de ${result.totalVendas} vendas processadas.`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}