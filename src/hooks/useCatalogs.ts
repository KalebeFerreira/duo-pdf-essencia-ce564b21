import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
}

export interface CatalogPriceItem {
  id: string;
  service: string;
  price: string;
  description?: string;
}

export interface CatalogTestimonial {
  id: string;
  name: string;
  text: string;
  rating?: number;
}

export interface Catalog {
  id: string;
  user_id: string;
  title: string;
  cover_image?: string;
  about_title: string;
  about_text?: string;
  about_image?: string;
  products: CatalogProduct[];
  price_table: CatalogPriceItem[];
  gallery: string[];
  testimonials: CatalogTestimonial[];
  contact_whatsapp?: string;
  contact_email?: string;
  contact_instagram?: string;
  contact_facebook?: string;
  theme_primary_color: string;
  theme_secondary_color: string;
  theme_font: string;
  sections_order: string[];
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export const useCatalogs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: catalogs, isLoading, error } = useQuery({
    queryKey: ['catalogs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Catalog[];
    },
    enabled: !!user?.id,
  });

  const createCatalog = useMutation({
    mutationFn: async (catalogData: Partial<Catalog>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('catalogs')
        .insert({
          user_id: user.id,
          title: catalogData.title || 'Meu Catálogo',
          cover_image: catalogData.cover_image,
          about_title: catalogData.about_title,
          about_text: catalogData.about_text,
          about_image: catalogData.about_image,
          products: (catalogData.products || []) as unknown as Json,
          price_table: (catalogData.price_table || []) as unknown as Json,
          gallery: (catalogData.gallery || []) as unknown as Json,
          testimonials: (catalogData.testimonials || []) as unknown as Json,
          contact_whatsapp: catalogData.contact_whatsapp,
          contact_email: catalogData.contact_email,
          contact_instagram: catalogData.contact_instagram,
          contact_facebook: catalogData.contact_facebook,
          theme_primary_color: catalogData.theme_primary_color,
          theme_secondary_color: catalogData.theme_secondary_color,
          theme_font: catalogData.theme_font,
          sections_order: (catalogData.sections_order || []) as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Catalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs', user?.id] });
    },
  });

  const updateCatalog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Catalog> & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.cover_image !== undefined) updateData.cover_image = updates.cover_image;
      if (updates.about_title !== undefined) updateData.about_title = updates.about_title;
      if (updates.about_text !== undefined) updateData.about_text = updates.about_text;
      if (updates.about_image !== undefined) updateData.about_image = updates.about_image;
      if (updates.products !== undefined) updateData.products = updates.products as unknown as Json;
      if (updates.price_table !== undefined) updateData.price_table = updates.price_table as unknown as Json;
      if (updates.gallery !== undefined) updateData.gallery = updates.gallery as unknown as Json;
      if (updates.testimonials !== undefined) updateData.testimonials = updates.testimonials as unknown as Json;
      if (updates.contact_whatsapp !== undefined) updateData.contact_whatsapp = updates.contact_whatsapp;
      if (updates.contact_email !== undefined) updateData.contact_email = updates.contact_email;
      if (updates.contact_instagram !== undefined) updateData.contact_instagram = updates.contact_instagram;
      if (updates.contact_facebook !== undefined) updateData.contact_facebook = updates.contact_facebook;
      if (updates.theme_primary_color !== undefined) updateData.theme_primary_color = updates.theme_primary_color;
      if (updates.theme_secondary_color !== undefined) updateData.theme_secondary_color = updates.theme_secondary_color;
      if (updates.theme_font !== undefined) updateData.theme_font = updates.theme_font;
      if (updates.sections_order !== undefined) updateData.sections_order = updates.sections_order as unknown as Json;
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;

      const { data, error } = await supabase
        .from('catalogs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Catalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs', user?.id] });
    },
  });

  const deleteCatalog = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('catalogs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs', user?.id] });
    },
  });

  const duplicateCatalog = useMutation({
    mutationFn: async (catalog: Catalog) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('catalogs')
        .insert({
          user_id: user.id,
          title: `${catalog.title} (cópia)`,
          cover_image: catalog.cover_image,
          about_title: catalog.about_title,
          about_text: catalog.about_text,
          about_image: catalog.about_image,
          products: catalog.products as unknown as Json,
          price_table: catalog.price_table as unknown as Json,
          gallery: catalog.gallery as unknown as Json,
          testimonials: catalog.testimonials as unknown as Json,
          contact_whatsapp: catalog.contact_whatsapp,
          contact_email: catalog.contact_email,
          contact_instagram: catalog.contact_instagram,
          contact_facebook: catalog.contact_facebook,
          theme_primary_color: catalog.theme_primary_color,
          theme_secondary_color: catalog.theme_secondary_color,
          theme_font: catalog.theme_font,
          sections_order: catalog.sections_order as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Catalog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs', user?.id] });
    },
  });

  return {
    catalogs,
    isLoading,
    error,
    createCatalog: createCatalog.mutate,
    updateCatalog: updateCatalog.mutate,
    deleteCatalog: deleteCatalog.mutate,
    duplicateCatalog: duplicateCatalog.mutate,
    isCreating: createCatalog.isPending,
    isUpdating: updateCatalog.isPending,
    isDeleting: deleteCatalog.isPending,
  };
};

export const useCatalog = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['catalog', id],
    queryFn: async () => {
      if (!id || !user?.id) return null;

      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Catalog | null;
    },
    enabled: !!id && !!user?.id,
  });
};
