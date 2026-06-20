require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hotels';" });
  if (error) {
    const { data: d2, error: e2 } = await supabase.from('hotels').select('*').limit(1);
    console.log(Object.keys(d2[0]));
  } else {
    console.log(data);
  }
}
test();
