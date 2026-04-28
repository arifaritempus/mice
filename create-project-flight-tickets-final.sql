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
