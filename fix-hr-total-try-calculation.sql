-- İNSAN KAYNAKLARI TOTAL_TRY HESAPLAMA DÜZELTMESİ
-- Bu script mevcut verileri düzeltir ve gelecekte otomatik hesaplama için trigger ekler

-- 1. MEVCUT VERİLERİ DÜZELT
-- Tüm kayıtların total_try değerini amount * exchange_rate olarak güncelle
UPDATE project_human_resources
SET total_try = ROUND((amount * exchange_rate)::numeric, 2)
WHERE amount IS NOT NULL 
  AND exchange_rate IS NOT NULL
  AND (total_try IS NULL OR total_try != ROUND((amount * exchange_rate)::numeric, 2));

-- Kaç kayıt güncellendiğini göster
SELECT 
    COUNT(*) as updated_records,
    'Mevcut veriler düzeltildi' as message
FROM project_human_resources
WHERE total_try = ROUND((amount * exchange_rate)::numeric, 2);

-- 2. TRIGGER OLUŞTUR - Gelecekte otomatik hesaplama için
-- Trigger function: INSERT ve UPDATE işlemlerinde total_try'ı otomatik hesapla
CREATE OR REPLACE FUNCTION calculate_hr_total_try()
RETURNS TRIGGER AS $$
BEGIN
    -- Toplam TL = Tutar * Kur
    IF NEW.amount IS NOT NULL AND NEW.exchange_rate IS NOT NULL THEN
        NEW.total_try := ROUND((NEW.amount * NEW.exchange_rate)::numeric, 2);
    ELSE
        NEW.total_try := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eski trigger'ı sil (varsa)
DROP TRIGGER IF EXISTS calculate_hr_total_try_trigger ON project_human_resources;

-- Yeni trigger'ı oluştur
CREATE TRIGGER calculate_hr_total_try_trigger
    BEFORE INSERT OR UPDATE ON project_human_resources
    FOR EACH ROW
    EXECUTE FUNCTION calculate_hr_total_try();

-- 3. KONTROL - Trigger'ın çalışıp çalışmadığını test et
-- Test için bir kayıt ekle (sonra silebilirsiniz)
-- INSERT INTO project_human_resources (project_id, date, hotel, main_category, sub_category, description, amount, currency, exchange_rate)
-- VALUES (
--     (SELECT id FROM projects LIMIT 1),
--     CURRENT_DATE,
--     'TEST HOTEL',
--     'CAT_006',
--     'TEST',
--     'Test kaydı - trigger testi',
--     100.00,
--     'EUR',
--     35.50
-- );
-- total_try otomatik olarak 3550.00 olmalı

-- 4. MEVCUT VERİLERİ KONTROL ET
-- Hangi kayıtların yanlış olduğunu göster
SELECT 
    id,
    hotel,
    amount,
    exchange_rate,
    total_try as mevcut_total_try,
    ROUND((amount * exchange_rate)::numeric, 2) as olmasi_gereken_total_try,
    CASE 
        WHEN total_try = ROUND((amount * exchange_rate)::numeric, 2) THEN 'DOĞRU'
        ELSE 'YANLIŞ'
    END as durum
FROM project_human_resources
WHERE amount IS NOT NULL 
  AND exchange_rate IS NOT NULL
ORDER BY 
    CASE 
        WHEN total_try = ROUND((amount * exchange_rate)::numeric, 2) THEN 1
        ELSE 0
    END,
    id;

-- Başarı mesajı
SELECT 'İnsan Kaynakları total_try hesaplama düzeltmesi tamamlandı!' as message;








