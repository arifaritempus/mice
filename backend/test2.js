require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  try {
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
      `, { count: 'exact' }).limit(10);
      
    if(error) console.error("Query error:", error);
    else console.log("Success! Data length:", data?.length);
  } catch(e) {
    console.error("Exception:", e);
  }
}
test();
