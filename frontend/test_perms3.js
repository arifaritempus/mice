const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

async function main() {
    const { data: roles } = await adminClient.from('roles').select('*').eq('name', 'Kullanıcı');
    if (!roles || roles.length === 0) return console.log("No Kullanıcı role");
    
    const roleId = roles[0].id;
    const { data: rolePerms } = await adminClient.from('role_permissions').select('permission_id').eq('role_id', roleId);
    
    const pIds = rolePerms.map(rp => rp.permission_id);
    const { data: perms } = await adminClient.from('permissions').select('*').in('id', pIds);
    
    console.log("Kullanıcı permissions:", perms.map(p => `${p.module}->${p.action}`).join(', '));
}

main().catch(console.error);
