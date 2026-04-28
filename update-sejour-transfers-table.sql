-- Sejour transfers tablosunu güncelle
-- Eksik kolonları ekle ve mevcut verileri koru

-- 1. date kolonunu ekle (transfer tarihi için)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN date DATE;
        
        -- Mevcut kayıtlar için direction'a göre varsayılan tarih ata
        UPDATE sejour_transfers 
        SET date = (
            CASE 
                WHEN direction = 'arrival' THEN 
                    (SELECT check_in_date FROM sejours WHERE id = sejour_transfers.sejour_id)
                WHEN direction = 'return' THEN 
                    (SELECT check_out_date FROM sejours WHERE id = sejour_transfers.sejour_id)
                ELSE 
                    (SELECT check_out_date FROM sejours WHERE id = sejour_transfers.sejour_id)
            END
        )
        WHERE date IS NULL;
    END IF;
END $$;

-- 2. direction kolonunu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'direction'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN direction VARCHAR(50) NOT NULL DEFAULT 'arrival';
        
        -- Mevcut kayıtlar için varsayılan değer atanmış olacak (DEFAULT sayesinde)
    END IF;
END $$;

-- 3. transfer_type kolonunu ekle (eğer yoksa ve NOT NULL constraint varsa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'transfer_type'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN transfer_type VARCHAR(50) DEFAULT 'private';
    END IF;
    
    -- Eğer kolon varsa ama NULL değerler varsa, bunları düzelt
    UPDATE sejour_transfers 
    SET transfer_type = 'private' 
    WHERE transfer_type IS NULL;
END $$;

-- 4. time kolonunu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'time'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN time TIME;
    END IF;
END $$;

-- 5. vehicle kolonunu ekle (eğer yoksa - vehicle_type yerine veya ek olarak)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'vehicle'
    ) THEN
        ALTER TABLE sejour_transfers ADD COLUMN vehicle VARCHAR(255);
        
        -- Eğer vehicle_type varsa ve vehicle yoksa, vehicle_type'dan kopyala
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'sejour_transfers' 
            AND column_name = 'vehicle_type'
        ) THEN
            UPDATE sejour_transfers 
            SET vehicle = vehicle_type 
            WHERE vehicle IS NULL AND vehicle_type IS NOT NULL;
        END IF;
    END IF;
END $$;

-- 6. Index'leri oluştur
CREATE INDEX IF NOT EXISTS idx_sejour_transfers_date ON sejour_transfers(date);
CREATE INDEX IF NOT EXISTS idx_sejour_transfers_direction ON sejour_transfers(direction);

-- 7. NOT NULL constraint'leri kontrol et ve gerekirse ekle
DO $$ 
BEGIN
    -- direction için NOT NULL constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'direction'
        AND is_nullable = 'YES'
    ) THEN
        -- Önce NULL değerleri düzelt
        UPDATE sejour_transfers SET direction = 'arrival' WHERE direction IS NULL;
        -- Sonra NOT NULL constraint ekle
        ALTER TABLE sejour_transfers ALTER COLUMN direction SET NOT NULL;
    END IF;
    
    -- transfer_type için NOT NULL constraint (eğer şemada gerekiyorsa)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sejour_transfers' 
        AND column_name = 'transfer_type'
        AND is_nullable = 'YES'
    ) THEN
        -- Önce NULL değerleri düzelt
        UPDATE sejour_transfers SET transfer_type = 'private' WHERE transfer_type IS NULL;
        -- Sonra NOT NULL constraint ekle (opsiyonel - şemaya bağlı)
        -- ALTER TABLE sejour_transfers ALTER COLUMN transfer_type SET NOT NULL;
    END IF;
END $$;

-- 8. Başarı mesajı
SELECT 'Sejour transfers tablosu başarıyla güncellendi!' as message;

