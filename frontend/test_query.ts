import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log("Fetching some projects to check start_date and end_date:");
  const { data: allProjects, error: err1 } = await supabase
    .from('projects')
    .select('id, title, start_date, end_date')
    .limit(5);
  console.log(allProjects);

  const dateStart = '2024-05-01'; // Just a sample

  console.log(`\nTesting filter: or(end_date.gte.${dateStart},start_date.gte.${dateStart})`);
  const { data: filteredProjects, error: err2 } = await supabase
    .from('projects')
    .select('id, title, start_date, end_date')
    .or(`end_date.gte.${dateStart},start_date.gte.${dateStart}`)
    .limit(5);
  console.log(filteredProjects);
  if (err2) console.error(err2);
}

testQuery();
