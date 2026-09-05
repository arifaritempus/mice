require('dotenv').config({path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: reqs } = await supabase.from('mice_requests').select('id, reference, status, company_name');
  console.log("All Mice Requests:");
  console.table(reqs);
  
  const { data: quotes } = await supabase.from('quotes').select('id, reference, status, company_name');
  console.log("All Quotes:");
  console.table(quotes);
}
run();
