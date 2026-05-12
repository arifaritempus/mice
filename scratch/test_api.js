const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'bahtiyar@tempustravel.com',
    password: 'password123' // assuming default password or we can fetch the token another way?
  });

  if (error) {
    console.error("Login error:", error);
    return;
  }

  const token = data.session.access_token;
  console.log("Token acquired.");

  const response = await fetch('http://localhost:3001/api/permissions/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const body = await response.json();
  console.log("Permissions API response:", JSON.stringify(body, null, 2));
}

test();
