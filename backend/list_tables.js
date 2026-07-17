const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
  const { data, error } = await supabase.from('project_purchase_items').select('id, category_id, sub_category_id, name').limit(10);
  console.log('purchases:', data);
}
list();
