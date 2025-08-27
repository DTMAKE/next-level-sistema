import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CandidaturaData {
  nome: string;
  email: string;
  telefone: string;
  sobre_voce: string;
  objetivo_vendas: string;
}

export interface Candidatura extends CandidaturaData {
  id: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  created_at: string;
  updated_at: string;
}

export function useCandidaturas() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const createCandidatura = async (data: CandidaturaData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('candidaturas')
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Candidatura enviada!",
        description: "Recebemos sua candidatura. Entraremos em contato em breve!",
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar candidatura:', error);
      toast({
        title: "Erro ao enviar candidatura",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCandidatura,
    isLoading,
  };
}

// Hook para listar todas as candidaturas (apenas admins)
export function useGetCandidaturas() {
  return useQuery({
    queryKey: ['candidaturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Candidatura[];
    },
  });
}

// Hook para atualizar status da candidatura
export function useUpdateCandidaturaStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'aprovada' | 'rejeitada' }) => {
      const { error } = await supabase
        .from('candidaturas')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['candidaturas'] });
      toast({
        title: "Status atualizado!",
        description: `Candidatura ${status === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da candidatura.",
        variant: "destructive",
      });
    },
  });
}

// Hook para deletar candidatura
export function useDeleteCandidatura() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidaturas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidaturas'] });
      toast({
        title: "Candidatura removida",
        description: "Candidatura excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir candidatura.",
        variant: "destructive",
      });
    },
  });
}