-- Add template column to documents table for resume templates
ALTER TABLE public.documents 
ADD COLUMN template TEXT DEFAULT 'professional';