const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('quote_items')
    .insert({
      quote_id: "66bbfc8f-3fd1-4b37-9ff2-e094bf5ab846",
      main_category: null,
      sub_category: null,
      unit_quantity: 1,
      sefer: 1,
      unit_price: 100,
      currency: "EUR",
      total: 100,
      total_price: 100,
      description: "Test",
      hotel_id: null
    });
    
  console.log("Error:", error);
}

test();
