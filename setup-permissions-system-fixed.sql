-- Permissions ve Role Permissions Sistemi Kurulum Script'i (Düzeltilmiş)
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

-- 0. ÖNCE DUPLICATE KAYITLARI TEMİZLE
-- Permissions tablosundaki duplicate kayıtları temizle (en eski olanı tut)
DELETE FROM permissions p1
WHERE EXISTS (
  SELECT 1 FROM permissions p2
  WHERE p2.module = p1.module
    AND p2.action = p1.action
    AND p2.id < p1.id
);

-- Roles tablosundaki duplicate kayıtları temizle (en eski olanı tut)
DELETE FROM roles r1
WHERE EXISTS (
  SELECT 1 FROM roles r2
  WHERE r2.name = r1.name
    AND r2.id < r1.id
);

-- Role_permissions tablosundaki duplicate kayıtları temizle (en eski olanı tut)
DELETE FROM role_permissions rp1
WHERE EXISTS (
  SELECT 1 FROM role_permissions rp2
  WHERE rp2.role_id = rp1.role_id
    AND rp2.permission_id = rp1.permission_id
    AND rp2.id < rp1.id
);

-- 1. PERMISSIONS tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint'i ayrı olarak ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'permissions_module_action_key'
  ) THEN
    ALTER TABLE permissions ADD CONSTRAINT permissions_module_action_key UNIQUE(module, action);
  END IF;
END $$;

-- 2. ROLES tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint'i ayrı olarak ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_key'
  ) THEN
    ALTER TABLE roles ADD CONSTRAINT roles_name_key UNIQUE(name);
  END IF;
END $$;

-- 3. ROLE_PERMISSIONS tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint'i ayrı olarak ekle (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_permission_id_key'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE(role_id, permission_id);
  END IF;
END $$;

-- 4. Index'ler
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 5. Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger'lar
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS (Row Level Security) Politikaları
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions: Authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Permissions are viewable by authenticated users" ON permissions;
CREATE POLICY "Permissions are viewable by authenticated users"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Permissions: Authenticated kullanıcılar ekleyebilir
DROP POLICY IF EXISTS "Permissions are insertable by authenticated users" ON permissions;
CREATE POLICY "Permissions are insertable by authenticated users"
  ON permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permissions: Authenticated kullanıcılar güncelleyebilir
DROP POLICY IF EXISTS "Permissions are updatable by authenticated users" ON permissions;
CREATE POLICY "Permissions are updatable by authenticated users"
  ON permissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permissions: Authenticated kullanıcılar silebilir
DROP POLICY IF EXISTS "Permissions are deletable by authenticated users" ON permissions;
CREATE POLICY "Permissions are deletable by authenticated users"
  ON permissions FOR DELETE
  TO authenticated
  USING (true);

-- Roles: Authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Roles: Authenticated kullanıcılar ekleyebilir
DROP POLICY IF EXISTS "Roles are insertable by authenticated users" ON roles;
CREATE POLICY "Roles are insertable by authenticated users"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Roles: Authenticated kullanıcılar güncelleyebilir
DROP POLICY IF EXISTS "Roles are updatable by authenticated users" ON roles;
CREATE POLICY "Roles are updatable by authenticated users"
  ON roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Roles: Authenticated kullanıcılar silebilir
DROP POLICY IF EXISTS "Roles are deletable by authenticated users" ON roles;
CREATE POLICY "Roles are deletable by authenticated users"
  ON roles FOR DELETE
  TO authenticated
  USING (true);

-- Role Permissions: Authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Role permissions are viewable by authenticated users" ON role_permissions;
CREATE POLICY "Role permissions are viewable by authenticated users"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Role Permissions: Authenticated kullanıcılar ekleyebilir
DROP POLICY IF EXISTS "Role permissions are insertable by authenticated users" ON role_permissions;
CREATE POLICY "Role permissions are insertable by authenticated users"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Role Permissions: Authenticated kullanıcılar güncelleyebilir
DROP POLICY IF EXISTS "Role permissions are updatable by authenticated users" ON role_permissions;
CREATE POLICY "Role permissions are updatable by authenticated users"
  ON role_permissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Role Permissions: Authenticated kullanıcılar silebilir
DROP POLICY IF EXISTS "Role permissions are deletable by authenticated users" ON role_permissions;
CREATE POLICY "Role permissions are deletable by authenticated users"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (true);

-- 8. Tüm modüller için permission kayıtlarını oluştur (sadece yoksa)
INSERT INTO permissions (id, module, action, description, is_active)
SELECT gen_random_uuid(), v.module, v.action, v.description, v.is_active
FROM (VALUES
('dashboard', 'view', 'Dashboard görüntüleme', true),
('quotes', 'view', 'Teklifler görüntüleme', true),
('quotes', 'create', 'Teklif oluşturma', true),
('quotes', 'edit', 'Teklif düzenleme', true),
('quotes', 'delete', 'Teklif silme', true),
('projects', 'view', 'Projeler görüntüleme', true),
('projects', 'create', 'Proje oluşturma', true),
('projects', 'edit', 'Proje düzenleme', true),
('projects', 'delete', 'Proje silme', true),
('budget', 'view', 'Bütçe görüntüleme', true),
('budget', 'create', 'Bütçe oluşturma', true),
('budget', 'edit', 'Bütçe düzenleme', true),
('budget', 'delete', 'Bütçe silme', true),
('sejour', 'view', 'Sejour görüntüleme', true),
('sejour', 'create', 'Sejour oluşturma', true),
('sejour', 'edit', 'Sejour düzenleme', true),
('sejour', 'delete', 'Sejour silme', true),
('operations', 'view', 'Operasyonlar görüntüleme', true),
('operations', 'create', 'Operasyon oluşturma', true),
('operations', 'edit', 'Operasyon düzenleme', true),
('operations', 'delete', 'Operasyon silme', true),
('tickets', 'view', 'Biletler görüntüleme', true),
('tickets', 'create', 'Bilet oluşturma', true),
('tickets', 'edit', 'Bilet düzenleme', true),
('tickets', 'delete', 'Bilet silme', true),
('agencies', 'view', 'Acenteler görüntüleme', true),
('agencies', 'create', 'Acente oluşturma', true),
('agencies', 'edit', 'Acente düzenleme', true),
('agencies', 'delete', 'Acente silme', true),
('hotels', 'view', 'Oteller görüntüleme', true),
('hotels', 'create', 'Otel oluşturma', true),
('hotels', 'edit', 'Otel düzenleme', true),
('hotels', 'delete', 'Otel silme', true),
('suppliers', 'view', 'Tedarikçiler görüntüleme', true),
('suppliers', 'create', 'Tedarikçi oluşturma', true),
('suppliers', 'edit', 'Tedarikçi düzenleme', true),
('suppliers', 'delete', 'Tedarikçi silme', true),
('categories', 'view', 'Kategoriler görüntüleme', true),
('categories', 'create', 'Kategori oluşturma', true),
('categories', 'edit', 'Kategori düzenleme', true),
('categories', 'delete', 'Kategori silme', true),
('users', 'view', 'Kullanıcılar görüntüleme', true),
('users', 'create', 'Kullanıcı oluşturma', true),
('users', 'edit', 'Kullanıcı düzenleme', true),
('users', 'delete', 'Kullanıcı silme', true),
('reports', 'view', 'Raporlar görüntüleme', true),
('reports', 'create', 'Rapor oluşturma', true),
('reports', 'edit', 'Rapor düzenleme', true),
('reports', 'delete', 'Rapor silme', true),
('settings', 'view', 'Ayarlar görüntüleme', true),
('settings', 'create', 'Ayar oluşturma', true),
('settings', 'edit', 'Ayar düzenleme', true),
('settings', 'delete', 'Ayar silme', true),
('profile', 'view', 'Profil görüntüleme', true),
('profile', 'create', 'Profil oluşturma', true),
('profile', 'edit', 'Profil düzenleme', true),
('profile', 'delete', 'Profil silme', true)
) AS v(module, action, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.module = v.module AND p.action = v.action
);

-- 9. Varsayılan rolleri oluştur (sadece yoksa)
INSERT INTO roles (id, name, description, is_active)
SELECT gen_random_uuid(), v.name, v.description, v.is_active
FROM (VALUES
('super_admin', 'Süper Admin - Tüm yetkilere sahip sistem yöneticisi', true),
('admin', 'Admin - Sistem yöneticisi', true),
('manager', 'Müdür - Proje ve operasyon müdürü', true),
('user', 'Kullanıcı - Standart kullanıcı', true),
('viewer', 'Görüntüleyici - Sadece görüntüleme yetkisi', true)
) AS v(name, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.name = v.name
);

-- 10. Super Admin için tüm yetkileri ata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 11. Admin için yetkileri ata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND NOT (p.module = 'users' AND p.action = 'delete')
  AND NOT (p.module = 'settings' AND p.action = 'delete')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 12. Manager için yetkileri ata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND NOT (p.module = 'users' AND p.action IN ('view', 'create', 'edit', 'delete'))
  AND NOT (p.module = 'settings' AND p.action IN ('view', 'create', 'edit', 'delete'))
  AND NOT (p.module = 'reports' AND p.action = 'delete')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 13. User için yetkileri ata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
  AND (
    (p.action = 'view') OR
    (p.module IN ('quotes', 'projects', 'budget', 'sejour', 'operations', 'tickets', 'agencies', 'hotels', 'suppliers') AND p.action IN ('create', 'edit'))
  )
  AND NOT (p.module = 'users')
  AND NOT (p.module = 'settings')
  AND NOT (p.module = 'categories' AND p.action IN ('create', 'edit', 'delete'))
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 14. Viewer için sadece view yetkilerini ata
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action = 'view'
  AND NOT (p.module = 'users')
  AND NOT (p.module = 'settings')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Başarı mesajı
DO $$
BEGIN
  RAISE NOTICE 'Permissions sistemi başarıyla kuruldu!';
  RAISE NOTICE 'Toplam % permission kaydı', (SELECT COUNT(*) FROM permissions);
  RAISE NOTICE 'Toplam % rol kaydı', (SELECT COUNT(*) FROM roles);
  RAISE NOTICE 'Toplam % rol-yetki ilişkisi', (SELECT COUNT(*) FROM role_permissions);
END $$;
