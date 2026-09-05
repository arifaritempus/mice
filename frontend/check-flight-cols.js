const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const colsF = ["id", "project_id", "flight_type", "flight_class", "pnr", "airline", "departure_date", "departure_time", "flight_code", "route", "supplier_name", "passengers"];
    for (const c of colsF) {
       const p = {}; p[c] = null;
       const { error } = await supabase.from('project_flight_tickets').insert(p);
       if (error && error.code !== '42501' && error.code !== '23502') console.log("Flight:", c, error.message);
    }

    const colsT = ["id", "project_id", "direction", "type_label", "transfer_type", "route", "vehicle_type", "flight_code", "supplier_name", "date", "time", "passengers"];
    for (const c of colsT) {
       const p = {}; p[c] = null;
       const { error } = await supabase.from('project_transfer_tour').insert(p);
       if (error && error.code !== '42501' && error.code !== '23502') console.log("Transfer:", c, error.message);
    }
}
run();
