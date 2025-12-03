-- Add is_public column to catalogs table for public sharing
ALTER TABLE public.catalogs ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create policy for public viewing of catalogs
CREATE POLICY "Anyone can view public catalogs" 
ON public.catalogs 
FOR SELECT 
USING (is_public = true);

-- Add sidebar_color to profiles for custom sidebar theming
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sidebar_color text DEFAULT '#1e3a5f';