import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  role: string;
  email?: string;
  created_at: string;
  percentual_comissao?: number;
  percentual_comissao_contrato?: number;
  meta_mensal?: number;
  telefone?: string;
  endereco?: string;
  avatar_url?: string;
}

export function useUsuarios() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['usuarios', user?.id],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      if (user.role !== 'admin') {
        return [];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, role, percentual_comissao, percentual_comissao_contrato, meta_mensal, telefone, endereco, avatar_url, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar perfis', error);
        throw error;
      }
      
      return data as UserProfile[];
    },
    enabled: !!user,
  });
}

export function usePromoverUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, novoRole }: { userId: string; novoRole: 'admin' | 'vendedor' }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: novoRole })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: 'Usuário atualizado',
        description: `Usuário ${variables.novoRole === 'admin' ? 'promovido para administrador' : 'rebaixado para vendedor'} com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAtualizarConfigUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      percentualComissao, 
      percentualComissaoContrato,
      metaMensal 
    }: { 
      userId: string; 
      percentualComissao?: number; 
      percentualComissaoContrato?: number;
      metaMensal?: number; 
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          percentual_comissao: percentualComissao,
          percentual_comissao_contrato: percentualComissaoContrato,
          meta_mensal: metaMensal
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: 'Configurações atualizadas',
        description: 'As configurações do usuário foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar configurações',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoverUsuario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, senha }: { userId: string; senha: string }) => {
      // Verificar se não está tentando remover a si mesmo
      if (currentUser?.id === userId) {
        throw new Error('Você não pode remover sua própria conta');
      }

      // Verificar se o usuário atual é admin
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Apenas administradores podem remover usuários');
      }
      
      // Verificar senha de confirmação (deve ser implementada adequadamente)
      if (!senha || senha.length < 6) {
        throw new Error('Senha de confirmação obrigatória');
      }

      // 1. Buscar um admin para receber os dados (diferente do usuário sendo removido)
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin')
        .neq('user_id', userId)
        .limit(1);

      if (adminError) {
        logger.error('Erro ao buscar admin', adminError);
        throw new Error('Falha ao buscar administrador para transferir dados');
      }

      const targetAdminId = adminUsers?.[0]?.user_id || currentUser.id;

      // 2. Transferir vendas para o admin
      const { error: vendasError } = await supabase
        .from('vendas')
        .update({ vendedor_id: targetAdminId })
        .eq('vendedor_id', userId);

      if (vendasError) {
        logger.error('Erro ao transferir vendas', vendasError);
        throw new Error('Falha ao transferir vendas do usuário');
      }

      // 3. Transferir comissões para o admin
      const { error: comissoesError } = await supabase
        .from('comissoes')
        .update({ vendedor_id: targetAdminId })
        .eq('vendedor_id', userId);

      if (comissoesError) {
        logger.error('Erro ao transferir comissões', comissoesError);
        throw new Error('Falha ao transferir comissões do usuário');
      }

      // 4. Transferir contratos para o admin
      const { error: contratosError } = await supabase
        .from('contratos')
        .update({ vendedor_id: targetAdminId })
        .eq('vendedor_id', userId);

      if (contratosError) {
        logger.error('Erro ao transferir contratos', contratosError);
        throw new Error('Falha ao transferir contratos do usuário');
      }

      // 5. Transferir leads para o admin
      const { error: leadsError } = await supabase
        .from('leads')
        .update({ vendedor_id: targetAdminId })
        .eq('vendedor_id', userId);

      if (leadsError) {
        logger.error('Erro ao transferir leads', leadsError);
        throw new Error('Falha ao transferir leads do usuário');
      }

      // 6. Remover metas específicas do vendedor
      const { error: metasError } = await supabase
        .from('metas_vendedores')
        .delete()
        .eq('vendedor_id', userId);

      if (metasError) {
        logger.error('Erro ao remover metas', metasError);
        // Não bloquear a remoção por isso, apenas log
      }

      // 7. Transferir dados gerais do usuário (vendas, clientes, etc. criados por ele)
      const { error: vendasUserError } = await supabase
        .from('vendas')
        .update({ user_id: targetAdminId })
        .eq('user_id', userId);

      const { error: clientesError } = await supabase
        .from('clientes')
        .update({ user_id: targetAdminId })
        .eq('user_id', userId);

      const { error: contratosUserError } = await supabase
        .from('contratos')
        .update({ user_id: targetAdminId })
        .eq('user_id', userId);

      const { error: leadsUserError } = await supabase
        .from('leads')
        .update({ user_id: targetAdminId })
        .eq('user_id', userId);

      const { error: servicosError } = await supabase
        .from('servicos')
        .update({ user_id: targetAdminId })
        .eq('user_id', userId);

      const { error: transacoesError } = await supabase
        .from('transacoes_financeiras')
        .update({ user_id: targetAdminId })
        .eq('user_id', userId);

      // 8. Finalmente, remover o perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('Erro ao remover usuário', error);
        throw new Error(`Falha ao remover usuário: ${error.message}`);
      }
      
      return { success: true, transferredTo: targetAdminId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes'] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes-financeiras'] });
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido com sucesso e todos os dados foram transferidos para um administrador.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCriarUsuario() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name, 
      role = 'vendedor',
      percentualComissao = 5.00,
      percentualComissaoContrato = 1.00,
      metaMensal = 10000.00
    }: { 
      email: string; 
      password: string; 
      name: string; 
      role?: 'admin' | 'vendedor';
      percentualComissao?: number;
      percentualComissaoContrato?: number;
      metaMensal?: number;
    }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Apenas administradores podem criar usuários');
      }

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Não foi possível obter o token de autenticação');
      }

      // Create user via edge function (already confirmed)
      const response = await fetch(`https://zpskukvdzlurrbqlgtuu.supabase.co/functions/v1/create-confirmed-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          percentualComissao,
          percentualComissaoContrato,
          metaMensal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: 'Usuário criado',
        description: 'O novo usuário foi criado com sucesso e já está confirmado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}