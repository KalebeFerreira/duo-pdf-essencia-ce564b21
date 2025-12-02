-- Update default limits for all plans

-- Free plan defaults (40 PDFs/month, 30 automations/month, 30 designs/month, 10 resumes/month, ebooks up to 10 pages)
ALTER TABLE profiles 
  ALTER COLUMN daily_pdfs_limit SET DEFAULT 40,
  ALTER COLUMN daily_automations_limit SET DEFAULT 30;

-- Add new columns for tracking different resource types
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS monthly_designs_limit integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS designs_used_this_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_resumes_limit integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS resumes_used_this_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ebook_page_limit integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS last_monthly_reset_date date DEFAULT CURRENT_DATE;

-- Update existing free plan users to have the new limits
UPDATE profiles 
SET 
  daily_pdfs_limit = 40,
  daily_automations_limit = 30,
  monthly_designs_limit = 30,
  designs_used_this_month = 0,
  monthly_resumes_limit = 10,
  resumes_used_this_month = 0,
  ebook_page_limit = 10
WHERE plan = 'free' OR plan IS NULL;

-- Update basic plan limits (200 PDFs/month, 300 designs/month, 300 resumes/month, ebooks up to 30 pages)
UPDATE profiles 
SET 
  daily_pdfs_limit = 200,
  daily_automations_limit = 999999,
  monthly_designs_limit = 300,
  monthly_resumes_limit = 300,
  ebook_page_limit = 30
WHERE plan = 'basic';

-- Update complete/professional plan limits (unlimited everything)
UPDATE profiles 
SET 
  daily_pdfs_limit = 999999,
  daily_automations_limit = 999999,
  monthly_designs_limit = 999999,
  monthly_resumes_limit = 999999,
  ebook_page_limit = 999999
WHERE plan = 'complete' OR plan = 'professional';