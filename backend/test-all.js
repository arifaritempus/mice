require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const q1 = supabase.from('sejour_extras').select('suppliers(name)').limit(1);
  const q2 = supabase.from('project_transfer_tour').select('suppliers(name)').limit(1);
  const q3 = supabase.from('project_human_resources').select('suppliers(name)').limit(1);
  
  const [r1, r2, r3] = await Promise.all([q1, q2, q3]);
  console.log("sejour_extras -> suppliers FK error:", r1.error);
  console.log("project_transfer_tour -> suppliers FK error:", r2.error);
  console.log("project_human_resources -> suppliers FK error:", r3.error);
}
run();
