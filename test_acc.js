import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('project_accommodation_items').select('*').limit(1);
  if (error) {
    console.error("ERROR", error);
  } else {
    console.log("COLUMNS:", data.length > 0 ? Object.keys(data[0]) : "NO DATA");
  }
}

run();
