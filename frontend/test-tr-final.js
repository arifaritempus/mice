const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const pId = "123e4567-e89b-12d3-a456-426614174000";
    const tr = {
                  project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
                  participant_id: pId,
                  direction: "arrival",
                  type_label: "Özel",
                  transfer_type: "VIP",
                  route: "IST-HOTEL",
                  vehicle_type: "VIP",
                  flight_code: "TK123",
                  supplier_name: "Test Supplier",
                  date: "2026-05-01",
                  time: "10:00",
                  passengers: ["Test User"]
    };
    const { error: tErr } = await supabase.from('project_transfer_tour').insert(tr);
    console.log("Transfer Error:", tErr);
}
run();
