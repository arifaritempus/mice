const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testGetInvoicesPageBug() {
  const invoice = { id: 'test-inv' };
  const items = [{ invoice_id: 'test-inv', item_id: 'room-1' }];
  
  const sRooms = { data: [{ id: 'room-1', sejour_id: 'sejour-1' }] };
  const sejourIds = new Set();
  const itemToSejourMap = {};
  
  sRooms.data.forEach(r => {
    if (r.sejour_id) {
      sejourIds.add(r.sejour_id);
      itemToSejourMap[r.id] = r.sejour_id;
    }
  });
  
  const sejoursMap = { 'sejour-1': { company_name: 'TEST HOTEL' } };
  
  for (const ii of items) {
    const sId = itemToSejourMap[ii.item_id] || ii.item_id;
    const sejour = sejoursMap[sId];
    console.log('Resolved sejour:', sejour);
  }
}
testGetInvoicesPageBug();
