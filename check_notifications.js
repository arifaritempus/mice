require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data } = await supabase.from('notifications').select('*');
  console.log("Total notifications in DB:", data ? data.length : 0);
  if(data && data.length > 0) {
    console.log("Sample notification user_id:", data[0].user_id);
  }
}
test();
