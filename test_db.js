const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'frontend/.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('settings').select('*');
  console.log(JSON.stringify(data, null, 2));
}
run();
