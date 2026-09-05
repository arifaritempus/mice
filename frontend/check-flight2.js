const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { error: fErr } = await supabase.from('project_flight_tickets').insert({donus_ucus_kodu: "123"});
    console.log("Donus ucus kodu:", fErr?.message);
}
run();
