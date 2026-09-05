const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    // 1. Flight
    const payloadF = {
        project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
        ucus_tipi: "İç Hat",
        pnr: null,
        havayolu: null,
        gidis_tarihi: null,
        gidis_saati: null,
        gidis_ucus_kodu: null,
        guzergah: null,
        tedarikci: null,
        misafirler: "Ahmet",
        kisi_sayisi: 1,
        doviz: "EUR",
        donus_tarihi: null,
        donus_saati: null,
        donus_ucus_kodu: null
    };
    const { error: fErr } = await supabase.from('project_flight_tickets').insert(payloadF);
    console.log("Flight Error:", fErr);

    // 2. Transfer
    const payloadT = {
        project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
        transfer_tarihi: null,
        transfer_saati: null,
        is_group: false,
        transfer_tipi: null,
        guzergah: null,
        arac_tipi: null,
        tedarikci: null,
        kisi_sayisi: 1,
        doviz: "EUR",
        misafirler: "Ahmet"
    };
    const { error: tErr } = await supabase.from('project_transfer_tour').insert(payloadT);
    console.log("Transfer Error:", tErr);

    // 3. Accommodation
    const payloadA = {
        project_id: "135b9972-d50e-4c2d-8007-4e3363f1c634",
        hotel_id: null,
        person_name: "Ahmet",
        room_type: "",
        accommodation_type: "",
        room_number: "",
        nights: 0,
        check_in: "",
        check_out: "",
        transfer: "",
        flight: "",
        total: 0,
        currency: "EUR",
        room_note: "",
        arrival_flight_code: "",
        arrival_flight_departure: "",
        arrival_flight_arrival: "",
        return_flight_code: "",
        return_flight_departure: "",
        return_flight_arrival: ""
    };
    const { error: aErr } = await supabase.from('project_accommodation_items').insert(payloadA);
    console.log("Accommodation Error:", aErr);
}
run();
