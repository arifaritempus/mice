import { useEffect, useMemo, useState } from 'react';
import { authService } from './auth';

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

export enum Permission {
  VIEW = 'view',
  EDIT = 'edit',
  CREATE = 'create',
  DELETE = 'delete'
}

export enum Module {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  QUOTES = 'quotes',
  PROJECTS = 'projects',
  ACCOUNTING = 'accounting',
  CASH_FLOW = 'cash_flow',
  INVOICES = 'invoices',
  EXCHANGE_RATES = 'exchange_rates',
  AGENCIES = 'agencies',
  HOTELS = 'hotels',
  CATEGORIES = 'categories',
  USERS = 'users',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  SEJOUR = 'sejour',
  OPERATIONS = 'operations',
  TRANSFERS = 'transfers',
  GUIDES = 'guides',
  PART_TIME = 'part_time',
  SUPPLIERS = 'suppliers',
  TICKETS = 'tickets',
  MARKETING = 'marketing',
  PROFILE = 'profile'
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer'
}

const ROLE_ALIASES: Record<string, string> = {
  super_admin: Role.SUPER_ADMIN,
  superadmin: Role.SUPER_ADMIN,
  'süper_admin': Role.SUPER_ADMIN,
  'süper admin': Role.SUPER_ADMIN,
  'süperadmin': Role.SUPER_ADMIN,
  'super admin': Role.SUPER_ADMIN,
  admin: Role.ADMIN,
  manager: Role.MANAGER,
  müdür: Role.MANAGER,
  mudur: Role.MANAGER,
  user: Role.USER,
  kullanıcı: Role.USER,
  kullanici: Role.USER,
  viewer: Role.VIEWER,
  görüntüleyici: Role.VIEWER,
  goruntuleyici: Role.VIEWER
};

const MODULE_ALIASES: Record<string, Module> = {
  dashboard: Module.DASHBOARD,
  home: Module.HOME,
  quotes: Module.QUOTES,
  quote: Module.QUOTES,
  teklif: Module.QUOTES,
  mice: Module.QUOTES,
  projects: Module.PROJECTS,
  project: Module.PROJECTS,
  proje: Module.PROJECTS,
  accounting: Module.ACCOUNTING,
  cash_flow: Module.CASH_FLOW,
  cashflow: Module.CASH_FLOW,
  invoices: Module.INVOICES,
  exchange_rates: Module.EXCHANGE_RATES,
  'exchange-rates': Module.EXCHANGE_RATES,
  agencies: Module.AGENCIES,
  agency: Module.AGENCIES,
  acenta: Module.AGENCIES,
  hotels: Module.HOTELS,
  hotel: Module.HOTELS,
  otel: Module.HOTELS,
  categories: Module.CATEGORIES,
  category: Module.CATEGORIES,
  kategori: Module.CATEGORIES,
  users: Module.USERS,
  user: Module.USERS,
  kullanici: Module.USERS,
  reports: Module.REPORTS,
  report: Module.REPORTS,
  rapor: Module.REPORTS,
  settings: Module.SETTINGS,
  setting: Module.SETTINGS,
  sejour: Module.SEJOUR,
  operations: Module.OPERATIONS,
  operation: Module.OPERATIONS,
  suppliers: Module.SUPPLIERS,
  part_time: Module.PART_TIME,
  parttime: Module.PART_TIME,
  'part-time': Module.PART_TIME,
  supplier: Module.SUPPLIERS,
  tedarikci: Module.SUPPLIERS,
  service_types: Module.SUPPLIERS,
  'service-types': Module.SUPPLIERS,
  tickets: Module.TICKETS,
  ticket: Module.TICKETS,
  bilet: Module.TICKETS,
  marketing: Module.MARKETING,
  pazarlama: Module.MARKETING,
  profile: Module.PROFILE,
  profil: Module.PROFILE
};

const ACTION_ALIASES: Record<string, Permission> = {
  view: Permission.VIEW,
  read: Permission.VIEW,
  list: Permission.VIEW,
  create: Permission.CREATE,
  add: Permission.CREATE,
  insert: Permission.CREATE,
  edit: Permission.EDIT,
  update: Permission.EDIT,
  write: Permission.EDIT,
  delete: Permission.DELETE,
  remove: Permission.DELETE
};

const normalizeKey = (value: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();

const normalizeRole = (role: string): string => {
  const key = normalizeKey(role);
  const normalized = ROLE_ALIASES[key] || key;
  if (role && role !== normalized) {
    console.debug(`[Permissions] Role normalized: "${role}" -> "${normalized}"`);
  }
  return normalized;
};

const normalizeModule = (moduleName: string): Module => {
  const key = normalizeKey(moduleName);
  return MODULE_ALIASES[key] || (key as Module);
};

const normalizeAction = (actionName: string): Permission => {
  const key = normalizeKey(actionName);
  return ACTION_ALIASES[key] || (key as Permission);
};

type GrantMap = Record<string, Record<Module, Set<Permission>>>;

type Snapshot = {
  grantMap: GrantMap;
  roleById: Record<string, string>;
  currentRole: string;
  ts: number;
};

// ── Cache katmanı ──────────────────────────────────────────────────────────────
// 1. In-memory cache (aynı sekme içindeki sayfalar arası)
let snapshotCache: Snapshot | null = null;
let permissionCache: Record<string, { value: boolean; ts: number }> = {};

// 2. sessionStorage cache (sayfa yenilenmelerinde tekrar fetch önler)
const SS_KEY = 'tt_perm_snapshot';
const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 dakika (eski: 10 saniye)

function loadFromSessionStorage(): Snapshot | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.ts > SNAPSHOT_TTL_MS) return null;

    // Set nesnelerini restore et
    const grantMap: GrantMap = {};
    for (const [role, modules] of Object.entries(parsed.grantMap as any)) {
      grantMap[role] = {} as any;
      for (const [mod, permsArr] of Object.entries(modules as any)) {
        grantMap[role][mod as Module] = new Set(permsArr as Permission[]);
      }
    }
    return { ...parsed, grantMap };
  } catch {
    return null;
  }
}

function saveToSessionStorage(snapshot: Snapshot) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    // Set → Array dönüşümü (JSON serialize için)
    const serializable: any = {
      ...snapshot,
      grantMap: {} as any
    };
    for (const [role, modules] of Object.entries(snapshot.grantMap)) {
      serializable.grantMap[role] = {};
      for (const [mod, permsSet] of Object.entries(modules)) {
        serializable.grantMap[role][mod] = Array.from(permsSet);
      }
    }
    sessionStorage.setItem(SS_KEY, JSON.stringify(serializable));
  } catch {}
}

async function loadAuthorizationSnapshot(force = false): Promise<Snapshot> {
  const now = Date.now();

  // 1. In-memory cache kontrolü
  if (!force && snapshotCache && now - snapshotCache.ts < SNAPSHOT_TTL_MS) {
    return snapshotCache;
  }

  // 2. sessionStorage cache kontrolü (force olmadan)
  if (!force) {
    const ss = loadFromSessionStorage();
    if (ss) {
      snapshotCache = ss;
      return ss;
    }
  }

  // 3. API fetch
  const { data: { session } } = await authService.supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('session token bulunamadi');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const resp = await fetch('/api/permissions/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error('permissions endpoint okunamadi');
    const payload = await resp.json();

    const currentRole = String(payload?.role || Role.VIEWER);
    const effectivePermissions = payload?.effectivePermissions || {};
    const grantMap: GrantMap = {};
    const roleKey = normalizeRole(currentRole);
    grantMap[roleKey] = {} as any;
    for (const [moduleRaw, actions] of Object.entries(effectivePermissions)) {
      const module = normalizeModule(moduleRaw);
      if (!grantMap[roleKey][module]) grantMap[roleKey][module] = new Set<Permission>();
      for (const actionRaw of (actions as string[])) {
        grantMap[roleKey][module].add(normalizeAction(actionRaw));
      }
    }

    const snapshot: Snapshot = { grantMap, roleById: {}, currentRole, ts: now };
    snapshotCache = snapshot;
    saveToSessionStorage(snapshot);
    return snapshot;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function isSuperAdminRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === Role.SUPER_ADMIN;
}

export async function checkPermission(userRole: string, module: Module, permission: Permission): Promise<boolean> {
  const roleKey = normalizeRole(userRole);
  const cacheKey = `${roleKey}:${module}:${permission}`;
  const now = Date.now();
  const cached = permissionCache[cacheKey];
  if (cached && now - cached.ts < SNAPSHOT_TTL_MS) return cached.value;

  if (isSuperAdminRole(userRole)) {
    permissionCache[cacheKey] = { value: true, ts: now };
    return true;
  }

  try {
    const snapshot = await loadAuthorizationSnapshot();
    const grants = snapshot.grantMap[roleKey] || snapshot.grantMap[normalizeRole(snapshot.currentRole)];
    const allowed = !!grants?.[module]?.has(permission);
    permissionCache[cacheKey] = { value: allowed, ts: now };
    return allowed;
  } catch {
    permissionCache[cacheKey] = { value: false, ts: now };
    return false;
  }
}

export const permissionService = {
  hasPermission(userRole: string, module: Module, permission: Permission): boolean {
    if (isSuperAdminRole(userRole)) return true;
    if (!snapshotCache) return false;
    const roleKey = normalizeRole(userRole);
    return !!snapshotCache.grantMap[roleKey]?.[module]?.has(permission);
  },
  getModulePermissions(userRole: string, module: Module): Permission[] {
    if (isSuperAdminRole(userRole)) return [Permission.VIEW, Permission.CREATE, Permission.EDIT, Permission.DELETE];
    if (!snapshotCache) return [];
    const roleKey = normalizeRole(userRole);
    return Array.from(snapshotCache.grantMap[roleKey]?.[module] || []);
  },
  getAllPermissions(userRole: string): Record<Module, Permission[]> {
    const all: Record<Module, Permission[]> = {} as any;
    for (const m of Object.values(Module)) all[m] = this.getModulePermissions(userRole, m as Module);
    return all;
  },
  getRoleDisplayName(role: string): string {
    const key = normalizeRole(role);
    const map: Record<string, string> = {
      [Role.SUPER_ADMIN]: 'Süper Admin',
      [Role.ADMIN]: 'Admin',
      [Role.MANAGER]: 'Müdür',
      [Role.USER]: 'Kullanıcı',
      [Role.VIEWER]: 'Görüntüleyici'
    };
    return map[key] || role;
  },
  getModuleDisplayName(module: Module): string {
    const map: Record<Module, string> = {
      [Module.HOME]: 'Ana Sayfa',
      [Module.DASHBOARD]: 'Dashboard',
      [Module.QUOTES]: 'Teklifler',
      [Module.PROJECTS]: 'Projeler',
      [Module.ACCOUNTING]: 'Muhasebe',
      [Module.CASH_FLOW]: 'Nakit Akışı',
      [Module.INVOICES]: 'Faturalar',
      [Module.EXCHANGE_RATES]: 'Döviz Kurları',
      [Module.AGENCIES]: 'Acenteler',
      [Module.HOTELS]: 'Oteller',
      [Module.CATEGORIES]: 'Kategoriler',
      [Module.USERS]: 'Kullanıcılar',
      [Module.REPORTS]: 'Raporlar',
      [Module.SETTINGS]: 'Ayarlar',
      [Module.SEJOUR]: 'Sejour',
      [Module.OPERATIONS]: 'Operasyon',
      [Module.TRANSFERS]: 'Transferler',
      [Module.GUIDES]: 'Rehberler',
      [Module.PART_TIME]: 'Part Time',
      [Module.SUPPLIERS]: 'Tedarikçiler',
      [Module.TICKETS]: 'Bilet',
      [Module.MARKETING]: 'Pazarlama (Marketing)',
      [Module.PROFILE]: 'Profil'
    };
    return map[module];
  },
  getPermissionDisplayName(permission: Permission): string {
    const map: Record<Permission, string> = {
      [Permission.VIEW]: 'Görüntüleme',
      [Permission.CREATE]: 'Ekleme',
      [Permission.EDIT]: 'Düzenleme',
      [Permission.DELETE]: 'Silme'
    };
    return map[permission];
  },
  clearCache(): void {
    snapshotCache = null;
    permissionCache = {};
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SS_KEY);
    }
    deleteCookie('currentUserRole');
    console.debug('[Permissions] Cache cleared');
  }
};

// ── usePermissions hook ────────────────────────────────────────────────────────
export const usePermissions = (explicitRole?: string) => {
  // Cookie'den mevcut rolü al — ilk render için hızlı başlangıç değeri
  const [resolvedRole, setResolvedRole] = useState<string>(
    () => explicitRole || getCookie('currentUserRole') || Role.VIEWER
  );
  const [loading, setLoading] = useState(true);
  const [grantMap, setGrantMap] = useState<GrantMap>(() => {
    // Hızlı başlangıç: sessionStorage'dan grantMap yükle (senkron)
    const ss = loadFromSessionStorage();
    if (ss) return ss.grantMap;
    return {};
  });

  useEffect(() => {
    let mounted = true;

    // Eğer in-memory cache varsa anında kullan, arka planda refresh et
    if (snapshotCache && Date.now() - snapshotCache.ts < SNAPSHOT_TTL_MS) {
      const effectiveRole = explicitRole || snapshotCache.currentRole || resolvedRole;
      if (mounted) {
        setResolvedRole(effectiveRole);
        setGrantMap(snapshotCache.grantMap);
        setLoading(false);
        setCookie('currentUserRole', effectiveRole);
      }
      return () => { mounted = false; };
    }

    const run = async () => {
      try {
        // Tek API çağrısı — snapshot içinden role ve permissions birlikte gelir
        const snapshot = await loadAuthorizationSnapshot(false);
        if (!mounted) return;
        const effectiveRole = explicitRole || snapshot.currentRole || Role.VIEWER;
        setResolvedRole(effectiveRole);
        setCookie('currentUserRole', effectiveRole);
        setGrantMap(snapshot.grantMap);
      } catch {
        if (!mounted) return;
        setGrantMap({});
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => { mounted = false; };
  }, [explicitRole]);

  const roleKey = useMemo(() => normalizeRole(resolvedRole), [resolvedRole]);
  const grants = grantMap[roleKey];

  useEffect(() => {
    if (!loading) {
      const isSuper = isSuperAdminRole(resolvedRole);
      const permsCount = Object.keys(grantMap[normalizeRole(resolvedRole)] || {}).length;
      console.log(`%c🛡️ PERMISSION SYSTEM: Role: "${resolvedRole}" ${isSuper ? '(SUPER ADMIN)' : `(${permsCount} modules)`}`, 
        `color: ${isSuper ? '#8b5cf6' : '#3b82f6'}; font-weight: bold; font-size: 10px;`);
      
      if (!isSuper && permsCount === 0 && !loading) {
        console.warn('[Permissions] WARNING: No permissions found for non-super-admin role. This might be a sync issue.');
      }
    }
  }, [resolvedRole, loading, grantMap]);

  return useMemo(() => ({
    canView: (module: Module) => {
      if (loading) return false;
      if (isSuperAdminRole(resolvedRole)) return true;
      return !!grantMap[normalizeRole(resolvedRole)]?.[module]?.has(Permission.VIEW);
    },
    canEdit: (module: Module) => {
      if (loading) return false;
      if (isSuperAdminRole(resolvedRole)) return true;
      return !!grantMap[normalizeRole(resolvedRole)]?.[module]?.has(Permission.EDIT);
    },
    canCreate: (module: Module) => {
      if (loading) return false;
      if (isSuperAdminRole(resolvedRole)) return true;
      return !!grantMap[normalizeRole(resolvedRole)]?.[module]?.has(Permission.CREATE);
    },
    canDelete: (module: Module) => {
      if (loading) return false;
      if (isSuperAdminRole(resolvedRole)) return true;
      return !!grantMap[normalizeRole(resolvedRole)]?.[module]?.has(Permission.DELETE);
    },
    getModulePermissions: (module: Module) => {
      if (isSuperAdminRole(resolvedRole)) {
        return [Permission.VIEW, Permission.CREATE, Permission.EDIT, Permission.DELETE];
      }
      return Array.from(grantMap[normalizeRole(resolvedRole)]?.[module] || []);
    },
    getAllPermissions: () => {
      const all: Record<Module, Permission[]> = {} as any;
      for (const m of Object.values(Module)) {
        all[m as Module] = isSuperAdminRole(resolvedRole)
          ? [Permission.VIEW, Permission.CREATE, Permission.EDIT, Permission.DELETE]
          : Array.from(grantMap[normalizeRole(resolvedRole)]?.[m as Module] || []);
      }
      return all;
    },
    userRole: resolvedRole,
    loading
  }), [resolvedRole, grantMap, loading]);
};