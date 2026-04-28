-- GERÇEK TANIMLANMIŞ KATEGORİLER
-- Önce mevcut verileri temizle (isteğe bağlı)
-- DELETE FROM categories;

-- Ana kategoriler (parent_id = null)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'OTEL | KONAKLAMA', 'Otel konaklama hizmetleri', null, true),
('00000000-0000-0000-0000-000000000002', 'OTEL | DİĞER HİZMETLER', 'Otel ek hizmetleri', null, true),
('00000000-0000-0000-0000-000000000003', 'UÇAK BİLETİ', 'Uçak bileti hizmetleri', null, true),
('00000000-0000-0000-0000-000000000004', 'TRANSFER & TUR', 'Transfer ve tur hizmetleri', null, true),
('00000000-0000-0000-0000-000000000005', 'ETKİNLİK', 'Etkinlik organizasyonu', null, true),
('00000000-0000-0000-0000-000000000006', 'İNSAN KAYNAKLARI', 'Personel hizmetleri', null, true),
('00000000-0000-0000-0000-000000000007', 'DİĞER OPERASYONEL HİZMETLER', 'Diğer operasyonel hizmetler', null, true);

-- OTEL | DİĞER HİZMETLER alt kategorileri (gerçek tanımlanmış olanlar)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000101', 'TOPLANTI SALONU KULLANIMI', 'Toplantı salonu kullanım hizmeti', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000102', 'TEKNİK EKİPMAN KULLANIMI', 'Teknik ekipman kullanım hizmeti', '00000000-0000-0000-0000-000000000002', true);

-- OTEL | KONAKLAMA alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000201', 'DOUBLE ODA KİŞİ BAŞI', 'Double oda kişi başı fiyatlandırma', '00000000-0000-0000-0000-000000000001', true),
('00000000-0000-0000-0000-000000000202', 'SINGLE ODA', 'Single oda fiyatlandırma', '00000000-0000-0000-0000-000000000001', true);

-- UÇAK BİLETİ alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000301', 'GRUP UÇAK BİLETİ', 'Grup uçak bileti hizmeti', '00000000-0000-0000-0000-000000000003', true);

-- TRANSFER & TUR alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000401', 'ALAN - OTEL - ALAN | GRUP TRANSFERİ', 'Grup transfer hizmeti', '00000000-0000-0000-0000-000000000004', true);

-- ETKİNLİK alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000501', 'GALA YEMEĞİ | MASA SÜSLEME', 'Gala yemeği masa süsleme hizmeti', '00000000-0000-0000-0000-000000000005', true);

-- İNSAN KAYNAKLARI alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000601', 'OPERASYON MÜDÜRÜ', 'Operasyon müdürü hizmeti', '00000000-0000-0000-0000-000000000006', true);

-- DİĞER OPERASYONEL HİZMETLER alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000701', 'KARŞILAMA DESKİ', 'Karşılama desk hizmeti', '00000000-0000-0000-0000-000000000007', true);
