const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('project_flight_tickets')
    .select('id, pnr, ucus_tipi')
    .eq('project_id', 'c7eb8e17-d6e5-42ee-8d20-122fd0601e09');
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Record:", data);
  }
}

check();
