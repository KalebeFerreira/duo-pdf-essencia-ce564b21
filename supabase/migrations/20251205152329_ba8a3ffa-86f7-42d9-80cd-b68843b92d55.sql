-- Add policy for referred users to view their own referral record (GDPR compliance)
CREATE POLICY "Users can view referrals where they are referred"
ON public.referrals FOR SELECT TO authenticated
USING (auth.uid() = referred_id);

-- Block anonymous access to referrals table
CREATE POLICY "Block anonymous access to referrals"
ON public.referrals FOR SELECT TO anon
USING (false);

CREATE POLICY "Block anonymous insert to referrals"
ON public.referrals FOR INSERT TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous update to referrals"
ON public.referrals FOR UPDATE TO anon
USING (false);

CREATE POLICY "Block anonymous delete to referrals"
ON public.referrals FOR DELETE TO anon
USING (false);