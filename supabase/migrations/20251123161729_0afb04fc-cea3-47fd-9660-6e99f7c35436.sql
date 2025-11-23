-- Criar bucket para fotos de perfil dos currículos
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-photos', 'resume-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Fotos de currículo são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de suas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas fotos" ON storage.objects;

-- Política para visualizar fotos (público)
CREATE POLICY "Fotos de currículo são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'resume-photos');

-- Política para usuários fazerem upload de suas próprias fotos
CREATE POLICY "Usuários podem fazer upload de suas fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resume-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para usuários atualizarem suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas fotos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resume-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para usuários deletarem suas próprias fotos
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resume-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);