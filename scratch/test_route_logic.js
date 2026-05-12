const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const publicClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);

async function test() {
    const { data } = await adminClient.from('permissions').select('*');
    console.log("Permissions:", data);
}
test();
