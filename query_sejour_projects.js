require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('projects').select('id, title, quote_type, total_budget').eq('quote_type', 'SEJOUR');
  console.log("SEJOUR projects:", data);
}
run();
