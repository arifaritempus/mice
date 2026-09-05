const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  let query = supabase.from('projects').select('id, title, start_date, end_date');
  
  const dateStart = '2026-08-02';
  const dateEnd = '2026-08-02';
  
  query = query.or(`end_date.gte.${dateStart},start_date.gte.${dateStart}`);
  query = query.lte('start_date', `${dateEnd}T23:59:59`);
  
  const { data, error } = await query;
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
