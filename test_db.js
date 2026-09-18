const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('frontend/.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/); // Use service role to query pg_policies
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    // try direct query if rpc doesn't exist
    const { data: q, error: e } = await supabase.from('pg_policies').select('*').limit(5);
    console.log("pg_policies query:", q, e);
  } else {
    console.log("Policies:", data);
  }
}
run();
