-- ETKİNLİK TABLOSU KONTROL VE TEST
-- Bu kodu Supabase SQL Editor'de çalıştırın

-- 1. Tablo var mı kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'project_events_activities';

-- 2. Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_events_activities'
ORDER BY ordinal_position;

-- 3. RLS durumunu kontrol et
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'project_events_activities';

-- 4. Politikaları kontrol et
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'project_events_activities';
