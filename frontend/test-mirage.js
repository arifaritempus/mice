import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('frontend/.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(
  urlMatch ? urlMatch[1].trim() : '',
  keyMatch ? keyMatch[1].trim() : ''
);

async function run() {
  const { data: agencies } = await supabase.from('agencies').select('id, name');
  const mirage = agencies.find(a => a.name.toUpperCase().includes('MIRAGE') || a.name.toUpperCase().includes('MİRAGE'));
  console.log("Found agency:", mirage);
  if (!mirage) return;
  const agencyId = mirage.id;
  
  const { data: projects } = await supabase.from('projects').select('id, title, agency_id').eq('agency_id', agencyId);
  console.log(`Found ${projects.length} projects`);
  
  for (const p of projects) {
    const { data: sales } = await supabase.from('project_sales_items').select('total_price, currency').eq('project_id', p.id);
    const totalEur = sales.filter(s => s.currency === 'EUR').reduce((sum, s) => sum + Number(s.total_price), 0);
    if (totalEur > 0) {
      console.log(`Project ${p.title} (${p.id}) has ${totalEur} EUR sales from ${sales.length} items`);
      console.log(sales.filter(s => s.currency === 'EUR'));
    }
  }
  
  const { data: sejours } = await supabase.from('sejours').select('id, voucher_number').eq('agency_id', agencyId);
  console.log(`Found ${sejours.length} sejours`);
  
  for (const s of sejours) {
    const { data: rooms } = await supabase.from('sejour_rooms').select('total_price, currency').eq('sejour_id', s.id);
    const { data: flights } = await supabase.from('sejour_flights').select('total_price, currency').eq('sejour_id', s.id);
    const { data: transfers } = await supabase.from('sejour_transfers').select('price, currency').eq('sejour_id', s.id);
    const { data: extras } = await supabase.from('sejour_extra_services').select('price, currency').eq('sejour_id', s.id);
    
    let totalEur = 0;
    rooms.forEach(x => { if (x.currency === 'EUR') totalEur += Number(x.total_price || 0); });
    flights.forEach(x => { if (x.currency === 'EUR') totalEur += Number(x.total_price || 0); });
    transfers.forEach(x => { if (x.currency === 'EUR') totalEur += Number(x.price || 0); });
    extras.forEach(x => { if (x.currency === 'EUR') totalEur += Number(x.price || 0); });
    
    if (totalEur > 0) {
      console.log(`Sejour ${s.voucher_number} (${s.id}) has ${totalEur} EUR sales`);
      console.log("Rooms:", rooms.filter(r => r.currency === 'EUR'));
      console.log("Flights:", flights.filter(f => f.currency === 'EUR'));
      console.log("Transfers:", transfers.filter(t => t.currency === 'EUR'));
      console.log("Extras:", extras.filter(e => e.currency === 'EUR'));
    }
  }
}
run();
