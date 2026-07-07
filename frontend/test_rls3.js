const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

async function main() {
    const { data, error } = await adminClient.rpc('get_policies_for_tables', {});
    // If RPC doesn't exist, try querying pg_class and pg_policy directly
    if (error) {
        const { data: d2, error: e2 } = await adminClient.from('projects').select('*').limit(1);
        console.log("Projects select:", e2 ? e2.message : "OK");
    } else {
        console.log("Policies:", data);
    }
}

main().catch(console.error);
