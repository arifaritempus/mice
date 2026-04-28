
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const table = process.argv[2] || 'sejour_flights';
  console.log(`Checking columns for table: ${table}`);
  
  // Get one row to see columns
  const { data, error } = await s.from(table).select('*').limit(1);
  
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]).join(', '));
  } else {
    console.log('No data found in table, trying to get columns from info schema...');
    // Fallback: try to select a non-existent column to see the error message which often lists columns
    const { error: err2 } = await s.from(table).select('non_existent_column').limit(1);
    console.log('Error message (might contain column list):', err2?.message);
  }
}

check();
