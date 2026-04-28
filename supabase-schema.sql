-- Supabase Database Schema for EVENTIQ MICE System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER PERMISSIONS TABLE (for custom permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module, permission)
);

-- AGENCIES TABLE
CREATE TABLE IF NOT EXISTS agencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    concept VARCHAR(255),
    location VARCHAR(255),
    rating INTEGER DEFAULT 5,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    main_category_id VARCHAR(10) REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUOTES TABLE
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reference VARCHAR(100) UNIQUE NOT NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    hotel_concept VARCHAR(255),
    quote_type VARCHAR(50) DEFAULT 'BİRİM',
    room_count INTEGER DEFAULT 1,
    pax_count INTEGER DEFAULT 1,
    option VARCHAR(50) DEFAULT '1. OPSİYON',
    status VARCHAR(50) DEFAULT 'TEKLİF',
    notes TEXT,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUOTE ITEMS TABLE
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    main_category VARCHAR(100),
    sub_category VARCHAR(100),
    unit_quantity INTEGER DEFAULT 1,
    sefer INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    total DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(50) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0,
    team_members INTEGER DEFAULT 0,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BUDGET ITEMS TABLE
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_agency_id ON quotes(agency_id);
CREATE INDEX IF NOT EXISTS idx_quotes_hotel_id ON quotes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_projects_quote_id ON projects(quote_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for other tables (basic policies)
CREATE POLICY "Authenticated users can view agencies" ON agencies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view hotels" ON hotels
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view quotes" ON quotes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view quote items" ON quote_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view budget items" ON budget_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO categories (id, name) VALUES
('1', 'OTEL | KONAKLAMA'),
('2', 'OTEL | DİĞER HİZMETLER'),
('3', 'UÇAK BİLETİ'),
('4', 'TRANSFER & TUR'),
('5', 'ETKİNLİK'),
('6', 'İNSAN KAYNAKLARI'),
('7', 'DİĞER OPERASYONEL HİZMETLER');

INSERT INTO categories (id, name, main_category_id) VALUES
('1-1', 'DOUBLE ODA KİŞİ BAŞI', '1'),
('1-2', 'SINGLE ODA', '1'),
('2-1', 'TOPLANTI SALONU KULLANIMI', '2'),
('2-2', 'TEKNİK EKİPMAN KULLANIMI', '2'),
('3-1', 'GRUP UÇAK BİLETİ', '3'),
('4-1', 'ALAN - OTEL - ALAN | GRUP TRANSFERİ', '4'),
('5-1', 'GALA YEMEĞİ | MASA SÜSLEME', '5'),
('6-1', 'OPERASYON MÜDÜRÜ', '6'),
('7-1', 'KARŞILAMA DESKİ', '7');

-- Insert sample agencies
INSERT INTO agencies (name, company_name, contact_person, phone, email) VALUES
('ABC Turizm', 'ABC Turizm A.Ş.', 'Ahmet Yılmaz', '+90 212 555 0101', 'info@abcturizm.com'),
('XYZ Seyahat', 'XYZ Seyahat Ltd. Şti.', 'Fatma Demir', '+90 216 555 0202', 'info@xyzseyahat.com'),
('Delta Tours', 'Delta Tours Turizm', 'Mehmet Kaya', '+90 232 555 0303', 'info@deltatours.com');

-- Insert sample hotels
INSERT INTO hotels (name, concept, location, rating, contact_person, phone, email) VALUES
('Grand Hotel Istanbul', '5 Yıldızlı Lüks', 'İstanbul, Taksim', 5, 'Ali Özkan', '+90 212 555 0404', 'info@grandhotel.com'),
('Blue Resort Antalya', '4 Yıldızlı Resort', 'Antalya, Kemer', 4, 'Ayşe Yıldız', '+90 242 555 0505', 'info@blueresort.com'),
('Business Hotel Ankara', '3 Yıldızlı İş', 'Ankara, Kızılay', 3, 'Can Arslan', '+90 312 555 0606', 'info@businesshotel.com');

-- Insert sample users (password will be set via Supabase Auth)
INSERT INTO users (email, first_name, last_name, role) VALUES
('admin@tempustravel.com', 'Sistem', 'Admin', 'super_admin'),
('manager@tempustravel.com', 'Proje', 'Müdürü', 'manager'),
('user@tempustravel.com', 'Normal', 'Kullanıcı', 'user'); 