import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('frontend/.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(
  urlMatch ? urlMatch[1].trim() : '',
  keyMatch ? keyMatch[1].trim() : ''
);

async function run() {
  const tables = [
    'project_sales_items',
    'project_collections',
    'sejour_rooms',
    'sejour_flights',
    'sejour_transfers',
    'sejour_extra_services',
    'sejour_collections'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .update({ currency: 'TRY' })
      .eq('currency', 'TL')
      .select('id');
      
    if (error) {
      console.error(`Error updating ${table}:`, error.message);
    } else {
      console.log(`Updated ${data.length} records in ${table}`);
    }
  }
}
run();
