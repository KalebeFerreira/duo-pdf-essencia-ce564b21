-- Adicionar colunas de créditos e plano Stripe na tabela profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS monthly_credits integer DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS remaining_credits integer DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS renewal_date date DEFAULT (CURRENT_DATE + interval '1 month');

-- Atualizar trigger para renovar créditos mensalmente
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se a data de renovação passou, renovar créditos
  IF NEW.renewal_date <= CURRENT_DATE THEN
    NEW.remaining_credits := NEW.monthly_credits;
    NEW.renewal_date := (CURRENT_DATE + interval '1 month')::date;
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para renovação automática
DROP TRIGGER IF EXISTS trigger_reset_monthly_credits ON profiles;
CREATE TRIGGER trigger_reset_monthly_credits
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_credits();

-- Atualizar função de novo usuário para incluir créditos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    nome_completo, 
    plan, 
    pdfs_limit, 
    pdfs_used, 
    automations_used, 
    pdfs_used_today, 
    daily_pdfs_limit, 
    last_reset_date, 
    automations_used_today, 
    daily_automations_limit, 
    last_automations_reset_date,
    monthly_credits,
    remaining_credits,
    renewal_date
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', ''),
    'free',
    100,
    0,
    0,
    0,
    50,
    CURRENT_DATE,
    0,
    1,
    CURRENT_DATE,
    1000,
    1000,
    (CURRENT_DATE + interval '1 month')::date
  );
  RETURN new;
END;
$$;