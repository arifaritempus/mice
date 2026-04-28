-- Sejour flights tablosuna biletleme bilgileri için kolonlar ekle
-- ticketing_provider, ticketing_date, pnr alanları

-- Önce kolonların var olup olmadığını kontrol et ve ekle
DO $$ 
BEGIN
    -- ticketing_provider kolonu
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_flights' 
        AND column_name = 'ticketing_provider'
    ) THEN
        ALTER TABLE sejour_flights ADD COLUMN ticketing_provider VARCHAR(255);
    END IF;
    
    -- ticketing_date kolonu
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_flights' 
        AND column_name = 'ticketing_date'
    ) THEN
        ALTER TABLE sejour_flights ADD COLUMN ticketing_date DATE;
    END IF;
    
    -- pnr kolonu
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_flights' 
        AND column_name = 'pnr'
    ) THEN
        ALTER TABLE sejour_flights ADD COLUMN pnr VARCHAR(50);
    END IF;
END $$;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_sejour_flights_ticketing_date ON sejour_flights(ticketing_date);
CREATE INDEX IF NOT EXISTS idx_sejour_flights_pnr ON sejour_flights(pnr);

