const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // use service role

async function check() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Keys:", data);
}
check();
