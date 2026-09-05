const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('project_accommodations').select('*').limit(1);
  if (error) {
      console.log("Error querying project_accommodations:", error);
  } else {
      console.log("project_accommodations has columns:", data.length > 0 ? Object.keys(data[0]) : "No data to infer columns");
      
      // Let's try to query with sort_order
      const testSort = await supabase.from('project_accommodations').select('sort_order').limit(1);
      if (testSort.error) {
          console.log("sort_order DOES NOT EXIST:", testSort.error.message);
      } else {
          console.log("sort_order EXISTS!");
      }
  }
}
run();
