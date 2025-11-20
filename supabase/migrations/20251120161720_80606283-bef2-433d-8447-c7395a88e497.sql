-- Add automation daily tracking fields to profiles table
ALTER TABLE profiles 
ADD COLUMN automations_used_today integer DEFAULT 0,
ADD COLUMN daily_automations_limit integer DEFAULT 1,
ADD COLUMN last_automations_reset_date date DEFAULT CURRENT_DATE;

-- Update daily automation limits for existing plans
UPDATE profiles SET daily_automations_limit = 1 WHERE plan = 'free';
UPDATE profiles SET daily_automations_limit = 999999 WHERE plan = 'basic';
UPDATE profiles SET daily_automations_limit = 999999 WHERE plan = 'complete';

-- Create function to reset daily automation usage
CREATE OR REPLACE FUNCTION public.reset_daily_automations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If the last reset date is before today, reset the counter
  IF NEW.last_automations_reset_date < CURRENT_DATE THEN
    NEW.automations_used_today := 0;
    NEW.last_automations_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to check and reset daily automation usage
CREATE TRIGGER check_daily_automations_reset
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_daily_automations();

-- Update handle_new_user function to include automation fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, plan, pdfs_limit, pdfs_used, automations_used, pdfs_used_today, daily_pdfs_limit, last_reset_date, automations_used_today, daily_automations_limit, last_automations_reset_date)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', ''),
    'free',
    NULL,
    0,
    0,
    0,
    10,
    CURRENT_DATE,
    0,
    1,
    CURRENT_DATE
  );
  RETURN new;
END;
$$;