require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function testInsert() {
  const payload = {
    project_id: '2ce43a04-7414-4091-9e17-dd6dde363f56', // id from user's logs
    category: 'test',
    unit_quantity: 1,
    unit_price: 1,
    total_price: 1,
    currency: 'EUR'
  };
  const { data, error } = await supabase.from('project_purchase_items').insert([payload]);
  console.log("Insert result:", error ? error : "Success", data);
}
testInsert();
