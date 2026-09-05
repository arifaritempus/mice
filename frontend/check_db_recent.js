require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: reqs } = await supabase.from('mice_requests').select('id, reference, status, company_name').order('created_at', {ascending: false}).limit(10);
  console.log("Recent Requests:");
  console.table(reqs);
}
run();
