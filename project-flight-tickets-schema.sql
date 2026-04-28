-- PROJECT FLIGHT TICKETS TABLOSU
-- Proje detay sayfasındaki uçak bileti tabı için Supabase tablosu

CREATE TABLE IF NOT EXISTS project_flight_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    biletleme_tarihi DATE,
    tedarikci VARCHAR(255),
    havayolu VARCHAR(255),
    pnr VARCHAR(100),
    ucus_tipi VARCHAR(50), -- 'GRUP', 'MÜNFERİT'
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
    durum VARCHAR(50) DEFAULT 'aktif', -- 'aktif', 'iptal', 'iade', 'degistirildi'
    islemler TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_flight_tickets_project_id ON project_flight_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_flight_tickets_biletleme_tarihi ON project_flight_tickets(biletleme_tarihi);
CREATE INDEX IF NOT EXISTS idx_project_flight_tickets_tedarikci ON project_flight_tickets(tedarikci);
CREATE INDEX IF NOT EXISTS idx_project_flight_tickets_havayolu ON project_flight_tickets(havayolu);
CREATE INDEX IF NOT EXISTS idx_project_flight_tickets_pnr ON project_flight_tickets(pnr);

-- RLS politikası
ALTER TABLE project_flight_tickets ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini görebilir
CREATE POLICY "Users can view project flight tickets if project member" ON project_flight_tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini ekleyebilir
CREATE POLICY "Users can insert project flight tickets if project member" ON project_flight_tickets
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini güncelleyebilir
CREATE POLICY "Users can update project flight tickets if project member" ON project_flight_tickets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini silebilir
CREATE POLICY "Users can delete project flight tickets if project member" ON project_flight_tickets
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Updated_at trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_flight_tickets_updated_at 
    BEFORE UPDATE ON project_flight_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
