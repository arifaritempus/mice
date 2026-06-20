require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hotels' AND column_name = 'accounting_link_codes';" });
  if (error) {
    console.log(error);
  } else {
    console.log(data);
  }
}
test();
