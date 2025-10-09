import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Senha {
  id: string;
  user_id: string;
  titulo: string;
  usuario: string | null;
  senha: string;
  url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSenhas() {
  return useQuery({
    queryKey: ['senhas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('senhas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Senha[];
    },
  });
}

export function useCreateSenha() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (senha: Omit<Senha, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('senhas')
        .insert([senha])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senhas'] });
      toast({
        title: "Senha criada",
        description: "A senha foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSenha() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...senha }: Partial<Senha> & { id: string }) => {
      const { data, error } = await supabase
        .from('senhas')
        .update(senha)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senhas'] });
      toast({
        title: "Senha atualizada",
        description: "A senha foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSenha() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('senhas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senhas'] });
      toast({
        title: "Senha excluída",
        description: "A senha foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
