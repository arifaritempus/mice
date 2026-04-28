
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Using URL:', process.env.SUPABASE_URL);

  const tables = ['users', 'categories'];
  for (const table of tables) {
    console.log(`--- ${table.toUpperCase()} COLS ---`);
    // This is a hacky way to get column names via an error message or by inserting a dummy row
    const { error } = await s.from(table).insert({ _non_existent_column_: true });
    if (error && error.message) {
      console.log('Error helpfully mentions columns?', error.message);
    }
  }
}

check();
