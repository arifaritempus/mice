import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getPublicClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase public env eksik');
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service env eksik');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

const ROLE_ALIASES: Record<string, string> = {
  'super_admin': 'super_admin',
  'superadmin': 'super_admin',
  'süper_admin': 'super_admin',
  'süperadmin': 'super_admin',
  'süper admin': 'super_admin',
  'admin': 'admin',
  'manager': 'manager',
  'müdür': 'manager',
  'mudur': 'manager',
  'user': 'user',
  'kullanıcı': 'user',
  'kullanici': 'user',
  'viewer': 'viewer',
  'görüntüleyici': 'viewer',
  'goruntuleyici': 'viewer'
};

const MODULE_ALIASES: Record<string, string> = {
  'mice': 'quotes',
  'quote': 'quotes',
  'teklif': 'quotes',
  'proje': 'projects',
  'project': 'projects',
  'budgets': 'budget',
  'acenta': 'agencies',
  'hotel': 'hotels',
  'otel': 'hotels',
  'kategori': 'categories',
  'rapor': 'reports',
  'operation': 'operations',
  'bilet': 'tickets',
  'sejur': 'sejour',
  'supplier': 'suppliers',
  'tedarikci': 'suppliers'
};

const norm = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();

const normalizeRole = (role: string) => {
  const n = norm(role);
  return ROLE_ALIASES[n] || n;
};

const normalizeModule = (module: string) => {
  const n = norm(module);
  return MODULE_ALIASES[n] || n;
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (!token) return NextResponse.json({ error: 'token gerekli' }, { status: 401 });

    const publicClient = getPublicClient();
    const adminClient = getAdminClient();

    const { data: authData, error: authErr } = await publicClient.auth.getUser(token);
    if (authErr || !authData?.user?.id) {
      return NextResponse.json({ error: 'gecersiz token' }, { status: 401 });
    }

    const userId = authData.user.id;
    const { data: userRow } = await adminClient
      .from('users')
      .select('id,email,role,is_active')
      .eq('id', userId)
      .maybeSingle();

    const role = userRow?.role || 'viewer';
    const clientNormalizedUserRole = normalizeRole(role);

    const [{ data: roles }, { data: permissions }, { data: rolePermissions }] = await Promise.all([
      adminClient.from('roles').select('id,name,is_active'),
      adminClient.from('permissions').select('id,module,action,is_active'),
      adminClient.from('role_permissions').select('role_id,permission_id,permissions(id,module,action,is_active)')
    ]);

    const roleRows = roles || [];
    const permissionRows = (permissions || []).filter((p: any) => p?.is_active !== false);
    const rolePermissionRows = rolePermissions || [];

    const roleById = new Map<string, any>(roleRows.map((r: any) => [r.id, r]));
    const permissionById = new Map<string, any>(permissionRows.map((p: any) => [p.id, p]));
    
    const matchedRoleIds = new Set<string>();
    let resolvedRoleName = role;
    
    for (const r of roleRows) {
      // Sadece veritabanındaki role ile eşleştirme yap
      if (r.id === role || normalizeRole(r.id) === normalizeRole(role) || normalizeRole(r.name) === normalizeRole(role)) {
        matchedRoleIds.add(r.id);
        resolvedRoleName = r.name; // Use the actual role name (e.g. "Süper Admin") instead of UUID
      }
    }
    
    // Fallback: users.role doğrudan role_id tutuluyorsa ve yukarıda eşleşmediyse
    if (matchedRoleIds.size === 0) {
      const direct = roleById.get(role);
      if (direct) {
        matchedRoleIds.add(direct.id);
        resolvedRoleName = direct.name;
      }
    }

    const effectivePermissions: Record<string, string[]> = {};
    for (const rp of rolePermissionRows) {
      if (!matchedRoleIds.has(rp.role_id)) continue;
      const perm = rp.permissions || permissionById.get(rp.permission_id);
      if (!perm || perm.is_active === false) continue;

      const moduleKey = normalizeModule(perm.module);
      const actionKey = norm(perm.action); // 'view', 'edit' vb.
      if (!effectivePermissions[moduleKey]) effectivePermissions[moduleKey] = [];
      if (!effectivePermissions[moduleKey].includes(actionKey)) {
        effectivePermissions[moduleKey].push(actionKey);
      }
    }

    return NextResponse.json(
      { role: resolvedRoleName, effectivePermissions, matchedRoleIds: Array.from(matchedRoleIds) },
      { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (e: any) {
    console.error(`[API permissions/me] ERROR:`, e);
    return NextResponse.json({ error: e?.message || 'Beklenmeyen hata' }, { status: 500 });
  }
}
