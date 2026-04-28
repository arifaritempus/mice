-- PROJECT FLIGHT TICKETS TABLOSU KONTROL
-- Supabase SQL Editor'da çalıştırın

-- 1. Tabloyu kontrol et
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'project_flight_tickets';

-- 2. Eğer tablo yoksa, basit bir test tablosu oluştur
CREATE TABLE IF NOT EXISTS project_flight_tickets (
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
INSERT INTO project_flight_tickets (project_id, tedarikci, havayolu, pnr) 
VALUES ('52519ea8-11ea-4c2f-b55f-82df78813fc4', 'TEST TEDARIKCI', 'TK', 'TEST123');

-- 4. Veriyi kontrol et
SELECT * FROM project_flight_tickets;

-- 5. Başarı mesajı
SELECT 'project_flight_tickets tablosu kontrol edildi ve test verisi eklendi!' as message;
