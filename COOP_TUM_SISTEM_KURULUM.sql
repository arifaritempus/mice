-- COOP (MICE) TUM SISTEM KURULUMU


-- ==========================================
-- BÖLÜM 0: EKSİK SÜTUN ONARIMLARI
-- ==========================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by UUID;
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hotels_data JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS hotels_data JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
    END IF;
END $$;




-- ==========================================
-- BÖLÜM: supabase-migration-safe.sql
-- ==========================================

-- TEMPUS TRAVEL - GÜVENLİ SUPABASE MİGRASYON
-- Mevcut tabloları kontrol ederek sadece eksik olanları oluşturur

-- 1. KULLANICILAR TABLOSU
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS agencies (
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
CREATE TABLE IF NOT EXISTS hotels (
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
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
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
CREATE TABLE IF NOT EXISTS service_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. KATEGORİLER TABLOSU
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PROJELER TABLOSU
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    agency_id UUID REFERENCES agencies(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    total_budget DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PROJE KULLANICILARI TABLOSU
CREATE TABLE IF NOT EXISTS project_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 9. TEKLİFLER TABLOSU
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TEKLİF KALEMLERİ TABLOSU
CREATE TABLE IF NOT EXISTS quote_items (
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
CREATE TABLE IF NOT EXISTS sejours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_number VARCHAR(100) UNIQUE NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    hotel_id UUID REFERENCES hotels(id),
    hotel_name VARCHAR(255),
    hotel_address TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. SEJOUR ODALARI TABLOSU
CREATE TABLE IF NOT EXISTS sejour_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    room_number VARCHAR(50),
    room_type VARCHAR(255) NOT NULL,
    room_type_code VARCHAR(10),
    guest_info TEXT,
    price DECIMAL(15,2),
    currency VARCHAR(10),
    cost_price DECIMAL(15,2),
    cost_currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. SEJOUR UÇUŞLARI TABLOSU
CREATE TABLE IF NOT EXISTS sejour_flights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    flight_date DATE NOT NULL,
    airline VARCHAR(255) NOT NULL,
    route VARCHAR(100) NOT NULL,
    flight_number VARCHAR(50) NOT NULL,
    departure_time TIME,
    arrival_time TIME,
    flight_type VARCHAR(50) DEFAULT 'departure',
    price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. SEJOUR TRANSFERLERİ TABLOSU
CREATE TABLE IF NOT EXISTS sejour_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
    direction VARCHAR(50) NOT NULL,
    transfer_type VARCHAR(50) NOT NULL,
    vehicle VARCHAR(255),
    supplier_id UUID REFERENCES suppliers(id),
    time TIME,
    price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. SEJOUR EK HİZMETLERİ TABLOSU
CREATE TABLE IF NOT EXISTS sejour_extra_services (
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
CREATE TABLE IF NOT EXISTS operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    operation_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planned',
    cost DECIMAL(15,2),
    currency VARCHAR(10),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. OPERASYON REHBERLERİ TABLOSU
CREATE TABLE IF NOT EXISTS operation_guides (
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
CREATE TABLE IF NOT EXISTS operation_transfers (
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
CREATE TABLE IF NOT EXISTS operation_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
    ticket_type VARCHAR(100) NOT NULL,
    ticket_name VARCHAR(255) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(15,2),
    currency VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. BÜTÇE TABLOSU
CREATE TABLE IF NOT EXISTS budgets (
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
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    parameters JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. AYARLAR TABLOSU
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. YETKİLER TABLOSU
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    permission_type VARCHAR(50) NOT NULL,
    is_granted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, module, permission_type)
);

-- 24. BİLDİRİMLER TABLOSU
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. LOGLAR TABLOSU
CREATE TABLE IF NOT EXISTS activity_logs (
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

-- İNDEKSLER (Sadece yoksa oluştur)
DO $$ 
BEGIN
    -- Projects indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_created_by') THEN
        CREATE INDEX idx_projects_created_by ON projects(created_by);
    END IF;
    
    -- Quotes indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_project_id') THEN
        CREATE INDEX idx_quotes_project_id ON quotes(project_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quotes_agency_id') THEN
        CREATE INDEX idx_quotes_agency_id ON quotes(agency_id);
    END IF;
    
    -- Sejours indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sejours_agency_id') THEN
        CREATE INDEX idx_sejours_agency_id ON sejours(agency_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sejours_hotel_id') THEN
        CREATE INDEX idx_sejours_hotel_id ON sejours(hotel_id);
    END IF;
    
    -- Other indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_role') THEN
        CREATE INDEX idx_permissions_role ON permissions(role);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_logs_user_id') THEN
        CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_logs_created_at') THEN
        CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
    END IF;
END $$;

-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejours ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları (Sadece yoksa oluştur)
DO $$ 
BEGIN
    -- Users policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own data') THEN
        CREATE POLICY "Users can view own data" ON users
            FOR SELECT USING (auth.uid() = id OR 
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));
    END IF;
    
    -- Projects policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view project if member') THEN
        CREATE POLICY "Users can view project if member" ON projects
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM project_users WHERE project_id = projects.id AND user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
            );
    END IF;
END $$;

-- TRIGGER'LAR - Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'larını ekle (Sadece yoksa)
DO $$ 
BEGIN
    -- Users trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Agencies trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agencies_updated_at') THEN
        CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Hotels trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hotels_updated_at') THEN
        CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Suppliers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
        CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Projects trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
        CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Quotes trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quotes_updated_at') THEN
        CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Sejours trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sejours_updated_at') THEN
        CREATE TRIGGER update_sejours_updated_at BEFORE UPDATE ON sejours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Operations trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_operations_updated_at') THEN
        CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- BAŞLANGIÇ VERİLERİ (Sadece yoksa ekle)
INSERT INTO users (id, first_name, last_name, email, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Arif', 'Ari', 'arif.ari@tempustravel.co', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- Varsayılan kategoriler
INSERT INTO categories (name, description) VALUES 
('Konaklama', 'Otel ve konaklama hizmetleri'),
('Ulaşım', 'Transfer ve ulaşım hizmetleri'),
('Rehberlik', 'Rehber ve tur hizmetleri'),
('Bilet', 'Müze ve etkinlik biletleri'),
('Yemek', 'Yemek ve catering hizmetleri'),
('Diğer', 'Diğer hizmetler')
ON CONFLICT DO NOTHING;

-- Varsayılan hizmet tipleri
INSERT INTO service_types (name, category) VALUES 
('Otel Rezervasyonu', 'accommodation'),
('Havaalanı Transferi', 'transport'),
('Şehir Transferi', 'transport'),
('Rehber Hizmeti', 'guide'),
('Müze Bileti', 'ticket'),
('Restoran Rezervasyonu', 'other')
ON CONFLICT DO NOTHING;

-- Varsayılan ayarlar
INSERT INTO settings (key, value, description) VALUES 
('general_settings', '{"company_name": "TEMPUS TRAVEL", "company_address": "", "company_phone": "", "company_email": "info@tempustravel.co", "company_website": "www.tempustravel.co"}', 'Genel şirket ayarları'),
('theme_settings', '{"theme": "light", "primary_color": "#2F3B46"}', 'Tema ayarları'),
('logo_settings', '{"light_icon_logo": "", "light_wordmark_logo": "", "dark_icon_logo": "", "dark_wordmark_logo": ""}', 'Logo ayarları')
ON CONFLICT (key) DO NOTHING;

-- Varsayılan yetkiler (Sadece yoksa ekle)
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
('super_admin', 'profile', 'delete', true)
ON CONFLICT (role, module, permission_type) DO NOTHING;

-- Admin yetkileri (delete hariç)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'admin', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type != 'delete'
ON CONFLICT (role, module, permission_type) DO NOTHING;

-- Manager yetkileri (sadece view ve create)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'manager', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type IN ('view', 'create')
ON CONFLICT (role, module, permission_type) DO NOTHING;

-- User yetkileri (sadece view)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'user', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type = 'view'
ON CONFLICT (role, module, permission_type) DO NOTHING;

-- Viewer yetkileri (sadece view)
INSERT INTO permissions (role, module, permission_type, is_granted) 
SELECT 'viewer', module, permission_type, is_granted 
FROM permissions 
WHERE role = 'super_admin' AND permission_type = 'view'
ON CONFLICT (role, module, permission_type) DO NOTHING;


-- ==========================================
-- BÖLÜM: create-project-flight-tickets-final.sql
-- ==========================================

-- PROJECT FLIGHT TICKETS TABLOSU OLUŞTURMA - FINAL
-- Supabase SQL Editor'da çalıştırın

-- 1. Mevcut tabloyu sil (eğer varsa)
DROP TABLE IF EXISTS project_flight_tickets CASCADE;

-- 2. Tabloyu oluştur
CREATE TABLE project_flight_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    biletleme_tarihi DATE,
    tedarikci VARCHAR(255),
    havayolu VARCHAR(255),
    pnr VARCHAR(100),
    ucus_tipi VARCHAR(50),
    gidis_tarihi DATE,
    gidis_saati TIME,
    gidis_ucus_kodu VARCHAR(50),
    donus_tarihi DATE,
    donus_saati TIME,
    donus_ucus_kodu VARCHAR(50),
    guzergah VARCHAR(255),
    kisi_sayisi INTEGER DEFAULT 1,
    pp_maliyet DECIMAL(15,2) DEFAULT 0,
    toplam_maliyet DECIMAL(15,2) DEFAULT 0,
    doviz VARCHAR(10) DEFAULT 'EUR',
    misafirler TEXT,
    durum VARCHAR(50) DEFAULT 'aktif',
    islemler TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Test verisi ekle
INSERT INTO project_flight_tickets (project_id, tedarikci, havayolu, pnr, ucus_tipi, guzergah, kisi_sayisi, pp_maliyet, toplam_maliyet, misafirler) 
VALUES (
    '52519ea8-11ea-4c2f-b55f-82df78813fc4', 
    'TEST TEDARIKCI', 
    'TK', 
    'TEST123',
    'GRUP',
    'IST-ECN-IST',
    470,
    230,
    108100,
    'TEST MISAFIR 1, TEST MISAFIR 2'
);

-- 4. Veriyi kontrol et
SELECT * FROM project_flight_tickets;

-- 5. Başarı mesajı
SELECT 'project_flight_tickets tablosu başarıyla oluşturuldu ve test verisi eklendi!' as message;


-- ==========================================
-- BÖLÜM: create-ticket-options-table.sql
-- ==========================================

-- BİLET OPSİYON TAKİP TABLOSU
-- Supabase SQL Editor'da çalıştırın

-- 1. Bilet opsiyonları tablosunu oluştur
CREATE TABLE IF NOT EXISTS ticket_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_no VARCHAR(255) NOT NULL,
    agent VARCHAR(255),
    company_name VARCHAR(255),
    supplier VARCHAR(255),
    airline VARCHAR(50),
    group_ref_no VARCHAR(255),
    flight_type VARCHAR(50), -- 'Gidiş', 'Dönüş', 'Gidiş Dönüş'
    departure_date DATE,
    departure_time TIME,
    return_date DATE,
    return_time TIME,
    route VARCHAR(255),
    passenger_count INTEGER DEFAULT 0,
    pp_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    option_end_date DATE,
    option_end_time TIME,
    pnr VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'confirmed', 'cancelled'
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ticket_options_voucher_no ON ticket_options(voucher_no);
CREATE INDEX IF NOT EXISTS idx_ticket_options_agent ON ticket_options(agent);
CREATE INDEX IF NOT EXISTS idx_ticket_options_supplier ON ticket_options(supplier);
CREATE INDEX IF NOT EXISTS idx_ticket_options_status ON ticket_options(status);
CREATE INDEX IF NOT EXISTS idx_ticket_options_departure_date ON ticket_options(departure_date);
CREATE INDEX IF NOT EXISTS idx_ticket_options_option_end_date ON ticket_options(option_end_date);

-- 3. RLS'yi etkinleştir
ALTER TABLE ticket_options ENABLE ROW LEVEL SECURITY;

-- 4. RLS politikalarını oluştur
-- Tüm kullanıcılar bilet opsiyonlarını görebilir (VIEW yetkisi varsa)
CREATE POLICY "Users can view ticket options" ON ticket_options
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonu ekleyebilir (CREATE yetkisi varsa)
CREATE POLICY "Users can create ticket options" ON ticket_options
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonunu güncelleyebilir (EDIT yetkisi varsa)
CREATE POLICY "Users can update ticket options" ON ticket_options
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonunu silebilir (DELETE yetkisi varsa)
CREATE POLICY "Users can delete ticket options" ON ticket_options
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 5. updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_ticket_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_options_updated_at
    BEFORE UPDATE ON ticket_options
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_options_updated_at();



















-- ==========================================
-- BÖLÜM: create-ticket-payments-tables.sql
-- ==========================================

-- BİLET ÖDEME TAKİP TABLOLARI
-- Supabase SQL Editor'da çalıştırın

-- 1. Ödeme Planları Tablosu
CREATE TABLE IF NOT EXISTS ticket_payment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket_options(id) ON DELETE CASCADE,
    installments JSONB NOT NULL, -- [{id, date, percentage, amount, currency}]
    total_amount DECIMAL(15,2) NOT NULL,
    total_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ödeme Kayıtları Tablosu
CREATE TABLE IF NOT EXISTS ticket_payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_plan_id UUID REFERENCES ticket_payment_plans(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES ticket_options(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_transfer', 'cash', 'online'
    notes TEXT,
    recipient VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ticket_payment_plans_ticket_id ON ticket_payment_plans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_plans_status ON ticket_payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_ticket_id ON ticket_payment_records(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_payment_plan_id ON ticket_payment_records(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_payment_date ON ticket_payment_records(payment_date);

-- 4. RLS'yi etkinleştir
ALTER TABLE ticket_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_payment_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS politikalarını oluştur - Payment Plans
CREATE POLICY "Users can view payment plans" ON ticket_payment_plans
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can create payment plans" ON ticket_payment_plans
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can update payment plans" ON ticket_payment_plans
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can delete payment plans" ON ticket_payment_plans
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 6. RLS politikalarını oluştur - Payment Records
CREATE POLICY "Users can view payment records" ON ticket_payment_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can create payment records" ON ticket_payment_records
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can update payment records" ON ticket_payment_records
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can delete payment records" ON ticket_payment_records
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 7. updated_at otomatik güncelleme trigger'ları
CREATE OR REPLACE FUNCTION update_ticket_payment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_payment_plans_updated_at
    BEFORE UPDATE ON ticket_payment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_payment_plans_updated_at();

CREATE OR REPLACE FUNCTION update_ticket_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_payment_records_updated_at
    BEFORE UPDATE ON ticket_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_payment_records_updated_at();



















-- ==========================================
-- BÖLÜM: supabase-odeme-tables.sql
-- ==========================================

-- Ödeme Tabı için Supabase Tabloları
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Proje Ödeme Planları Tablosu (Alış Ödeme Planı)
CREATE TABLE IF NOT EXISTS project_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  hotel TEXT, -- Otel/Tedarikçi adı (display için)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proje Ödemeler Tablosu (Yapılan Ödemeler)
CREATE TABLE IF NOT EXISTS project_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  payee TEXT, -- Ödenen kişi/firma
  hotel TEXT, -- Otel/Tedarikçi adı (display için)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mevcut tablolara kolon ekleme (eğer tablolar zaten varsa)
ALTER TABLE project_payment_plans 
  ADD COLUMN IF NOT EXISTS hotel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;

ALTER TABLE project_payments 
  ADD COLUMN IF NOT EXISTS hotel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_project ON project_payment_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_date ON project_payment_plans(date);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_supplier ON project_payment_plans(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_hotel ON project_payment_plans(hotel_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_project ON project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_date ON project_payments(date);
CREATE INDEX IF NOT EXISTS idx_project_payments_supplier ON project_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_hotel ON project_payments(hotel_id);

-- RLS (Row Level Security) Politikaları
ALTER TABLE project_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "Users can view payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can insert payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can update payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can delete payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can view payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can insert payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can update payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can delete payments for their projects" ON project_payments;

-- Proje sahipleri ve proje kullanıcıları okuyabilir/yazabilir
CREATE POLICY "Users can view payment plans for their projects"
  ON project_payment_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payment plans for their projects"
  ON project_payment_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payment plans for their projects"
  ON project_payment_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payment plans for their projects"
  ON project_payment_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Aynı politikaları payments tablosu için de oluştur
CREATE POLICY "Users can view payments for their projects"
  ON project_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments for their projects"
  ON project_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their projects"
  ON project_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments for their projects"
  ON project_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Mevcut trigger'ları sil (eğer varsa)
DROP TRIGGER IF EXISTS update_project_payment_plans_updated_at ON project_payment_plans;
DROP TRIGGER IF EXISTS update_project_payments_updated_at ON project_payments;

-- Updated_at trigger'ları
CREATE TRIGGER update_project_payment_plans_updated_at
  BEFORE UPDATE ON project_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_payments_updated_at
  BEFORE UPDATE ON project_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



-- ==========================================
-- BÖLÜM: supabase-tahsilat-tables.sql
-- ==========================================

-- Tahsilat Tabı için Supabase Tabloları
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Proje Tahsilat Planları Tablosu (Ödeme Planı - Sözleşme)
CREATE TABLE IF NOT EXISTS project_collection_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proje Tahsilatlar Tablosu (Alınan Tahsilatlar)
CREATE TABLE IF NOT EXISTS project_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  payer TEXT, -- Ödeyen kişi/firma
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_collection_plans_project ON project_collection_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collection_plans_date ON project_collection_plans(date);
CREATE INDEX IF NOT EXISTS idx_project_collections_project ON project_collections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collections_date ON project_collections(date);

-- RLS (Row Level Security) Politikaları
ALTER TABLE project_collection_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collections ENABLE ROW LEVEL SECURITY;

-- Proje sahipleri ve proje kullanıcıları okuyabilir/yazabilir
CREATE POLICY "Users can view collection plans for their projects"
  ON project_collection_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert collection plans for their projects"
  ON project_collection_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collection plans for their projects"
  ON project_collection_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete collection plans for their projects"
  ON project_collection_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Aynı politikaları collections tablosu için de oluştur
CREATE POLICY "Users can view collections for their projects"
  ON project_collections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert collections for their projects"
  ON project_collections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collections for their projects"
  ON project_collections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete collections for their projects"
  ON project_collections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER update_project_collection_plans_updated_at
  BEFORE UPDATE ON project_collection_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_collections_updated_at
  BEFORE UPDATE ON project_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




-- ==========================================
-- BÖLÜM: flight-tickets-schema.sql
-- ==========================================

-- UÇAK BİLETLERİ TABLOSU
-- Proje detay sayfasındaki uçak bileti tabı için Supabase tablosu

CREATE TABLE flight_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    biletleme_tarihi DATE,
    tedarikci VARCHAR(255),
    havayolu VARCHAR(255),
    pnr VARCHAR(100),
    ucus_tipi VARCHAR(50), -- 'gidis', 'donus', 'gidis-donus'
    gidis_tarihi DATE,
    gidis_saati TIME,
    gidis_ucus_kodu VARCHAR(50),
    donus_tarihi DATE,
    donus_saati TIME,
    donus_ucus_kodu VARCHAR(50),
    guzergah VARCHAR(255),
    kisi_sayisi INTEGER DEFAULT 1,
    pp_maliyet DECIMAL(15,2) DEFAULT 0,
    toplam_maliyet DECIMAL(15,2) DEFAULT 0,
    doviz VARCHAR(10) DEFAULT 'EUR',
    misafirler TEXT,
    durum VARCHAR(50) DEFAULT 'aktif', -- 'aktif', 'iptal', 'tamamlandi'
    islemler TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_flight_tickets_project_id ON flight_tickets(project_id);
CREATE INDEX idx_flight_tickets_biletleme_tarihi ON flight_tickets(biletleme_tarihi);
CREATE INDEX idx_flight_tickets_tedarikci ON flight_tickets(tedarikci);
CREATE INDEX idx_flight_tickets_havayolu ON flight_tickets(havayolu);
CREATE INDEX idx_flight_tickets_pnr ON flight_tickets(pnr);

-- RLS politikası
ALTER TABLE flight_tickets ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini görebilir
CREATE POLICY "Users can view flight tickets if project member" ON flight_tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini ekleyebilir
CREATE POLICY "Users can insert flight tickets if project member" ON flight_tickets
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini güncelleyebilir
CREATE POLICY "Users can update flight tickets if project member" ON flight_tickets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini silebilir
CREATE POLICY "Users can delete flight tickets if project member" ON flight_tickets
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Updated_at trigger'ı
CREATE TRIGGER update_flight_tickets_updated_at 
    BEFORE UPDATE ON flight_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- BÖLÜM: project-transfer-tour-fixed-schema.sql
-- ==========================================

-- PROJE TRANSFER & TUR TABLOSU - DÜZELTME SQL KODLARI
-- Bu kodları Supabase SQL Editor'da sırayla çalıştırın

-- 1. Önce projects tablosunun yapısını kontrol edin
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- 2. Transfer & Tur tablosunu oluşturun
CREATE TABLE IF NOT EXISTS project_transfer_tour (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Transfer temel bilgileri
    direction VARCHAR(50) NOT NULL, -- 'arrival', 'departure', 'intermediate'
    type_label VARCHAR(100), -- 'Giriş', 'Çıkış', 'Ara Transfer'
    date DATE,
    time TIME,
    flight_code VARCHAR(20),
    route TEXT,
    
    -- Yolcu bilgileri
    passenger_count INTEGER DEFAULT 1,
    passengers TEXT[], -- Yolcu isimleri array'i
    
    -- Transfer detayları
    transfer_type VARCHAR(50), -- 'private', 'economic'
    vehicle_type VARCHAR(100), -- 'vito', 'sprinter', 'otobus', 'binek', 's-class'
    
    -- Tedarikçi bilgileri
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name VARCHAR(255),
    vehicle_assigned BOOLEAN DEFAULT FALSE,
    
    -- Maliyet bilgileri
    cost_amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    
    -- Grup transfer bilgileri
    is_group BOOLEAN DEFAULT FALSE,
    group_transfers JSONB, -- Grup transferlerinin detayları
    
    -- Düzenleme durumu
    is_editing BOOLEAN DEFAULT FALSE,
    
    -- Sıralama ve arama
    sort_key VARCHAR(255), -- Sıralama için kullanılacak anahtar
    
    -- Zaman damgaları
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 3. İndeksleri oluşturun
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_project_id ON project_transfer_tour(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_date ON project_transfer_tour(date);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_direction ON project_transfer_tour(direction);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_supplier ON project_transfer_tour(supplier_id);

-- 4. RLS'yi etkinleştirin
ALTER TABLE project_transfer_tour ENABLE ROW LEVEL SECURITY;

-- 5. RLS politikalarını oluşturun (company_id olmadan)
DROP POLICY IF EXISTS "Users can view transfer_tour of their projects" ON project_transfer_tour;
CREATE POLICY "Users can view transfer_tour of their projects" ON project_transfer_tour
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can insert transfer_tour to their projects" ON project_transfer_tour;
CREATE POLICY "Users can insert transfer_tour to their projects" ON project_transfer_tour
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can update transfer_tour of their projects" ON project_transfer_tour;
CREATE POLICY "Users can update transfer_tour of their projects" ON project_transfer_tour
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can delete transfer_tour of their projects" ON project_transfer_tour;
CREATE POLICY "Users can delete transfer_tour of their projects" ON project_transfer_tour
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- 6. Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_project_transfer_tour_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_transfer_tour_updated_at
    BEFORE UPDATE ON project_transfer_tour
    FOR EACH ROW
    EXECUTE FUNCTION update_project_transfer_tour_updated_at();

-- 7. Transfer türleri için enum tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS transfer_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Varsayılan transfer türlerini ekle
INSERT INTO transfer_types (name, description) VALUES
('Giriş Transferi', 'Havalimanından otele transfer'),
('Çıkış Transferi', 'Otelden havalimanına transfer'),
('Ara Transfer', 'Otel-otel veya şehir içi transfer'),
('Tur Transferi', 'Turistik gezi transferi')
ON CONFLICT DO NOTHING;

-- 9. Araç türleri için enum tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Varsayılan araç türlerini ekle
INSERT INTO vehicle_types (name, capacity, description) VALUES
('Vito', 8, 'Mercedes Vito minibüs'),
('Sprinter', 16, 'Mercedes Sprinter minibüs'),
('Otobüs', 50, 'Büyük otobüs'),
('Binek', 4, 'Binek araç'),
('S Class', 4, 'Lüks binek araç')
ON CONFLICT DO NOTHING;

-- 11. Test verisi ekleyin (isteğe bağlı)
-- INSERT INTO project_transfer_tour (project_id, direction, type_label, date, time, route, passenger_count, transfer_type, currency)
-- VALUES ('your-project-id', 'arrival', 'Giriş', CURRENT_DATE, '12:00', 'Havalimanı → Otel', 1, 'private', 'TRY');


-- ==========================================
-- BÖLÜM: human-resources-schema.sql
-- ==========================================

-- İNSAN KAYNAKLARI TABLOSU
CREATE TABLE project_human_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hotel VARCHAR(255) NOT NULL, -- Otel/Tedarikçi adı
    main_category VARCHAR(100) NOT NULL, -- Ana kategori (CAT_006 gibi)
    sub_category VARCHAR(255), -- Alt kategori adı
    sub_category_id UUID REFERENCES categories(id), -- Alt kategori ID'si
    supplier_id UUID REFERENCES suppliers(id), -- Tedarikçi ID'si
    hotel_id UUID REFERENCES hotels(id), -- Otel ID'si
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
CREATE INDEX idx_project_human_resources_project_id ON project_human_resources(project_id);
CREATE INDEX idx_project_human_resources_date ON project_human_resources(date);
CREATE INDEX idx_project_human_resources_hotel ON project_human_resources(hotel);
CREATE INDEX idx_project_human_resources_main_category ON project_human_resources(main_category);
CREATE INDEX idx_project_human_resources_sub_category_id ON project_human_resources(sub_category_id);

-- RLS politikası
ALTER TABLE project_human_resources ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini görebilir
CREATE POLICY "Users can view human resources if project member" ON project_human_resources
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini ekleyebilir
CREATE POLICY "Users can insert human resources if project member" ON project_human_resources
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini güncelleyebilir
CREATE POLICY "Users can update human resources if project member" ON project_human_resources
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini silebilir
CREATE POLICY "Users can delete human resources if project member" ON project_human_resources
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_human_resources_updated_at 
    BEFORE UPDATE ON project_human_resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();



-- ==========================================
-- BÖLÜM: supabase-vw-rp-sejour-kar-zarar.sql
-- ==========================================

-- =============================================================================
-- vw_rp_sejour_kar_zarar — Sejour Kar/Zarar (voucher bazlı, TL)
-- Backend: backend/src/routes/reports.js → vw_rp_sejour_kar_zarar
--
-- Kaynak: public.sejours (totals / costs / profits JSONB — TRY anahtarı)
-- Acente: agencies | Otel: sejours.hotel_id → hotels, yoksa ilk oda satırı
--
-- Supabase "schema cache" hatası alırsanız: SQL çalıştırdıktan sonra birkaç saniye
-- bekleyin veya Dashboard → Settings → API → "Reload schema" (varsa) / projeyi yeniden deploy.
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_rp_sejour_kar_zarar AS
SELECT
  s.voucher_number::varchar AS voucher_no,
  s.check_in_date::date AS giris_tarihi,
  s.check_out_date::date AS cikis_tarihi,
  COALESCE(NULLIF(TRIM(a.name), ''), '-')::varchar AS acente,
  COALESCE(
    NULLIF(TRIM(h_main.name), ''),
    (
      SELECT NULLIF(TRIM(h2.name), '')
      FROM public.sejour_rooms sr
      JOIN public.hotels h2 ON h2.id = sr.hotel_id
      WHERE sr.sejour_id = s.id
      ORDER BY sr.created_at NULLS LAST, sr.id
      LIMIT 1
    ),
    '-'
  )::varchar AS otel,
  COALESCE(s.status, 'BEKLEMEDE')::varchar AS durum,
  COALESCE((s.totals ->> 'TRY')::numeric, 0)::numeric AS satis_tl,
  COALESCE((s.costs ->> 'TRY')::numeric, 0)::numeric AS maliyet_tl,
  COALESCE(
    (s.profits ->> 'TRY')::numeric,
    COALESCE((s.totals ->> 'TRY')::numeric, 0) - COALESCE((s.costs ->> 'TRY')::numeric, 0)
  )::numeric AS kar_zarar_tl,
  CASE
    WHEN COALESCE((s.totals ->> 'TRY')::numeric, 0) > 0 THEN
      ROUND(
        (
          COALESCE(
            (s.profits ->> 'TRY')::numeric,
            COALESCE((s.totals ->> 'TRY')::numeric, 0) - COALESCE((s.costs ->> 'TRY')::numeric, 0)
          )
          / NULLIF((s.totals ->> 'TRY')::numeric, 0)
          * 100
        )::numeric,
        2
      )
    ELSE 0::numeric
  END AS kar_marj_yuzde
FROM public.sejours s
LEFT JOIN public.agencies a ON a.id = s.agency_id
LEFT JOIN public.hotels h_main ON h_main.id = s.hotel_id;

COMMENT ON VIEW public.vw_rp_sejour_kar_zarar IS
  'Sejour voucher satırı; satış/maliyet/kar TL JSONB alanlarından; marj % satış TL üzerinden.';

-- İsteğe bağlı (RLS politikalarınıza göre):
-- GRANT SELECT ON public.vw_rp_sejour_kar_zarar TO authenticated;
-- GRANT SELECT ON public.vw_rp_sejour_kar_zarar TO service_role;


-- ==========================================
-- BÖLÜM: supabase-vw-rp-proje-satis-maliyet.sql
-- ==========================================

-- =============================================================================
-- vw_rp_proje_satis_maliyet — Proje satış / alış özeti (TRY), rapor gruplaması için
-- Backend: fetchProjeSatisMaliyetProjectRows → Acente/Otel Kar-Zarar, Kar-Zarar
-- detay, marj raporları, yıllık yatay TL
--
-- Çıktı (önerilen sütun adları):
--   project_id, referans_no, organizasyon_tarihi, cikis_tarihi, firma, acente,
--   otel, durum, satis_tl, maliyet_tl, kar_zarar_tl, kar_marj_yuzde
--
-- Not: projects.reference yoksa önce ALTER ile ekleyin veya referans_no için
-- yalnızca title kullanın.
--
-- PostgreSQL: CREATE OR REPLACE VIEW mevcut görünümden sütun silemez (42P16).
-- Bu dosya önce DROP VIEW, sonra CREATE VIEW kullanır. Başka view'lar buna
-- bağlıysa CASCADE onları da kaldırır; gerekirse önce bağımlılıkları kontrol edin.
-- =============================================================================

DROP VIEW IF EXISTS public.vw_rp_proje_satis_maliyet CASCADE;

CREATE VIEW public.vw_rp_proje_satis_maliyet AS
WITH sales_agg AS (
  SELECT
    psi.project_id,
    COALESCE(
      SUM(
        COALESCE(
          psi.total_try,
          COALESCE(psi.total_price, 0::numeric) * COALESCE(psi.fx, 1::numeric),
          0::numeric
        )
      ),
      0::numeric
    ) AS satis_tl
  FROM public.project_sales_items psi
  GROUP BY psi.project_id
),
purchase_agg AS (
  SELECT
    ppi.project_id,
    COALESCE(
      SUM(
        COALESCE(
          ppi.total_try,
          COALESCE(ppi.total_price, 0::numeric) * COALESCE(ppi.fx, 1::numeric),
          0::numeric
        )
      ),
      0::numeric
    ) AS maliyet_tl
  FROM public.project_purchase_items ppi
  GROUP BY ppi.project_id
)
SELECT
  p.id AS project_id,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(p.reference::text, '')), ''),
      NULLIF(TRIM(COALESCE(p.title::text, '')), ''),
      p.id::text
    ),
    200
  )::varchar AS referans_no,
  p.start_date::date AS organizasyon_tarihi,
  p.end_date::date AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.company_name, '')), ''), '-'), 255)::varchar AS firma,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(a.name, '')), ''), '-'), 255)::varchar AS acente,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(hp.name, '')), ''),
      NULLIF(TRIM(COALESCE(hi.name, '')), ''),
      '-'
    ),
    255
  )::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.status, '')), ''), 'BEKLEMEDE'), 80)::varchar AS durum,
  COALESCE(sa.satis_tl, 0::numeric) AS satis_tl,
  COALESCE(pa.maliyet_tl, 0::numeric) AS maliyet_tl,
  (COALESCE(sa.satis_tl, 0::numeric) - COALESCE(pa.maliyet_tl, 0::numeric)) AS kar_zarar_tl,
  (
    CASE
      WHEN COALESCE(sa.satis_tl, 0::numeric) > 0::numeric THEN
        ROUND(
          (
            ((COALESCE(sa.satis_tl, 0::numeric) - COALESCE(pa.maliyet_tl, 0::numeric)) / sa.satis_tl)
            * 100::numeric
          )::numeric,
          2
        )
      ELSE 0::numeric
    END
  ) AS kar_marj_yuzde
FROM public.projects p
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN public.hotels hp ON hp.id = p.hotel_id
LEFT JOIN sales_agg sa ON sa.project_id = p.id
LEFT JOIN purchase_agg pa ON pa.project_id = p.id
LEFT JOIN LATERAL (
  SELECT h.name
  FROM public.project_sales_items psi
  INNER JOIN public.hotels h ON h.id = psi.hotel_id
  WHERE psi.project_id = p.id
    AND psi.hotel_id IS NOT NULL
  ORDER BY psi.created_at DESC NULLS LAST, psi.id DESC
  LIMIT 1
) hi ON true;

COMMENT ON VIEW public.vw_rp_proje_satis_maliyet IS
  'Proje başına TRY satış (project_sales_items), TRY alış (project_purchase_items), kar/zarar ve marj %; raporlar için.';


-- ==========================================
-- BÖLÜM: supabase-vw-rp-otel-detay-proje-maliyet.sql
-- ==========================================

-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu
-- Rapor Merkezi / backend: vw_rp_otel_detay_proje_maliyet + main_category CAT_001/002
--
-- View çıktı sütunları (Supabase şema ile uyumlu):
--   proje_referans varchar | organizasyon_tarihi date | cikis_tarihi date
--   firma_adi varchar | acente varchar | otel varchar | alt_kategori varchar
--   adet int4 | sefer numeric | birim_satis numeric | birim_maliyet numeric
--   para_birimi varchar | main_category varchar  (hepsi NULLABLE olabilir)
-- =============================================================================
--
-- Önkoşullar (çoğu ortamda zaten vardır):
--   public.projects (reference, company_name, agency_id, start_date, end_date, …)
--   public.project_sales_items, public.project_purchase_items
--   public.hotels, public.agencies
--   project_sales_items.category: 'CAT_001'/'CAT_002' VEYA categories.id (UUID) —
--   sub_category: metin veya categories.id (UUID); UUID ise alt_kategori = categories.name
--   UUID ise kök kategori: parent_id zinciriyle köke çıkılır; kök adı
--   "KONAKLAMA", "OTEL | KONAKLAMA", "OTEL EKSTRA", "OTEL | DİĞER HİZMETLER" vb. (LIKE ile) eşlenir
--
-- Eğer project_sales_items.sefer sütunu yoksa, önce:
--   ALTER TABLE public.project_sales_items ADD COLUMN IF NOT EXISTS sefer integer DEFAULT 1;
--   ALTER TABLE public.project_purchase_items ADD COLUMN IF NOT EXISTS sefer integer DEFAULT 1;
--
-- Not: CREATE OR REPLACE VIEW mevcut sütun TİPLERİNİ değiştiremez (text ↔ varchar, varchar ↔ varchar(n) vb.).
-- Metin tipleri mevcut view ile birebir (CREATE OR REPLACE tip değiştiremez):
--   proje_referans, main_category → character varying(255)
--   firma_adi, acente, otel, alt_kategori, para_birimi → varchar (sınırsız)
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH sales AS (
  SELECT
    psi.id,
    psi.project_id,
    psi.hotel_id,
    psi.category,
    psi.sub_category,
    psi.description,
    psi.unit_quantity::numeric AS unit_quantity,
    COALESCE(psi.sefer, 1)::numeric AS sefer,
    COALESCE(psi.unit_price, 0)::numeric AS unit_price,
    NULLIF(TRIM(psi.currency), '') AS currency,
    ROW_NUMBER() OVER (
      PARTITION BY
        psi.project_id,
        COALESCE(psi.hotel_id::text, ''),
        COALESCE(psi.category, ''),
        COALESCE(psi.sub_category, '')
      ORDER BY psi.created_at NULLS LAST, psi.id
    ) AS pair_rn
  FROM public.project_sales_items psi
  WHERE
    COALESCE(psi.category::text, '') IN ('CAT_001', 'CAT_002')
    OR (
      COALESCE(TRIM(psi.category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        WITH RECURSIVE up_cat AS (
          SELECT c.id, c.parent_id, c.name
          FROM public.categories c
          WHERE c.id = TRIM(psi.category::text)::uuid
          UNION ALL
          SELECT p.id, p.parent_id, p.name
          FROM public.categories p
          INNER JOIN up_cat uc ON p.id = uc.parent_id
        )
        SELECT 1
        FROM up_cat uc
        CROSS JOIN LATERAL (
          SELECT upper(
            replace(
              replace(replace(replace(trim(uc.name), 'İ', 'I'), 'ı', 'I'), 'ğ', 'G'),
              'Ğ',
              'G'
            )
          ) AS n
        ) x
        WHERE uc.parent_id IS NULL
          AND (
            x.n LIKE '%KONAKLAMA%'
            OR x.n LIKE '%EKSTRA%'
            OR (x.n LIKE '%OTEL%' AND x.n LIKE '%DIGER%')
          )
      )
    )
),
purch AS (
  SELECT
    ppi.id,
    ppi.project_id,
    ppi.hotel_id,
    ppi.category,
    ppi.sub_category,
    COALESCE(ppi.unit_price, 0)::numeric AS unit_price,
    ROW_NUMBER() OVER (
      PARTITION BY
        ppi.project_id,
        COALESCE(ppi.hotel_id::text, ''),
        COALESCE(ppi.category, ''),
        COALESCE(ppi.sub_category, '')
      ORDER BY ppi.created_at NULLS LAST, ppi.id
    ) AS pair_rn
  FROM public.project_purchase_items ppi
  WHERE
    COALESCE(ppi.category::text, '') IN ('CAT_001', 'CAT_002')
    OR (
      COALESCE(TRIM(ppi.category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        WITH RECURSIVE up_cat AS (
          SELECT c.id, c.parent_id, c.name
          FROM public.categories c
          WHERE c.id = TRIM(ppi.category::text)::uuid
          UNION ALL
          SELECT p.id, p.parent_id, p.name
          FROM public.categories p
          INNER JOIN up_cat uc ON p.id = uc.parent_id
        )
        SELECT 1
        FROM up_cat uc
        CROSS JOIN LATERAL (
          SELECT upper(
            replace(
              replace(replace(replace(trim(uc.name), 'İ', 'I'), 'ı', 'I'), 'ğ', 'G'),
              'Ğ',
              'G'
            )
          ) AS n
        ) x
        WHERE uc.parent_id IS NULL
          AND (
            x.n LIKE '%KONAKLAMA%'
            OR x.n LIKE '%EKSTRA%'
            OR (x.n LIKE '%OTEL%' AND x.n LIKE '%DIGER%')
          )
      )
    )
)
SELECT
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(p.reference, '')), ''),
      NULLIF(TRIM(COALESCE(p.title, '')), ''),
      p.id::text
    ),
    255
  )::character varying(255) AS proje_referans,
  p.start_date::date AS organizasyon_tarihi,
  p.end_date::date AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.company_name, '')), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(a.name, '')), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(h.name, '')), ''), '-'), 255)::varchar AS otel,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(sc_sub.name, '')), ''),
      CASE
        WHEN COALESCE(TRIM(psi.sub_category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        THEN NULL
        ELSE NULLIF(TRIM(COALESCE(psi.sub_category::text, '')), '')
      END,
      NULLIF(LEFT(TRIM(COALESCE(psi.description, '')), 120), ''),
      '-'
    ),
    255
  )::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(psi.currency, '')), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN public.hotels h ON h.id = psi.hotel_id
LEFT JOIN public.categories sc_sub ON (
  COALESCE(TRIM(psi.sub_category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND sc_sub.id = TRIM(psi.sub_category::text)::uuid
)
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
 AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
 AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
 AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
 AND ppi.pair_rn = psi.pair_rn;

COMMENT ON VIEW public.vw_rp_otel_detay_proje_maliyet IS
  'Konaklama / otel ekstraları: CAT_001|CAT_002 veya UUID category; alt_kategori UUID ise public.categories.name. Alış: aynı partition+pair_rn.';

-- İsteğe bağlı: API/service role ile okuma (RLS tablolara göre davranır)
-- GRANT SELECT ON public.vw_rp_otel_detay_proje_maliyet TO authenticated;
-- GRANT SELECT ON public.vw_rp_otel_detay_proje_maliyet TO service_role;


-- ==========================================
-- BÖLÜM: fix-otel-detay-teklif-view.sql
-- ==========================================

-- =============================================================================
-- vw_rp_otel_detay_teklif — Otel Detaylı Teklif Raporu (v3 - GÜNCEL)
-- =============================================================================

-- 1. AGRESİF VERİ ONARICI: [T:...] etiketi varsa hotel_id'yi MUTLAKA günceller
DO $$
DECLARE
    r RECORD;
    v_tab_id TEXT;
    v_hotel_id UUID;
BEGIN
    -- Etiketi olan tüm kalemleri tara (NULL olsun olmasın, yanlış atanmışları düzeltmek için)
    FOR r IN SELECT id, quote_id, description, hotel_id FROM public.quote_items WHERE description LIKE '%[T:%' LOOP
        v_tab_id := substring(r.description from '\[T:([^\]]+)\]');
        
        SELECT (h_data->>'hotel_id')::uuid INTO v_hotel_id
        FROM public.quotes q,
        jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
        WHERE q.id = r.quote_id AND h_data->>'id' = v_tab_id;
        
        -- Eğer etiketteki otel mevcut hotel_id'den farklıysa düzelt
        IF v_hotel_id IS NOT NULL AND (r.hotel_id IS NULL OR r.hotel_id <> v_hotel_id) THEN
            UPDATE public.quote_items SET hotel_id = v_hotel_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 1. GÜNCEL RAPOR GÖRÜNÜMÜ (v7.1 - ULTIMATE)
-- Bu sürüm hem otelleri ayırır hem de her otelin kendi durumunu (Konfirme/İptal) gösterir.
DROP VIEW IF EXISTS public.vw_rp_otel_detay_teklif CASCADE;

CREATE VIEW public.vw_rp_otel_detay_teklif AS
WITH exploded_hotels AS (
    SELECT 
        q.id as quote_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status -- Sekme bazlı durum (İptal/Konfirme)
    FROM public.quotes q,
    jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
),
items_with_tags AS (
    SELECT 
        qi.*,
        substring(qi.description from '\[T:([^\]]+)\]') as extracted_tab_id
    FROM public.quote_items qi
)
SELECT
    q.reference AS teklif_no,
    COALESCE(eh.cin_tarihi, q.check_in_date) AS cin_tarihi,
    COALESCE(eh.cout_tarihi, q.check_out_date) AS cout_tarihi,
    q.company_name AS firma_adi,
    a.name AS acente,
    COALESCE(h.name, 'BELİRSİZ OTEL') AS otel,
    COALESCE(cat.name, iwt.sub_category::text, '-') AS alt_kategori,
    iwt.unit_quantity AS adet,
    iwt.sefer AS sefer,
    iwt.unit_price AS birim_satis,
    iwt.currency AS para_birimi,
    COALESCE(eh.hotel_status, q.status) AS teklif_durumu -- ANA DÜZELTME: Sekme durumunu kullan
FROM items_with_tags iwt
JOIN public.quotes q ON q.id = iwt.quote_id
LEFT JOIN public.agencies a ON a.id = q.agency_id
LEFT JOIN LATERAL (
    SELECT exh.*
    FROM exploded_hotels exh
    WHERE exh.quote_id = q.id
    ORDER BY 
        (exh.tab_id = iwt.extracted_tab_id) DESC,
        (exh.hotel_id = iwt.hotel_id) DESC,
        exh.tab_id ASC
    LIMIT 1
) eh ON TRUE
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, iwt.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = iwt.sub_category::text
WHERE iwt.main_category::text IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER');


-- ==========================================
-- BÖLÜM: fix-otel-detay-maliyet-view.sql
-- ==========================================

-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu (v7.1 - ULTIMATE)
-- =============================================================================

-- 1. AGRESİF VERİ ONARICI: project_sales_items tablosundaki hatalı hotel_id'leri düzeltir
DO $$
DECLARE
    r RECORD;
    v_tab_id TEXT;
    v_hotel_id UUID;
BEGIN
    FOR r IN SELECT id, project_id, description, hotel_id FROM public.project_sales_items WHERE description LIKE '%[T:%' LOOP
        v_tab_id := substring(r.description from '\[T:([^\]]+)\]');
        
        SELECT (h_data->>'hotel_id')::uuid INTO v_hotel_id
        FROM public.projects p,
        jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
        WHERE p.id = r.project_id AND h_data->>'id' = v_tab_id;
        
        IF v_hotel_id IS NOT NULL AND (r.hotel_id IS NULL OR r.hotel_id <> v_hotel_id) THEN
            UPDATE public.project_sales_items SET hotel_id = v_hotel_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 2. GÜNCEL RAPOR GÖRÜNÜMÜ (v7.1 - ULTIMATE RESILIENCE)
DROP VIEW IF EXISTS public.vw_rp_otel_detay_proje_maliyet CASCADE;

CREATE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH exploded_hotels AS (
    SELECT 
        p.id as project_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status
    FROM public.projects p,
    jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
),
sales AS (
  SELECT 
    psi.*,
    substring(psi.description from '\[T:([^\]]+)\]') as extracted_tab_id,
    ROW_NUMBER() OVER (PARTITION BY psi.project_id, psi.hotel_id, psi.category, psi.sub_category ORDER BY psi.id) as pair_rn
  FROM public.project_sales_items psi
),
purch AS (
  SELECT 
    ppi.*,
    ROW_NUMBER() OVER (PARTITION BY ppi.project_id, ppi.hotel_id, ppi.category, ppi.sub_category ORDER BY ppi.id) as pair_rn
  FROM public.project_purchase_items ppi
)
SELECT
  p.reference AS proje_referans,
  COALESCE(eh.cin_tarihi, p.start_date) AS organizasyon_tarihi,
  COALESCE(eh.cout_tarihi, p.end_date) AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(p.company_name), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(a.name), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(h.name), ''), 'BELİRSİZ OTEL'), 255)::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(cat.name), ''), NULLIF(TRIM(psi.sub_category::text), ''), NULLIF(TRIM(psi.description), ''), '-'), 255)::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(psi.currency), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN LATERAL (
    SELECT exh.*
    FROM exploded_hotels exh
    WHERE exh.project_id = p.id
    ORDER BY 
        (exh.tab_id = psi.extracted_tab_id) DESC,
        (exh.hotel_id = psi.hotel_id) DESC,
        exh.tab_id ASC
    LIMIT 1
) eh ON TRUE
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, psi.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = psi.sub_category::text
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
  AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
  AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
  AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
  AND ppi.pair_rn = psi.pair_rn
WHERE psi.category::text IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER');


-- ==========================================
-- BÖLÜM: categories-real-data.sql
-- ==========================================

-- GERÇEK TANIMLANMIŞ KATEGORİLER
-- Önce mevcut verileri temizle (isteğe bağlı)
-- DELETE FROM categories;

-- Ana kategoriler (parent_id = null)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'OTEL | KONAKLAMA', 'Otel konaklama hizmetleri', null, true),
('00000000-0000-0000-0000-000000000002', 'OTEL | DİĞER HİZMETLER', 'Otel ek hizmetleri', null, true),
('00000000-0000-0000-0000-000000000003', 'UÇAK BİLETİ', 'Uçak bileti hizmetleri', null, true),
('00000000-0000-0000-0000-000000000004', 'TRANSFER & TUR', 'Transfer ve tur hizmetleri', null, true),
('00000000-0000-0000-0000-000000000005', 'ETKİNLİK', 'Etkinlik organizasyonu', null, true),
('00000000-0000-0000-0000-000000000006', 'İNSAN KAYNAKLARI', 'Personel hizmetleri', null, true),
('00000000-0000-0000-0000-000000000007', 'DİĞER OPERASYONEL HİZMETLER', 'Diğer operasyonel hizmetler', null, true);

-- OTEL | DİĞER HİZMETLER alt kategorileri (gerçek tanımlanmış olanlar)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000101', 'TOPLANTI SALONU KULLANIMI', 'Toplantı salonu kullanım hizmeti', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000102', 'TEKNİK EKİPMAN KULLANIMI', 'Teknik ekipman kullanım hizmeti', '00000000-0000-0000-0000-000000000002', true);

-- OTEL | KONAKLAMA alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000201', 'DOUBLE ODA KİŞİ BAŞI', 'Double oda kişi başı fiyatlandırma', '00000000-0000-0000-0000-000000000001', true),
('00000000-0000-0000-0000-000000000202', 'SINGLE ODA', 'Single oda fiyatlandırma', '00000000-0000-0000-0000-000000000001', true);

-- UÇAK BİLETİ alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000301', 'GRUP UÇAK BİLETİ', 'Grup uçak bileti hizmeti', '00000000-0000-0000-0000-000000000003', true);

-- TRANSFER & TUR alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000401', 'ALAN - OTEL - ALAN | GRUP TRANSFERİ', 'Grup transfer hizmeti', '00000000-0000-0000-0000-000000000004', true);

-- ETKİNLİK alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000501', 'GALA YEMEĞİ | MASA SÜSLEME', 'Gala yemeği masa süsleme hizmeti', '00000000-0000-0000-0000-000000000005', true);

-- İNSAN KAYNAKLARI alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000601', 'OPERASYON MÜDÜRÜ', 'Operasyon müdürü hizmeti', '00000000-0000-0000-0000-000000000006', true);

-- DİĞER OPERASYONEL HİZMETLER alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000701', 'KARŞILAMA DESKİ', 'Karşılama desk hizmeti', '00000000-0000-0000-0000-000000000007', true);


-- ==========================================
-- BÖLÜM: EVENT_X_KURULUM.sql
-- ==========================================

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


