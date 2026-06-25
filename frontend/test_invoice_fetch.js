const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: settings } = await supabase.from('settings').select('*');
  console.log("SETTINGS DB:");
  settings.forEach(s => console.log(s.key, s.value));

  const { data: invoices } = await supabase.from('invoices').select('id, invoice_no').eq('invoice_no', 'DENEME1').single();
  if (!invoices) { console.log("Invoice not found"); return; }
  
  const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoices.id);
  console.log("INVOICE ITEMS:", JSON.stringify(items, null, 2));

  const itemIds = items.map(i => i.item_id);
  const { data: sales } = await supabase.from('project_sales_items').select('*').in('id', itemIds);
  console.log("SALES ITEMS:", JSON.stringify(sales, null, 2));
  
  const categories = await supabase.from('categories').select('*');
  console.log("CATS:", categories.data.map(c => ({ id: c.id, name: c.name })));
}
test();
