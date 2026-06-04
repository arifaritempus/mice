-- EVENT X SUPABASE KURULUM DOSYASI

-- ==========================================
-- DOSYA: supabase-schema-complete.sql
-- ==========================================

-- TEMPUS TRAVEL MICE YÖNETİM SİSTEMİ - SUPABASE SCHEMA
-- Tüm localStorage verilerini Supabase tablolarına dönüştürme

-- 1. KULLANICILAR TABLOSU
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AJANSALAR TABLOSU
CREATE TABLE agencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. OTELLER TABLOSU
CREATE TABLE hotels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TEDARİKÇİLER TABLOSU
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'hotel', 'transport', 'guide', 'other'
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HİZMET TİPLERİ TABLOSU
CREATE TABLE service_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'accommodation', 'transport', 'guide', 'other'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. KATEGORİLER TABLOSU
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PROJELER TABLOSU
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    agency_id UUID REFERENCES agencies(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    total_budget DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PROJE KULLANICILARI TABLOSU
CREATE TABLE project_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 9. TEKLİFLER TABLOSU
CREATE TABLE quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
    valid_until DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TEKLİF KALEMLERİ TABLOSU
CREATE TABLE quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SEJOUR REZERVASYONLARI TABLOSU
CREATE TABLE sejours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_number VARCHAR(100) UNIQUE NOT NULL,
    customer_type VARCHAR(50) NOT NULL, -- 'individual', 'agency'
    customer_name VARCHAR(255) NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    hotel_id UUID REFERENCES hotels(id),
    hotel_name VARCHAR(255),
    hotel_address TEXT,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'draft', 'confirmed', 'cancelled'
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. SEJOUR ODALARI TABLOSU
CREATE TABLE sejour_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    room_number VARCHAR(50),
    room_type VARCHAR(255) NOT NULL,
    room_type_code VARCHAR(10), -- 'SNG', 'DBL', 'TWN', 'TRP'
    guest_info TEXT,
    price DECIMAL(15,2),
    currency VARCHAR(10),
    cost_price DECIMAL(15,2),
    cost_currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. SEJOUR UÇUŞLARI TABLOSU
CREATE TABLE sejour_flights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    flight_date DATE NOT NULL,
    airline VARCHAR(255) NOT NULL,
    route VARCHAR(100) NOT NULL,
    flight_number VARCHAR(50) NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    flight_type VARCHAR(50) DEFAULT 'departure', -- 'departure', 'return'
    price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. SEJOUR TRANSFERLERİ TABLOSU
CREATE TABLE sejour_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    direction VARCHAR(50) NOT NULL, -- 'arrival', 'return', 'intermediate'
    transfer_type VARCHAR(50) NOT NULL, -- 'private', 'shared'
    vehicle VARCHAR(255),
    supplier_id UUID REFERENCES suppliers(id),
    time TIME,
    price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. SEJOUR EK HİZMETLERİ TABLOSU
CREATE TABLE sejour_extra_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES service_types(id),
    provider_id UUID REFERENCES suppliers(id),
    description TEXT,
    price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. OPERASYONLAR TABLOSU
CREATE TABLE operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    operation_type VARCHAR(100) NOT NULL, -- 'guide', 'transfer', 'ticket', 'other'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
    cost DECIMAL(15,2),
    currency VARCHAR(10),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. OPERASYON REHBERLERİ TABLOSU
CREATE TABLE operation_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
    guide_name VARCHAR(255) NOT NULL,
    language VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. OPERASYON TRANSFERLERİ TABLOSU
CREATE TABLE operation_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100) NOT NULL,
    vehicle_name VARCHAR(255),
    capacity INTEGER,
    supplier_id UUID REFERENCES suppliers(id),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. OPERASYON BİLETLERİ TABLOSU
CREATE TABLE operation_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
    ticket_type VARCHAR(100) NOT NULL, -- 'museum', 'attraction', 'transport', 'other'
    ticket_name VARCHAR(255) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. BÜTÇE TABLOSU
CREATE TABLE budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    category VARCHAR(100) NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. RAPORLAR TABLOSU
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'financial', 'operational', 'custom'
    parameters JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. AYARLAR TABLOSU
CREATE TABLE settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. YETKİLER TABLOSU
CREATE TABLE permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    permission_type VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete'
    is_granted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, module, permission_type)
);

-- 24. BİLDİRİMLER TABLOSU
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. LOGLAR TABLOSU
CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İNDEKSLER
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_quotes_project_id ON quotes(project_id);
CREATE INDEX idx_quotes_agency_id ON quotes(agency_id);
CREATE INDEX idx_sejours_agency_id ON sejours(agency_id);
CREATE INDEX idx_sejours_hotel_id ON sejours(hotel_id);
CREATE INDEX idx_sejour_rooms_sejour_id ON sejour_rooms(sejour_id);
CREATE INDEX idx_sejour_flights_sejour_id ON sejour_flights(sejour_id);
CREATE INDEX idx_sejour_transfers_sejour_id ON sejour_transfers(sejour_id);
CREATE INDEX idx_operations_project_id ON operations(project_id);
CREATE INDEX idx_operations_supplier_id ON operations(supplier_id);
CREATE INDEX idx_permissions_role ON permissions(role);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejours ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi verilerini görebilir (admin hariç)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Projeler - kullanıcı projede üye ise görebilir
CREATE POLICY "Users can view project if member" ON projects
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = projects.id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Diğer tablolar için benzer politikalar...

-- TRIGGER'LAR - Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'larını ekle
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejours_updated_at BEFORE UPDATE ON sejours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- BAŞLANGIÇ VERİLERİ
INSERT INTO users (id, first_name, last_name, email, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'Arif', 'Ari', 'arif.ari@tempustravel.co', 'super_admin');

-- Varsayılan kategoriler
INSERT INTO categories (name, description) VALUES 
('Konaklama', 'Otel ve konaklama hizmetleri'),
('Ulaşım', 'Transfer ve ulaşım hizmetleri'),
('Rehberlik', 'Rehber ve tur hizmetleri'),
('Bilet', 'Müze ve etkinlik biletleri'),
('Yemek', 'Yemek ve catering hizmetleri'),
('Diğer', 'Diğer hizmetler');

-- Varsayılan hizmet tipleri
INSERT INTO service_types (name, category) VALUES 
('Otel Rezervasyonu', 'accommodation'),
('Havaalanı Transferi', 'transport'),
('Şehir Transferi', 'transport'),
('Rehber Hizmeti', 'guide'),
('Müze Bileti', 'ticket'),
('Restoran Rezervasyonu', 'other');

-- Varsayılan ayarlar
INSERT INTO settings (key, value, description) VALUES 
('general_settings', '{"company_name": "TEMPUS TRAVEL", "company_address": "", "company_phone": "", "company_email": "info@tempustravel.co", "company_website": "www.tempustravel.co"}', 'Genel şirket ayarları'),
('theme_settings', '{"theme": "light", "primary_color": "#2F3B46"}', 'Tema ayarları'),
('logo_settings', '{"light_icon_logo": "", "light_wordmark_logo": "", "dark_icon_logo": "", "dark_wordmark_logo": ""}', 'Logo ayarları');

-- Varsayılan yetkiler
INSERT INTO permissions (role, module, permission_type, is_granted) VALUES 
-- Super Admin - Tüm yetkiler
('super_admin', 'dashboard', 'view', true),
('super_admin', 'dashboard', 'create', true),
('super_admin', 'dashboard', 'edit', true),
('super_admin', 'dashboard', 'delete', true),
('super_admin', 'projects', 'view', true),
('super_admin', 'projects', 'create', true),
('super_admin', 'projects', 'edit', true),
('super_admin', 'projects', 'delete', true),
('super_admin', 'quotes', 'view', true),
('super_admin', 'quotes', 'create', true),
('super_admin', 'quotes', 'edit', true),
('super_admin', 'quotes', 'delete', true),
('super_admin', 'sejour', 'view', true),
('super_admin', 'sejour', 'create', true),
('super_admin', 'sejour', 'edit', true),
('super_admin', 'sejour', 'delete', true),
('super_admin', 'operations', 'view', true),
('super_admin', 'operations', 'create', true),
('super_admin', 'operations', 'edit', true),
('super_admin', 'operations', 'delete', true),
('super_admin', 'suppliers', 'view', true),
('super_admin', 'suppliers', 'create', true),
('super_admin', 'suppliers', 'edit', true),
('super_admin', 'suppliers', 'delete', true),
('super_admin', 'tickets', 'view', true),
('super_admin', 'tickets', 'create', true),
('super_admin', 'tickets', 'edit', true),
('super_admin', 'tickets', 'delete', true),
('super_admin', 'users', 'view', true),
('super_admin', 'users', 'create', true),
('super_admin', 'users', 'edit', true),
('super_admin', 'users', 'delete', true),
('super_admin', 'permissions', 'view', true),
('super_admin', 'permissions', 'create', true),
('super_admin', 'permissions', 'edit', true),
('super_admin', 'permissions', 'delete', true),
('super_admin', 'profile', 'view', true),
('super_admin', 'profile', 'create', true),
('super_admin', 'profile', 'edit', true),
('super_admin', 'profile', 'delete', true);

-- Admin yetkileri (delete hariç)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'admin', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type != 'delete';

-- Manager yetkileri (sadece view ve create)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'manager', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type IN ('view', 'create');

-- User yetkileri (sadece view)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'user', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type = 'view';

-- Viewer yetkileri (sadece view)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'viewer', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type = 'view';


-- ==========================================
-- DOSYA: setup-permissions-system-fixed.sql
-- ==========================================

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Permissions ve Role Permissions Sistemi Kurulum Script'i (Düzeltilmiş)
-- Bu script Supabase SQL Editor'da çalıştırılmalıdır

-- 0. ÖNCE DUPLICATE KAYITLARI TEMİZLE
-- Permissions tablosundaki duplicate kayıtları temizle (en eski olanı tut)
-- Cleaned duplicate block for permissions

-- Roles tablosundaki duplicate kayıtları temizle (en eski olanı tut)
-- Cleaned duplicate block for roles

-- Role_permissions tablosundaki duplicate kayıtları temizle (en eski olanı tut)
-- Cleaned duplicate block for role_permissions

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


-- ==========================================
-- DOSYA: events-activities-schema.sql
-- ==========================================

-- ETKİNLİK & AKTİVİTE TABLOSU
-- Proje etkinlik ve aktivitelerini yönetmek için

CREATE TABLE IF NOT EXISTS project_events_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Temel bilgiler
    event_date DATE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id), -- Otel/Tedarikçi
    supplier_type VARCHAR(50) DEFAULT 'supplier', -- 'hotel' veya 'supplier'
    
    -- Kategori bilgileri
    main_category VARCHAR(100) DEFAULT 'Etkinlik & Aktivite', -- Sabit değer
    sub_category_id UUID REFERENCES categories(id), -- CAT_005 ID'li alt kategoriler
    
    -- Açıklama
    description TEXT,
    
    -- Finansal bilgiler
    amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- Tutar
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR', -- Döviz
    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1, -- Kur
    total_tl DECIMAL(15,2) GENERATED ALWAYS AS (amount * exchange_rate) STORED, -- Toplam TL (otomatik hesaplanan)
    
    -- Sistem alanları
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_events_activities_project_id ON project_events_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_activities_supplier_id ON project_events_activities(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_events_activities_event_date ON project_events_activities(event_date);
CREATE INDEX IF NOT EXISTS idx_project_events_activities_sub_category_id ON project_events_activities(sub_category_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE project_events_activities ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi projelerindeki etkinlikleri görebilir
CREATE POLICY "Users can view events in their projects" ON project_events_activities
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

-- Kullanıcılar kendi projelerinde etkinlik oluşturabilir
CREATE POLICY "Users can create events in their projects" ON project_events_activities
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

-- Kullanıcılar kendi projelerindeki etkinlikleri güncelleyebilir
CREATE POLICY "Users can update events in their projects" ON project_events_activities
    FOR UPDATE USING (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

-- Kullanıcılar kendi projelerindeki etkinlikleri silebilir
CREATE POLICY "Users can delete events in their projects" ON project_events_activities
    FOR DELETE USING (
        project_id IN (
            SELECT project_id FROM project_users WHERE user_id = auth.uid()
        )
    );

-- Updated_at trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_events_activities_updated_at 
    BEFORE UPDATE ON project_events_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- DOSYA: marketing_schema.sql
-- ==========================================

-- Marketing Module Schema - Düzeltilmiş (Roles/Permissions Sistemi Uyumlu)
-- Bu kodları Supabase SQL Editor'da çalıştırın.

-- 1. Marketing Müşterileri (Firmalar ve Acenteler)
CREATE TABLE IF NOT EXISTS public.marketing_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('firma', 'acenta', 'diger')),
    industry TEXT, -- Sektörü
    website TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    tax_office TEXT,
    tax_number TEXT,
    services TEXT[] DEFAULT '{}', -- mice, sejour, konaklama, uçak bileti, transfer, organizasyon, kongre, vb.
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Marketing Kişileri (Sınırsız ilgili kişi)
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.marketing_clients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    position TEXT, -- Ünvanı
    phone TEXT,
    mobile TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Marketing Etkileşimleri (Görüşmeler, Aramalar, E-postalar, Randevular)
CREATE TABLE IF NOT EXISTS public.marketing_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.marketing_clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
    interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL, -- yüz yüze, online, telefon, e-posta
    status TEXT DEFAULT 'completed', -- completed, planned (appointment), cancelled
    subject TEXT,
    description TEXT, -- Görüşme detayı
    discussed_services TEXT[] DEFAULT '{}', -- mice, sejour, vb.
    appointment_date TIMESTAMPTZ, -- Gelecek randevu tarihi
    user_id UUID REFERENCES auth.users(id), -- Görüşmeyi yapan kullanıcı
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Marketing Notları (İlave notlar)
CREATE TABLE IF NOT EXISTS public.marketing_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.marketing_clients(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES public.marketing_interactions(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Aktifleştirme
ALTER TABLE public.marketing_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_notes ENABLE ROW LEVEL SECURITY;

-- Temel Politikalar (Tüm giriş yapmış kullanıcılar için izin ver)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_clients'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_clients FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_contacts'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_contacts FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_interactions'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_interactions FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable all for authenticated users' AND polrelid = 'public.marketing_notes'::regclass) THEN
        CREATE POLICY "Enable all for authenticated users" ON public.marketing_notes FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- 5. Yetkiler (Permissions) Tanımlama
-- Mevcut yetki sistemine (permissions ve roles tabloları) uygun ekleme
INSERT INTO public.permissions (module, action, description, is_active)
VALUES 
    ('marketing', 'view', 'Marketing modülü görüntüleme', true),
    ('marketing', 'create', 'Marketing kaydı oluşturma', true),
    ('marketing', 'edit', 'Marketing kaydı düzenleme', true),
    ('marketing', 'delete', 'Marketing kaydı silme', true)
ON CONFLICT (module, action) DO NOTHING;

-- Super Admin rolü için tüm yetkileri ata
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('super_admin', 'Süper Admin')
  AND p.module = 'marketing'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );


-- ==========================================
-- DOSYA: hotel-extra-schema.sql
-- ==========================================

-- OTEL EKSTRA HİZMETLERİ TABLOSU
CREATE TABLE project_hotel_extras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hotel VARCHAR(255) NOT NULL, -- Otel/Tedarikçi adı
    main_category VARCHAR(100) NOT NULL, -- Ana kategori (CAT_002 gibi)
    sub_category VARCHAR(255), -- Alt kategori adı
    room_number VARCHAR(50), -- Oda numarası
    guest_name VARCHAR(255), -- Misafir adı
    description TEXT, -- Açıklama
    amount DECIMAL(15,4) NOT NULL DEFAULT 0, -- Tutar
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY', -- Döviz cinsi
    exchange_rate DECIMAL(10,4) DEFAULT 1, -- Döviz kuru
    total_try DECIMAL(15,2) NOT NULL DEFAULT 0, -- Toplam TL
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_project_hotel_extras_project_id ON project_hotel_extras(project_id);
CREATE INDEX idx_project_hotel_extras_date ON project_hotel_extras(date);
CREATE INDEX idx_project_hotel_extras_hotel ON project_hotel_extras(hotel);
CREATE INDEX idx_project_hotel_extras_main_category ON project_hotel_extras(main_category);

-- RLS politikası
ALTER TABLE project_hotel_extras ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin otel ekstra verilerini görebilir
CREATE POLICY "Users can view hotel extras if project member" ON project_hotel_extras
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin otel ekstra verilerini ekleyebilir
CREATE POLICY "Users can insert hotel extras if project member" ON project_hotel_extras
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin otel ekstra verilerini güncelleyebilir
CREATE POLICY "Users can update hotel extras if project member" ON project_hotel_extras
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin otel ekstra verilerini silebilir
CREATE POLICY "Users can delete hotel extras if project member" ON project_hotel_extras
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Updated_at trigger'ı ekle
CREATE TRIGGER update_project_hotel_extras_updated_at 
    BEFORE UPDATE ON project_hotel_extras 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


