require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const t = ["project_flight_tickets", "events", "project_accommodation_items"];
  for (const table of t) {
    const { data } = await supabase.from(table).select('*').limit(1);
    console.log(table, ":", data);
  }
}
test();
