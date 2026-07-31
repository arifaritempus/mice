require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log("Testing sejour_transfers query...");
  const sejourQuery = supabase
      .from('sejour_transfers')
      .select(`
        id,
        sejour_id,
        supplier_id,
        transfer_type,
        vehicle_type,
        date,
        time,
        price,
        currency,
        created_at,
        updated_at,
        direction,
        suppliers(name),
        sejours!inner(
          id,
          voucher_number,
          customer_name,
          check_in_date,
          check_out_date,
          status,
          created_at,
          agencies(name),
          hotels(name)
        )
      `, { count: 'exact' })
      .eq('sejours.status', 'KONFIRME')
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, 19);

  const { data, error } = await sejourQuery;
  console.log("Sejour Error:", error);
  console.log("Sejour Data length:", data ? data.length : 0);

  console.log("\nTesting project_transfer_tour query...");
  const projectQuery = supabase
      .from('project_transfer_tour')
      .select(`
        id,
        project_id,
        supplier_id,
        supplier_name,
        transfer_type,
        vehicle_type,
        date,
        time,
        route,
        direction,
        flight_code,
        passenger_count,
        passengers,
        cost_amount,
        currency,
        created_at,
        updated_at,
        suppliers(name)
      `, { count: 'exact' })
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(0, 19);

  const { data: pData, error: pError } = await projectQuery;
  console.log("Project Error:", pError);
  console.log("Project Data length:", pData ? pData.length : 0);
}
test();
