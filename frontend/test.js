require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('mice_requests').update({status: 'CEVAPLANDI'}).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Update mock result:", data, error);
}
run();
