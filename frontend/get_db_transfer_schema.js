const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
async function test() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  const { data, error } = await supabase.from('project_transfer_tour').select('*').limit(1);
  console.log("Transfer cols:", data && data.length > 0 ? Object.keys(data[0]) : error || "Empty");
}
test();
