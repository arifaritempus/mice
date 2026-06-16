require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('logs').select('*').limit(1);
  console.log("logs:", data, error);
  const { data: d2, error: e2 } = await supabase.from('audit_logs').select('*').limit(1);
  console.log("audit_logs:", d2, e2);
  const { data: d3, error: e3 } = await supabase.from('system_logs').select('*').limit(1);
  console.log("system_logs:", d3, e3);
  const { data: d4, error: e4 } = await supabase.from('activity_logs').select('*').limit(1);
  console.log("activity_logs:", d4, e4);
}
check();
