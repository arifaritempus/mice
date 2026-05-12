import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'general_settings');

  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Settings found:', data.length);
    data.forEach((row, i) => {
      console.log(`Row ${i}:`, row.id, typeof row.value);
    });
  }
}

checkSettings();
