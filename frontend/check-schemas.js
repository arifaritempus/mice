const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    let p = {};
    p["pnr"] = null;
    const { error: e1 } = await supabase.from('project_flight_tickets').insert(p);
    console.log("project_flight_tickets columns error:", e1?.message);

    let t = {};
    t["type_label"] = null;
    const { error: e2 } = await supabase.from('project_transfer_tour').insert(t);
    console.log("project_transfer_tour columns error:", e2?.message);
}
run();
