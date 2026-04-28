-- KATEGORİLER İÇİN ÖRNEK VERİLER (UUID FORMATINDA)
-- Önce mevcut verileri temizle (isteğe bağlı)
-- DELETE FROM categories;

-- Ana kategoriler (parent_id = null)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'KONAKLAMA', 'Otel ve konaklama hizmetleri', null, true),
('00000000-0000-0000-0000-000000000002', 'OTEL EKSTRA', 'Otel ekstra hizmetleri', null, true),
('00000000-0000-0000-0000-000000000003', 'UÇAK BİLETİ', 'Uçak bileti hizmetleri', null, true),
('00000000-0000-0000-0000-000000000004', 'TRANSFER & TUR', 'Transfer ve tur hizmetleri', null, true),
('00000000-0000-0000-0000-000000000005', 'ETKİNLİK & AKTİVİTE', 'Etkinlik ve aktivite hizmetleri', null, true),
('00000000-0000-0000-0000-000000000006', 'İNSAN KAYNAKLARI', 'İnsan kaynakları hizmetleri', null, true),
('00000000-0000-0000-0000-000000000007', 'DİĞER SERVİSLER', 'Diğer hizmetler', null, true),
('00000000-0000-0000-0000-000000000008', 'FİNANSAL', 'Finansal hizmetler', null, true);

-- Otel Ekstra alt kategorileri (OTEL EKSTRA'nın alt kategorileri)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000101', 'Oda Servisi', 'Otel oda servisi hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000102', 'Spa & Wellness', 'Spa ve wellness hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000103', 'Restoran Rezervasyonu', 'Restoran rezervasyon hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000104', 'Transfer Hizmeti', 'Otel transfer hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000105', 'Ekstra Yatak', 'Ekstra yatak hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000106', 'Mini Bar', 'Mini bar hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000107', 'Laundry', 'Çamaşır hizmetleri', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000108', 'Diğer', 'Diğer otel ekstra hizmetleri', '00000000-0000-0000-0000-000000000002', true);

-- Diğer Servisler alt kategorileri (DİĞER SERVİSLER'ın alt kategorileri)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000201', 'Rehberlik', 'Rehberlik hizmetleri', '00000000-0000-0000-0000-000000000007', true),
('00000000-0000-0000-0000-000000000202', 'Araç Kiralama', 'Araç kiralama hizmetleri', '00000000-0000-0000-0000-000000000007', true),
('00000000-0000-0000-0000-000000000203', 'Fotoğraf & Video', 'Fotoğraf ve video hizmetleri', '00000000-0000-0000-0000-000000000007', true),
('00000000-0000-0000-0000-000000000204', 'Çeviri', 'Çeviri hizmetleri', '00000000-0000-0000-0000-000000000007', true),
('00000000-0000-0000-0000-000000000205', 'Diğer', 'Diğer hizmetler', '00000000-0000-0000-0000-000000000007', true);

-- İnsan Kaynakları alt kategorileri (İNSAN KAYNAKLARI'nın alt kategorileri)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000301', 'Rehber', 'Rehber hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000302', 'Şoför', 'Şoför hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000303', 'Host/Hostes', 'Host/hostes hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000304', 'Teknik Personel', 'Teknik personel hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000305', 'Diğer', 'Diğer insan kaynakları hizmetleri', '00000000-0000-0000-0000-000000000006', true);
