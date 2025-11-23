import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Helper para decodificar conteúdo base64 UTF-8
const decodeContent = (fileUrl: string): string => {
  if (!fileUrl) return '';
  
  // Se for data URL base64
  if (fileUrl.startsWith('data:text/plain;base64,')) {
    try {
      const base64Content = fileUrl.replace('data:text/plain;base64,', '');
      // Decodifica base64 UTF-8 corretamente
      return decodeURIComponent(escape(atob(base64Content)));
    } catch (error) {
      console.error('Error decoding base64 content:', error);
      return fileUrl;
    }
  }
  
  // Se for conteúdo direto, retorna como está
  return fileUrl;
};

export const useDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Decodifica o conteúdo de cada documento
      return (data || []).map(doc => ({
        ...doc,
        file_url: decodeContent(doc.file_url || ''),
      }));
    },
    enabled: !!user?.id,
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('documents')
        .update({ 
          title, 
          file_url: content 
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
    },
  });

  return {
    documents,
    isLoading,
    error,
    deleteDocument: deleteDocument.mutate,
    updateDocument: updateDocument.mutateAsync,
  };
};
