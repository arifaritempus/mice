require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const ref = "TEST-MOCK-REF-123";
  
  // 1. Create a request
  const { data: req } = await adminClient.from('mice_requests').insert({
    reference: ref,
    status: 'TEKLİFE AKTARILDI'
  }).select().single();
  console.log("Created request:", req.id);

  // 2. Create a quote
  const { data: q } = await adminClient.from('quotes').insert({
    reference: ref,
    status: 'TEKLİF'
  }).select().single();
  console.log("Created quote:", q.id);

  // 3. Run the deletion logic
  const { data: quoteToVerify } = await adminClient
    .from('quotes')
    .select('status, reference')
    .eq('id', q.id)
    .single();

  if (quoteToVerify?.reference) {
    const { data: otherQuotes } = await adminClient
      .from('quotes')
      .select('id')
      .eq('reference', quoteToVerify.reference)
      .neq('id', q.id);

    if (!otherQuotes || otherQuotes.length === 0) {
      const { data: upReq, error: upErr } = await adminClient
        .from('mice_requests')
        .update({ status: 'CEVAPLANDI' })
        .eq('reference', quoteToVerify.reference)
        .eq('status', 'TEKLİFE AKTARILDI')
        .select();
      console.log("Updated request result:", upReq, upErr);
    }
  }

  // 4. Delete the quote
  await adminClient.from('quotes').delete().eq('id', q.id);
  console.log("Deleted quote");
  
  // 5. Cleanup
  await adminClient.from('mice_requests').delete().eq('id', req.id);
  console.log("Cleaned up");
}
run();
