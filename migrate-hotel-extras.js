const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase bağlantı bilgileri
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzdfdnfkyedwnameflso.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// localStorage verilerini oku
function readLocalStorageData() {
  const data = {};
  
  // Proje ID'lerini bul (örnek: project_hotel_extras_123)
  const localStorageKeys = Object.keys(localStorage || {});
  const hotelExtraKeys = localStorageKeys.filter(key => key.startsWith('project_hotel_extras_'));
  
  hotelExtraKeys.forEach(key => {
    const projectId = key.replace('project_hotel_extras_', '');
    const hotelExtras = JSON.parse(localStorage.getItem(key) || '[]');
    data[projectId] = hotelExtras;
  });
  
  return data;
}

// Supabase'e veri gönder
async function migrateHotelExtras() {
  try {
    console.log('Otel ekstra verileri migrate ediliyor...');
    
    // localStorage verilerini oku
    const hotelExtrasData = readLocalStorageData();
    
    let totalMigrated = 0;
    let totalErrors = 0;
    
    for (const [projectId, hotelExtras] of Object.entries(hotelExtrasData)) {
      console.log(`Proje ${projectId} için ${hotelExtras.length} otel ekstra verisi bulundu`);
      
      for (const extra of hotelExtras) {
        try {
          // Veriyi Supabase formatına dönüştür
          const supabaseData = {
            project_id: projectId,
            date: extra.date || new Date().toISOString().split('T')[0],
            hotel: extra.hotel || '',
            main_category: extra.mainCategory || extra.main_category || 'CAT_002',
            sub_category: extra.subCategory || extra.sub_category || '',
            room_number: extra.roomNumber || extra.room_number || '',
            guest_name: extra.guestName || extra.guest_name || '',
            description: extra.description || '',
            amount: parseFloat(extra.amount) || 0,
            currency: extra.currency || 'TRY',
            exchange_rate: parseFloat(extra.exchangeRate || extra.exchange_rate) || 1,
            total_try: parseFloat(extra.totalTRY || extra.total_try) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Supabase'e ekle
          const { data, error } = await supabase
            .from('project_hotel_extras')
            .insert([supabaseData])
            .select();
          
          if (error) {
            console.error(`Hata (Proje ${projectId}, ID ${extra.id}):`, error);
            totalErrors++;
          } else {
            console.log(`✓ Başarıyla eklendi: ${extra.hotel || 'Bilinmeyen'}`);
            totalMigrated++;
          }
          
        } catch (error) {
          console.error(`Veri işleme hatası (Proje ${projectId}, ID ${extra.id}):`, error);
          totalErrors++;
        }
      }
    }
    
    console.log(`\nMigrate tamamlandı!`);
    console.log(`Toplam başarılı: ${totalMigrated}`);
    console.log(`Toplam hata: ${totalErrors}`);
    
  } catch (error) {
    console.error('Migrate işlemi başarısız:', error);
  }
}

// Eğer Node.js ortamında çalışıyorsa
if (typeof window === 'undefined') {
  migrateHotelExtras();
}

// Browser ortamında çalıştırmak için
if (typeof window !== 'undefined') {
  window.migrateHotelExtras = migrateHotelExtras;
}
