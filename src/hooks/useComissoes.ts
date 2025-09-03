import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ComissaoData {
  vendedor_id: string;
  venda_id?: string;
  contrato_id?: string;
  valor_venda: number;
  percentual: number;
  valor_comissao: number;
  mes_referencia: string;
  observacoes?: string;
}

export function useCreateComissao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comissaoData: ComissaoData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // 1. Criar a comissão
      const { data: comissao, error: comissaoError } = await supabase
        .from('comissoes')
        .insert({
          user_id: user.id,
          ...comissaoData,
          status: 'pendente'
        })
        .select()
        .maybeSingle();

      if (comissaoError || !comissao) throw new Error('Erro ao criar comissão ou comissão não encontrada');

      // 2. Buscar informações do admin para criar a conta a pagar
      const { data: adminUser, error: adminError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .eq('role', 'admin')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (adminError) {
        console.error('Admin não encontrado, usando usuário atual para conta a pagar');
      }

      const adminId = adminUser?.user_id || user.id;
      const adminName = adminUser?.name || 'Admin';

      // 3. Buscar categoria de comissões ou criar se não existir
      let { data: categoria } = await supabase
        .from('categorias_financeiras')
        .select('id')
        .eq('nome', 'Comissões de Vendas')
        .eq('tipo', 'despesa')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!categoria) {
        const { data: novaCategoria, error: categoriaError } = await supabase
          .from('categorias_financeiras')
          .insert({
            user_id: adminId,
            nome: 'Comissões de Vendas',
            tipo: 'despesa',
            cor: '#9333EA',
            ativo: true
          })
          .select()
          .maybeSingle();

        if (categoriaError || !novaCategoria) throw new Error('Erro ao criar categoria de comissões');
        categoria = novaCategoria;
      }

      if (!categoria?.id) throw new Error('Categoria de comissões não encontrada');

      // 4. Buscar nome do vendedor
      const { data: vendedor } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', comissaoData.vendedor_id)
        .maybeSingle();

      const vendedorNome = vendedor?.name || 'Vendedor';

      // 5. Criar a conta a pagar para a comissão
      const mesReferencia = new Date(comissaoData.mes_referencia);
      const dataVencimento = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0); // Último dia do mês

      const { error: contaPagarError } = await supabase
        .from('transacoes_financeiras')
        .insert({
          user_id: adminId,
          tipo: 'despesa',
          data_transacao: comissaoData.mes_referencia,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          descricao: `Comissão de ${vendedorNome} - ${comissaoData.observacoes || 'Comissão de venda'}`,
          valor: comissaoData.valor_comissao,
          categoria_id: categoria.id,
          comissao_id: comissao.id,
          status: 'pendente',
          forma_pagamento: 'a_vista',
          parcelas: 1,
          parcela_atual: 1
        });

      if (contaPagarError) throw contaPagarError;

      return comissao;
    },
    onSuccess: () => {
      console.log('useComissoes - Invalidando queries após criação de comissão...');
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-vendedor'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-mes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      
      // Force refresh da página de contas a pagar
      queryClient.refetchQueries({ queryKey: ['contas-pagar'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar comissão:', error);
      toast({
        title: "Erro ao criar comissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteComissao() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comissaoId: string) => {
      // 1. Deletar a conta a pagar relacionada primeiro
      const { error: contaPagarError } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('comissao_id', comissaoId);

      if (contaPagarError) throw contaPagarError;

      // 2. Deletar a comissão
      const { error: comissaoError } = await supabase
        .from('comissoes')
        .delete()
        .eq('id', comissaoId);

      if (comissaoError) throw comissaoError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-vendedor'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes-mes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: "Comissão removida",
        description: "Comissão e conta a pagar relacionada removidas com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar comissão:', error);
      toast({
        title: "Erro ao remover comissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}