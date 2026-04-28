-- Transfer tablosunu test et
-- Bu kodu Supabase SQL Editor'da çalıştır

-- 1. Tablo var mı kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_transfer_tour'
) as table_exists;

-- 2. Eğer tablo yoksa oluştur
CREATE TABLE IF NOT EXISTS project_transfer_tour (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    direction VARCHAR(50) NOT NULL,
    type_label VARCHAR(100),
    date DATE,
    time TIME,
    flight_code VARCHAR(20),
    route TEXT,
    passenger_count INTEGER DEFAULT 1,
    passengers TEXT[],
    transfer_type VARCHAR(50),
    vehicle_type VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name VARCHAR(255),
    vehicle_assigned BOOLEAN DEFAULT FALSE,
    cost_amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    is_group BOOLEAN DEFAULT FALSE,
    group_transfers JSONB,
    is_editing BOOLEAN DEFAULT FALSE,
    sort_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 3. RLS'yi etkinleştir
ALTER TABLE project_transfer_tour ENABLE ROW LEVEL SECURITY;

-- 4. Basit RLS politikası oluştur (test için)
DROP POLICY IF EXISTS "Allow all for testing" ON project_transfer_tour;
CREATE POLICY "Allow all for testing" ON project_transfer_tour
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Test verisi ekle
INSERT INTO project_transfer_tour (
    project_id, 
    direction, 
    type_label, 
    date, 
    time, 
    route, 
    passenger_count, 
    transfer_type, 
    currency
) VALUES (
    '52519ea8-11ea-4c2f-b55f-82df78813fc4',
    'arrival',
    'Giriş',
    CURRENT_DATE,
    '12:00',
    'Havalimanı → Otel',
    1,
    'private',
    'TRY'
) ON CONFLICT DO NOTHING;

-- 6. Veriyi kontrol et
SELECT * FROM project_transfer_tour WHERE project_id = '52519ea8-11ea-4c2f-b55f-82df78813fc4';
