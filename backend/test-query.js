
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Testing sejour_flights query...');
  const { data, error } = await s
    .from('sejour_flights')
    .select(`
      id,
      sejour_id,
      flight_date,
      airline,
      flight_number,
      departure_time,
      arrival_time,
      departure_airport,
      arrival_airport,
      ticketing_provider,
      ticketing_date,
      pnr,
      total_price,
      currency,
      cost_price,
      cost_currency,
      created_at,
      sejours!inner(
        id,
        voucher_number,
        customer_name,
        check_in_date,
        check_out_date,
        created_at,
        agencies(name),
        sejour_rooms(guest_info)
      )
    `)
    .limit(1);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query Success! Data count:', data.length);
    if (data.length > 0) {
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    }
  }
}

check();
