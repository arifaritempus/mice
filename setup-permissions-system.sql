-- Permissions ve Role Permissions Sistemi Kurulum Script'i
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

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

-- Roles: Authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
CREATE POLICY "Roles are viewable by authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Role Permissions: Authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Role permissions are viewable by authenticated users" ON role_permissions;
CREATE POLICY "Role permissions are viewable by authenticated users"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- 8. Tüm modüller için permission kayıtlarını oluştur (sadece yoksa)
INSERT INTO permissions (module, action, description, is_active)
SELECT * FROM (VALUES
-- Dashboard
('dashboard', 'view', 'Dashboard görüntüleme', true),
-- Quotes
('quotes', 'view', 'Teklifler görüntüleme', true),
('quotes', 'create', 'Teklif oluşturma', true),
('quotes', 'edit', 'Teklif düzenleme', true),
('quotes', 'delete', 'Teklif silme', true),
-- Projects
('projects', 'view', 'Projeler görüntüleme', true),
('projects', 'create', 'Proje oluşturma', true),
('projects', 'edit', 'Proje düzenleme', true),
('projects', 'delete', 'Proje silme', true),
-- Budget
('budget', 'view', 'Bütçe görüntüleme', true),
('budget', 'create', 'Bütçe oluşturma', true),
('budget', 'edit', 'Bütçe düzenleme', true),
('budget', 'delete', 'Bütçe silme', true),
-- Sejour
('sejour', 'view', 'Sejour görüntüleme', true),
('sejour', 'create', 'Sejour oluşturma', true),
('sejour', 'edit', 'Sejour düzenleme', true),
('sejour', 'delete', 'Sejour silme', true),
-- Operations
('operations', 'view', 'Operasyonlar görüntüleme', true),
('operations', 'create', 'Operasyon oluşturma', true),
('operations', 'edit', 'Operasyon düzenleme', true),
('operations', 'delete', 'Operasyon silme', true),
-- Tickets
('tickets', 'view', 'Biletler görüntüleme', true),
('tickets', 'create', 'Bilet oluşturma', true),
('tickets', 'edit', 'Bilet düzenleme', true),
('tickets', 'delete', 'Bilet silme', true),
-- Agencies
('agencies', 'view', 'Acenteler görüntüleme', true),
('agencies', 'create', 'Acente oluşturma', true),
('agencies', 'edit', 'Acente düzenleme', true),
('agencies', 'delete', 'Acente silme', true),
-- Hotels
('hotels', 'view', 'Oteller görüntüleme', true),
('hotels', 'create', 'Otel oluşturma', true),
('hotels', 'edit', 'Otel düzenleme', true),
('hotels', 'delete', 'Otel silme', true),
-- Suppliers
('suppliers', 'view', 'Tedarikçiler görüntüleme', true),
('suppliers', 'create', 'Tedarikçi oluşturma', true),
('suppliers', 'edit', 'Tedarikçi düzenleme', true),
('suppliers', 'delete', 'Tedarikçi silme', true),
-- Categories
('categories', 'view', 'Kategoriler görüntüleme', true),
('categories', 'create', 'Kategori oluşturma', true),
('categories', 'edit', 'Kategori düzenleme', true),
('categories', 'delete', 'Kategori silme', true),
-- Users
('users', 'view', 'Kullanıcılar görüntüleme', true),
('users', 'create', 'Kullanıcı oluşturma', true),
('users', 'edit', 'Kullanıcı düzenleme', true),
('users', 'delete', 'Kullanıcı silme', true),
-- Reports
('reports', 'view', 'Raporlar görüntüleme', true),
('reports', 'create', 'Rapor oluşturma', true),
('reports', 'edit', 'Rapor düzenleme', true),
('reports', 'delete', 'Rapor silme', true),
-- Settings
('settings', 'view', 'Ayarlar görüntüleme', true),
('settings', 'create', 'Ayar oluşturma', true),
('settings', 'edit', 'Ayar düzenleme', true),
('settings', 'delete', 'Ayar silme', true),
-- Profile
('profile', 'view', 'Profil görüntüleme', true),
('profile', 'create', 'Profil oluşturma', true),
('profile', 'edit', 'Profil düzenleme', true),
('profile', 'delete', 'Profil silme', true)
) AS v(module, action, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions p WHERE p.module = v.module AND p.action = v.action
);

-- 9. Varsayılan rolleri oluştur (sadece yoksa)
INSERT INTO roles (name, description, is_active)
SELECT * FROM (VALUES
('super_admin', 'Süper Admin - Tüm yetkilere sahip sistem yöneticisi', true),
('admin', 'Admin - Sistem yöneticisi', true),
('manager', 'Müdür - Proje ve operasyon müdürü', true),
('user', 'Kullanıcı - Standart kullanıcı', true),
('viewer', 'Görüntüleyici - Sadece görüntüleme yetkisi', true)
) AS v(name, description, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.name = v.name
);

-- 10. Super Admin için tüm yetkileri ata (sadece yoksa)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 11. Admin için yetkileri ata (users delete hariç, settings delete hariç)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND NOT (p.module = 'users' AND p.action = 'delete')
  AND NOT (p.module = 'settings' AND p.action = 'delete')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 12. Manager için yetkileri ata (users, settings, reports delete hariç)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
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

-- 13. User için yetkileri ata (sadece view ve bazı create/edit)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
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
SELECT 
  r.id as role_id,
  p.id as permission_id
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
  RAISE NOTICE 'Toplam % permission kaydı oluşturuldu', (SELECT COUNT(*) FROM permissions);
  RAISE NOTICE 'Toplam % rol kaydı oluşturuldu', (SELECT COUNT(*) FROM roles);
  RAISE NOTICE 'Toplam % rol-yetki ilişkisi oluşturuldu', (SELECT COUNT(*) FROM role_permissions);
END $$;

