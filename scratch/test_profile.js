const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testProfile() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'bahtiyar@tempustravel.com',
    password: 'Password123!' // I will just create a mock JWT for him or fetch directly since we don't know the password
  });

  // Let's use the admin client to create a custom JWT, or simpler: just check the DB policies using admin.
}
testProfile();
