-- PROJECT FLIGHT TICKETS TABLOSU YAPISINI KONTROL ET
-- Supabase SQL Editor'da çalıştırın

-- 1. Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'project_flight_tickets' 
ORDER BY ordinal_position;

-- 2. Kur alanı var mı kontrol et
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'project_flight_tickets' 
AND column_name IN ('kur', 'toplam_tl');

-- 3. Eğer alanlar yoksa ekle
DO $$
BEGIN
    -- Kur alanını ekle (eğer yoksa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_flight_tickets' 
        AND column_name = 'kur'
    ) THEN
        ALTER TABLE project_flight_tickets ADD COLUMN kur DECIMAL(10,4) DEFAULT 1.0000;
        RAISE NOTICE 'Kur alanı eklendi';
    ELSE
        RAISE NOTICE 'Kur alanı zaten mevcut';
    END IF;

    -- Toplam TL alanını ekle (eğer yoksa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_flight_tickets' 
        AND column_name = 'toplam_tl'
    ) THEN
        ALTER TABLE project_flight_tickets ADD COLUMN toplam_tl DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Toplam TL alanı eklendi';
    ELSE
        RAISE NOTICE 'Toplam TL alanı zaten mevcut';
    END IF;
END $$;

-- 4. Son kontrol
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'project_flight_tickets' 
AND column_name IN ('kur', 'toplam_tl')
ORDER BY ordinal_position;
