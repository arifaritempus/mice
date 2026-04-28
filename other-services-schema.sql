-- DİĞER SERVİSLER TABLOSU
CREATE TABLE IF NOT EXISTS project_other_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hotel VARCHAR(255) NOT NULL, -- Otel/Tedarikçi adı
    main_category VARCHAR(100) NOT NULL DEFAULT 'CAT_007', -- Ana kategori (CAT_007)
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
CREATE INDEX IF NOT EXISTS idx_project_other_services_project_id ON project_other_services(project_id);
CREATE INDEX IF NOT EXISTS idx_project_other_services_date ON project_other_services(date);
CREATE INDEX IF NOT EXISTS idx_project_other_services_hotel ON project_other_services(hotel);
CREATE INDEX IF NOT EXISTS idx_project_other_services_main_category ON project_other_services(main_category);
CREATE INDEX IF NOT EXISTS idx_project_other_services_sub_category_id ON project_other_services(sub_category_id);

-- RLS politikası
ALTER TABLE project_other_services ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin diğer servisler verilerini görebilir
CREATE POLICY "Users can view other services if project member" ON project_other_services
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_other_services.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin diğer servisler verilerini ekleyebilir
CREATE POLICY "Users can insert other services if project member" ON project_other_services
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_other_services.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin diğer servisler verilerini güncelleyebilir
CREATE POLICY "Users can update other services if project member" ON project_other_services
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_other_services.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin diğer servisler verilerini silebilir
CREATE POLICY "Users can delete other services if project member" ON project_other_services
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_other_services.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Trigger: updated_at otomatik güncelleme
CREATE TRIGGER update_project_other_services_updated_at 
    BEFORE UPDATE ON project_other_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: total_try otomatik hesaplama
CREATE OR REPLACE FUNCTION calculate_other_services_total_try()
RETURNS TRIGGER AS $$
BEGIN
    -- Toplam TL = Tutar * Kur
    IF NEW.amount IS NOT NULL AND NEW.exchange_rate IS NOT NULL THEN
        NEW.total_try := ROUND((NEW.amount * NEW.exchange_rate)::numeric, 2);
    ELSE
        NEW.total_try := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_other_services_total_try_trigger ON project_other_services;
CREATE TRIGGER calculate_other_services_total_try_trigger
    BEFORE INSERT OR UPDATE ON project_other_services
    FOR EACH ROW
    EXECUTE FUNCTION calculate_other_services_total_try();








