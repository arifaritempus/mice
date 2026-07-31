require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data: pData, error: pErr } = await supabase.from('vw_rp_proje_satis_maliyet').select('*').limit(1);
  console.log("Proj View:", pData);
  const { data: sData, error: sErr } = await supabase.from('vw_rp_sejour_kar_zarar').select('*').limit(1);
  console.log("Sejour View:", sData);
}
test();
