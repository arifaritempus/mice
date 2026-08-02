const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await client
    .from('sejour_extra_services')
    .select(`
        id,
        sejour_id,
        service_type_id,
        supplier_id,
        service_description,
        price,
        currency,
        cost_price,
        cost_currency,
        created_at,
        suppliers(name),
        service_types(name),
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          agencies(name),
          hotels(name)
        )
      `, { count: 'exact' })
      .eq('sejours.status', 'KONFIRME')
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, 19);
  
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data.length);
  }
}
run();
