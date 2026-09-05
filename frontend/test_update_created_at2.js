const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: inserted, error: insertError } = await supabase.from('project_accommodation_items').insert({ project_id: '123e4567-e89b-12d3-a456-426614174000' }).select();
  if (insertError) {
      console.log("Insert err:", insertError);
      return;
  }
  const id = inserted[0].id;
  const newDate = new Date(Date.now() - 100000).toISOString();
  const { error } = await supabase.from('project_accommodation_items').update({ created_at: newDate }).eq('id', id).select();
  console.log("Update result:", error ? error.message : "Success!");
  await supabase.from('project_accommodation_items').delete().eq('id', id);
}
run();
