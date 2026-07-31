const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('permissions').select('*');
  console.log("Total permissions:", data?.length);
  console.log("Requests permissions:", data?.filter(p => p.module === 'requests'));
  console.log("Quotes permissions:", data?.filter(p => p.module === 'quotes'));
}
run();
