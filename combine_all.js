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
