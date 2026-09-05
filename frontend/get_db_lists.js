const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
async function test() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  
  const { data: cData } = await supabase.from('companies').select('id, name, type');
  console.log("Companies:", cData ? cData.slice(0, 5) : "None");
}
test();
