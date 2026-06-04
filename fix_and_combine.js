const fs = require('fs');

const files = [
    // 1. Temel tablolar
    'supabase-migration-safe.sql',
    
    // 2. Modül tabloları
    'create-project-flight-tickets-final.sql',
    'create-ticket-options-table.sql',
    'create-ticket-payments-tables.sql',
    'supabase-odeme-tables.sql',
    'supabase-tahsilat-tables.sql',
    'flight-tickets-schema.sql',
    'project-transfer-tour-fixed-schema.sql',
    'human-resources-schema.sql',
    
    // 3. Görünümler (Raporlar)
    'supabase-vw-rp-sejour-kar-zarar.sql',
    'supabase-vw-rp-proje-satis-maliyet.sql',
    'supabase-vw-rp-otel-detay-proje-maliyet.sql',
    'fix-otel-detay-teklif-view.sql',
    'fix-otel-detay-maliyet-view.sql',
    
    // 4. Veriler
    'categories-real-data.sql',
    'EVENT_X_KURULUM.sql'
];

let combined = '-- COOP (MICE) TUM SISTEM KURULUMU\n\n';

// Proje tablosu için kritik eksik sütunları ekleyelim (Eğer önceden tablo açılıp sütunlar unutulduysa patlamasın diye)
combined += `
-- ==========================================
-- BÖLÜM 0: EKSİK SÜTUN ONARIMLARI
-- ==========================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by UUID;
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
        ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hotels_data JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS hotels_data JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
    END IF;
END $$;
\n\n`;

for (const file of files) {
    if (fs.existsSync(file)) {
        combined += `\n\n-- ==========================================\n`;
        combined += `-- BÖLÜM: ${file}\n`;
        combined += `-- ==========================================\n\n`;
        combined += fs.readFileSync(file, 'utf8');
    } else {
        console.warn(`Bulunamadı: ${file}`);
    }
}

fs.writeFileSync('COOP_TUM_SISTEM_KURULUM.sql', combined);
console.log('COOP_TUM_SISTEM_KURULUM.sql başarıyla oluşturuldu!');
