-- Quotes tablosuna birden fazla otel verisini tutmak için JSONB kolonu eklenmesi
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS hotels_data JSONB DEFAULT '[]'::jsonb;

-- Geriye dönük uyumluluk ve esneklik için mevcut kolonların zorunluluğunu kaldırıyoruz
ALTER TABLE quotes ALTER COLUMN hotel_id DROP NOT NULL;
ALTER TABLE quotes ALTER COLUMN check_in_date DROP NOT NULL;
ALTER TABLE quotes ALTER COLUMN check_out_date DROP NOT NULL;

-- Eğer forms validation veya view error verirse diye comment
COMMENT ON COLUMN quotes.hotels_data IS 'Birden fazla otel seçimi için {"hotel_id", "hotel_concept", "check_in_date", "check_out_date"} formatında JSON dizisi tutar.';
