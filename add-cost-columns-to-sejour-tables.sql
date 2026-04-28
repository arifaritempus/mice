-- Sejour tablolarına maliyet kolonları ekle
-- Rooms, Flights, Transfers ve Extra Services için cost_price ve cost_currency

-- 1. sejour_rooms tablosuna maliyet kolonları ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_rooms' 
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE sejour_rooms ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_rooms' 
        AND column_name = 'cost_currency'
    ) THEN
        ALTER TABLE sejour_rooms ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'EUR';
    END IF;
END $$;

-- 2. sejour_flights tablosuna maliyet kolonları ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_flights' 
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE sejour_flights ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_flights' 
        AND column_name = 'cost_currency'
    ) THEN
        ALTER TABLE sejour_flights ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'EUR';
    END IF;
END $$;

-- 3. sejour_transfers tablosuna maliyet kolonları ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'cost_currency'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'EUR';
    END IF;
END $$;

-- 4. sejour_extra_services tablosuna maliyet kolonları ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_extra_services' 
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE sejour_extra_services ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_extra_services' 
        AND column_name = 'cost_currency'
    ) THEN
        ALTER TABLE sejour_extra_services ADD COLUMN cost_currency VARCHAR(3) DEFAULT 'EUR';
    END IF;
END $$;

-- 5. Başarı mesajı
SELECT 'Maliyet kolonları başarıyla eklendi!' as message;

