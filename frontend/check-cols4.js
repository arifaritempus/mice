const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('project_transfer_tour').select('*').limit(1);
    console.log("Transfer cols:", data ? Object.keys(data[0]) : error);

    const { data: aData, error: aErr } = await supabase.from('project_accommodation_items').select('*').limit(1);
    console.log("Acc cols:", aData ? Object.keys(aData[0]) : aErr);
    
    const { data: fData, error: fErr } = await supabase.from('project_flight_tickets').select('*').limit(1);
    console.log("Flight cols:", fData ? Object.keys(fData[0]) : fErr);
}
run();
