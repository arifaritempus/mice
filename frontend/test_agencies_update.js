require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: agencies } = await supabase.from('agencies').select('id, bank_accounts').limit(1);
  if (!agencies || agencies.length === 0) return console.log("No agencies found");
  
  const agencyId = agencies[0].id;
  console.log("Updating agency:", agencyId);
  
  const { data, error } = await supabase
    .from('agencies')
    .update({ bank_accounts: [{ id: "456", bankName: "TEST AGENCY", iban: "TR456", currency: "TRY", recipient: "Agency" }] })
    .eq('id', agencyId)
    .select();
    
  if (error) {
    console.error("Update Error:", error.message);
  } else {
    console.log("Update Success! Data:", data[0].bank_accounts);
  }
}
test();
