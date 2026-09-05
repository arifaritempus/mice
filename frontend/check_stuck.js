require('dotenv').config({path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: reqs } = await supabase.from('mice_requests').select('id, reference, status').eq('status', 'TEKLİFE AKTARILDI');
  
  const { data: quotes } = await supabase.from('quotes').select('id, reference, status');
  
  const quoteRefs = new Set(quotes.map(q => q.reference));
  
  console.log("Requests with TEKLİFE AKTARILDI but no matching quote reference:");
  const stuckReqs = reqs.filter(r => !quoteRefs.has(r.reference));
  console.table(stuckReqs);
  
  // What about requests that were previously "TEKLİFE AKTARILDI" but the quote was deleted before our fix?
  // They might be stuck. We can manually fix them now.
  if (stuckReqs.length > 0) {
    console.log("Fixing stuck requests...");
    for (const r of stuckReqs) {
       await supabase.from('mice_requests').update({status: 'CEVAPLANDI'}).eq('id', r.id);
    }
    console.log("Fixed!");
  }
}
run();
