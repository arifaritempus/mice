const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gzdfdnfkyedwnameflso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZGZkbmZreWVkd25hbWVmbHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg5MjkxMiwiZXhwIjoyMDc2NDY4OTEyfQ.QIV75ynKo_W0n7N80udD5o5t8ecL6_CwXL4XSlZkSYA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: quotes } = await supabase.from('quotes').select('id, hotels_data').order('created_at', { ascending: false }).limit(2);
  console.log("Quotes:", JSON.stringify(quotes, null, 2));
  
  if (quotes && quotes.length > 0) {
    const quoteId = quotes[0].id;
    console.log("Checking quote items for quote:", quoteId);
    const { data: items } = await supabase.from('quote_items').select('id, hotel_id, main_category').eq('quote_id', quoteId);
    console.log("Quote Items:", JSON.stringify(items, null, 2));
  }
}
test();
