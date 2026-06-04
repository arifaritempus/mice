const fs = require('fs');

const files = [
    'sejour-supabase-schema.sql',
    'create-project-flight-tickets-final.sql',
    'create-ticket-options-table.sql',
    'create-ticket-payments-tables.sql',
    'supabase-odeme-tables.sql',
    'supabase-tahsilat-tables.sql',
    'flight-tickets-schema.sql',
    'project-transfer-tour-fixed-schema.sql',
    'human-resources-schema.sql',
    'supabase-vw-rp-otel-detay-proje-maliyet.sql',
    'supabase-vw-rp-proje-satis-maliyet.sql',
    'supabase-vw-rp-sejour-kar-zarar.sql',
    'fix-otel-detay-teklif-view.sql',
    'fix-otel-detay-maliyet-view.sql',
    'categories-real-data.sql'
];

let combined = '-- EKSIK TABLOLAR VE GORUNUMLER\n\n';

for (const file of files) {
    if (fs.existsSync(file)) {
        combined += `\n\n-- ==========================================\n`;
        combined += `-- FILE: ${file}\n`;
        combined += `-- ==========================================\n\n`;
        combined += fs.readFileSync(file, 'utf8');
    } else {
        console.warn(`File not found: ${file}`);
    }
}

fs.writeFileSync('EKSIKLER_KURULUM.sql', combined);
console.log('Created EKSIKLER_KURULUM.sql');
