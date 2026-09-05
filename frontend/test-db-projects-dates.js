const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('projects').select('id, title, start_date, end_date').order('created_at', { ascending: false }).limit(20);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
