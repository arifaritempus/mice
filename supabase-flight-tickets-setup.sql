-- UÇAK BİLETLERİ TABLOSU KURULUMU
-- Supabase SQL Editor'da çalıştırın

-- 1. Uçak biletleri tablosunu oluştur
CREATE TABLE IF NOT EXISTS flight_tickets (
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

-- 2. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_flight_tickets_project_id ON flight_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_flight_tickets_biletleme_tarihi ON flight_tickets(biletleme_tarihi);
CREATE INDEX IF NOT EXISTS idx_flight_tickets_tedarikci ON flight_tickets(tedarikci);
CREATE INDEX IF NOT EXISTS idx_flight_tickets_havayolu ON flight_tickets(havayolu);
CREATE INDEX IF NOT EXISTS idx_flight_tickets_pnr ON flight_tickets(pnr);

-- 3. RLS'yi etkinleştir
ALTER TABLE flight_tickets ENABLE ROW LEVEL SECURITY;

-- 4. RLS politikalarını oluştur
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

-- 5. Updated_at trigger'ını oluştur (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger'ı ekle
CREATE TRIGGER update_flight_tickets_updated_at 
    BEFORE UPDATE ON flight_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Başarı mesajı
SELECT 'Uçak biletleri tablosu başarıyla oluşturuldu!' as message;
