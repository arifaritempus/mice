require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function getTriggers() {
  const { data, error } = await supabase.schema('information_schema').from('triggers').select('*').eq('event_object_table', 'project_purchase_items');
  console.log("Triggers for purchase items:", data ? data.map(t => ({name: t.trigger_name, action: t.action_statement})) : error);
  const { data: d2, error: e2 } = await supabase.schema('information_schema').from('triggers').select('*').eq('event_object_table', 'project_sales_items');
  console.log("Triggers for sales items:", d2 ? d2.map(t => ({name: t.trigger_name, action: t.action_statement})) : e2);
}
getTriggers();
