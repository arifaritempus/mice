const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const isGuide = (...values) => {
  return values.some(value => {
    if (!value) return false;
    const text = String(value).toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
    return (text.includes('kokart') || text.includes('rehber') || text.includes('guide'));
  });
};

async function test() {
  try {
    const { data: sejourExtras, error: sejourError } = await client
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
      
    if(sejourError) {
       console.error("sejourError:", sejourError);
       return;
    }
    
    console.log("sejourExtras length:", sejourExtras.length);

    const merged = [
      ...(sejourExtras || [])
        .filter((row) => {
           console.log("filtering row", row.id);
           return isGuide(row.service_types?.name, row.service_description);
        })
        .map((row) => ({ id: row.id }))
    ];
    console.log("Success! Merged length:", merged.length);
  } catch(e) {
    console.error("Exception:", e);
  }
}
test();
