require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('project_categories').select('id, name').limit(5);
  console.log('project_categories', data);
  const { data: d2 } = await supabase.from('mice_categories').select('id, name').limit(5);
  console.log('mice_categories', d2);
}
test();
