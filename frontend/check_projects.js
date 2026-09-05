require('dotenv').config({path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const quoteId = '07a2a68f-e3cf-4ad8-bc0e-44598b6e969b'; // TMI260730004
  const { data: projects, error } = await supabase.from('projects').select('id').eq('quote_id', quoteId);
  console.log("Projects linked to the quote:", projects, error);
}
run();
