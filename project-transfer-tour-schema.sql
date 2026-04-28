-- PROJE TRANSFER & TUR TABLOSU
-- Proje detay sayfasındaki transfer & tur tabı için Supabase tablosu

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

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_project_id ON project_transfer_tour(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_date ON project_transfer_tour(date);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_direction ON project_transfer_tour(direction);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_supplier ON project_transfer_tour(supplier_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE project_transfer_tour ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi şirketlerinin projelerinin transferlerini görebilir
CREATE POLICY "Users can view transfer_tour of their company projects" ON project_transfer_tour
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Kullanıcılar kendi şirketlerinin projelerine transfer ekleyebilir
CREATE POLICY "Users can insert transfer_tour to their company projects" ON project_transfer_tour
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Kullanıcılar kendi şirketlerinin projelerinin transferlerini güncelleyebilir
CREATE POLICY "Users can update transfer_tour of their company projects" ON project_transfer_tour
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Kullanıcılar kendi şirketlerinin projelerinin transferlerini silebilir
CREATE POLICY "Users can delete transfer_tour of their company projects" ON project_transfer_tour
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Updated_at otomatik güncelleme trigger'ı
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

-- Transfer türleri için enum tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS transfer_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan transfer türlerini ekle
INSERT INTO transfer_types (name, description) VALUES
('Giriş Transferi', 'Havalimanından otele transfer'),
('Çıkış Transferi', 'Otelden havalimanına transfer'),
('Ara Transfer', 'Otel-otel veya şehir içi transfer'),
('Tur Transferi', 'Turistik gezi transferi')
ON CONFLICT DO NOTHING;

-- Araç türleri için enum tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan araç türlerini ekle
INSERT INTO vehicle_types (name, capacity, description) VALUES
('Vito', 8, 'Mercedes Vito minibüs'),
('Sprinter', 16, 'Mercedes Sprinter minibüs'),
('Otobüs', 50, 'Büyük otobüs'),
('Binek', 4, 'Binek araç'),
('S Class', 4, 'Lüks binek araç')
ON CONFLICT DO NOTHING;
