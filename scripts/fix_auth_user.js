
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Hata: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY eksik.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUser(email, password) {
  console.log(`Kullanıcı kontrol ediliyor: ${email}`);
  
  // 1. Kullanıcıyı bul
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Kullanıcı listesi alınamadı:', listError.message);
    return;
  }
  
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    console.log(`Kullanıcı bulundu (ID: ${existingUser.id}), güncelleniyor...`);
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { 
        password: password,
        email_confirm: true 
      }
    );
    
    if (updateError) {
      console.error('Güncelleme hatası:', updateError.message);
    } else {
      console.log('✅ Kullanıcı başarıyla güncellendi (şifre sıfırlandı ve doğrulandı).');
    }
  } else {
    console.log('Kullanıcı bulunamadı, yeni oluşturuluyor...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    
    if (createError) {
      console.error('Oluşturma hatası:', createError.message);
    } else {
      console.log('✅ Yeni kullanıcı başarıyla oluşturuldu.');
    }
  }
}

const email = 'arif.ari@tempustravel.co';
const password = '123456';

fixUser(email, password).then(() => {
  console.log('İşlem tamamlandı.');
});
