
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSync() {
  console.log('--- Auth.users ve Public.users Senkronizasyon Kontrolü ---');

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth users listelenemedi:', authError.message);
    return;
  }

  const { data: publicUsers, error: pubError } = await supabase.from('users').select('id, email, role');
  if (pubError) {
    console.error('Public users listelenemedi:', pubError.message);
    return;
  }

  console.log(`Auth.users sayısı: ${authUsers.users.length}`);
  console.log(`Public.users sayısı: ${publicUsers.length}`);

  console.log('\n--- Detaylı Karşılaştırma ---');
  for (const au of authUsers.users) {
    const pu = publicUsers.find(u => u.id === au.id);
    if (pu) {
      console.log(`✅ [UYUMLU] Email: ${au.email}, Role: ${pu.role}`);
    } else {
      const emailMatch = publicUsers.find(u => u.email === au.email);
      if (emailMatch) {
         console.log(`⚠️ [HATA] Email eşleşiyor ama ID FARKLI! Auth ID: ${au.id}, Public ID: ${emailMatch.id} (Email: ${au.email})`);
      } else {
         console.log(`❌ [EKSİK] Auth kullanıcısı Public.users'da yok: ${au.email} (ID: ${au.id})`);
      }
    }
  }

  for (const pu of publicUsers) {
    if (!authUsers.users.find(au => au.id === pu.id)) {
      console.log(`🔍 [YETİM] Public kullanıcısı Auth'da yok: ${pu.email} (ID: ${pu.id})`);
    }
  }
}

checkSync();
