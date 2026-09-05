require('dotenv').config({path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local'});
const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const id = '07a2a68f-e3cf-4ad8-bc0e-44598b6e969b'; // TMI260730004
  try {
    const { data: quoteToVerify, error: quoteError } = await adminClient
      .from('quotes')
      .select('status, reference')
      .eq('id', id)
      .single();

    if (quoteError) throw quoteError;
    console.log("Found quote:", quoteToVerify);

    const [quoteItemsDelete, quoteLinksDelete] = await Promise.all([
      adminClient.from('quote_items').delete().eq('quote_id', id),
      adminClient.from('public_links').delete().eq('quote_id', id)
    ]);
    console.log("Deleted items and links");

    const { error } = await adminClient
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log("Successfully deleted quote!");
  } catch(e) {
    console.error("Error during delete:", e);
  }
}
run();
