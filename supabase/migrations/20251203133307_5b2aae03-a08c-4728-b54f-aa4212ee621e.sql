-- Add column for custom background color
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_bg_color text DEFAULT NULL;