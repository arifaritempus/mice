const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const fl = {
                  project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
                  ucus_tipi: "İç Hat",
                  pnr: "123",
                  havayolu: "THY",
                  gidis_tarihi: "2026-05-01",
                  gidis_saati: "10:00",
                  gidis_ucus_kodu: "TK123",
                  guzergah: "IST-ANK",
                  tedarikci: "Test",
                  misafirler: "Test User",
                  kisi_sayisi: 1,
                  doviz: "EUR"
    };
    const { error: fErr } = await supabase.from('project_flight_tickets').insert(fl);
    console.log("Flight Error:", fErr);
}
run();
