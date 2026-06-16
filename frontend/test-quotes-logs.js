require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('audit_logs').select('module, entity_type').limit(10);
  console.log("Modules:", Array.from(new Set(data.map(d => d.module))));
}
check();
