-- Atualizar limites padrão para novos usuários
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
    30,  -- 30 PDFs mensais
    0,
    0,
    0,
    3,   -- 3 PDFs por dia
    CURRENT_DATE,
    0,
    1,
    CURRENT_DATE
  );
  RETURN new;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar usuários existentes com plano gratuito
UPDATE public.profiles
SET 
  pdfs_limit = 30,
  daily_pdfs_limit = 3
WHERE plan = 'free' OR plan IS NULL;