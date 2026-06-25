const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: views } = await supabase.from('vw_rp_proje_satis_maliyet').select('*').limit(3);
  console.log("vw_rp_proje_satis_maliyet:", views);
  
  const { data: cats } = await supabase.from('categories').select('*').ilike('name', '%uçak%').limit(5);
  console.log("Uçak categories:", cats);

  const { data: sales } = await supabase.from('project_sales_items').select('*').limit(3);
  console.log("Sales items:", sales);
  
  const { data: mkt } = await supabase.from('marketing_interactions').select('*').limit(3);
  console.log("Marketing interactions:", mkt);

  const { data: qts } = await supabase.from('quotes').select('*').limit(3);
  console.log("Quotes:", qts);
}
run();
