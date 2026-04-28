-- İnsan Kaynakları kategorilerini düzelt ve eksik alt kategorileri ekle
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Önce mevcut İnsan Kaynakları kategorilerini kontrol et
SELECT 'Mevcut İnsan Kaynakları kategorileri:' as info;
SELECT id, name, parent_id, is_active 
FROM categories 
WHERE name ILIKE '%İNSAN%' OR name ILIKE '%HUMAN%' OR name ILIKE '%HR%'
ORDER BY parent_id, name;

-- 2. İnsan Kaynakları ana kategorisini bul veya oluştur
INSERT INTO categories (id, name, description, parent_id, is_active, sort_order) 
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'İNSAN KAYNAKLARI',
  'İnsan kaynakları hizmetleri',
  NULL,
  true,
  6
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 3. İnsan Kaynakları alt kategorilerini ekle
INSERT INTO categories (id, name, description, parent_id, is_active, sort_order) VALUES 
('00000000-0000-0000-0000-000000000301', 'Rehber', 'Rehber hizmetleri', '00000000-0000-0000-0000-000000000006', true, 1),
('00000000-0000-0000-0000-000000000302', 'Şoför', 'Şoför hizmetleri', '00000000-0000-0000-0000-000000000006', true, 2),
('00000000-0000-0000-0000-000000000303', 'Host/Hostes', 'Host/hostes hizmetleri', '00000000-0000-0000-0000-000000000006', true, 3),
('00000000-0000-0000-0000-000000000304', 'Teknik Personel', 'Teknik personel hizmetleri', '00000000-0000-0000-0000-000000000006', true, 4),
('00000000-0000-0000-0000-000000000305', 'Diğer', 'Diğer insan kaynakları hizmetleri', '00000000-0000-0000-0000-000000000006', true, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 4. Sonuçları kontrol et
SELECT 'Düzeltme sonrası İnsan Kaynakları kategorileri:' as info;
SELECT id, name, parent_id, is_active, sort_order
FROM categories 
WHERE (name ILIKE '%İNSAN%' OR name ILIKE '%HUMAN%' OR name ILIKE '%HR%' OR parent_id = '00000000-0000-0000-0000-000000000006')
ORDER BY parent_id, sort_order, name;

-- 5. Ana kategori ve alt kategorileri ayrı ayrı listele
SELECT 'Ana Kategori:' as type, id, name, parent_id FROM categories WHERE id = '00000000-0000-0000-0000-000000000006'
UNION ALL
SELECT 'Alt Kategoriler:' as type, id, name, parent_id FROM categories WHERE parent_id = '00000000-0000-0000-0000-000000000006'
ORDER BY type, name;

