const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('project_hotels')
    .select('id')
    .limit(1);
    
  if (error) {
    console.error("project_hotels Error:", error.message);
  } else {
    console.log("project_hotels exists.");
  }
}

test();
