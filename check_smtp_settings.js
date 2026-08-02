const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read frontend/.env.local
const envContent = fs.readFileSync('frontend/.env.local', 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSettingsWithAnon() {
  const { data, error } = await supabase.from('settings').select('*');
  console.log('Anon Key Settings Count:', data ? data.length : 0);
  if (error) console.error('Error:', error);
}

checkSettingsWithAnon();
