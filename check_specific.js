const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', 'f9b51dac-0011-42da-8303-6181c287ba65');
  console.log("Quote:", data);
}

test();
