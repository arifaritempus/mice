const fs = require('fs');

const files = [
    'supabase-schema-complete.sql',
    'setup-permissions-system-fixed.sql',
    'events-activities-schema.sql',
    'marketing_schema.sql',
    'hotel-extra-schema.sql'
];

let combined = '-- EVENT X SUPABASE KURULUM DOSYASI\n\n';

for (const file of files) {
    if (fs.existsSync(file)) {
        combined += `-- ==========================================\n`;
        combined += `-- DOSYA: ${file}\n`;
        combined += `-- ==========================================\n\n`;
        
        let content = fs.readFileSync(file, 'utf8');
        
        if (file === 'setup-permissions-system-fixed.sql') {
            combined += `DROP TABLE IF EXISTS role_permissions CASCADE;\n`;
            combined += `DROP TABLE IF EXISTS roles CASCADE;\n`;
            combined += `DROP TABLE IF EXISTS permissions CASCADE;\n\n`;
            
            // Remove the DELETE FROM duplicate blocks which crash if tables don't exist
            content = content.replace(/DELETE FROM permissions p1[\s\S]*?\);/g, '-- Cleaned duplicate block for permissions');
            content = content.replace(/DELETE FROM roles r1[\s\S]*?\);/g, '-- Cleaned duplicate block for roles');
            content = content.replace(/DELETE FROM role_permissions rp1[\s\S]*?\);/g, '-- Cleaned duplicate block for role_permissions');
        }
        
        combined += content + '\n\n';
    }
}

fs.writeFileSync('EVENT_X_KURULUM.sql', combined);
console.log('EVENT_X_KURULUM.sql dosyasi basariyla olusturuldu!');
