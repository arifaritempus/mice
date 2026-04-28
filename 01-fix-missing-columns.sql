-- 1. Quotes tablosuna birden fazla otel verisini tutmak için JSONB kolonu eklenmesi
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS hotels_data JSONB DEFAULT '[]'::jsonb;

-- Geriye dönük uyumluluk ve esneklik için mevcut kolonların zorunluluğunu kaldırıyoruz
ALTER TABLE quotes ALTER COLUMN hotel_id DROP NOT NULL;
ALTER TABLE quotes ALTER COLUMN check_in_date DROP NOT NULL;
ALTER TABLE quotes ALTER COLUMN check_out_date DROP NOT NULL;

-- 2. quote_items tablosuna hangi otele ait olduğunu belirlemek için hotel_id kolonu eklenmesi
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id);

-- Açıklamalar
COMMENT ON COLUMN quotes.hotels_data IS 'Birden fazla otel seçimi için {"hotel_id", "hotel_concept", "check_in_date", "check_out_date"} formatında JSON dizisi tutar.';
COMMENT ON COLUMN quote_items.hotel_id IS 'Hizmet kaleminin hangi otele ait olduğu (null ise genel hizmettir).';
