require('dotenv').config({ path: 'frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: vw } = await supabase.from('vw_rp_sejour_kar_zarar').select('*');
  let totalSatis = 0;
  if(vw) vw.forEach(v => totalSatis += Number(v.satis_tl || 0));
  console.log("VW Total Satis TL:", totalSatis);

  const { data: sej } = await supabase.from('sejour').select('*');
  let totalPrice = 0;
  if(sej) sej.forEach(s => totalPrice += Number(s.total_price || 0) * (Number(s.exchange_rate) || 1));
  console.log("Sejours Total Price TL (approx):", totalPrice);
}
run();
