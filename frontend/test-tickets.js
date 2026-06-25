import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const options = await supabase.from('ticket_options').select('*');
  console.log('Ticket Options:', options.data);
  const payments = await supabase.from('ticket_payment_plans').select('*');
  console.log('Ticket Payments:', payments.data);
}
run();
