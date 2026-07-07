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

    console.log("ROLES:", roles.map(r => r.name));

    const userRole = roles.find(r => r.name.toLowerCase().includes('kullanıcı') || r.name.toLowerCase() === 'user');
    if (!userRole) return console.log("User role not found!");

    console.log("\nUser Role:", userRole.name, userRole.id);

    const userPermIds = rolePermissions.filter(rp => rp.role_id === userRole.id).map(rp => rp.permission_id);
    const userPerms = permissions.filter(p => userPermIds.includes(p.id));

    console.log("\nUser Permissions (module -> action):");
    userPerms.forEach(p => console.log(`${p.module} -> ${p.action}`));
}

main().catch(console.error);
