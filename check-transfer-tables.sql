-- Supabase'de transfer tablolarını kontrol et
-- Bu kodu Supabase SQL Editor'da çalıştır

-- 1. Mevcut tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%transfer%'
ORDER BY table_name;

-- 2. project_transfer_tour tablosunun yapısını kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_transfer_tour' 
ORDER BY ordinal_position;

-- 3. RLS politikalarını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'project_transfer_tour';

-- 4. Tablo var mı kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_transfer_tour'
) as table_exists;
