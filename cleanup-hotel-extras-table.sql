-- OTEL EKSTRA TABLOSU TEMİZLEME SQL KODLARI
-- Gereksiz alanları kaldır ve sadece gerekli alanları bırak

-- 1. Önce mevcut tablo yapısını kontrol edin
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_hotel_extras' 
ORDER BY ordinal_position;

-- 2. Gereksiz alanları kaldır (eğer varsa)
-- Bu alanlar gereksizse kaldırılabilir:
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS category;
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS subCategory;
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS roomNumber;
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS guestName;
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS mainCategory;
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS totalTRY;
-- ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS exchangeRate;

-- 3. Sadece gerekli alanları bırak - temiz tablo yapısı
-- Bu komutları çalıştırmadan önce mevcut verileri yedekleyin!

-- 4. Mevcut verileri kontrol edin
SELECT 
    id,
    project_id,
    date,
    hotel,
    main_category,
    sub_category,
    room_number,
    guest_name,
    description,
    amount,
    currency,
    exchange_rate,
    total_try,
    created_at,
    updated_at
FROM project_hotel_extras 
ORDER BY created_at DESC;

-- 5. Eğer gereksiz alanlar varsa, bunları kaldırın
-- Örnek: ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS category;
-- Örnek: ALTER TABLE project_hotel_extras DROP COLUMN IF EXISTS subCategory;

-- 6. Tablo yapısını optimize edin
-- Gerekli indeksleri oluşturun
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_project_id ON project_hotel_extras(project_id);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_date ON project_hotel_extras(date);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_hotel ON project_hotel_extras(hotel);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_main_category ON project_hotel_extras(main_category);

-- 7. RLS politikalarını kontrol edin
SELECT * FROM pg_policies WHERE tablename = 'project_hotel_extras';
