const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local to get supabase url and key
const envFile = fs.readFileSync('frontend/.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('sejour_rooms').select('check_in_date').limit(1);
  if (error) {
    console.error("ERROR:", error.message);
  } else {
    console.log("SUCCESS: check_in_date column exists!");
  }
}

test();
