-- Sistem sahibi kullanıcısını oluştur
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

-- 1. Önce Supabase Auth'da kullanıcı oluştur (Dashboard > Authentication > Users)
-- Email: arif.ari@tempustravel.co
-- Password: 414041
-- Auto-confirm: true

-- 2. Kullanıcı oluşturulduktan sonra bu SQL'i çalıştırın:

-- Kullanıcının ID'sini al (e-posta ile)
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Kullanıcının ID'sini al
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'arif.ari@tempustravel.co';
    
    -- Eğer kullanıcı yoksa hata ver
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcı bulunamadı: arif.ari@tempustravel.co';
    END IF;
    
    -- Users tablosuna ekle
    INSERT INTO users (id, email, first_name, last_name, role, is_active)
    VALUES (
        user_id,
        'arif.ari@tempustravel.co',
        'Arif',
        'Ari',
        'super_admin',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active;
    
    RAISE NOTICE 'Sistem sahibi kullanıcısı başarıyla oluşturuldu: %', user_id;
END $$;

-- 3. Kullanıcının oluşturulduğunu kontrol et
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at
FROM users 
WHERE email = 'arif.ari@tempustravel.co'; 