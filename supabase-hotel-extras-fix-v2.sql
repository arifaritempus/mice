-- OTEL EKSTRA TABLOSU SORUNLARINI DÜZELTMEK İÇİN GÜNCELLENMİŞ SQL KODLARI
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

-- 2. Eksik sütunları ekleyin (hem camelCase hem snake_case)
ALTER TABLE project_hotel_extras 
ADD COLUMN IF NOT EXISTS category VARCHAR(255),
ADD COLUMN IF NOT EXISTS subCategory VARCHAR(255),
ADD COLUMN IF NOT EXISTS roomNumber VARCHAR(50),
ADD COLUMN IF NOT EXISTS guestName VARCHAR(255),
ADD COLUMN IF NOT EXISTS mainCategory VARCHAR(100),
ADD COLUMN IF NOT EXISTS totalTRY DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS exchangeRate DECIMAL(10,4);

-- 3. Mevcut sütunları kontrol edin ve eksik olanları ekleyin
DO $$ 
BEGIN
    -- Temel sütunlar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'id') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'project_id') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'date') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'hotel') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN hotel VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'main_category') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN main_category VARCHAR(100) NOT NULL DEFAULT 'CAT_002';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'sub_category') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN sub_category VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'room_number') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN room_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'guest_name') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN guest_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'description') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'amount') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN amount DECIMAL(15,4) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'currency') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'TRY';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'exchange_rate') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'total_try') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN total_try DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'created_by') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'created_at') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_hotel_extras' AND column_name = 'updated_at') THEN
        ALTER TABLE project_hotel_extras ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Sütun tiplerini düzeltin
ALTER TABLE project_hotel_extras 
    ALTER COLUMN amount TYPE DECIMAL(15,4),
    ALTER COLUMN exchange_rate TYPE DECIMAL(10,4),
    ALTER COLUMN total_try TYPE DECIMAL(15,2),
    ALTER COLUMN totalTRY TYPE DECIMAL(15,2),
    ALTER COLUMN exchangeRate TYPE DECIMAL(10,4);

-- 5. NOT NULL kısıtlamalarını ekleyin
ALTER TABLE project_hotel_extras 
    ALTER COLUMN date SET NOT NULL,
    ALTER COLUMN hotel SET NOT NULL,
    ALTER COLUMN main_category SET NOT NULL,
    ALTER COLUMN amount SET NOT NULL,
    ALTER COLUMN currency SET NOT NULL,
    ALTER COLUMN total_try SET NOT NULL;

-- 6. Varsayılan değerleri ayarlayın
ALTER TABLE project_hotel_extras 
    ALTER COLUMN amount SET DEFAULT 0,
    ALTER COLUMN currency SET DEFAULT 'TRY',
    ALTER COLUMN exchange_rate SET DEFAULT 1,
    ALTER COLUMN total_try SET DEFAULT 0,
    ALTER COLUMN exchangeRate SET DEFAULT 1,
    ALTER COLUMN totalTRY SET DEFAULT 0;

-- 7. İndeksleri oluşturun
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_project_id ON project_hotel_extras(project_id);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_date ON project_hotel_extras(date);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_hotel ON project_hotel_extras(hotel);
CREATE INDEX IF NOT EXISTS idx_project_hotel_extras_main_category ON project_hotel_extras(main_category);

-- 8. RLS'yi etkinleştirin
ALTER TABLE project_hotel_extras ENABLE ROW LEVEL SECURITY;

-- 9. RLS politikalarını oluşturun (eğer yoksa)
DO $$
BEGIN
    -- View policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_hotel_extras' AND policyname = 'Users can view hotel extras if project member') THEN
        CREATE POLICY "Users can view hotel extras if project member" ON project_hotel_extras
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
            );
    END IF;
    
    -- Insert policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_hotel_extras' AND policyname = 'Users can insert hotel extras if project member') THEN
        CREATE POLICY "Users can insert hotel extras if project member" ON project_hotel_extras
            FOR INSERT WITH CHECK (
                EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
            );
    END IF;
    
    -- Update policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_hotel_extras' AND policyname = 'Users can update hotel extras if project member') THEN
        CREATE POLICY "Users can update hotel extras if project member" ON project_hotel_extras
            FOR UPDATE USING (
                EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
            );
    END IF;
    
    -- Delete policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_hotel_extras' AND policyname = 'Users can delete hotel extras if project member') THEN
        CREATE POLICY "Users can delete hotel extras if project member" ON project_hotel_extras
            FOR DELETE USING (
                EXISTS (SELECT 1 FROM project_users WHERE project_id = project_hotel_extras.project_id AND user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
            );
    END IF;
END $$;

-- 10. Updated_at trigger'ını oluşturun (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_hotel_extras_updated_at ON project_hotel_extras;
CREATE TRIGGER update_project_hotel_extras_updated_at 
    BEFORE UPDATE ON project_hotel_extras 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Son kontrol - tablo yapısını gösterin
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_hotel_extras' 
ORDER BY ordinal_position;

-- 12. Test verisi ekleyin (isteğe bağlı)
INSERT INTO project_hotel_extras (
    project_id, 
    date, 
    hotel, 
    category,
    subCategory,
    sub_category,
    roomNumber,
    room_number,
    guestName,
    guest_name,
    description, 
    amount, 
    currency, 
    mainCategory,
    main_category,
    exchangeRate,
    exchange_rate, 
    totalTRY,
    total_try
) VALUES (
    (SELECT id FROM projects LIMIT 1), -- İlk projeyi al
    CURRENT_DATE,
    'Test Otel',
    'Test Kategori',
    'Test Alt Kategori',
    'Test Alt Kategori',
    '101',
    '101',
    'Test Misafir',
    'Test Misafir',
    'Test açıklama',
    100.50,
    'TRY',
    'CAT_002',
    'CAT_002',
    1.0,
    1.0,
    100.50,
    100.50
) ON CONFLICT DO NOTHING;

-- 13. Test verisini kontrol edin
SELECT * FROM project_hotel_extras ORDER BY created_at DESC LIMIT 5;
