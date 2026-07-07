const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

async function main() {
    const { data: roles } = await adminClient.from('roles').select('*');
    const { data: permissions } = await adminClient.from('permissions').select('*');
    const { data: rolePermissions } = await adminClient.from('role_permissions').select('role_id, permission_id');

    for (const role of roles) {
        console.log(`\n=== Role: ${role.name} ===`);
        const permIds = rolePermissions.filter(rp => rp.role_id === role.id).map(rp => rp.permission_id);
        const perms = permissions.filter(p => permIds.includes(p.id));
        perms.forEach(p => console.log(`${p.module} -> ${p.action}`));
    }
}

main().catch(console.error);
