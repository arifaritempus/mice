
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const norm = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();

async function simulateApi() {
  const email = 'anilay.acikavak@tempustravel.co';
  console.log(`Simulating permissions/me API for ${email}...`);

  try {
    const { data: userRow } = await supabase
      .from('users')
      .select('id,email,role,is_active')
      .eq('email', email)
      .maybeSingle();

    if (!userRow) {
      console.log('User not found in public.users');
      return;
    }

    const role = userRow.role || 'viewer';
    const normalizedUserRole = norm(role);
    console.log(`User role in DB: "${role}", Normalized: "${normalizedUserRole}"`);

    const [{ data: roles }, { data: permissions }, { data: rolePermissions }] = await Promise.all([
      supabase.from('roles').select('id,name,is_active'),
      supabase.from('permissions').select('id,module,action,is_active'),
      supabase.from('role_permissions').select('role_id,permission_id,permissions(id,module,action,is_active)')
    ]);

    const roleRows = roles || [];
    const permissionRows = (permissions || []).filter((p) => p?.is_active !== false);
    const rolePermissionRows = rolePermissions || [];

    console.log(`Loaded ${roleRows.length} roles, ${permissionRows.length} active permissions, ${rolePermissionRows.length} role-permission relations.`);

    const roleById = new Map(roleRows.map((r) => [r.id, r]));
    const permissionById = new Map(permissionRows.map((p) => [p.id, p]));

    const matchedRoleIds = new Set();
    for (const r of roleRows) {
      const matchId = norm(r.id) === normalizedUserRole;
      const matchName = norm(r.name) === normalizedUserRole;
      if (matchId || matchName) {
        console.log(`Matched role row: ID "${r.id}", Name "${r.name}" (Match logic: ID=${matchId}, Name=${matchName})`);
        matchedRoleIds.add(r.id);
      }
    }

    if (matchedRoleIds.size === 0) {
      const direct = roleById.get(role);
      if (direct) {
        console.log(`Fallback matched role by ID: ${direct.id}`);
        matchedRoleIds.add(direct.id);
      }
    }

    const effectivePermissions = {};
    for (const rp of rolePermissionRows) {
      if (!matchedRoleIds.has(rp.role_id)) continue;
      
      const perm = rp.permissions || permissionById.get(rp.permission_id);
      if (!perm || perm.is_active === false) {
        // console.log(`Skipping permission ${rp.permission_id}: redundant or inactive`);
        continue;
      }

      const moduleKey = norm(perm.module);
      const actionKey = norm(perm.action);
      if (!effectivePermissions[moduleKey]) effectivePermissions[moduleKey] = [];
      if (!effectivePermissions[moduleKey].includes(actionKey)) {
        effectivePermissions[moduleKey].push(actionKey);
      }
    }

    console.log('\nResulting Payload:');
    console.log(JSON.stringify({
      role,
      effectivePermissionsCount: Object.keys(effectivePermissions).length,
      matchedRoleIds: Array.from(matchedRoleIds),
      permissionsPreview: Object.entries(effectivePermissions).slice(0, 3)
    }, null, 2));

    if (Object.keys(effectivePermissions).length === 0) {
        console.log('\n❌ ERROR: effectivePermissions is empty!');
    } else {
        console.log('\n✅ SUCCESS: Payload generated correctly.');
    }

  } catch (e) {
    console.error('API Simulation Error:', e);
  }
}

simulateApi();
