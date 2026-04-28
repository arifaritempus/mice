-- Sejour Supabase Schema Setup
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Sejours ana tablosu
CREATE TABLE IF NOT EXISTS sejours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_number VARCHAR(50) UNIQUE NOT NULL,
  customer_type VARCHAR(20) DEFAULT 'agency' CHECK (customer_type IN ('agency', 'customer')),
  agency_id UUID REFERENCES agencies(id),
  customer_name VARCHAR(255) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'BEKLEMEDE',
  notes TEXT,
  
  -- Maliyet bilgileri
  costs JSONB DEFAULT '{"EUR": 0, "USD": 0, "TRY": 0, "GBP": 0}',
  totals JSONB DEFAULT '{"EUR": 0, "USD": 0, "TRY": 0, "GBP": 0}',
  profits JSONB DEFAULT '{"EUR": 0, "USD": 0, "TRY": 0, "GBP": 0}',
  
  -- Zaman damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Sejour odaları tablosu
CREATE TABLE IF NOT EXISTS sejour_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  room_number VARCHAR(50),
  hotel_id UUID REFERENCES hotels(id),
  room_type VARCHAR(100),
  accommodation_type VARCHAR(100), -- YB, HB, FB, AI
  guest_info TEXT,
  adult_count INTEGER DEFAULT 1,
  child_count INTEGER DEFAULT 0,
  infant_count INTEGER DEFAULT 0,
  
  -- Fiyat bilgileri
  price_per_night DECIMAL(10,2) DEFAULT 0,
  total_nights INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sejour uçuşları tablosu
CREATE TABLE IF NOT EXISTS sejour_flights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  flight_type VARCHAR(20) DEFAULT 'round_trip' CHECK (flight_type IN ('one_way', 'round_trip')),
  
  -- Gidiş uçuşu
  departure_airline VARCHAR(100),
  departure_flight_number VARCHAR(20),
  departure_date DATE,
  departure_time TIME,
  departure_airport VARCHAR(100),
  arrival_airport VARCHAR(100),
  
  -- Dönüş uçuşu (round_trip için)
  return_airline VARCHAR(100),
  return_flight_number VARCHAR(20),
  return_date DATE,
  return_time TIME,
  
  -- Fiyat bilgileri
  price_per_person DECIMAL(10,2) DEFAULT 0,
  total_passengers INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sejour transferleri tablosu
CREATE TABLE IF NOT EXISTS sejour_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  transfer_type VARCHAR(50), -- Airport, Hotel, City, etc.
  vehicle_type VARCHAR(50), -- Vito, Binek, S Class, Sprinter, Bus
  route_description TEXT,
  
  -- Fiyat bilgileri
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sejour ekstra hizmetler tablosu
CREATE TABLE IF NOT EXISTS sejour_extra_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_types(id),
  supplier_id UUID REFERENCES suppliers(id),
  service_name VARCHAR(255),
  service_description TEXT,
  
  -- Fiyat bilgileri
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Sejour tahsilatlar tablosu (Collections)
CREATE TABLE IF NOT EXISTS sejour_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  collection_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_method VARCHAR(50), -- Cash, Bank Transfer, Credit Card, etc.
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sejour satış faturaları tablosu
CREATE TABLE IF NOT EXISTS sejour_sales_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sejour alış faturaları tablosu
CREATE TABLE IF NOT EXISTS sejour_purchase_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sejour_id UUID REFERENCES sejours(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  invoice_number VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'paid', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Index'ler
CREATE INDEX IF NOT EXISTS idx_sejours_voucher_number ON sejours(voucher_number);
CREATE INDEX IF NOT EXISTS idx_sejours_customer_name ON sejours(customer_name);
CREATE INDEX IF NOT EXISTS idx_sejours_check_in_date ON sejours(check_in_date);
CREATE INDEX IF NOT EXISTS idx_sejours_status ON sejours(status);
CREATE INDEX IF NOT EXISTS idx_sejours_created_at ON sejours(created_at);

CREATE INDEX IF NOT EXISTS idx_sejour_rooms_sejour_id ON sejour_rooms(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_rooms_hotel_id ON sejour_rooms(hotel_id);

CREATE INDEX IF NOT EXISTS idx_sejour_flights_sejour_id ON sejour_flights(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_flights_departure_date ON sejour_flights(departure_date);

CREATE INDEX IF NOT EXISTS idx_sejour_transfers_sejour_id ON sejour_transfers(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_transfers_supplier_id ON sejour_transfers(supplier_id);

CREATE INDEX IF NOT EXISTS idx_sejour_extra_services_sejour_id ON sejour_extra_services(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_extra_services_supplier_id ON sejour_extra_services(supplier_id);

CREATE INDEX IF NOT EXISTS idx_sejour_collections_sejour_id ON sejour_collections(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_collections_date ON sejour_collections(collection_date);

CREATE INDEX IF NOT EXISTS idx_sejour_sales_invoices_sejour_id ON sejour_sales_invoices(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_sales_invoices_invoice_number ON sejour_sales_invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_sejour_purchase_invoices_sejour_id ON sejour_purchase_invoices(sejour_id);
CREATE INDEX IF NOT EXISTS idx_sejour_purchase_invoices_supplier_id ON sejour_purchase_invoices(supplier_id);

-- 10. RLS (Row Level Security) politikaları
ALTER TABLE sejours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_extra_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_purchase_invoices ENABLE ROW LEVEL SECURITY;

-- Sejours tablosu için RLS politikaları
CREATE POLICY "Users can view all sejours" ON sejours FOR SELECT USING (true);
CREATE POLICY "Users can insert sejours" ON sejours FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejours" ON sejours FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejours" ON sejours FOR DELETE USING (true);

-- Sejour_rooms tablosu için RLS politikaları
CREATE POLICY "Users can view sejour rooms" ON sejour_rooms FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour rooms" ON sejour_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour rooms" ON sejour_rooms FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour rooms" ON sejour_rooms FOR DELETE USING (true);

-- Sejour_flights tablosu için RLS politikaları
CREATE POLICY "Users can view sejour flights" ON sejour_flights FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour flights" ON sejour_flights FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour flights" ON sejour_flights FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour flights" ON sejour_flights FOR DELETE USING (true);

-- Sejour_transfers tablosu için RLS politikaları
CREATE POLICY "Users can view sejour transfers" ON sejour_transfers FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour transfers" ON sejour_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour transfers" ON sejour_transfers FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour transfers" ON sejour_transfers FOR DELETE USING (true);

-- Sejour_extra_services tablosu için RLS politikaları
CREATE POLICY "Users can view sejour extra services" ON sejour_extra_services FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour extra services" ON sejour_extra_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour extra services" ON sejour_extra_services FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour extra services" ON sejour_extra_services FOR DELETE USING (true);

-- Sejour_collections tablosu için RLS politikaları
CREATE POLICY "Users can view sejour collections" ON sejour_collections FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour collections" ON sejour_collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour collections" ON sejour_collections FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour collections" ON sejour_collections FOR DELETE USING (true);

-- Sejour_sales_invoices tablosu için RLS politikaları
CREATE POLICY "Users can view sejour sales invoices" ON sejour_sales_invoices FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour sales invoices" ON sejour_sales_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour sales invoices" ON sejour_sales_invoices FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour sales invoices" ON sejour_sales_invoices FOR DELETE USING (true);

-- Sejour_purchase_invoices tablosu için RLS politikaları
CREATE POLICY "Users can view sejour purchase invoices" ON sejour_purchase_invoices FOR SELECT USING (true);
CREATE POLICY "Users can insert sejour purchase invoices" ON sejour_purchase_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sejour purchase invoices" ON sejour_purchase_invoices FOR UPDATE USING (true);
CREATE POLICY "Users can delete sejour purchase invoices" ON sejour_purchase_invoices FOR DELETE USING (true);

-- 11. Trigger'lar - updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sejours_updated_at BEFORE UPDATE ON sejours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_rooms_updated_at BEFORE UPDATE ON sejour_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_flights_updated_at BEFORE UPDATE ON sejour_flights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_transfers_updated_at BEFORE UPDATE ON sejour_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_extra_services_updated_at BEFORE UPDATE ON sejour_extra_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_collections_updated_at BEFORE UPDATE ON sejour_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_sales_invoices_updated_at BEFORE UPDATE ON sejour_sales_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sejour_purchase_invoices_updated_at BEFORE UPDATE ON sejour_purchase_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Örnek veri ekleme (isteğe bağlı)
INSERT INTO sejours (
  voucher_number, customer_name, check_in_date, check_out_date, 
  total_amount, currency, status, notes
) VALUES 
  ('SJ-2024-001', 'Ahmet Yılmaz', '2024-11-01', '2024-11-07', 1500.00, 'EUR', 'KONFİRME', 'Antalya tatil paketi'),
  ('SJ-2024-002', 'Ayşe Demir', '2024-11-15', '2024-11-20', 1200.00, 'EUR', 'BEKLEYEN', 'İstanbul şehir turu'),
  ('SJ-2024-003', 'Mehmet Kaya', '2024-12-01', '2024-12-10', 2500.00, 'USD', 'KONFİRME', 'Kapadokya turu')
ON CONFLICT (voucher_number) DO NOTHING;

-- 13. View'lar - Sejour detayları için
CREATE OR REPLACE VIEW sejour_details AS
SELECT 
  s.*,
  a.name as agency_name,
  -- Oda bilgileri
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', sr.id,
        'room_number', sr.room_number,
        'hotel_id', sr.hotel_id,
        'hotel_name', h.name,
        'room_type', sr.room_type,
        'accommodation_type', sr.accommodation_type,
        'guest_info', sr.guest_info,
        'adult_count', sr.adult_count,
        'child_count', sr.child_count,
        'infant_count', sr.infant_count,
        'price_per_night', sr.price_per_night,
        'total_nights', sr.total_nights,
        'total_price', sr.total_price,
        'currency', sr.currency
      )
    ) FILTER (WHERE sr.id IS NOT NULL), 
    '[]'::json
  ) as rooms,
  -- Uçuş bilgileri
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', sf.id,
        'flight_type', sf.flight_type,
        'departure_airline', sf.departure_airline,
        'departure_flight_number', sf.departure_flight_number,
        'departure_date', sf.departure_date,
        'departure_time', sf.departure_time,
        'departure_airport', sf.departure_airport,
        'arrival_airport', sf.arrival_airport,
        'return_airline', sf.return_airline,
        'return_flight_number', sf.return_flight_number,
        'return_date', sf.return_date,
        'return_time', sf.return_time,
        'price_per_person', sf.price_per_person,
        'total_passengers', sf.total_passengers,
        'total_price', sf.total_price,
        'currency', sf.currency
      )
    ) FILTER (WHERE sf.id IS NOT NULL), 
    '[]'::json
  ) as flights,
  -- Transfer bilgileri
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', st.id,
        'supplier_id', st.supplier_id,
        'supplier_name', sp.name,
        'transfer_type', st.transfer_type,
        'vehicle_type', st.vehicle_type,
        'route_description', st.route_description,
        'price', st.price,
        'currency', st.currency
      )
    ) FILTER (WHERE st.id IS NOT NULL), 
    '[]'::json
  ) as transfers,
  -- Ekstra hizmetler
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ses.id,
        'service_type_id', ses.service_type_id,
        'service_type_name', stype.name,
        'supplier_id', ses.supplier_id,
        'supplier_name', sp2.name,
        'service_name', ses.service_name,
        'service_description', ses.service_description,
        'price', ses.price,
        'currency', ses.currency
      )
    ) FILTER (WHERE ses.id IS NOT NULL), 
    '[]'::json
  ) as extra_services,
  -- Tahsilatlar
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', sc.id,
        'collection_date', sc.collection_date,
        'amount', sc.amount,
        'currency', sc.currency,
        'payment_method', sc.payment_method,
        'description', sc.description,
        'status', sc.status
      )
    ) FILTER (WHERE sc.id IS NOT NULL), 
    '[]'::json
  ) as collections,
  -- Satış faturaları
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ssi.id,
        'invoice_number', ssi.invoice_number,
        'invoice_date', ssi.invoice_date,
        'due_date', ssi.due_date,
        'total_amount', ssi.total_amount,
        'currency', ssi.currency,
        'tax_rate', ssi.tax_rate,
        'tax_amount', ssi.tax_amount,
        'net_amount', ssi.net_amount,
        'status', ssi.status,
        'notes', ssi.notes
      )
    ) FILTER (WHERE ssi.id IS NOT NULL), 
    '[]'::json
  ) as sales_invoices,
  -- Alış faturaları
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', spi.id,
        'supplier_id', spi.supplier_id,
        'supplier_name', sp3.name,
        'invoice_number', spi.invoice_number,
        'invoice_date', spi.invoice_date,
        'due_date', spi.due_date,
        'total_amount', spi.total_amount,
        'currency', spi.currency,
        'tax_rate', spi.tax_rate,
        'tax_amount', spi.tax_amount,
        'net_amount', spi.net_amount,
        'status', spi.status,
        'notes', spi.notes
      )
    ) FILTER (WHERE spi.id IS NOT NULL), 
    '[]'::json
  ) as purchase_invoices
FROM sejours s
LEFT JOIN agencies a ON s.agency_id = a.id
LEFT JOIN sejour_rooms sr ON s.id = sr.sejour_id
LEFT JOIN hotels h ON sr.hotel_id = h.id
LEFT JOIN sejour_flights sf ON s.id = sf.sejour_id
LEFT JOIN sejour_transfers st ON s.id = st.sejour_id
LEFT JOIN suppliers sp ON st.supplier_id = sp.id
LEFT JOIN sejour_extra_services ses ON s.id = ses.sejour_id
LEFT JOIN service_types stype ON ses.service_type_id = stype.id
LEFT JOIN suppliers sp2 ON ses.supplier_id = sp2.id
LEFT JOIN sejour_collections sc ON s.id = sc.sejour_id
LEFT JOIN sejour_sales_invoices ssi ON s.id = ssi.sejour_id
LEFT JOIN sejour_purchase_invoices spi ON s.id = spi.sejour_id
LEFT JOIN suppliers sp3 ON spi.supplier_id = sp3.id
GROUP BY s.id, a.name;

-- 14. Fonksiyonlar
-- Sejour toplam tutarını hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_sejour_total(sejour_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  total_amount DECIMAL(15,2) := 0;
BEGIN
  -- Oda toplamları
  SELECT COALESCE(SUM(total_price), 0) INTO total_amount
  FROM sejour_rooms 
  WHERE sejour_id = sejour_uuid;
  
  -- Uçuş toplamları
  SELECT COALESCE(SUM(total_price), 0) + total_amount INTO total_amount
  FROM sejour_flights 
  WHERE sejour_id = sejour_uuid;
  
  -- Transfer toplamları
  SELECT COALESCE(SUM(price), 0) + total_amount INTO total_amount
  FROM sejour_transfers 
  WHERE sejour_id = sejour_uuid;
  
  -- Ekstra hizmet toplamları
  SELECT COALESCE(SUM(price), 0) + total_amount INTO total_amount
  FROM sejour_extra_services 
  WHERE sejour_id = sejour_uuid;
  
  RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- 15. Başarı mesajı
SELECT 'Sejour Supabase schema başarıyla oluşturuldu!' as message;

