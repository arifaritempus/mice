require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('hotels').insert([{
    name: 'Test Hotel',
    company_name: 'Test Company',
    location: 'Test Location',
    concept: 'Test Concept',
    rating: 5,
    contact_person: 'Test Person',
    phone: '123456',
    email: 'test@test.com',
    address: 'Test Address',
    tax_number: '12345',
    tax_office: 'Test Office',
    accounting_link_codes: { TL: '1', EUR: '2', USD: '3', GBP: '4' },
    is_active: true
  }]).select();
  if (error) {
    console.log("Error inserting:", JSON.stringify(error));
  } else {
    console.log("Inserted successfully:", JSON.stringify(data));
    // Clean up
    await supabase.from('hotels').delete().eq('id', data[0].id);
  }
}
test();
