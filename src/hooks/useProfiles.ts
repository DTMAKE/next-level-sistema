import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  user_id: string;
  name: string;
  role: string;
}

export function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ['profiles', userIds],
    queryFn: async (): Promise<Profile[]> => {
      if (userIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', userIds);
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: userIds.length > 0,
  });
}