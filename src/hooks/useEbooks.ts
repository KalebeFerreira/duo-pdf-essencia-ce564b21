import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface Ebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  chapters: Chapter[];
  language: string;
  color_palette: string;
  created_at: string;
  updated_at: string;
}

export const useEbooks = () => {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEbooks = async () => {
    if (!user) {
      setEbooks([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEbooks((data || []).map(item => ({
        ...item,
        chapters: item.chapters as unknown as Chapter[]
      })));
    } catch (error) {
      console.error("Error fetching ebooks:", error);
      toast({
        title: "Erro ao carregar ebooks",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEbook = async (
    title: string,
    description: string,
    chapters: Chapter[],
    language: string,
    colorPalette: string
  ) => {
    if (!user) {
      toast({
        title: "Erro ao salvar",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("ebooks")
        .insert({
          user_id: user.id,
          title,
          description,
          chapters: chapters as any,
          language,
          color_palette: colorPalette,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Ebook salvo!",
        description: "Seu ebook foi salvo no histórico.",
      });

      await fetchEbooks();
      return data;
    } catch (error) {
      console.error("Error saving ebook:", error);
      toast({
        title: "Erro ao salvar ebook",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEbook = async (
    id: string,
    updates: {
      title?: string;
      description?: string;
      chapters?: Chapter[];
      language?: string;
      color_palette?: string;
    }
  ) => {
    if (!user) {
      toast({
        title: "Erro ao atualizar",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.chapters !== undefined) updateData.chapters = updates.chapters;
      if (updates.language !== undefined) updateData.language = updates.language;
      if (updates.color_palette !== undefined) updateData.color_palette = updates.color_palette;

      const { error } = await supabase
        .from("ebooks")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "✅ Ebook atualizado!",
        description: "Suas alterações foram salvas.",
      });

      await fetchEbooks();
      return true;
    } catch (error) {
      console.error("Error updating ebook:", error);
      toast({
        title: "Erro ao atualizar ebook",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEbook = async (id: string) => {
    if (!user) {
      toast({
        title: "Erro ao excluir",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("ebooks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Ebook excluído",
        description: "O ebook foi removido do histórico.",
      });

      await fetchEbooks();
      return true;
    } catch (error) {
      console.error("Error deleting ebook:", error);
      toast({
        title: "Erro ao excluir ebook",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEbooks();
  }, [user]);

  return {
    ebooks,
    isLoading,
    saveEbook,
    updateEbook,
    deleteEbook,
    refreshEbooks: fetchEbooks,
  };
};
