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
