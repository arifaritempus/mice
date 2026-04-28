-- KATEGORİLER İÇİN ÖRNEK VERİLER
-- Önce mevcut verileri temizle (isteğe bağlı)
-- DELETE FROM categories;

-- Ana kategoriler (parent_id = null)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('CAT_001', 'KONAKLAMA', 'Otel ve konaklama hizmetleri', null, true),
('CAT_002', 'OTEL EKSTRA', 'Otel ekstra hizmetleri', null, true),
('CAT_003', 'UÇAK BİLETİ', 'Uçak bileti hizmetleri', null, true),
('CAT_004', 'TRANSFER & TUR', 'Transfer ve tur hizmetleri', null, true),
('CAT_005', 'ETKİNLİK & AKTİVİTE', 'Etkinlik ve aktivite hizmetleri', null, true),
('CAT_006', 'İNSAN KAYNAKLARI', 'İnsan kaynakları hizmetleri', null, true),
('CAT_007', 'DİĞER SERVİSLER', 'Diğer hizmetler', null, true),
('CAT_008', 'FİNANSAL', 'Finansal hizmetler', null, true);

-- Otel Ekstra alt kategorileri (CAT_002'nin alt kategorileri)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('CAT_002_001', 'Oda Servisi', 'Otel oda servisi hizmetleri', 'CAT_002', true),
('CAT_002_002', 'Spa & Wellness', 'Spa ve wellness hizmetleri', 'CAT_002', true),
('CAT_002_003', 'Restoran Rezervasyonu', 'Restoran rezervasyon hizmetleri', 'CAT_002', true),
('CAT_002_004', 'Transfer Hizmeti', 'Otel transfer hizmetleri', 'CAT_002', true),
('CAT_002_005', 'Ekstra Yatak', 'Ekstra yatak hizmetleri', 'CAT_002', true),
('CAT_002_006', 'Mini Bar', 'Mini bar hizmetleri', 'CAT_002', true),
('CAT_002_007', 'Laundry', 'Çamaşır hizmetleri', 'CAT_002', true),
('CAT_002_008', 'Diğer', 'Diğer otel ekstra hizmetleri', 'CAT_002', true);

-- Diğer Servisler alt kategorileri (CAT_007'nin alt kategorileri)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('CAT_007_001', 'Rehberlik', 'Rehberlik hizmetleri', 'CAT_007', true),
('CAT_007_002', 'Araç Kiralama', 'Araç kiralama hizmetleri', 'CAT_007', true),
('CAT_007_003', 'Fotoğraf & Video', 'Fotoğraf ve video hizmetleri', 'CAT_007', true),
('CAT_007_004', 'Çeviri', 'Çeviri hizmetleri', 'CAT_007', true),
('CAT_007_005', 'Diğer', 'Diğer hizmetler', 'CAT_007', true);

-- İnsan Kaynakları alt kategorileri (CAT_006'nın alt kategorileri)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('CAT_006_001', 'Rehber', 'Rehber hizmetleri', 'CAT_006', true),
('CAT_006_002', 'Şoför', 'Şoför hizmetleri', 'CAT_006', true),
('CAT_006_003', 'Host/Hostes', 'Host/hostes hizmetleri', 'CAT_006', true),
('CAT_006_004', 'Teknik Personel', 'Teknik personel hizmetleri', 'CAT_006', true),
('CAT_006_005', 'Diğer', 'Diğer insan kaynakları hizmetleri', 'CAT_006', true);
