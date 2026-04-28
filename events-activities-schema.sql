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
