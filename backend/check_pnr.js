const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('project_flight_tickets')
    .select('pnr, ucus_tipi')
    .eq('pnr', 'YHNMJU');
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Record:", data);
  }
}

check();
