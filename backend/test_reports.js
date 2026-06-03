const { supabase } = require('./src/config/database');
async function test() {
  console.log('Testing vw_rp_opsiyon_takip...');
  const res1 = await supabase.from('vw_rp_opsiyon_takip').select('*').limit(5);
  console.log('Opsiyon Takip:', res1.error || res1.data);
  
  console.log('\nTesting vw_rp_otel_detay_teklif...');
  const res2 = await supabase.from('vw_rp_otel_detay_teklif').select('*').limit(5);
  console.log('Otel Detay Teklif:', res2.error || res2.data);
}
test();
