const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const tRow = {
        id: `transfer-123-gidis`,
        project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
        direction: "Geliş",
        type_label: "Özel",
        transfer_type: "VIP",
        route: "Havalimanı-Otel",
        vehicle_type: "VIP",
        flight_code: null,
        supplier_name: "Tedarikci",
        date: "2026-05-05",
        time: "10:00",
        passengers: ["Ahmet Yılmaz"],
    };
    const { error: e2 } = await supabase.from('project_transfer_tour').insert(tRow);
    console.log("project_transfer_tour error:", e2?.message, e2);
}
run();
