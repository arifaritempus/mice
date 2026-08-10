require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('sejour').select('*').limit(1); // just checking connection
  
  // Actually, we can use a raw sql query via RPC if there's one, or maybe we can fetch some rows from `vw_rp_sejour_kar_zarar` to see what's in it.
  const { data: vwData, error: vwErr } = await supabase.from('vw_rp_sejour_kar_zarar').select('*').limit(3);
  console.log("vw_rp_sejour_kar_zarar rows:", JSON.stringify(vwData, null, 2));
  
  // Let's also check the actual sejour records to compare.
  const { data: sejData, error: sejErr } = await supabase.from('sejour').select('*').limit(3);
  console.log("sejour rows:", JSON.stringify(sejData, null, 2));
}
run();
