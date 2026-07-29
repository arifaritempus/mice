const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('quotes')
    .select('id, reference, created_at, quote_items(id)')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log("Latest Quotes:", data);
}

test();
