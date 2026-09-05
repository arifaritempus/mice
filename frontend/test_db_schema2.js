const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('project_accommodation_items').select('sort_order').limit(1);
  if (error) {
      console.log("sort_order DOES NOT EXIST:", error.message);
  } else {
      console.log("sort_order EXISTS!");
  }
}
run();
