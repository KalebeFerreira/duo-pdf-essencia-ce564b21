import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Usar maybeSingle() para não lançar erro se não existir
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        throw error;
      }
      
      // Se não existir perfil, criar um padrão
      if (!data) {
        console.log('Perfil não encontrado, criando perfil padrão...');
        const defaultProfile = {
          id: user.id,
          nome_completo: user.email?.split('@')[0] || 'Usuário',
          plan: 'free',
          pdfs_limit: 5,
          pdfs_used: 0,
          pdfs_used_today: 0,
          daily_pdfs_limit: 3,
          automations_used: 0,
          automations_used_today: 0,
          daily_automations_limit: 1,
          monthly_credits: 10,
          remaining_credits: 10,
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert(defaultProfile, { onConflict: 'id' })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar perfil padrão:', insertError);
          // Retornar perfil default mesmo se falhar insert (pode ser RLS)
          return defaultProfile as any;
        }

        return newProfile;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos - evita re-fetches desnecessários
    gcTime: 1000 * 60 * 10, // 10 minutos no cache
    retry: 2,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<typeof profile>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateProfile.mutate,
  };
};
