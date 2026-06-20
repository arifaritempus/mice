require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('project_purchase_items').select('*').limit(1);
  console.log("purchase columns:", data && data[0] ? Object.keys(data[0]) : "no data", error);
  const { data: d2 } = await supabase.from('project_sales_items').select('*').limit(1);
  console.log("sales columns:", d2 && d2[0] ? Object.keys(d2[0]) : "no data");
}
check();
