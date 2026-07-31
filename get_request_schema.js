require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: rData, error: rErr } = await supabase.from('mice_requests').select('date_type, date_details').eq('date_type', 'EXACT').limit(1);
  console.log("Req error:", rErr);
  console.log("Req data exact:", JSON.stringify(rData, null, 2));
}
test();
