require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_view_ddl', { view_name: 'vw_rp_sejour_kar_zarar' });
  if (error) console.log("RPC failed, trying raw query...", error);
  else console.log(data);
}
run();
