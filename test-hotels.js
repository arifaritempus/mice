require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('hotels').select('*').limit(1);
  console.log(error ? 'Error: ' + error.message : 'Data: ' + JSON.stringify(data));
}
test();
