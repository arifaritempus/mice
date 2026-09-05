const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const pId = "123e4567-e89b-12d3-a456-426614174000"; // Dummy UUID
    const acc = {
            project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
            participant_id: pId,
            hotel_id: null,
            first_name: "Test",
            last_name: "User",
            room_type: "Single",
            room_number: "101",
            nights: 2,
            check_in_date: "2026-05-01",
            check_out_date: "2026-05-03",
            package: "Single", 
            flight: "IST-ANK",
            total: 100,
            currency: "EUR",
            room_note: "",
            arrival_flight_code: "TK123",
            arrival_flight_departure: "10:00",
            arrival_flight_arrival: "",
            return_flight_code: "TK124",
            return_flight_departure: "15:00",
            return_flight_arrival: "",
    };
    const { error: aErr } = await supabase.from('project_accommodation_items').insert(acc);
    console.log("Acc Error:", aErr);
}
run();
