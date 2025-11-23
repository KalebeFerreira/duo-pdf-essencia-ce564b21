-- Add signature_url column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signature_url TEXT;