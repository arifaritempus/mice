const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, count, error } = await supabase.from('projects').select('id', { count: 'exact' });
  console.log("Error:", error);
  console.log("Count:", count);
}

run();
