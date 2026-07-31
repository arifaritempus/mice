require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('sejour_transfers').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data columns:", data && data.length ? Object.keys(data[0]) : "No data");
}
test();
