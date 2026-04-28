-- Duplicate Rolleri Temizleme Script'i
-- Bu script standart İngilizce rol isimlerini tutar, Türkçe duplicate'leri siler

-- 1. Önce hangi roller var kontrol et
SELECT id, name, description FROM roles ORDER BY name;

-- 2. Admin duplicate'i temizle
DO $$
DECLARE
  dup_id UUID;
  std_id UUID;
BEGIN
  -- Standart admin rolünü bul
  SELECT id INTO std_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  -- Admin duplicate'ini bul
  SELECT id INTO dup_id FROM roles WHERE name = 'Admin' LIMIT 1;
  
  -- Eğer her ikisi de varsa, duplicate'i temizle
  IF dup_id IS NOT NULL AND std_id IS NOT NULL THEN
    -- Role permissions'ları taşı
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT std_id, permission_id
    FROM role_permissions
    WHERE role_id = dup_id
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Duplicate role_permissions'ları sil
    DELETE FROM role_permissions WHERE role_id = dup_id;
    
    -- Duplicate rolü sil
    DELETE FROM roles WHERE id = dup_id;
    
    RAISE NOTICE 'Admin duplicate temizlendi';
  END IF;
END $$;

-- 3. Manager duplicate'i temizle
DO $$
DECLARE
  dup_id UUID;
  std_id UUID;
BEGIN
  SELECT id INTO std_id FROM roles WHERE name = 'manager' LIMIT 1;
  SELECT id INTO dup_id FROM roles WHERE name IN ('Müdür', 'Manager') AND name != 'manager' LIMIT 1;
  
  IF dup_id IS NOT NULL AND std_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT std_id, permission_id
    FROM role_permissions
    WHERE role_id = dup_id
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    DELETE FROM role_permissions WHERE role_id = dup_id;
    DELETE FROM roles WHERE id = dup_id;
    
    RAISE NOTICE 'Manager duplicate temizlendi';
  END IF;
END $$;

-- 4. User duplicate'i temizle
DO $$
DECLARE
  dup_id UUID;
  std_id UUID;
BEGIN
  SELECT id INTO std_id FROM roles WHERE name = 'user' LIMIT 1;
  SELECT id INTO dup_id FROM roles WHERE name = 'Kullanıcı' LIMIT 1;
  
  IF dup_id IS NOT NULL AND std_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT std_id, permission_id
    FROM role_permissions
    WHERE role_id = dup_id
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    DELETE FROM role_permissions WHERE role_id = dup_id;
    DELETE FROM roles WHERE id = dup_id;
    
    RAISE NOTICE 'User duplicate temizlendi';
  END IF;
END $$;

-- 5. Super Admin duplicate'i temizle
DO $$
DECLARE
  dup_id UUID;
  std_id UUID;
BEGIN
  SELECT id INTO std_id FROM roles WHERE name = 'super_admin' LIMIT 1;
  SELECT id INTO dup_id FROM roles WHERE name = 'Süper Admin' LIMIT 1;
  
  IF dup_id IS NOT NULL AND std_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT std_id, permission_id
    FROM role_permissions
    WHERE role_id = dup_id
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    DELETE FROM role_permissions WHERE role_id = dup_id;
    DELETE FROM roles WHERE id = dup_id;
    
    RAISE NOTICE 'Super Admin duplicate temizlendi';
  END IF;
END $$;

-- 6. Son durumu kontrol et
SELECT id, name, description, 
  (SELECT COUNT(*) FROM role_permissions WHERE role_id = roles.id) as permission_count
FROM roles 
ORDER BY name;
