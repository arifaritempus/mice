const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

const ROLE_ALIASES = {
  super_admin: "super_admin",
  superadmin: "super_admin",
  "süper_admin": "super_admin",
  "süperadmin": "super_admin",
  "süper admin": "super_admin",
  admin: "admin",
  manager: "manager",
  "müdür": "manager",
  mudur: "manager",
  user: "user",
  "kullanıcı": "user",
  kullanici: "user",
  viewer: "viewer",
  "görüntüleyici": "viewer",
  goruntuleyici: "viewer",
};

const norm = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .trim();

const normalizeRole = (role) => {
  const n = norm(role);
  return ROLE_ALIASES[n] || n;
};

async function run() {
  const { data: users } = await adminClient.from('users').select('id, email, role');
  console.log("Users count:", users.length);
  
  if (users.length > 0) {
    const testUser = users[0];
    console.log("Test user:", testUser.email, "Role:", testUser.role);
    
    const role = testUser.role || "viewer";
    
    const [{ data: roles }, { data: permissions }, { data: rolePermissions }] = await Promise.all([
      adminClient.from("roles").select("id,name,is_active"),
      adminClient.from("permissions").select("id,module,action,is_active"),
      adminClient.from("role_permissions").select("role_id,permission_id,permissions(id,module,action,is_active)"),
    ]);

    const roleRows = roles || [];
    const permissionRows = (permissions || []).filter((p) => p?.is_active !== false);
    const rolePermissionRows = rolePermissions || [];

    const roleById = new Map(roleRows.map((r) => [r.id, r]));
    const permissionById = new Map(permissionRows.map((p) => [p.id, p]));

    const matchedRoleIds = new Set();
    let resolvedRoleName = role;

    for (const r of roleRows) {
      if (
        r.id === role ||
        normalizeRole(r.id) === normalizeRole(role) ||
        normalizeRole(r.name) === normalizeRole(role)
      ) {
        matchedRoleIds.add(r.id);
        resolvedRoleName = r.name; 
      }
    }

    if (matchedRoleIds.size === 0) {
      const direct = roleById.get(role);
      if (direct) {
        matchedRoleIds.add(direct.id);
        resolvedRoleName = direct.name;
      }
    }
    
    console.log("Matched Role IDs:", Array.from(matchedRoleIds));
    console.log("Resolved Role Name:", resolvedRoleName);

    const effectivePermissions = {};
    for (const rp of rolePermissionRows) {
      if (!matchedRoleIds.has(rp.role_id)) continue;
      const perm = rp.permissions || permissionById.get(rp.permission_id);
      if (!perm || perm.is_active === false) continue;

      const moduleKey = norm(perm.module); // Simplified for test
      const actionKey = norm(perm.action);
      if (!effectivePermissions[moduleKey]) effectivePermissions[moduleKey] = [];
      if (!effectivePermissions[moduleKey].includes(actionKey)) {
        effectivePermissions[moduleKey].push(actionKey);
      }
    }

    console.log("Effective Permissions:", effectivePermissions);
  }
}

run().catch(console.error);
