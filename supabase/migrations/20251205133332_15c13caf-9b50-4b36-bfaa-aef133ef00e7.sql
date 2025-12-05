-- Block anonymous access to profiles table (sensitive payment/personal data)
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles FOR SELECT TO anon
USING (false);

-- Block anonymous access to commissions table (financial data)
CREATE POLICY "Block anonymous access to commissions"
ON public.commissions FOR SELECT TO anon
USING (false);

-- Block anonymous access to referral_codes table (prevent enumeration)
CREATE POLICY "Block anonymous access to referral_codes"
ON public.referral_codes FOR SELECT TO anon
USING (false);

-- Also block anonymous INSERT/UPDATE/DELETE on these tables for extra security
CREATE POLICY "Block anonymous insert to profiles"
ON public.profiles FOR INSERT TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous update to profiles"
ON public.profiles FOR UPDATE TO anon
USING (false);

CREATE POLICY "Block anonymous insert to commissions"
ON public.commissions FOR INSERT TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous update to commissions"
ON public.commissions FOR UPDATE TO anon
USING (false);

CREATE POLICY "Block anonymous insert to referral_codes"
ON public.referral_codes FOR INSERT TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous update to referral_codes"
ON public.referral_codes FOR UPDATE TO anon
USING (false);

CREATE POLICY "Block anonymous delete to referral_codes"
ON public.referral_codes FOR DELETE TO anon
USING (false);