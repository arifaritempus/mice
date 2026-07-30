const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('frontend/.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('hotels').select('*').limit(1);
  if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
  }
}
run();
