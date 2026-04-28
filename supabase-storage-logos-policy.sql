-- Supabase Storage 'logos' bucket'ı için RLS politikaları
-- Bu script'i Supabase SQL Editor'de çalıştırın

-- Önce mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can insert logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete logos" ON storage.objects;

-- Storage objects tablosu için RLS'yi aktif et (eğer değilse)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BASİT YAKLAŞIM: Tüm authenticated kullanıcılar için izin
-- ============================================

-- Authenticated kullanıcılar logos bucket'ına dosya yükleyebilir
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Authenticated kullanıcılar logos bucket'ından dosya okuyabilir
CREATE POLICY "Authenticated users can read logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'logos');

-- Authenticated kullanıcılar logos bucket'ındaki dosyaları güncelleyebilir
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- Authenticated kullanıcılar logos bucket'ındaki dosyaları silebilir
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

-- ============================================
-- PUBLIC ERİŞİM (Bucket public ise)
-- ============================================

-- Public erişim için (herkese açık okuma)
CREATE POLICY "Public can read logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Eğer bucket public ise ve authenticated olmayan kullanıcılar da yükleyebilmeli ise:
-- (Genellikle gerekli değil, ama bazı durumlarda kullanılabilir)
-- CREATE POLICY "Public can insert logos"
-- ON storage.objects
-- FOR INSERT
-- TO public
-- WITH CHECK (bucket_id = 'logos');

