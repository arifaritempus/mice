const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDeletedProject() {
  const { data: items } = await supabase.from('project_purchase_items').select('id, project_id, description').like('description', '%SNG%').limit(10);
  console.log('project_purchase_items with SNG:', items);
}
checkDeletedProject();
