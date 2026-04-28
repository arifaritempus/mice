-- Supabase Auth'da kullanıcıları kontrol et
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

-- 1. Auth.users tablosundaki tüm kullanıcıları listele
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    updated_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Belirli email'leri kontrol et
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users
WHERE email IN (
    'arif.ari@tempustravel.co',
    'anilay.acikavak@tempustravel.co'
);

-- 3. Users tablosundaki kullanıcıları kontrol et
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM users
WHERE email IN (
    'arif.ari@tempustravel.co',
    'anilay.acikavak@tempustravel.co'
);

