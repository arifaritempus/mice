require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  try {
    const { data: sejour, error: fetchError } = await client
      .from('sejours')
      .select('id, voucher_number, customer_type, customer_name, check_in_date, check_out_date, currency')
      .limit(1)
      .single();

    if(fetchError) {
       console.error("fetchError:", fetchError);
       return;
    }
    console.log("Sejour ID:", sejour.id);

    // Ana sejour bilgilerini güncelle
    const { error: sejourError } = await client
      .from('sejours')
      .update({
        voucher_number: sejour.voucher_number,
        customer_type: sejour.customer_type,
        customer_name: sejour.customer_name,
        agency_id: null,
        check_in_date: sejour.check_in_date,
        check_out_date: sejour.check_out_date,
        hotel_id: null,
        hotel_name: 'Test Hotel',
        hotel_address: null,
        status: 'confirmed',
        notes: null,
        total_amount: 100,
        currency: sejour.currency,
        costs: { TRY: 0, EUR: 0, USD: 0, GBP: 0 },
        totals: { TRY: 100, EUR: 0, USD: 0, GBP: 0 },
        profits: { TRY: 100, EUR: 0, USD: 0, GBP: 0 },
        updated_at: new Date().toISOString()
      })
      .eq('id', sejour.id);

    if (sejourError) {
      console.error('sejourError', sejourError);
      return;
    }

    console.log("Sejour updated successfully");
  } catch(e) {
    console.error("Exception:", e);
  }
}
test();
