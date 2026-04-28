-- Sejour flights tablosunu yeniden yapılandır
-- Her uçuş için ayrı kayıt tutacak şekilde (gidiş ve dönüş ayrı)

-- 1. Yeni bir geçici tablo oluştur
CREATE TABLE IF NOT EXISTS sejour_flights_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  flight_direction VARCHAR(20) NOT NULL CHECK (flight_direction IN ('departure', 'return')),
  
  -- Uçuş bilgileri (her uçuş için)
  airline VARCHAR(100),
  flight_number VARCHAR(20),
  flight_date DATE,
  departure_time TIME,
  arrival_time TIME,
  departure_airport VARCHAR(100),
  arrival_airport VARCHAR(100),
  
  -- Biletleme bilgileri
  ticketing_provider VARCHAR(255),
  ticketing_date DATE,
  pnr VARCHAR(50),
  
  -- Fiyat bilgileri
  price_per_person DECIMAL(10,2) DEFAULT 0,
  total_passengers INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mevcut verileri yeni yapıya migrate et
-- Önce eski tabloda ticketing_provider, ticketing_date, pnr kolonlarının var olup olmadığını kontrol et
DO $$ 
DECLARE
  has_ticketing_provider BOOLEAN;
  has_ticketing_date BOOLEAN;
  has_pnr BOOLEAN;
BEGIN
  -- Kolonların varlığını kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sejour_flights' AND column_name = 'ticketing_provider'
  ) INTO has_ticketing_provider;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sejour_flights' AND column_name = 'ticketing_date'
  ) INTO has_ticketing_date;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sejour_flights' AND column_name = 'pnr'
  ) INTO has_pnr;
  
  -- Gidiş uçuşlarını migrate et
  EXECUTE format('
    INSERT INTO sejour_flights_new (
      sejour_id,
      flight_direction,
      airline,
      flight_number,
      flight_date,
      departure_time,
      arrival_time,
      departure_airport,
      arrival_airport,
      ticketing_provider,
      ticketing_date,
      pnr,
      price_per_person,
      total_passengers,
      total_price,
      currency,
      created_at,
      updated_at
    )
    SELECT 
      sejour_id,
      ''departure'' as flight_direction,
      departure_airline as airline,
      departure_flight_number as flight_number,
      departure_date as flight_date,
      departure_time as departure_time,
      NULL as arrival_time,
      departure_airport as departure_airport,
      arrival_airport as arrival_airport,
      %s as ticketing_provider,
      %s as ticketing_date,
      %s as pnr,
      price_per_person,
      total_passengers,
      total_price,
      currency,
      created_at,
      updated_at
    FROM sejour_flights
    WHERE departure_date IS NOT NULL',
    CASE WHEN has_ticketing_provider THEN 'ticketing_provider' ELSE 'NULL' END,
    CASE WHEN has_ticketing_date THEN 'ticketing_date' ELSE 'NULL' END,
    CASE WHEN has_pnr THEN 'pnr' ELSE 'NULL' END
  );
END $$;

-- Dönüş uçuşlarını ekle
DO $$ 
DECLARE
  has_ticketing_provider BOOLEAN;
  has_ticketing_date BOOLEAN;
  has_pnr BOOLEAN;
BEGIN
  -- Kolonların varlığını kontrol et
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sejour_flights' AND column_name = 'ticketing_provider'
  ) INTO has_ticketing_provider;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sejour_flights' AND column_name = 'ticketing_date'
  ) INTO has_ticketing_date;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sejour_flights' AND column_name = 'pnr'
  ) INTO has_pnr;
  
  EXECUTE format('
    INSERT INTO sejour_flights_new (
      sejour_id,
      flight_direction,
      airline,
      flight_number,
      flight_date,
      departure_time,
      arrival_time,
      departure_airport,
      arrival_airport,
      ticketing_provider,
      ticketing_date,
      pnr,
      price_per_person,
      total_passengers,
      total_price,
      currency,
      created_at,
      updated_at
    )
    SELECT 
      sejour_id,
      ''return'' as flight_direction,
      return_airline as airline,
      return_flight_number as flight_number,
      return_date as flight_date,
      return_time as departure_time,
      NULL as arrival_time,
      arrival_airport as departure_airport,
      departure_airport as arrival_airport,
      %s as ticketing_provider,
      %s as ticketing_date,
      %s as pnr,
      price_per_person,
      total_passengers,
      total_price,
      currency,
      created_at,
      updated_at
    FROM sejour_flights
    WHERE return_date IS NOT NULL',
    CASE WHEN has_ticketing_provider THEN 'ticketing_provider' ELSE 'NULL' END,
    CASE WHEN has_ticketing_date THEN 'ticketing_date' ELSE 'NULL' END,
    CASE WHEN has_pnr THEN 'pnr' ELSE 'NULL' END
  );
END $$;

-- 3. Eski tabloyu yedekle (opsiyonel - güvenlik için)
ALTER TABLE sejour_flights RENAME TO sejour_flights_old;

-- 4. Yeni tabloyu aktif hale getir
ALTER TABLE sejour_flights_new RENAME TO sejour_flights;

-- 5. Index'leri oluştur
CREATE INDEX IF NOT EXISTS idx_sejour_flights_sejour_id ON sejour_flights(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_flights_direction ON sejour_flights(flight_direction);
CREATE INDEX IF NOT EXISTS idx_sejour_flights_date ON sejour_flights(flight_date);
CREATE INDEX IF NOT EXISTS idx_sejour_flights_ticketing_date ON sejour_flights(ticketing_date);
CREATE INDEX IF NOT EXISTS idx_sejour_flights_pnr ON sejour_flights(pnr);

-- 6. RLS politikalarını yeniden oluştur
DROP POLICY IF EXISTS "Users can view sejour flights" ON sejour_flights;
DROP POLICY IF EXISTS "Users can insert sejour flights" ON sejour_flights;
DROP POLICY IF EXISTS "Users can update sejour flights" ON sejour_flights;
DROP POLICY IF EXISTS "Users can delete sejour flights" ON sejour_flights;

CREATE POLICY "Users can view sejour flights" ON sejour_flights FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour flights" ON sejour_flights FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour flights" ON sejour_flights FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour flights" ON sejour_flights FOR DELETE USING (true);

-- 7. Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS update_sejour_flights_updated_at ON sejour_flights;
CREATE TRIGGER update_sejour_flights_updated_at 
  BEFORE UPDATE ON sejour_flights 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Başarı mesajı
SELECT 'Sejour flights tablosu başarıyla yeniden yapılandırıldı! Eski tablo sejour_flights_old olarak yedeklendi.' as message;

