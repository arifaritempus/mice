const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const payload = {
    hotel_id: null,
    project_id: "c7eb8e17-d6e5-42ee-8d20-122fd0601e09",
    biletleme_tarihi: "2026-06-27",
    tedarikci: "Test",
    havayolu: "Test",
    pnr: "123",
    ucus_tipi: "tek-yon",
    gidis_tarihi: "2026-06-27",
    gidis_saati: "10:00",
    gidis_ucus_kodu: "123",
    donus_tarihi: null,
    donus_saati: null,
    donus_ucus_kodu: null,
    guzergah: "Test",
    kisi_sayisi: 1,
    pp_maliyet: 1,
    toplam_maliyet: 1,
    doviz: "TRY",
    kur: 1,
    toplam_tl: 1,
    satis_pax: 1,
    pp_satis: 1,
    toplam_satis: 1,
    satis_doviz: "TRY",
    satis_kur: 1,
    toplam_satis_tl: 1,
    misafirler: "Test",
    durum: "aktif"
  };

  const { data, error } = await supabase
    .from('project_flight_tickets')
    .insert([payload]);
    
  if (error) {
    console.error("Supabase Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Record inserted.");
    // delete it
  }
}

test();
