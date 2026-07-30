const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from("mice_request_hotels").select("*").eq("request_id", "199066b4-3bc4-41da-89b6-682b121ae2fc");
  console.log("Rows count:", data ? data.length : 0);
}
run();
