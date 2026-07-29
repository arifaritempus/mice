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
      quote_id: "1f3a76f4-f8cb-4858-87d6-d4161b0b3c74",
      main_category: "80b22984-83ba-41d7-bb8e-0d9c1968b614",
      sub_category: "01b73b0d-4be8-405b-a20d-6e62710d9dcd",
      unit_quantity: 1,
      sefer: 1,
      unit_price: 100,
      currency: "EUR",
      total: 100,
      description: "Test",
      hotel_id: "general"
    });
    
  console.log("Error:", error);
}

test();
