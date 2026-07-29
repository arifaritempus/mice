const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .rpc('get_table_schema', { table_name: 'quote_items' }); // This might fail if the RPC doesn't exist
    
  if (error) {
     // Let's just fetch one item and try to insert a string to see the exact error
     const { error: err2 } = await supabase
      .from('quote_items')
      .insert({
        quote_id: "1f3a76f4-f8cb-4858-87d6-d4161b0b3c74",
        main_category: "TEST",
        sub_category: "TEST",
        unit_quantity: 1,
        sefer: 1,
        unit_price: 100,
        currency: "EUR",
        total: 100,
        description: "Test",
        hotel_id: "TEST"
      });
     console.log("Insert Error:", err2);
  } else {
     console.log("Schema:", data);
  }
}

test();
