-- İnsan Kaynakları kategorilerini kontrol et
-- Bu sorguları Supabase SQL Editor'da çalıştırarak kategorilerin durumunu kontrol edebilirsiniz

-- 1. İnsan Kaynakları ana kategorisini kontrol et
SELECT * FROM categories 
WHERE name ILIKE '%İNSAN KAYNAKLARI%' 
AND parent_id IS NULL;

-- 2. İnsan Kaynakları alt kategorilerini kontrol et
SELECT * FROM categories 
WHERE parent_id = '00000000-0000-0000-0000-000000000006'
OR parent_id = 'CAT_006'
ORDER BY name;

-- 3. Eğer alt kategoriler yoksa, bunları ekle
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000301', 'Rehber', 'Rehber hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000302', 'Şoför', 'Şoför hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000303', 'Host/Hostes', 'Host/hostes hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000304', 'Teknik Personel', 'Teknik personel hizmetleri', '00000000-0000-0000-0000-000000000006', true),
('00000000-0000-0000-0000-000000000305', 'Diğer', 'Diğer insan kaynakları hizmetleri', '00000000-0000-0000-0000-000000000006', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Tüm kategorileri listele (debug için)
SELECT id, name, parent_id, is_active 
FROM categories 
WHERE name ILIKE '%İNSAN%' 
ORDER BY parent_id, name;

