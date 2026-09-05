const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testGetById() {
  const { data: invoices } = await supabase.from('invoices').select('id, invoice_no, total_try').eq('type', 'expense').order('created_at', { ascending: false }).limit(20);
  
  if (!invoices || invoices.length === 0) return;
  
  for (const inv of invoices) {
    if (inv.total_try === 74500 || inv.invoice_no === '994') {
       console.log("Found 994!", inv);
    }
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    if (!items || items.length === 0) continue;
    
    const itemIds = items.map(ii => ii.item_id).filter(Boolean);
    if (itemIds.length === 0) continue;
    
    // Check if any is a sejour room
    const { data: purchaseItems } = await supabase.from('project_purchase_items').select('id, project_id, description').in('id', itemIds);
    if (purchaseItems && purchaseItems.length > 0) {
      console.log(`Invoice ${inv.invoice_no} has project_purchase_items!`, purchaseItems);
    }
  }
}
testGetById();
