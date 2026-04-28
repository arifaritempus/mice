-- Transfer tablosu RLS politikalarını düzelt
-- Bu kodu Supabase SQL Editor'da çalıştır

-- 1. Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Users can view transfer_tour of their projects" ON project_transfer_tour;
DROP POLICY IF EXISTS "Users can insert transfer_tour to their projects" ON project_transfer_tour;
DROP POLICY IF EXISTS "Users can update transfer_tour of their projects" ON project_transfer_tour;
DROP POLICY IF EXISTS "Users can delete transfer_tour of their projects" ON project_transfer_tour;
DROP POLICY IF EXISTS "Allow all for testing" ON project_transfer_tour;

-- 2. Geçici olarak tüm kullanıcılara erişim ver (test için)
CREATE POLICY "Allow all users for testing" ON project_transfer_tour
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabloyu kontrol et
SELECT COUNT(*) as total_transfers FROM project_transfer_tour;

-- 4. Belirli proje için transferleri kontrol et
SELECT * FROM project_transfer_tour WHERE project_id = '52519ea8-11ea-4c2f-b55f-82df78813fc4';

-- 5. Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_transfer_tour' 
ORDER BY ordinal_position;
