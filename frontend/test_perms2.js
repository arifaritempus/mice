const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

async function main() {
    const { data: perms } = await adminClient.from('permissions').select('module').order('module');
    const mods = new Set(perms.map(p => p.module));
    console.log("Modules in permissions table:", Array.from(mods).join(', '));
}

main().catch(console.error);
