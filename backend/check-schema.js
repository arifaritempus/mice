
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log(`Checking schema for: ${supabaseUrl}`);
  
  // Get column names for users table
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'users' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select with limit 0
    console.log('RPC get_table_columns failed, trying select * limit 0');
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.error('Select failed:', selectError);
    } else {
      console.log('Columns in users table:', Object.keys(selectData[0] || {}));
    }
  } else {
    console.log('Columns from RPC:', data);
  }
  
  // Also check categories table
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .limit(1);
    
  if (catError) {
    console.error('Categories select failed:', catError);
  } else {
    console.log('Columns in categories table:', Object.keys(catData[0] || {}));
  }
}

checkSchema();
