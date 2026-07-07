const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('project_flight_tickets')
    .select('ucus_tipi')
    .limit(5);
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("ucus_tipi values:", data);
  }
}

check();
