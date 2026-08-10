require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_view_ddl', { view_name: 'doesnt_matter' }); // just to use connection
  // To list tables:
  const { data: tables, error: tErr } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public').like('table_name', '%mail%');
  if (tErr) {
     // use raw fetch
     const resp = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }});
     const swagger = await resp.json();
     const tableNames = Object.keys(swagger.definitions || {}).filter(k => k.includes('mail') || k.includes('request'));
     console.log("Tables:", tableNames);
  } else {
     console.log("Tables:", tables);
  }
}
run();
