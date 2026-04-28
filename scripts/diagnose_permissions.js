
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Hata: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
  console.log('--- Veritabanı Teşhisi Başlatılıyor ---');

  const tables = ['users', 'roles', 'permissions', 'role_permissions'];
  
  for (const table of tables) {
    console.log(`\n[${table}] Tablosu Kontrol Ediliyor...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`  Hata: ${error.message}`);
      if (error.message.includes('not found')) {
        console.log(`  🔍 Tablo mevcut değil.`);
      }
    } else {
      console.log(`  ✅ Tablo mevcut. Kayıt sayısı: (En az 1 var veya boş)`);
      if (data && data.length > 0) {
        console.log(`  Sütunlar: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log('  🔍 Tablo boş, sütunlar belirlenemedi.');
        // Try to get columns via a more complex query if needed, 
        // but for now let's hope it's not empty if they say they "defined roles".
      }
    }
  }

  console.log('\n--- Kritik Verilerin Kontrolü ---');
  
  const { data: roles } = await supabase.from('roles').select('id, name');
  console.log('Mevcut Roller:', roles);

  const { data: arif } = await supabase.from('users').select('email, role').eq('email', 'arif.ari@tempustravel.co').maybeSingle();
  console.log('Arif kullanıcısının rolü:', arif);

  if (arif && roles) {
    const roleMatch = roles.find(r => r.id === arif.role || r.name === arif.role || 
      String(r.id).toLowerCase() === String(arif.role).toLowerCase() ||
      String(r.name).toLowerCase() === String(arif.role).toLowerCase());
    
    if (roleMatch) {
      console.log(`✅ Eşleşen Rol Bulundu: ${roleMatch.name} (ID: ${roleMatch.id})`);
      
      const { data: perms } = await supabase.from('role_permissions')
        .select('permission_id, permissions(module, action)')
        .eq('role_id', roleMatch.id);
      
      console.log(`Verilen Yetki Sayısı: ${perms?.length || 0}`);
      if (perms && perms.length > 0) {
        console.log('Örnek Yetkiler:', perms.slice(0, 5).map(p => `${p.permissions?.module}:${p.permissions?.action}`));
      }
    } else {
      console.log('❌ Kullanıcının rolü mevcut rollerle eşleşmiyor!');
    }
  }
}

diagnose();
