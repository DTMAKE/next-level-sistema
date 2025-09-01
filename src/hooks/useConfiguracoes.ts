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
        .select('id, user_id, name, role, percentual_comissao, meta_mensal, telefone, endereco, avatar_url, created_at, updated_at')
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
      metaMensal 
    }: { 
      userId: string; 
      percentualComissao?: number; 
      metaMensal?: number; 
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          percentual_comissao: percentualComissao,
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

      // Remover perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('Erro ao remover usuário', error);
        throw new Error(`Falha ao remover usuário: ${error.message}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido com sucesso.',
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
      metaMensal = 10000.00
    }: { 
      email: string; 
      password: string; 
      name: string; 
      role?: 'admin' | 'vendedor';
      percentualComissao?: number;
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