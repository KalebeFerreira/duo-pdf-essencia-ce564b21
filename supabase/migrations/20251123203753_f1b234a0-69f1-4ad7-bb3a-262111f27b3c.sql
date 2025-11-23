-- Update handle_new_user function to set higher limits for testing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, plan, pdfs_limit, pdfs_used, automations_used, pdfs_used_today, daily_pdfs_limit, last_reset_date, automations_used_today, daily_automations_limit, last_automations_reset_date)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', ''),
    'free',
    100,  -- 100 PDFs mensais para teste
    0,
    0,
    0,
    50,   -- 50 PDFs por dia para teste
    CURRENT_DATE,
    0,
    1,
    CURRENT_DATE
  );
  RETURN new;
END;
$function$;

-- Update existing free users to have the new higher limits
UPDATE public.profiles
SET 
  pdfs_limit = 100,
  daily_pdfs_limit = 50
WHERE plan = 'free' OR plan IS NULL;