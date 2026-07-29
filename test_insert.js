const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      reference: "TEST-123",
      quote_number: "TEST-123",
      agency_id: "00000000-0000-0000-0000-000000000000",
      company_name: "TEST",
      check_in_date: "2026-01-01",
      check_out_date: "2026-01-02",
      hotel_id: "00000000-0000-0000-0000-000000000000",
      hotel_concept: "",
      room_count: 0,
      pax_count: 0,
      option: "",
      option_date: null,
      status: "TEKLİF",
      quote_type: "BİRİM",
      operation_managers: [],
      notes: "",
      total_amount: 0,
      currency: "EUR"
    });
    
  console.log("Error:", error);
}

test();
