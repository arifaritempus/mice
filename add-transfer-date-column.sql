-- Sejour transfers tablosuna date kolonu ekle
-- Transfer tarihlerini bağımsız olarak kaydetmek için

-- Önce kolonun var olup olmadığını kontrol et
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

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_sejour_transfers_date ON sejour_transfers(date);

