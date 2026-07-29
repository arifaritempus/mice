const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('quote_items')
    .select('*')
    .limit(5)
    .order('created_at', { ascending: false });
    
  console.log("Items:", data);
  console.log("Error:", error);
}

test();
