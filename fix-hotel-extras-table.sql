-- OTEL EKSTRA TABLOSU DÜZELTME SQL KODLARI
-- Bu kodları Supabase SQL Editor'da sırayla çalıştırın

-- 1. Önce mevcut tabloyu kontrol edin
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_hotel_extras' 
ORDER BY ordinal_position;

-- 2. Tablo yoksa oluşturun
CREATE TABLE IF NOT EXISTS project_hotel_extras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    hotel VARCHAR(255) NOT NULL DEFAULT '',
    main_category VARCHAR(100) NOT NULL DEFAULT 'CAT_002',
    sub_category VARCHAR(255),
    room_number VARCHAR(50),
    guest_name VARCHAR(255),
    description TEXT,
    amount DECIMAL(15,4) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    total_try DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Eksik sütunları ekleyin
ALTER TABLE project_hotel_extras 
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS room_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(15,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_try DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. İndeksleri oluşturun
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_project_id ON project_hotel_extras(project_id);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_date ON project_hotel_extras(date);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_hotel ON project_hotel_extras(hotel);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_main_category ON project_hotel_extras(main_category);

-- 5. RLS'yi etkinleştirin
ALTER TABLE project_hotel_extras ENABLE ROW LEVEL SECURITY;

-- 6. RLS politikalarını oluşturun
DROP POLICY IF EXISTS "Users can view hotel extras if project member" ON project_hotel_extras;
CREATE POLICY "Users can view hotel extras if project member" ON project_hotel_extras
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can insert hotel extras if project member" ON project_hotel_extras;
CREATE POLICY "Users can insert hotel extras if project member" ON project_hotel_extras
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can update hotel extras if project member" ON project_hotel_extras;
CREATE POLICY "Users can update hotel extras if project member" ON project_hotel_extras
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

DROP POLICY IF EXISTS "Users can delete hotel extras if project member" ON project_hotel_extras;
CREATE POLICY "Users can delete hotel extras if project member" ON project_hotel_extras
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    );

-- 7. Test verisi ekleyin (isteğe bağlı)
-- INSERT INTO project_hotel_extras (project_id, date, hotel, main_category, sub_category, room_number, guest_name, description, amount, currency, exchange_rate, total_try)
-- VALUES ('your-project-id', CURRENT_DATE, 'Test Hotel', 'CAT_002', 'Test Sub Category', '101', 'Test Guest', 'Test Description', 100.00, 'TRY', 1.0, 100.00);
