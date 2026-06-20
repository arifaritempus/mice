require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.rpc('query_sql', {
    sql: "SELECT prosrc FROM pg_proc WHERE proname = 'process_audit_log' LIMIT 1"
  });
  console.log('Result RPC:', data, error);
}
test();
