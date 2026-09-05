require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: reqs } = await supabase.from('mice_requests').select('id, reference, status, company_name').in('reference', ['TMI260814001', 'TMI260814002']);
  console.log("Requests:");
  console.table(reqs);
  
  const { data: quotes } = await supabase.from('quotes').select('id, reference, status, company_name').in('reference', ['TMI260814001', 'TMI260814002']);
  console.log("Quotes:");
  console.table(quotes);
}
run();
