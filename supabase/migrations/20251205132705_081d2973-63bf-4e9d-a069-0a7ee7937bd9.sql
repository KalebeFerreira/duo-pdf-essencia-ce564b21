-- Prevent direct referral inserts (force through edge function)
CREATE POLICY "Prevent direct referral inserts"
ON public.referrals FOR INSERT TO authenticated
WITH CHECK (false);

-- Prevent direct commission inserts (force through edge function)
CREATE POLICY "Prevent direct commission inserts"
ON public.commissions FOR INSERT TO authenticated
WITH CHECK (false);

-- Prevent direct profile deletion (force through edge function)
CREATE POLICY "Prevent direct profile deletion"
ON public.profiles FOR DELETE TO authenticated
USING (false);