-- Add fields to track daily usage for profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pdfs_used_today integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_reset_date date DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_pdfs_limit integer DEFAULT 10;

-- Update existing free plan users to have the new daily limit
UPDATE profiles 
SET daily_pdfs_limit = 10, 
    pdfs_limit = NULL 
WHERE plan = 'free';

-- Update basic plan users (25 per day)
UPDATE profiles 
SET daily_pdfs_limit = 25 
WHERE plan = 'basic';

-- Update complete plan users (unlimited, set to high number)
UPDATE profiles 
SET daily_pdfs_limit = 999999 
WHERE plan = 'complete';

-- Create function to reset daily counters
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the last reset date is before today, reset the counter
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.pdfs_used_today := 0;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically reset daily usage
DROP TRIGGER IF EXISTS check_daily_reset ON profiles;
CREATE TRIGGER check_daily_reset
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_daily_usage();

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, plan, pdfs_limit, pdfs_used, automations_used, pdfs_used_today, daily_pdfs_limit, last_reset_date)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', ''),
    'free',
    NULL,
    0,
    0,
    0,
    10,
    CURRENT_DATE
  );
  RETURN new;
END;
$function$;