const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    // Array of objects with DIFFERENT keys
    const items = [
      {
         project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
         ucus_tipi: "İç Hat",
         gidis_tarihi: "2026-05-05"
      },
      {
         project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
         ucus_tipi: "İç Hat",
         donus_tarihi: "2026-05-10"
      }
    ];
    const { error: fErr } = await supabase.from('project_flight_tickets').insert(items);
    console.log("Error:", fErr);
}
run();
