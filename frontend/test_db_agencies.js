require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: a, error: e1 } = await supabase.from('agencies').select('bank_accounts').limit(1);
  if (e1) console.error("Agencies DB Error:", e1.message);
  else console.log("Agencies DB Success:", a);
  
  const { data: s, error: e2 } = await supabase.from('suppliers').select('bank_accounts').limit(1);
  if (e2) console.error("Suppliers DB Error:", e2.message);
  else console.log("Suppliers DB Success:", s);
}
test();
