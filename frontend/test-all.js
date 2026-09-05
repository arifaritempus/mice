const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const projectId = "135b9972-d50e-4c2d-8007-4e3363f1c634";

    // Insert dummy participant
    const { data: pData, error: pErr } = await supabase.from('project_participants').insert({
        project_id: projectId,
        first_name: "Test",
        last_name: "User",
        tc_passport: "123",
        email: "test@test.com",
        phone: "123",
        registration_type: "Delege",
        notes: "Test"
    }).select().single();
    
    if (pErr) { console.error("Part Err:", pErr); return; }
    
    const pId = pData.id;
    console.log("Created participant:", pId);
    
    // Test Accommodations
    const acc = {
            project_id: projectId,
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
    console.log("Acc Error:", aErr?.message || "Success");
    
    // Test Transfers
    const tr = {
                  project_id: projectId,
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
    console.log("Transfer Error:", tErr?.message || "Success");
    
    // Test Flights
    const fl = {
                  project_id: projectId,
                  ucus_tipi: "İç Hat",
                  pnr: "PNR123",
                  havayolu: "THY",
                  gidis_tarihi: "2026-05-01",
                  gidis_saati: "10:00",
                  gidis_ucus_kodu: "TK123",
                  guzergah: "IST-ANK",
                  tedarikci: "Test Supplier",
                  misafirler: "Test User",
                  kisi_sayisi: 1,
                  doviz: "EUR"
    };
    
    const { error: fErr } = await supabase.from('project_flight_tickets').insert(fl);
    console.log("Flight Error:", fErr?.message || "Success");
    
    // Cleanup
    await supabase.from('project_participants').delete().eq('id', pId);
}
run();
