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
