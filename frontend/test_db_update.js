require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: hotels } = await supabase.from('hotels').select('id, bank_accounts').limit(1);
  if (!hotels || hotels.length === 0) return console.log("No hotels found");
  
  const hotelId = hotels[0].id;
  console.log("Updating hotel:", hotelId);
  
  const { data, error } = await supabase
    .from('hotels')
    .update({ bank_accounts: [{ id: "123", bankName: "TEST", iban: "TR123", currency: "TRY", recipient: "Me" }] })
    .eq('id', hotelId)
    .select();
    
  if (error) {
    console.error("Update Error:", error.message);
  } else {
    console.log("Update Success! Data:", data[0].bank_accounts);
  }
}
test();
