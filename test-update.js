require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function testUpdate() {
  const { data, error } = await supabase.from('project_purchase_items')
    .update({ unit_quantity: 2 })
    .eq('id', '2ce43a04-7414-4091-9e17-dd6dde363f56');
  console.log("Update result:", error ? error : "Success", data);
}
testUpdate();
