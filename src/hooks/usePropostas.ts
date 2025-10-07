import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Slide {
  tipo: 'capa' | 'sobre' | 'problema' | 'solucao' | 'servicos' | 'investimento' | 'cronograma' | 'proximos_passos' | 'contato';
  titulo: string;
  conteudo: string[];
  destaque?: string;
}

export interface Proposta {
  id: string;
  titulo: string;
  contexto: string;
  slides_json: Slide[];
  created_by: string;
  cliente_id: string | null;
  status: 'rascunho' | 'finalizada';
  created_at: string;
  updated_at: string;
}

export function usePropostas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['propostas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        slides_json: (item.slides_json as unknown as Slide[]) || [],
      })) as Proposta[];
    },
    enabled: !!user,
  });
}

export function useProposta(id: string) {
  return useQuery({
    queryKey: ['proposta', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        slides_json: (data.slides_json as unknown as Slide[]) || [],
      } as Proposta;
    },
    enabled: !!id,
  });
}

export function useCreateProposta() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proposta: Partial<Proposta>) => {
      const { data, error } = await supabase
        .from('propostas')
        .insert({
          titulo: proposta.titulo!,
          contexto: proposta.contexto!,
          slides_json: proposta.slides_json as any,
          created_by: user?.id!,
          cliente_id: proposta.cliente_id || null,
          status: proposta.status || 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        slides_json: (data.slides_json as unknown as Slide[]) || [],
      } as Proposta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating proposta:', error);
      toast.error('Erro ao criar proposta');
    },
  });
}

export function useUpdateProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Proposta> & { id: string }) => {
      const updateData: any = {};
      if (updates.titulo) updateData.titulo = updates.titulo;
      if (updates.contexto) updateData.contexto = updates.contexto;
      if (updates.slides_json) updateData.slides_json = updates.slides_json;
      if (updates.status) updateData.status = updates.status;
      if (updates.cliente_id) updateData.cliente_id = updates.cliente_id;

      const { data, error } = await supabase
        .from('propostas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        slides_json: (data.slides_json as unknown as Slide[]) || [],
      } as Proposta;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      queryClient.invalidateQueries({ queryKey: ['proposta', data.id] });
      toast.success('Proposta atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating proposta:', error);
      toast.error('Erro ao atualizar proposta');
    },
  });
}

export function useDeleteProposta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('propostas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting proposta:', error);
      toast.error('Erro ao excluir proposta');
    },
  });
}

export function useGenerateProposta() {
  return useMutation({
    mutationFn: async (params: {
      contexto: string;
      clienteNome?: string;
      segmento?: string;
      servicosIds?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Error generating proposta:', error);
      toast.error('Erro ao gerar proposta com IA');
    },
  });
}