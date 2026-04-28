const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment değişkenleri:');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '***' + supabaseKey.slice(-4) : 'undefined');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '***' + supabaseServiceKey.slice(-4) : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL ve SUPABASE_ANON_KEY environment değişkenleri gerekli');
}

// Anon client (RLS kurallarına tabidir)
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client (RLS'i bypass eder - Sadece gerekli yerlerde kullanın)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (!supabaseAdmin) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY tanımlanmamış. Admin işlemleri çalışmayabilir.');
}

// Veritabanı bağlantısını test et
const testConnection = async () => {
  try {
    console.log('🔍 Veritabanı bağlantısı test ediliyor...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Veritabanı bağlantı hatası:', error);
      return false;
    }
    console.log('✅ Veritabanı bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('❌ Veritabanı bağlantı testi başarısız:', error);
    return false;
  }
};

// Veritabanı migration'ları çalıştır
const runMigrations = async () => {
  try {
    console.log('🔄 Veritabanı migration\'ları kontrol ediliyor...');
    
    // Ana tabloların varlığını kontrol et
    const tables = [
      'users', 'companies', 'events', 'categories', 'event_tickets',
      'registrations', 'projects', 'project_tasks', 'budget_items',
      'vendors', 'financial_transactions', 'customers', 'customer_interactions',
      'team_members', 'goals', 'reviews', 'notifications', 'report_schedules',
      'file_attachments', 'audit_log'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === '42P01') { // Table doesn't exist
        console.log(`⚠️  Tablo '${table}' bulunamadı. Migration gerekli.`);
      }
    }

    console.log('✅ Veritabanı yapısı kontrol edildi');
  } catch (error) {
    console.error('Migration kontrolü başarısız:', error);
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  runMigrations
}; 