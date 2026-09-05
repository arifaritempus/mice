const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: items } = await supabase.from('project_accommodation_items').select('id, created_at').limit(1);
  if (items && items.length > 0) {
      const id = items[0].id;
      const newDate = new Date(Date.now() - 100000).toISOString();
      const { data, error } = await supabase.from('project_accommodation_items').update({ created_at: newDate }).eq('id', id).select();
      console.log("Update result:", error ? error.message : "Success!");
  } else {
      console.log("No items found");
  }
}
run();
