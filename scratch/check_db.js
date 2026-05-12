const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/arifari/Desktop/TT_Sistem_AG/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing supabase keys in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, email, role')
    .ilike('email', '%bahtiyar%');

  console.log("Bahtiyar users:", users);

  if (users && users.length > 0) {
    const roleId = users[0].role;
    console.log("Role ID:", roleId);

    const { data: roleData } = await supabase.from('roles').select('*').eq('id', roleId);
    console.log("Role Data:", roleData);

    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(module, action)')
      .eq('role_id', roleId);
      
    console.log("Permissions for role:", rolePerms);
  } else {
    // Check 'user' role
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission_id, permissions(module, action)')
      .eq('role_id', 'user');
    console.log("Permissions for 'user' role:", rolePerms);
  }
}

check();
