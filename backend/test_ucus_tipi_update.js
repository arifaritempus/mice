const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('project_flight_tickets')
    .update({ ucus_tipi: 'GRUP' })
    .eq('pnr', 'QWERTY');
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Success updating to GRUP");
  }
}

test();
