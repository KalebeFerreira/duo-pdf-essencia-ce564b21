-- Tabela de códigos de indicação
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de indicações (quem indicou quem)
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL, -- quem indicou
  referred_id UUID NOT NULL, -- quem foi indicado
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  commission_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '12 months'),
  UNIQUE(referred_id)
);

-- Tabela de comissões
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id),
  referrer_id UUID NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL, -- valor pago pelo indicado
  commission_amount DECIMAL(10,2) NOT NULL, -- 10% do valor
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, expired
  payment_date TIMESTAMP WITH TIME ZONE, -- quando foi pago
  pix_key TEXT, -- chave PIX do afiliado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para referral_codes
CREATE POLICY "Users can view their own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para referrals (visualizar indicações que fez)
CREATE POLICY "Users can view referrals they made"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

-- RLS Policies para commissions
CREATE POLICY "Users can view their own commissions"
ON public.commissions FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can update their PIX key"
ON public.commissions FOR UPDATE
USING (auth.uid() = referrer_id)
WITH CHECK (auth.uid() = referrer_id);

-- Adicionar coluna pix_key no profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- Função para gerar código de indicação automaticamente
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar código automaticamente quando usuário é criado
CREATE TRIGGER on_profile_created_generate_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();