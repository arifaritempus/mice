
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Testing project_flight_tickets query...');
  const { data, error } = await s
    .from('project_flight_tickets')
    .select(`
      id,
      project_id,
      biletleme_tarihi,
      tedarikci,
      pnr,
      havayolu,
      guzergah,
      gidis_tarihi,
      gidis_saati,
      gidis_ucus_kodu,
      donus_tarihi,
      donus_saati,
      toplam_maliyet,
      pp_maliyet,
      doviz,
      misafirler,
      created_at
    `, { count: 'exact' })
    .limit(1);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success! Data count:', data?.length);
  }
}

check();
