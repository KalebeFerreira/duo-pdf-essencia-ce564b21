-- Adicionar coluna para armazenar URL da foto do currículo
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS photo_url TEXT;