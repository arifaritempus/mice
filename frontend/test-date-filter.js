const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  let query = supabase.from('projects').select('*', { count: 'exact' });
  
  const dateStart = '2026-08-01';
  // query = query.or(`end_date.gte.${dateStart},start_date.gte.${dateStart}`);
  // Try exactly what getPage does
  const res = await query.or(`end_date.gte.${dateStart},start_date.gte.${dateStart}`);
  console.log("Only dateStart:", res.data ? res.data.length : res.error);

  let query2 = supabase.from('projects').select('*', { count: 'exact' });
  const res2 = await query2.lte('start_date', `${dateStart}T23:59:59`);
  console.log("Only dateEnd:", res2.data ? res2.data.length : res2.error);

  let query3 = supabase.from('projects').select('*', { count: 'exact' });
  const res3 = await query3.or(`end_date.gte.${dateStart},start_date.gte.${dateStart}`).lte('start_date', `${dateStart}T23:59:59`);
  console.log("Both:", res3.data ? res3.data.length : res3.error);
}

run();
