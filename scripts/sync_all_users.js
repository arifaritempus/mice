
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Hata: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function syncAllUsers() {
  console.log('--- Tüm Kullanıcıları Senkronize Etme İşlemi Başlıyor (fix: password_hash bypass) ---');

  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Auth users alınamadı:', authErr.message);
    return;
  }

  const authUsers = authData.users;

  for (const au of authUsers) {
    console.log(`İşleniyor: ${au.email} (ID: ${au.id})`);
    
    const fullName = au.raw_user_meta_data?.full_name || 
                     (au.raw_user_meta_data?.first_name ? `${au.raw_user_meta_data.first_name} ${au.raw_user_meta_data.last_name || ''}` : au.email.split('@')[0]);

    // Upsert into public.users
    const { error: upsertErr } = await supabase
      .from('users')
      .upsert({
        id: au.id,
        email: au.email,
        full_name: fullName.trim(),
        password_hash: 'SUPABASE_AUTH_MANAGED', // Bypass not-null constraint
        role: (au.email === 'arif.ari@tempustravel.co' ? 'super_admin' : 'user'),
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (upsertErr) {
      console.error(`  Hata (${au.email}):`, upsertErr.message);
    } else {
      console.log(`  ✅ Başarıyla senkronize edildi.`);
    }
  }

  console.log('\n--- Senkronizasyon Tamamlandı ---');
}

syncAllUsers();
