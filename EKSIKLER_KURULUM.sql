-- EKSIK TABLOLAR VE GORUNUMLER



-- ==========================================
-- FILE: sejour-supabase-schema.sql
-- ==========================================

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



-- ==========================================
-- FILE: create-project-flight-tickets-final.sql
-- ==========================================

-- PROJECT FLIGHT TICKETS TABLOSU OLUŞTURMA - FINAL
-- Supabase SQL Editor'da çalıştırın

-- 1. Mevcut tabloyu sil (eğer varsa)
DROP TABLE IF EXISTS project_flight_tickets CASCADE;

-- 2. Tabloyu oluştur
CREATE TABLE project_flight_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    biletleme_tarihi DATE,
    tedarikci VARCHAR(255),
    havayolu VARCHAR(255),
    pnr VARCHAR(100),
    ucus_tipi VARCHAR(50),
    gidis_tarihi DATE,
    gidis_saati TIME,
    gidis_ucus_kodu VARCHAR(50),
    donus_tarihi DATE,
    donus_saati TIME,
    donus_ucus_kodu VARCHAR(50),
    guzergah VARCHAR(255),
    kisi_sayisi INTEGER DEFAULT 1,
    pp_maliyet DECIMAL(15,2) DEFAULT 0,
    toplam_maliyet DECIMAL(15,2) DEFAULT 0,
    doviz VARCHAR(10) DEFAULT 'EUR',
    misafirler TEXT,
    durum VARCHAR(50) DEFAULT 'aktif',
    islemler TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Test verisi ekle
INSERT INTO project_flight_tickets (project_id, tedarikci, havayolu, pnr, ucus_tipi, guzergah, kisi_sayisi, pp_maliyet, toplam_maliyet, misafirler) 
VALUES (
    '52519ea8-11ea-4c2f-b55f-82df78813fc4', 
    'TEST TEDARIKCI', 
    'TK', 
    'TEST123',
    'GRUP',
    'IST-ECN-IST',
    470,
    230,
    108100,
    'TEST MISAFIR 1, TEST MISAFIR 2'
);

-- 4. Veriyi kontrol et
SELECT * FROM project_flight_tickets;

-- 5. Başarı mesajı
SELECT 'project_flight_tickets tablosu başarıyla oluşturuldu ve test verisi eklendi!' as message;


-- ==========================================
-- FILE: create-ticket-options-table.sql
-- ==========================================

-- BİLET OPSİYON TAKİP TABLOSU
-- Supabase SQL Editor'da çalıştırın

-- 1. Bilet opsiyonları tablosunu oluştur
CREATE TABLE IF NOT EXISTS ticket_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_no VARCHAR(255) NOT NULL,
    agent VARCHAR(255),
    company_name VARCHAR(255),
    supplier VARCHAR(255),
    airline VARCHAR(50),
    group_ref_no VARCHAR(255),
    flight_type VARCHAR(50), -- 'Gidiş', 'Dönüş', 'Gidiş Dönüş'
    departure_date DATE,
    departure_time TIME,
    return_date DATE,
    return_time TIME,
    route VARCHAR(255),
    passenger_count INTEGER DEFAULT 0,
    pp_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    option_end_date DATE,
    option_end_time TIME,
    pnr VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'confirmed', 'cancelled'
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ticket_options_voucher_no ON ticket_options(voucher_no);
CREATE INDEX IF NOT EXISTS idx_ticket_options_agent ON ticket_options(agent);
CREATE INDEX IF NOT EXISTS idx_ticket_options_supplier ON ticket_options(supplier);
CREATE INDEX IF NOT EXISTS idx_ticket_options_status ON ticket_options(status);
CREATE INDEX IF NOT EXISTS idx_ticket_options_departure_date ON ticket_options(departure_date);
CREATE INDEX IF NOT EXISTS idx_ticket_options_option_end_date ON ticket_options(option_end_date);

-- 3. RLS'yi etkinleştir
ALTER TABLE ticket_options ENABLE ROW LEVEL SECURITY;

-- 4. RLS politikalarını oluştur
-- Tüm kullanıcılar bilet opsiyonlarını görebilir (VIEW yetkisi varsa)
CREATE POLICY "Users can view ticket options" ON ticket_options
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonu ekleyebilir (CREATE yetkisi varsa)
CREATE POLICY "Users can create ticket options" ON ticket_options
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonunu güncelleyebilir (EDIT yetkisi varsa)
CREATE POLICY "Users can update ticket options" ON ticket_options
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- Kullanıcılar bilet opsiyonunu silebilir (DELETE yetkisi varsa)
CREATE POLICY "Users can delete ticket options" ON ticket_options
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 5. updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_ticket_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_options_updated_at
    BEFORE UPDATE ON ticket_options
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_options_updated_at();



















-- ==========================================
-- FILE: create-ticket-payments-tables.sql
-- ==========================================

-- BİLET ÖDEME TAKİP TABLOLARI
-- Supabase SQL Editor'da çalıştırın

-- 1. Ödeme Planları Tablosu
CREATE TABLE IF NOT EXISTS ticket_payment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket_options(id) ON DELETE CASCADE,
    installments JSONB NOT NULL, -- [{id, date, percentage, amount, currency}]
    total_amount DECIMAL(15,2) NOT NULL,
    total_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ödeme Kayıtları Tablosu
CREATE TABLE IF NOT EXISTS ticket_payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_plan_id UUID REFERENCES ticket_payment_plans(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES ticket_options(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_transfer', 'cash', 'online'
    notes TEXT,
    recipient VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. İndeksleri oluştur
CREATE INDEX IF NOT EXISTS idx_ticket_payment_plans_ticket_id ON ticket_payment_plans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_plans_status ON ticket_payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_ticket_id ON ticket_payment_records(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_payment_plan_id ON ticket_payment_records(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_ticket_payment_records_payment_date ON ticket_payment_records(payment_date);

-- 4. RLS'yi etkinleştir
ALTER TABLE ticket_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_payment_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS politikalarını oluştur - Payment Plans
CREATE POLICY "Users can view payment plans" ON ticket_payment_plans
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can create payment plans" ON ticket_payment_plans
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can update payment plans" ON ticket_payment_plans
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can delete payment plans" ON ticket_payment_plans
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 6. RLS politikalarını oluştur - Payment Records
CREATE POLICY "Users can view payment records" ON ticket_payment_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'view'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can create payment records" ON ticket_payment_records
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'create'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can update payment records" ON ticket_payment_records
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'edit'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

CREATE POLICY "Users can delete payment records" ON ticket_payment_records
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
        OR EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.id = auth.uid()
            WHERE p.module = 'tickets' AND p.action = 'delete'
            AND (rp.role_id IN (SELECT id FROM roles WHERE name = u.role) OR u.role = 'Kullanıcı')
        )
    );

-- 7. updated_at otomatik güncelleme trigger'ları
CREATE OR REPLACE FUNCTION update_ticket_payment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_payment_plans_updated_at
    BEFORE UPDATE ON ticket_payment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_payment_plans_updated_at();

CREATE OR REPLACE FUNCTION update_ticket_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_payment_records_updated_at
    BEFORE UPDATE ON ticket_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_payment_records_updated_at();



















-- ==========================================
-- FILE: supabase-odeme-tables.sql
-- ==========================================

-- Ödeme Tabı için Supabase Tabloları
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Proje Ödeme Planları Tablosu (Alış Ödeme Planı)
CREATE TABLE IF NOT EXISTS project_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  hotel TEXT, -- Otel/Tedarikçi adı (display için)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proje Ödemeler Tablosu (Yapılan Ödemeler)
CREATE TABLE IF NOT EXISTS project_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  payee TEXT, -- Ödenen kişi/firma
  hotel TEXT, -- Otel/Tedarikçi adı (display için)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mevcut tablolara kolon ekleme (eğer tablolar zaten varsa)
ALTER TABLE project_payment_plans 
  ADD COLUMN IF NOT EXISTS hotel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;

ALTER TABLE project_payments 
  ADD COLUMN IF NOT EXISTS hotel TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_project ON project_payment_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_date ON project_payment_plans(date);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_supplier ON project_payment_plans(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_payment_plans_hotel ON project_payment_plans(hotel_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_project ON project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_date ON project_payments(date);
CREATE INDEX IF NOT EXISTS idx_project_payments_supplier ON project_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_hotel ON project_payments(hotel_id);

-- RLS (Row Level Security) Politikaları
ALTER TABLE project_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil (eğer varsa)
DROP POLICY IF EXISTS "Users can view payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can insert payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can update payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can delete payment plans for their projects" ON project_payment_plans;
DROP POLICY IF EXISTS "Users can view payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can insert payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can update payments for their projects" ON project_payments;
DROP POLICY IF EXISTS "Users can delete payments for their projects" ON project_payments;

-- Proje sahipleri ve proje kullanıcıları okuyabilir/yazabilir
CREATE POLICY "Users can view payment plans for their projects"
  ON project_payment_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payment plans for their projects"
  ON project_payment_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payment plans for their projects"
  ON project_payment_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payment plans for their projects"
  ON project_payment_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payment_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payment_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Aynı politikaları payments tablosu için de oluştur
CREATE POLICY "Users can view payments for their projects"
  ON project_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments for their projects"
  ON project_payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their projects"
  ON project_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments for their projects"
  ON project_payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_payments.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_payments.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Mevcut trigger'ları sil (eğer varsa)
DROP TRIGGER IF EXISTS update_project_payment_plans_updated_at ON project_payment_plans;
DROP TRIGGER IF EXISTS update_project_payments_updated_at ON project_payments;

-- Updated_at trigger'ları
CREATE TRIGGER update_project_payment_plans_updated_at
  BEFORE UPDATE ON project_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_payments_updated_at
  BEFORE UPDATE ON project_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



-- ==========================================
-- FILE: supabase-tahsilat-tables.sql
-- ==========================================

-- Tahsilat Tabı için Supabase Tabloları
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Proje Tahsilat Planları Tablosu (Ödeme Planı - Sözleşme)
CREATE TABLE IF NOT EXISTS project_collection_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Proje Tahsilatlar Tablosu (Alınan Tahsilatlar)
CREATE TABLE IF NOT EXISTS project_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  collection_type TEXT CHECK (collection_type IN ('banka', 'pos', 'cek', 'nakit')),
  description TEXT,
  payer TEXT, -- Ödeyen kişi/firma
  amount NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'EUR', 'USD', 'GBP')),
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  total_try NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_project_collection_plans_project ON project_collection_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collection_plans_date ON project_collection_plans(date);
CREATE INDEX IF NOT EXISTS idx_project_collections_project ON project_collections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collections_date ON project_collections(date);

-- RLS (Row Level Security) Politikaları
ALTER TABLE project_collection_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collections ENABLE ROW LEVEL SECURITY;

-- Proje sahipleri ve proje kullanıcıları okuyabilir/yazabilir
CREATE POLICY "Users can view collection plans for their projects"
  ON project_collection_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert collection plans for their projects"
  ON project_collection_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collection plans for their projects"
  ON project_collection_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete collection plans for their projects"
  ON project_collection_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collection_plans.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collection_plans.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Aynı politikaları collections tablosu için de oluştur
CREATE POLICY "Users can view collections for their projects"
  ON project_collections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert collections for their projects"
  ON project_collections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collections for their projects"
  ON project_collections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete collections for their projects"
  ON project_collections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_users pu
      WHERE pu.project_id = project_collections.project_id
      AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collections.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER update_project_collection_plans_updated_at
  BEFORE UPDATE ON project_collection_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_collections_updated_at
  BEFORE UPDATE ON project_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




-- ==========================================
-- FILE: flight-tickets-schema.sql
-- ==========================================

-- UÇAK BİLETLERİ TABLOSU
-- Proje detay sayfasındaki uçak bileti tabı için Supabase tablosu

CREATE TABLE flight_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    biletleme_tarihi DATE,
    tedarikci VARCHAR(255),
    havayolu VARCHAR(255),
    pnr VARCHAR(100),
    ucus_tipi VARCHAR(50), -- 'gidis', 'donus', 'gidis-donus'
    gidis_tarihi DATE,
    gidis_saati TIME,
    gidis_ucus_kodu VARCHAR(50),
    donus_tarihi DATE,
    donus_saati TIME,
    donus_ucus_kodu VARCHAR(50),
    guzergah VARCHAR(255),
    kisi_sayisi INTEGER DEFAULT 1,
    pp_maliyet DECIMAL(15,2) DEFAULT 0,
    toplam_maliyet DECIMAL(15,2) DEFAULT 0,
    doviz VARCHAR(10) DEFAULT 'EUR',
    misafirler TEXT,
    durum VARCHAR(50) DEFAULT 'aktif', -- 'aktif', 'iptal', 'tamamlandi'
    islemler TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_flight_tickets_project_id ON flight_tickets(project_id);
CREATE INDEX idx_flight_tickets_biletleme_tarihi ON flight_tickets(biletleme_tarihi);
CREATE INDEX idx_flight_tickets_tedarikci ON flight_tickets(tedarikci);
CREATE INDEX idx_flight_tickets_havayolu ON flight_tickets(havayolu);
CREATE INDEX idx_flight_tickets_pnr ON flight_tickets(pnr);

-- RLS politikası
ALTER TABLE flight_tickets ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini görebilir
CREATE POLICY "Users can view flight tickets if project member" ON flight_tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini ekleyebilir
CREATE POLICY "Users can insert flight tickets if project member" ON flight_tickets
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini güncelleyebilir
CREATE POLICY "Users can update flight tickets if project member" ON flight_tickets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin uçak biletlerini silebilir
CREATE POLICY "Users can delete flight tickets if project member" ON flight_tickets
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = flight_tickets.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Updated_at trigger'ı
CREATE TRIGGER update_flight_tickets_updated_at 
    BEFORE UPDATE ON flight_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- FILE: project-transfer-tour-fixed-schema.sql
-- ==========================================

-- PROJE TRANSFER & TUR TABLOSU - DÜZELTME SQL KODLARI
-- Bu kodları Supabase SQL Editor'da sırayla çalıştırın

-- 1. Önce projects tablosunun yapısını kontrol edin
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- 2. Transfer & Tur tablosunu oluşturun
CREATE TABLE IF NOT EXISTS project_transfer_tour (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Transfer temel bilgileri
    direction VARCHAR(50) NOT NULL, -- 'arrival', 'departure', 'intermediate'
    type_label VARCHAR(100), -- 'Giriş', 'Çıkış', 'Ara Transfer'
    date DATE,
    time TIME,
    flight_code VARCHAR(20),
    route TEXT,
    
    -- Yolcu bilgileri
    passenger_count INTEGER DEFAULT 1,
    passengers TEXT[], -- Yolcu isimleri array'i
    
    -- Transfer detayları
    transfer_type VARCHAR(50), -- 'private', 'economic'
    vehicle_type VARCHAR(100), -- 'vito', 'sprinter', 'otobus', 'binek', 's-class'
    
    -- Tedarikçi bilgileri
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name VARCHAR(255),
    vehicle_assigned BOOLEAN DEFAULT FALSE,
    
    -- Maliyet bilgileri
    cost_amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    
    -- Grup transfer bilgileri
    is_group BOOLEAN DEFAULT FALSE,
    group_transfers JSONB, -- Grup transferlerinin detayları
    
    -- Düzenleme durumu
    is_editing BOOLEAN DEFAULT FALSE,
    
    -- Sıralama ve arama
    sort_key VARCHAR(255), -- Sıralama için kullanılacak anahtar
    
    -- Zaman damgaları
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 3. İndeksleri oluşturun
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_project_id ON project_transfer_tour(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_date ON project_transfer_tour(date);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_direction ON project_transfer_tour(direction);
CREATE INDEX IF NOT EXISTS idx_project_transfer_tour_supplier ON project_transfer_tour(supplier_id);

-- 4. RLS'yi etkinleştirin
ALTER TABLE project_transfer_tour ENABLE ROW LEVEL SECURITY;

-- 5. RLS politikalarını oluşturun (company_id olmadan)
DROP POLICY IF EXISTS "Users can view transfer_tour of their projects" ON project_transfer_tour;
CREATE POLICY "Users can view transfer_tour of their projects" ON project_transfer_tour
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can insert transfer_tour to their projects" ON project_transfer_tour;
CREATE POLICY "Users can insert transfer_tour to their projects" ON project_transfer_tour
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can update transfer_tour of their projects" ON project_transfer_tour;
CREATE POLICY "Users can update transfer_tour of their projects" ON project_transfer_tour
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can delete transfer_tour of their projects" ON project_transfer_tour;
CREATE POLICY "Users can delete transfer_tour of their projects" ON project_transfer_tour
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_transfer_tour.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- 6. Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_project_transfer_tour_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_transfer_tour_updated_at
    BEFORE UPDATE ON project_transfer_tour
    FOR EACH ROW
    EXECUTE FUNCTION update_project_transfer_tour_updated_at();

-- 7. Transfer türleri için enum tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS transfer_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Varsayılan transfer türlerini ekle
INSERT INTO transfer_types (name, description) VALUES
('Giriş Transferi', 'Havalimanından otele transfer'),
('Çıkış Transferi', 'Otelden havalimanına transfer'),
('Ara Transfer', 'Otel-otel veya şehir içi transfer'),
('Tur Transferi', 'Turistik gezi transferi')
ON CONFLICT DO NOTHING;

-- 9. Araç türleri için enum tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Varsayılan araç türlerini ekle
INSERT INTO vehicle_types (name, capacity, description) VALUES
('Vito', 8, 'Mercedes Vito minibüs'),
('Sprinter', 16, 'Mercedes Sprinter minibüs'),
('Otobüs', 50, 'Büyük otobüs'),
('Binek', 4, 'Binek araç'),
('S Class', 4, 'Lüks binek araç')
ON CONFLICT DO NOTHING;

-- 11. Test verisi ekleyin (isteğe bağlı)
-- INSERT INTO project_transfer_tour (project_id, direction, type_label, date, time, route, passenger_count, transfer_type, currency)
-- VALUES ('your-project-id', 'arrival', 'Giriş', CURRENT_DATE, '12:00', 'Havalimanı → Otel', 1, 'private', 'TRY');


-- ==========================================
-- FILE: human-resources-schema.sql
-- ==========================================

-- İNSAN KAYNAKLARI TABLOSU
CREATE TABLE project_human_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hotel VARCHAR(255) NOT NULL, -- Otel/Tedarikçi adı
    main_category VARCHAR(100) NOT NULL, -- Ana kategori (CAT_006 gibi)
    sub_category VARCHAR(255), -- Alt kategori adı
    sub_category_id UUID REFERENCES categories(id), -- Alt kategori ID'si
    supplier_id UUID REFERENCES suppliers(id), -- Tedarikçi ID'si
    hotel_id UUID REFERENCES hotels(id), -- Otel ID'si
    description TEXT, -- Açıklama
    amount DECIMAL(15,4) NOT NULL DEFAULT 0, -- Tutar
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY', -- Döviz cinsi
    exchange_rate DECIMAL(10,4) DEFAULT 1, -- Döviz kuru
    total_try DECIMAL(15,2) NOT NULL DEFAULT 0, -- Toplam TL
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_project_human_resources_project_id ON project_human_resources(project_id);
CREATE INDEX idx_project_human_resources_date ON project_human_resources(date);
CREATE INDEX idx_project_human_resources_hotel ON project_human_resources(hotel);
CREATE INDEX idx_project_human_resources_main_category ON project_human_resources(main_category);
CREATE INDEX idx_project_human_resources_sub_category_id ON project_human_resources(sub_category_id);

-- RLS politikası
ALTER TABLE project_human_resources ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini görebilir
CREATE POLICY "Users can view human resources if project member" ON project_human_resources
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini ekleyebilir
CREATE POLICY "Users can insert human resources if project member" ON project_human_resources
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini güncelleyebilir
CREATE POLICY "Users can update human resources if project member" ON project_human_resources
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Kullanıcılar sadece üye oldukları projelerin insan kaynakları verilerini silebilir
CREATE POLICY "Users can delete human resources if project member" ON project_human_resources
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_human_resources.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_human_resources_updated_at 
    BEFORE UPDATE ON project_human_resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();



-- ==========================================
-- FILE: supabase-vw-rp-otel-detay-proje-maliyet.sql
-- ==========================================

-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu
-- Rapor Merkezi / backend: vw_rp_otel_detay_proje_maliyet + main_category CAT_001/002
--
-- View çıktı sütunları (Supabase şema ile uyumlu):
--   proje_referans varchar | organizasyon_tarihi date | cikis_tarihi date
--   firma_adi varchar | acente varchar | otel varchar | alt_kategori varchar
--   adet int4 | sefer numeric | birim_satis numeric | birim_maliyet numeric
--   para_birimi varchar | main_category varchar  (hepsi NULLABLE olabilir)
-- =============================================================================
--
-- Önkoşullar (çoğu ortamda zaten vardır):
--   public.projects (reference, company_name, agency_id, start_date, end_date, …)
--   public.project_sales_items, public.project_purchase_items
--   public.hotels, public.agencies
--   project_sales_items.category: 'CAT_001'/'CAT_002' VEYA categories.id (UUID) —
--   sub_category: metin veya categories.id (UUID); UUID ise alt_kategori = categories.name
--   UUID ise kök kategori: parent_id zinciriyle köke çıkılır; kök adı
--   "KONAKLAMA", "OTEL | KONAKLAMA", "OTEL EKSTRA", "OTEL | DİĞER HİZMETLER" vb. (LIKE ile) eşlenir
--
-- Eğer project_sales_items.sefer sütunu yoksa, önce:
--   ALTER TABLE public.project_sales_items ADD COLUMN IF NOT EXISTS sefer integer DEFAULT 1;
--   ALTER TABLE public.project_purchase_items ADD COLUMN IF NOT EXISTS sefer integer DEFAULT 1;
--
-- Not: CREATE OR REPLACE VIEW mevcut sütun TİPLERİNİ değiştiremez (text ↔ varchar, varchar ↔ varchar(n) vb.).
-- Metin tipleri mevcut view ile birebir (CREATE OR REPLACE tip değiştiremez):
--   proje_referans, main_category → character varying(255)
--   firma_adi, acente, otel, alt_kategori, para_birimi → varchar (sınırsız)
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH sales AS (
  SELECT
    psi.id,
    psi.project_id,
    psi.hotel_id,
    psi.category,
    psi.sub_category,
    psi.description,
    psi.unit_quantity::numeric AS unit_quantity,
    COALESCE(psi.sefer, 1)::numeric AS sefer,
    COALESCE(psi.unit_price, 0)::numeric AS unit_price,
    NULLIF(TRIM(psi.currency), '') AS currency,
    ROW_NUMBER() OVER (
      PARTITION BY
        psi.project_id,
        COALESCE(psi.hotel_id::text, ''),
        COALESCE(psi.category, ''),
        COALESCE(psi.sub_category, '')
      ORDER BY psi.created_at NULLS LAST, psi.id
    ) AS pair_rn
  FROM public.project_sales_items psi
  WHERE
    COALESCE(psi.category::text, '') IN ('CAT_001', 'CAT_002')
    OR (
      COALESCE(TRIM(psi.category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        WITH RECURSIVE up_cat AS (
          SELECT c.id, c.parent_id, c.name
          FROM public.categories c
          WHERE c.id = TRIM(psi.category::text)::uuid
          UNION ALL
          SELECT p.id, p.parent_id, p.name
          FROM public.categories p
          INNER JOIN up_cat uc ON p.id = uc.parent_id
        )
        SELECT 1
        FROM up_cat uc
        CROSS JOIN LATERAL (
          SELECT upper(
            replace(
              replace(replace(replace(trim(uc.name), 'İ', 'I'), 'ı', 'I'), 'ğ', 'G'),
              'Ğ',
              'G'
            )
          ) AS n
        ) x
        WHERE uc.parent_id IS NULL
          AND (
            x.n LIKE '%KONAKLAMA%'
            OR x.n LIKE '%EKSTRA%'
            OR (x.n LIKE '%OTEL%' AND x.n LIKE '%DIGER%')
          )
      )
    )
),
purch AS (
  SELECT
    ppi.id,
    ppi.project_id,
    ppi.hotel_id,
    ppi.category,
    ppi.sub_category,
    COALESCE(ppi.unit_price, 0)::numeric AS unit_price,
    ROW_NUMBER() OVER (
      PARTITION BY
        ppi.project_id,
        COALESCE(ppi.hotel_id::text, ''),
        COALESCE(ppi.category, ''),
        COALESCE(ppi.sub_category, '')
      ORDER BY ppi.created_at NULLS LAST, ppi.id
    ) AS pair_rn
  FROM public.project_purchase_items ppi
  WHERE
    COALESCE(ppi.category::text, '') IN ('CAT_001', 'CAT_002')
    OR (
      COALESCE(TRIM(ppi.category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        WITH RECURSIVE up_cat AS (
          SELECT c.id, c.parent_id, c.name
          FROM public.categories c
          WHERE c.id = TRIM(ppi.category::text)::uuid
          UNION ALL
          SELECT p.id, p.parent_id, p.name
          FROM public.categories p
          INNER JOIN up_cat uc ON p.id = uc.parent_id
        )
        SELECT 1
        FROM up_cat uc
        CROSS JOIN LATERAL (
          SELECT upper(
            replace(
              replace(replace(replace(trim(uc.name), 'İ', 'I'), 'ı', 'I'), 'ğ', 'G'),
              'Ğ',
              'G'
            )
          ) AS n
        ) x
        WHERE uc.parent_id IS NULL
          AND (
            x.n LIKE '%KONAKLAMA%'
            OR x.n LIKE '%EKSTRA%'
            OR (x.n LIKE '%OTEL%' AND x.n LIKE '%DIGER%')
          )
      )
    )
)
SELECT
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(p.reference, '')), ''),
      NULLIF(TRIM(COALESCE(p.title, '')), ''),
      p.id::text
    ),
    255
  )::character varying(255) AS proje_referans,
  p.start_date::date AS organizasyon_tarihi,
  p.end_date::date AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.company_name, '')), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(a.name, '')), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(h.name, '')), ''), '-'), 255)::varchar AS otel,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(sc_sub.name, '')), ''),
      CASE
        WHEN COALESCE(TRIM(psi.sub_category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        THEN NULL
        ELSE NULLIF(TRIM(COALESCE(psi.sub_category::text, '')), '')
      END,
      NULLIF(LEFT(TRIM(COALESCE(psi.description, '')), 120), ''),
      '-'
    ),
    255
  )::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(psi.currency, '')), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN public.hotels h ON h.id = psi.hotel_id
LEFT JOIN public.categories sc_sub ON (
  COALESCE(TRIM(psi.sub_category::text), '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND sc_sub.id = TRIM(psi.sub_category::text)::uuid
)
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
 AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
 AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
 AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
 AND ppi.pair_rn = psi.pair_rn;

COMMENT ON VIEW public.vw_rp_otel_detay_proje_maliyet IS
  'Konaklama / otel ekstraları: CAT_001|CAT_002 veya UUID category; alt_kategori UUID ise public.categories.name. Alış: aynı partition+pair_rn.';

-- İsteğe bağlı: API/service role ile okuma (RLS tablolara göre davranır)
-- GRANT SELECT ON public.vw_rp_otel_detay_proje_maliyet TO authenticated;
-- GRANT SELECT ON public.vw_rp_otel_detay_proje_maliyet TO service_role;


-- ==========================================
-- FILE: supabase-vw-rp-proje-satis-maliyet.sql
-- ==========================================

-- =============================================================================
-- vw_rp_proje_satis_maliyet — Proje satış / alış özeti (TRY), rapor gruplaması için
-- Backend: fetchProjeSatisMaliyetProjectRows → Acente/Otel Kar-Zarar, Kar-Zarar
-- detay, marj raporları, yıllık yatay TL
--
-- Çıktı (önerilen sütun adları):
--   project_id, referans_no, organizasyon_tarihi, cikis_tarihi, firma, acente,
--   otel, durum, satis_tl, maliyet_tl, kar_zarar_tl, kar_marj_yuzde
--
-- Not: projects.reference yoksa önce ALTER ile ekleyin veya referans_no için
-- yalnızca title kullanın.
--
-- PostgreSQL: CREATE OR REPLACE VIEW mevcut görünümden sütun silemez (42P16).
-- Bu dosya önce DROP VIEW, sonra CREATE VIEW kullanır. Başka view'lar buna
-- bağlıysa CASCADE onları da kaldırır; gerekirse önce bağımlılıkları kontrol edin.
-- =============================================================================

DROP VIEW IF EXISTS public.vw_rp_proje_satis_maliyet CASCADE;

CREATE VIEW public.vw_rp_proje_satis_maliyet AS
WITH sales_agg AS (
  SELECT
    psi.project_id,
    COALESCE(
      SUM(
        COALESCE(
          psi.total_try,
          COALESCE(psi.total_price, 0::numeric) * COALESCE(psi.fx, 1::numeric),
          0::numeric
        )
      ),
      0::numeric
    ) AS satis_tl
  FROM public.project_sales_items psi
  GROUP BY psi.project_id
),
purchase_agg AS (
  SELECT
    ppi.project_id,
    COALESCE(
      SUM(
        COALESCE(
          ppi.total_try,
          COALESCE(ppi.total_price, 0::numeric) * COALESCE(ppi.fx, 1::numeric),
          0::numeric
        )
      ),
      0::numeric
    ) AS maliyet_tl
  FROM public.project_purchase_items ppi
  GROUP BY ppi.project_id
)
SELECT
  p.id AS project_id,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(p.reference::text, '')), ''),
      NULLIF(TRIM(COALESCE(p.title::text, '')), ''),
      p.id::text
    ),
    200
  )::varchar AS referans_no,
  p.start_date::date AS organizasyon_tarihi,
  p.end_date::date AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.company_name, '')), ''), '-'), 255)::varchar AS firma,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(a.name, '')), ''), '-'), 255)::varchar AS acente,
  LEFT(
    COALESCE(
      NULLIF(TRIM(COALESCE(hp.name, '')), ''),
      NULLIF(TRIM(COALESCE(hi.name, '')), ''),
      '-'
    ),
    255
  )::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(COALESCE(p.status, '')), ''), 'BEKLEMEDE'), 80)::varchar AS durum,
  COALESCE(sa.satis_tl, 0::numeric) AS satis_tl,
  COALESCE(pa.maliyet_tl, 0::numeric) AS maliyet_tl,
  (COALESCE(sa.satis_tl, 0::numeric) - COALESCE(pa.maliyet_tl, 0::numeric)) AS kar_zarar_tl,
  (
    CASE
      WHEN COALESCE(sa.satis_tl, 0::numeric) > 0::numeric THEN
        ROUND(
          (
            ((COALESCE(sa.satis_tl, 0::numeric) - COALESCE(pa.maliyet_tl, 0::numeric)) / sa.satis_tl)
            * 100::numeric
          )::numeric,
          2
        )
      ELSE 0::numeric
    END
  ) AS kar_marj_yuzde
FROM public.projects p
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN public.hotels hp ON hp.id = p.hotel_id
LEFT JOIN sales_agg sa ON sa.project_id = p.id
LEFT JOIN purchase_agg pa ON pa.project_id = p.id
LEFT JOIN LATERAL (
  SELECT h.name
  FROM public.project_sales_items psi
  INNER JOIN public.hotels h ON h.id = psi.hotel_id
  WHERE psi.project_id = p.id
    AND psi.hotel_id IS NOT NULL
  ORDER BY psi.created_at DESC NULLS LAST, psi.id DESC
  LIMIT 1
) hi ON true;

COMMENT ON VIEW public.vw_rp_proje_satis_maliyet IS
  'Proje başına TRY satış (project_sales_items), TRY alış (project_purchase_items), kar/zarar ve marj %; raporlar için.';


-- ==========================================
-- FILE: supabase-vw-rp-sejour-kar-zarar.sql
-- ==========================================

-- =============================================================================
-- vw_rp_sejour_kar_zarar — Sejour Kar/Zarar (voucher bazlı, TL)
-- Backend: backend/src/routes/reports.js → vw_rp_sejour_kar_zarar
--
-- Kaynak: public.sejours (totals / costs / profits JSONB — TRY anahtarı)
-- Acente: agencies | Otel: sejours.hotel_id → hotels, yoksa ilk oda satırı
--
-- Supabase "schema cache" hatası alırsanız: SQL çalıştırdıktan sonra birkaç saniye
-- bekleyin veya Dashboard → Settings → API → "Reload schema" (varsa) / projeyi yeniden deploy.
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_rp_sejour_kar_zarar AS
SELECT
  s.voucher_number::varchar AS voucher_no,
  s.check_in_date::date AS giris_tarihi,
  s.check_out_date::date AS cikis_tarihi,
  COALESCE(NULLIF(TRIM(a.name), ''), '-')::varchar AS acente,
  COALESCE(
    NULLIF(TRIM(h_main.name), ''),
    (
      SELECT NULLIF(TRIM(h2.name), '')
      FROM public.sejour_rooms sr
      JOIN public.hotels h2 ON h2.id = sr.hotel_id
      WHERE sr.sejour_id = s.id
      ORDER BY sr.created_at NULLS LAST, sr.id
      LIMIT 1
    ),
    '-'
  )::varchar AS otel,
  COALESCE(s.status, 'BEKLEMEDE')::varchar AS durum,
  COALESCE((s.totals ->> 'TRY')::numeric, 0)::numeric AS satis_tl,
  COALESCE((s.costs ->> 'TRY')::numeric, 0)::numeric AS maliyet_tl,
  COALESCE(
    (s.profits ->> 'TRY')::numeric,
    COALESCE((s.totals ->> 'TRY')::numeric, 0) - COALESCE((s.costs ->> 'TRY')::numeric, 0)
  )::numeric AS kar_zarar_tl,
  CASE
    WHEN COALESCE((s.totals ->> 'TRY')::numeric, 0) > 0 THEN
      ROUND(
        (
          COALESCE(
            (s.profits ->> 'TRY')::numeric,
            COALESCE((s.totals ->> 'TRY')::numeric, 0) - COALESCE((s.costs ->> 'TRY')::numeric, 0)
          )
          / NULLIF((s.totals ->> 'TRY')::numeric, 0)
          * 100
        )::numeric,
        2
      )
    ELSE 0::numeric
  END AS kar_marj_yuzde
FROM public.sejours s
LEFT JOIN public.agencies a ON a.id = s.agency_id
LEFT JOIN public.hotels h_main ON h_main.id = s.hotel_id;

COMMENT ON VIEW public.vw_rp_sejour_kar_zarar IS
  'Sejour voucher satırı; satış/maliyet/kar TL JSONB alanlarından; marj % satış TL üzerinden.';

-- İsteğe bağlı (RLS politikalarınıza göre):
-- GRANT SELECT ON public.vw_rp_sejour_kar_zarar TO authenticated;
-- GRANT SELECT ON public.vw_rp_sejour_kar_zarar TO service_role;


-- ==========================================
-- FILE: fix-otel-detay-teklif-view.sql
-- ==========================================

-- =============================================================================
-- vw_rp_otel_detay_teklif — Otel Detaylı Teklif Raporu (v3 - GÜNCEL)
-- =============================================================================

-- 1. AGRESİF VERİ ONARICI: [T:...] etiketi varsa hotel_id'yi MUTLAKA günceller
DO $$
DECLARE
    r RECORD;
    v_tab_id TEXT;
    v_hotel_id UUID;
BEGIN
    -- Etiketi olan tüm kalemleri tara (NULL olsun olmasın, yanlış atanmışları düzeltmek için)
    FOR r IN SELECT id, quote_id, description, hotel_id FROM public.quote_items WHERE description LIKE '%[T:%' LOOP
        v_tab_id := substring(r.description from '\[T:([^\]]+)\]');
        
        SELECT (h_data->>'hotel_id')::uuid INTO v_hotel_id
        FROM public.quotes q,
        jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
        WHERE q.id = r.quote_id AND h_data->>'id' = v_tab_id;
        
        -- Eğer etiketteki otel mevcut hotel_id'den farklıysa düzelt
        IF v_hotel_id IS NOT NULL AND (r.hotel_id IS NULL OR r.hotel_id <> v_hotel_id) THEN
            UPDATE public.quote_items SET hotel_id = v_hotel_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 1. GÜNCEL RAPOR GÖRÜNÜMÜ (v7.1 - ULTIMATE)
-- Bu sürüm hem otelleri ayırır hem de her otelin kendi durumunu (Konfirme/İptal) gösterir.
DROP VIEW IF EXISTS public.vw_rp_otel_detay_teklif CASCADE;

CREATE VIEW public.vw_rp_otel_detay_teklif AS
WITH exploded_hotels AS (
    SELECT 
        q.id as quote_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status -- Sekme bazlı durum (İptal/Konfirme)
    FROM public.quotes q,
    jsonb_array_elements(CASE WHEN jsonb_typeof(q.hotels_data) = 'array' THEN q.hotels_data ELSE '[]'::jsonb END) h_data
),
items_with_tags AS (
    SELECT 
        qi.*,
        substring(qi.description from '\[T:([^\]]+)\]') as extracted_tab_id
    FROM public.quote_items qi
)
SELECT
    q.reference AS teklif_no,
    COALESCE(eh.cin_tarihi, q.check_in_date) AS cin_tarihi,
    COALESCE(eh.cout_tarihi, q.check_out_date) AS cout_tarihi,
    q.company_name AS firma_adi,
    a.name AS acente,
    COALESCE(h.name, 'BELİRSİZ OTEL') AS otel,
    COALESCE(cat.name, iwt.sub_category::text, '-') AS alt_kategori,
    iwt.unit_quantity AS adet,
    iwt.sefer AS sefer,
    iwt.unit_price AS birim_satis,
    iwt.currency AS para_birimi,
    COALESCE(eh.hotel_status, q.status) AS teklif_durumu -- ANA DÜZELTME: Sekme durumunu kullan
FROM items_with_tags iwt
JOIN public.quotes q ON q.id = iwt.quote_id
LEFT JOIN public.agencies a ON a.id = q.agency_id
LEFT JOIN LATERAL (
    SELECT exh.*
    FROM exploded_hotels exh
    WHERE exh.quote_id = q.id
    ORDER BY 
        (exh.tab_id = iwt.extracted_tab_id) DESC,
        (exh.hotel_id = iwt.hotel_id) DESC,
        exh.tab_id ASC
    LIMIT 1
) eh ON TRUE
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, iwt.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = iwt.sub_category::text
WHERE iwt.main_category::text IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER');


-- ==========================================
-- FILE: fix-otel-detay-maliyet-view.sql
-- ==========================================

-- =============================================================================
-- vw_rp_otel_detay_proje_maliyet — Otel Detaylı Proje Maliyet Raporu (v7.1 - ULTIMATE)
-- =============================================================================

-- 1. AGRESİF VERİ ONARICI: project_sales_items tablosundaki hatalı hotel_id'leri düzeltir
DO $$
DECLARE
    r RECORD;
    v_tab_id TEXT;
    v_hotel_id UUID;
BEGIN
    FOR r IN SELECT id, project_id, description, hotel_id FROM public.project_sales_items WHERE description LIKE '%[T:%' LOOP
        v_tab_id := substring(r.description from '\[T:([^\]]+)\]');
        
        SELECT (h_data->>'hotel_id')::uuid INTO v_hotel_id
        FROM public.projects p,
        jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
        WHERE p.id = r.project_id AND h_data->>'id' = v_tab_id;
        
        IF v_hotel_id IS NOT NULL AND (r.hotel_id IS NULL OR r.hotel_id <> v_hotel_id) THEN
            UPDATE public.project_sales_items SET hotel_id = v_hotel_id WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 2. GÜNCEL RAPOR GÖRÜNÜMÜ (v7.1 - ULTIMATE RESILIENCE)
DROP VIEW IF EXISTS public.vw_rp_otel_detay_proje_maliyet CASCADE;

CREATE VIEW public.vw_rp_otel_detay_proje_maliyet AS
WITH exploded_hotels AS (
    SELECT 
        p.id as project_id,
        (h_data->>'id') as tab_id,
        (h_data->>'hotel_id')::uuid as hotel_id,
        (h_data->>'check_in_date')::date as cin_tarihi,
        (h_data->>'check_out_date')::date as cout_tarihi,
        (h_data->>'hotel_status') as hotel_status
    FROM public.projects p,
    jsonb_array_elements(CASE WHEN jsonb_typeof(p.hotels_data) = 'array' THEN p.hotels_data ELSE '[]'::jsonb END) h_data
),
sales AS (
  SELECT 
    psi.*,
    substring(psi.description from '\[T:([^\]]+)\]') as extracted_tab_id,
    ROW_NUMBER() OVER (PARTITION BY psi.project_id, psi.hotel_id, psi.category, psi.sub_category ORDER BY psi.id) as pair_rn
  FROM public.project_sales_items psi
),
purch AS (
  SELECT 
    ppi.*,
    ROW_NUMBER() OVER (PARTITION BY ppi.project_id, ppi.hotel_id, ppi.category, ppi.sub_category ORDER BY ppi.id) as pair_rn
  FROM public.project_purchase_items ppi
)
SELECT
  p.reference AS proje_referans,
  COALESCE(eh.cin_tarihi, p.start_date) AS organizasyon_tarihi,
  COALESCE(eh.cout_tarihi, p.end_date) AS cikis_tarihi,
  LEFT(COALESCE(NULLIF(TRIM(p.company_name), ''), '-'), 255)::varchar AS firma_adi,
  LEFT(COALESCE(NULLIF(TRIM(a.name), ''), '-'), 255)::varchar AS acente,
  LEFT(COALESCE(NULLIF(TRIM(h.name), ''), 'BELİRSİZ OTEL'), 255)::varchar AS otel,
  LEFT(COALESCE(NULLIF(TRIM(cat.name), ''), NULLIF(TRIM(psi.sub_category::text), ''), NULLIF(TRIM(psi.description), ''), '-'), 255)::varchar AS alt_kategori,
  ROUND(COALESCE(psi.unit_quantity, 0))::int4 AS adet,
  COALESCE(psi.sefer, 1)::numeric AS sefer,
  COALESCE(psi.unit_price, 0)::numeric AS birim_satis,
  COALESCE(ppi.unit_price, 0)::numeric AS birim_maliyet,
  LEFT(COALESCE(NULLIF(TRIM(psi.currency), ''), 'EUR'), 255)::varchar AS para_birimi,
  LEFT(COALESCE(psi.category, ''), 255)::character varying(255) AS main_category
FROM sales psi
INNER JOIN public.projects p ON p.id = psi.project_id
LEFT JOIN public.agencies a ON a.id = p.agency_id
LEFT JOIN LATERAL (
    SELECT exh.*
    FROM exploded_hotels exh
    WHERE exh.project_id = p.id
    ORDER BY 
        (exh.tab_id = psi.extracted_tab_id) DESC,
        (exh.hotel_id = psi.hotel_id) DESC,
        exh.tab_id ASC
    LIMIT 1
) eh ON TRUE
LEFT JOIN public.hotels h ON h.id = COALESCE(eh.hotel_id, psi.hotel_id)
LEFT JOIN public.categories cat ON cat.id::text = psi.sub_category::text
LEFT JOIN purch ppi
  ON ppi.project_id = psi.project_id
  AND COALESCE(ppi.hotel_id::text, '') = COALESCE(psi.hotel_id::text, '')
  AND COALESCE(ppi.category, '') = COALESCE(psi.category, '')
  AND COALESCE(ppi.sub_category, '') = COALESCE(psi.sub_category, '')
  AND ppi.pair_rn = psi.pair_rn
WHERE psi.category::text IN ('OTEL | KONAKLAMA', 'OTEL | DİĞER HİZMETLER');


-- ==========================================
-- FILE: categories-real-data.sql
-- ==========================================

-- GERÇEK TANIMLANMIŞ KATEGORİLER
-- Önce mevcut verileri temizle (isteğe bağlı)
-- DELETE FROM categories;

-- Ana kategoriler (parent_id = null)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', 'OTEL | KONAKLAMA', 'Otel konaklama hizmetleri', null, true),
('00000000-0000-0000-0000-000000000002', 'OTEL | DİĞER HİZMETLER', 'Otel ek hizmetleri', null, true),
('00000000-0000-0000-0000-000000000003', 'UÇAK BİLETİ', 'Uçak bileti hizmetleri', null, true),
('00000000-0000-0000-0000-000000000004', 'TRANSFER & TUR', 'Transfer ve tur hizmetleri', null, true),
('00000000-0000-0000-0000-000000000005', 'ETKİNLİK', 'Etkinlik organizasyonu', null, true),
('00000000-0000-0000-0000-000000000006', 'İNSAN KAYNAKLARI', 'Personel hizmetleri', null, true),
('00000000-0000-0000-0000-000000000007', 'DİĞER OPERASYONEL HİZMETLER', 'Diğer operasyonel hizmetler', null, true);

-- OTEL | DİĞER HİZMETLER alt kategorileri (gerçek tanımlanmış olanlar)
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000101', 'TOPLANTI SALONU KULLANIMI', 'Toplantı salonu kullanım hizmeti', '00000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000102', 'TEKNİK EKİPMAN KULLANIMI', 'Teknik ekipman kullanım hizmeti', '00000000-0000-0000-0000-000000000002', true);

-- OTEL | KONAKLAMA alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000201', 'DOUBLE ODA KİŞİ BAŞI', 'Double oda kişi başı fiyatlandırma', '00000000-0000-0000-0000-000000000001', true),
('00000000-0000-0000-0000-000000000202', 'SINGLE ODA', 'Single oda fiyatlandırma', '00000000-0000-0000-0000-000000000001', true);

-- UÇAK BİLETİ alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000301', 'GRUP UÇAK BİLETİ', 'Grup uçak bileti hizmeti', '00000000-0000-0000-0000-000000000003', true);

-- TRANSFER & TUR alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000401', 'ALAN - OTEL - ALAN | GRUP TRANSFERİ', 'Grup transfer hizmeti', '00000000-0000-0000-0000-000000000004', true);

-- ETKİNLİK alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000501', 'GALA YEMEĞİ | MASA SÜSLEME', 'Gala yemeği masa süsleme hizmeti', '00000000-0000-0000-0000-000000000005', true);

-- İNSAN KAYNAKLARI alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000601', 'OPERASYON MÜDÜRÜ', 'Operasyon müdürü hizmeti', '00000000-0000-0000-0000-000000000006', true);

-- DİĞER OPERASYONEL HİZMETLER alt kategorileri
INSERT INTO categories (id, name, description, parent_id, is_active) VALUES 
('00000000-0000-0000-0000-000000000701', 'KARŞILAMA DESKİ', 'Karşılama desk hizmeti', '00000000-0000-0000-0000-000000000007', true);
