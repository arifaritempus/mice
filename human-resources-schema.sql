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

