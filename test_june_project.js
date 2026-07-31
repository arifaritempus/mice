require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: pData, error: pErr } = await supabase.from('projects').select('*').eq('reference', 'TMI260608001');
  console.log("Projects:", pData);
}
test();
