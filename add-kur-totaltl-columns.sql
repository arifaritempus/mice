-- UÇAK BİLETİ TABLOSUNA KUR VE TOPLAM TL ALANLARI EKLEME
-- Supabase SQL Editor'da çalıştırın

-- 1. Kur alanını ekle
ALTER TABLE project_flight_tickets 
ADD COLUMN kur DECIMAL(10,4) DEFAULT 1.0000;

-- 2. Toplam TL alanını ekle (formüllü hesaplama için)
ALTER TABLE project_flight_tickets 
ADD COLUMN toplam_tl DECIMAL(15,2) DEFAULT 0;

-- 3. Mevcut veriler için kur değerlerini güncelle
UPDATE project_flight_tickets 
SET kur = CASE 
  WHEN doviz = 'EUR' THEN 35.50
  WHEN doviz = 'USD' THEN 32.80
  WHEN doviz = 'GBP' THEN 40.20
  ELSE 1.0000
END;

-- 4. Toplam TL hesaplaması (toplam_maliyet * kur)
UPDATE project_flight_tickets 
SET toplam_tl = toplam_maliyet * kur;

-- 5. Başarı mesajı
SELECT 'Kur ve Toplam TL alanları başarıyla eklendi!' as message;
