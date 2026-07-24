const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hezkngmwcdcleqfmfiwu.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const quote = {
    reference: `TEST-COPY`,
    agency_id: '1e1948ec-f236-4076-afab-63f25dcd889b', // Replace with a valid UUID if needed, but let's see if it's a foreign key error
    company_name: 'test',
    check_in_date: '2026-07-20',
    check_out_date: '2026-07-23',
    hotel_id: '2cf5b800-ec89-40b9-aa32-00108db284b3', // Replace with valid UUID
    hotel_concept: '',
    room_count: 0,
    pax_count: 0,
    option: '1. OPSİYON',
    option_date: null,
    status: 'TEKLİF',
    quote_type: 'BİRİM',
    operation_managers: [],
    notes: '',
    total_amount: 0
  };
  const { data, error } = await supabase.from('quotes').insert([quote]).select().single();
  if (error) console.error(JSON.stringify(error, null, 2));
  else console.log("SUCCESS");
}
test();
