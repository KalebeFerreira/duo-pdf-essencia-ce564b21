-- Add columns for device-specific theme preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_desktop text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS theme_mobile text DEFAULT 'system';