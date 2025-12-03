-- Create catalogs table
CREATE TABLE public.catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Meu Catálogo',
  cover_image TEXT,
  about_title TEXT DEFAULT 'Sobre',
  about_text TEXT,
  about_image TEXT,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_table JSONB NOT NULL DEFAULT '[]'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_whatsapp TEXT,
  contact_email TEXT,
  contact_instagram TEXT,
  contact_facebook TEXT,
  theme_primary_color TEXT DEFAULT '#3B82F6',
  theme_secondary_color TEXT DEFAULT '#1E40AF',
  theme_font TEXT DEFAULT 'Inter',
  sections_order JSONB NOT NULL DEFAULT '["cover", "about", "products", "prices", "gallery", "testimonials", "contacts"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own catalogs" 
ON public.catalogs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own catalogs" 
ON public.catalogs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catalogs" 
ON public.catalogs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catalogs" 
ON public.catalogs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_catalogs_updated_at
BEFORE UPDATE ON public.catalogs
FOR EACH ROW
EXECUTE FUNCTION public.update_ebook_updated_at();