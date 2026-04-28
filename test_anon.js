const { createClient } = require('@supabase/supabase-js');
const url = 'https://gzdfdnfkyedwnameflso.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZGZkbmZreWVkd25hbWVmbHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTI5MTIsImV4cCI6MjA3NjQ2ODkxMn0.mrQBekx7aotFM0smVAXSPk7ssgd_uW1q9HrFIBwyDNs';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZGZkbmZreWVkd25hbWVmbHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg5MjkxMiwiZXhwIjoyMDc2NDY4OTEyfQ.QIV75ynKo_W0n7N80udD5o5t8ecL6_CwXL4XSlZkSYA';

const supabaseAnon = createClient(url, anonKey);
const supabaseAdmin = createClient(url, serviceKey);

async function test() {
  const { data: quotes } = await supabaseAdmin.from('quotes').select('id, status, hotels_data').order('updated_at', { ascending: false }).limit(3);
  
  for (let q of quotes) {
    console.log(`\nQuote: ${q.id} (status: ${q.status})`);
    const { data: adminItems, error: aErr } = await supabaseAdmin.from('quote_items').select('id, hotel_id, main_category').eq('quote_id', q.id);
    console.log("  Admin read items:", adminItems ? adminItems.length : aErr);
    
    const { data: anonItems, error: rErr } = await supabaseAnon.from('quote_items').select('id, hotel_id, main_category').eq('quote_id', q.id);
    console.log("  Anon read items:", anonItems ? anonItems.length : rErr);
    
    if (adminItems && adminItems.length > 0) {
      console.log("  Sample Admin Item hotel_id:", adminItems[0].hotel_id);
    }
    
    console.log("  hotels_data from DB:", JSON.stringify(q.hotels_data[0]));
  }
}
test();
