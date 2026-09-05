const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_schema_info', { table_name: 'projects' });
  console.log("RPC Error:", error);
  // Alternative way using postgrest directly if RPC doesn't exist
  if (error) {
     const { data: cols, error: colError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
     console.log(cols);
  }
}

run();
