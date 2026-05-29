'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { rolesService, permissionsService, rolePermissionsService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';
import { storage } from '@/utils/safeStorage';
import { Pencil, Trash2, Shield, Info, Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';

interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  permissions?: {
    id: string;
    module: string;
    action: string;
    description: string;
  };
}

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
  is_active: boolean;
}

type ModuleMeta = {
  id: string;
  name: string;
  icon: string;
};

const MODULE_META: Record<string, ModuleMeta> = {
  home: { id: 'home', name: 'Ana Sayfa', icon: '🏠' },
  dashboard: { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  quotes: { id: 'quotes', name: 'Teklif', icon: '📋' },
  projects: { id: 'projects', name: 'Proje', icon: '📁' },
  accounting: { id: 'accounting', name: 'Muhasebe (Grup)', icon: '💰' },
  cash_flow: { id: 'cash_flow', name: 'Nakit Akış', icon: '💵' },
  invoices: { id: 'invoices', name: 'Faturalar (Gelir/Gider)', icon: '📄' },
  sejour: { id: 'sejour', name: 'Sejour', icon: '🏖️' },
  operations: { id: 'operations', name: 'Operasyon (Grup)', icon: '⚙️' },
  transfers: { id: 'transfers', name: 'Transfer', icon: '🚐' },
  guides: { id: 'guides', name: 'Kokartlı Rehber', icon: '👨‍💼' },
  part_time: { id: 'part_time', name: 'Part-Time', icon: '⏰' },
  tickets: { id: 'tickets', name: 'Bilet Yönetimi', icon: '🎫' },
  reports: { id: 'reports', name: 'Raporlar', icon: '📈' },
  hotels: { id: 'hotels', name: 'Otel', icon: '🏨' },
  suppliers: { id: 'suppliers', name: 'Tedarikçi', icon: '🏢' },
  agencies: { id: 'agencies', name: 'Acenta', icon: '🏛️' },
  categories: { id: 'categories', name: 'Kategori', icon: '🏷️' },
  users: { id: 'users', name: 'Kullanıcı Yönetimi', icon: '👥' },
  settings: { id: 'settings', name: 'Ayarlar', icon: '⚙️' },
  marketing: { id: 'marketing', name: 'Pazarlama (Marketing)', icon: '📢' },
  profile: { id: 'profile', name: 'Profil', icon: '👤' }
};

const MODULE_ORDER = [
  'home',
  'dashboard',
  'quotes',
  'projects',
  'accounting',
  'cash_flow',
  'invoices',
  'sejour',
  'operations',
  'transfers',
  'guides',
  'part_time',
  'tickets',
  'reports',
  'hotels',
  'suppliers',
  'agencies',
  'categories',
  'users',
  'marketing',
  'settings',
  'profile'
];

const MODULE_ALIASES: Record<string, string> = {
  mice: 'quotes',
  quote: 'quotes',
  teklif: 'quotes',
  proje: 'projects',
  project: 'projects',
  otel: 'hotels',
  hotel: 'hotels',
  kategori: 'categories',
  rapor: 'reports',
  operation: 'operations',
  bilet: 'tickets',
  marketing: 'marketing',
  pazarlama: 'marketing',
  sejur: 'sejour',
  service_types: 'suppliers',
  'service-types': 'suppliers',
  accounting: 'projects',
  budgets: 'budget',
  part_time: 'part_time',
  parttime: 'part_time',
  'part-time': 'part_time',
  cash_flow: 'cash_flow',
  cashflow: 'cash_flow'
};

const normalizeModuleId = (moduleId: string) => {
  const raw = String(moduleId || '').trim().toLowerCase();
  return MODULE_ALIASES[raw] || raw;
};

const PERMISSIONS = [
  { id: 'view', name: 'Görüntüleme', color: 'blue' },
  { id: 'create', name: 'Ekleme', color: 'green' },
  { id: 'edit', name: 'Düzenleme', color: 'yellow' },
  { id: 'delete', name: 'Silme', color: 'red' }
];

export default function RolePermissionsPage() {
  const { canView, canEdit, loading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [moduleQuery, setModuleQuery] = useState('');
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // New state for batch saving
  const [stagedPermissions, setStagedPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load roles from Supabase
      const rolesData = await rolesService.getAll();
      // Türkçe rolleri önceliklendir: Eğer hem İngilizce hem Türkçe varsa, Türkçe olanı tut
      const filteredRoles = rolesData.filter((role: Role) => {
        // Standart İngilizce roller: admin, manager, user, super_admin, viewer
        const standardRoles = ['admin', 'manager', 'user', 'super_admin', 'viewer'];
        const isStandard = standardRoles.includes(role.name.toLowerCase());
        
        // Eğer standart İngilizce rol ise ve Türkçe versiyonu varsa, İngilizce olanı filtrele
        if (isStandard) {
          const turkishVersion = rolesData.find((r: Role) => {
            const nameLower = role.name.toLowerCase();
            return (
              (nameLower === 'admin' && r.name === 'Admin') ||
              (nameLower === 'manager' && (r.name === 'Müdür' || r.name === 'Manager')) ||
              (nameLower === 'user' && r.name === 'Kullanıcı') ||
              (nameLower === 'super_admin' && r.name === 'Süper Admin')
            );
          });
          // Türkçe versiyonu varsa, İngilizce olanı filtrele
          return !turkishVersion;
        }
        // Diğer rolleri tut
        return true;
      });
      setRoles(filteredRoles);
      if (filteredRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(filteredRoles[0].id);
      }

      // Load permissions from Supabase
      const permissionsData = await permissionsService.getAll();
      setPermissions(permissionsData);

      // Load role permissions from Supabase
      const rolePermissionsData = await rolePermissionsService.getAll();
      console.log('Role permissions loaded:', rolePermissionsData);
      setRolePermissions(rolePermissionsData);

    } catch (error: any) {
      console.error('Load data error:', error);
      setError('Veriler yüklenirken hata oluştu: ' + error.message);
      
      // Fallback to localStorage if Supabase fails
      try {
        const storedRoles = storage.getItem('roles');
        if (storedRoles) {
          const parsedRoles = JSON.parse(storedRoles);
          setRoles(parsedRoles);
        }

        const storedPermissions = storage.getItem('rolePermissions');
        if (storedPermissions) {
          const parsedPermissions = JSON.parse(storedPermissions);
          setRolePermissions(parsedPermissions);
        }
      } catch (localError) {
        console.error('localStorage fallback error:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moduleList = useMemo(() => {
    const fromEnum = Object.values(Module).map((moduleId) => {
      const normalized = normalizeModuleId(moduleId);
      return MODULE_META[normalized] || { id: normalized, name: normalized, icon: '🧩' };
    });
    const dynamicModules = Array.from(new Set(permissions.map((p) => p.module))).map((moduleId) => {
      const normalized = normalizeModuleId(moduleId);
      return MODULE_META[normalized] || { id: normalized, name: normalized, icon: '🧩' };
    });
    const merged = [...fromEnum, ...dynamicModules].reduce<Record<string, ModuleMeta>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    return MODULE_ORDER
      .filter((moduleId) => !!merged[moduleId])
      .map((moduleId) => merged[moduleId]);
  }, [permissions]);

  const filteredModules = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase();
    if (!query) return moduleList;
    return moduleList.filter((module) => {
      return module.name.toLowerCase().includes(query) || module.id.toLowerCase().includes(query);
    });
  }, [moduleList, moduleQuery]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0];
  const selectedRoleEffectiveId = selectedRole?.id || '';

  // Initialize staged permissions when role changes or data loads
  useEffect(() => {
    if (selectedRoleEffectiveId) {
      const initialStaged = new Set<string>();
      rolePermissions.forEach(rp => {
        if (rp.role_id === selectedRoleEffectiveId && rp.permissions) {
          const mod = normalizeModuleId(rp.permissions.module);
          const act = rp.permissions.action;
          initialStaged.add(`${mod}:${act}`);
        }
      });
      setStagedPermissions(initialStaged);
    }
  }, [selectedRoleEffectiveId, rolePermissions]);

  const selectedRolePermissionCount = useMemo(() => {
    if (!selectedRoleEffectiveId) return 0;
    return rolePermissions.filter((rp) => rp.role_id === selectedRoleEffectiveId).length;
  }, [rolePermissions, selectedRoleEffectiveId]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRoleEffectiveId) return false;
    const initialStaged = new Set<string>();
    rolePermissions.forEach(rp => {
      if (rp.role_id === selectedRoleEffectiveId && rp.permissions) {
        initialStaged.add(`${normalizeModuleId(rp.permissions.module)}:${rp.permissions.action}`);
      }
    });
    if (initialStaged.size !== stagedPermissions.size) return true;
    for (const item of stagedPermissions) {
      if (!initialStaged.has(item)) return true;
    }
    return false;
  }, [stagedPermissions, rolePermissions, selectedRoleEffectiveId]);

  const handleRoleSelect = (roleId: string) => {
    if (roleId === selectedRoleEffectiveId) return;
    if (hasUnsavedChanges) {
      setPendingRoleSwitch(roleId);
      setShowUnsavedModal(true);
    } else {
      setSelectedRoleId(roleId);
    }
  };

  const confirmRoleSwitch = () => {
    if (pendingRoleSwitch) {
      setSelectedRoleId(pendingRoleSwitch);
      setPendingRoleSwitch(null);
    }
    setShowUnsavedModal(false);
  };

  // USERS modülü için VIEW yetkisi kontrolü (Rol ve Yetki Yönetimi USERS modülü altında)
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.USERS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Rol ve Yetki Yönetimi sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const handlePermissionChange = (moduleId: string, permissionId: string, value: boolean) => {
    const key = `${moduleId}:${permissionId}`;
    setStagedPermissions(prev => {
      const next = new Set(prev);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleToggleColumn = (permissionId: string, value: boolean) => {
    setStagedPermissions(prev => {
      const next = new Set(prev);
      filteredModules.forEach(mod => {
        const key = `${mod.id}:${permissionId}`;
        const hasPermissionRecord = permissions.some(p => normalizeModuleId(p.module) === mod.id && p.action === permissionId);
        if (hasPermissionRecord) {
          if (value) next.add(key);
          else next.delete(key);
        }
      });
      return next;
    });
  };

  const handleToggleRow = (moduleId: string, value: boolean) => {
    setStagedPermissions(prev => {
      const next = new Set(prev);
      PERMISSIONS.forEach(perm => {
        const key = `${moduleId}:${perm.id}`;
        const hasPermissionRecord = permissions.some(p => normalizeModuleId(p.module) === moduleId && p.action === perm.id);
        if (hasPermissionRecord) {
          if (value) next.add(key);
          else next.delete(key);
        }
      });
      return next;
    });
  };

  const handleToggleAll = (value: boolean) => {
    setStagedPermissions(prev => {
      const next = new Set(prev);
      filteredModules.forEach(mod => {
        PERMISSIONS.forEach(perm => {
          const key = `${mod.id}:${perm.id}`;
          const hasPermissionRecord = permissions.some(p => normalizeModuleId(p.module) === mod.id && p.action === perm.id);
          if (hasPermissionRecord) {
            if (value) next.add(key);
            else next.delete(key);
          }
        });
      });
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleEffectiveId) return;
    setIsSaving(true);
    try {
      // Bul: Eklenecek ve silinecek yetkiler
      const initialStaged = new Set<string>();
      const initialRolePerms = rolePermissions.filter(rp => rp.role_id === selectedRoleEffectiveId && rp.permissions);
      
      const permissionRecordMap = new Map<string, string>(); // 'module:action' -> permission_id
      permissions.forEach(p => {
        permissionRecordMap.set(`${normalizeModuleId(p.module)}:${p.action}`, p.id);
      });

      initialRolePerms.forEach(rp => {
        if (rp.permissions) {
          initialStaged.add(`${normalizeModuleId(rp.permissions.module)}:${rp.permissions.action}`);
        }
      });

      const toAdd: string[] = [];
      const toRemove: string[] = [];

      for (const item of stagedPermissions) {
        if (!initialStaged.has(item)) {
          const permId = permissionRecordMap.get(item);
          if (permId) toAdd.push(permId);
        }
      }

      for (const item of initialStaged) {
        if (!stagedPermissions.has(item)) {
          const permId = permissionRecordMap.get(item);
          if (permId) toRemove.push(permId);
        }
      }

      // Supabase'e islem gonder
      for (const permId of toAdd) {
        await rolePermissionsService.upsert(selectedRoleEffectiveId, permId);
      }
      for (const permId of toRemove) {
        await rolePermissionsService.deleteByRoleAndPermission(selectedRoleEffectiveId, permId);
      }

      await loadData();
      setSuccess('Yetkiler başarıyla kaydedildi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Save permissions error:', error);
      setError('Yetkiler kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      await rolesService.update(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description
      });

      // Reload data to get updated roles
      await loadData();
      
      setEditingRole(null);
      setShowEditRoleModal(false);
      setSuccess('Rol başarıyla güncellendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Update role error:', error);
      setError('Rol güncellenirken hata oluştu: ' + error.message);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      setError('Rol adı gereklidir');
      return;
    }

    try {
      const newRoleData = await rolesService.create({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        is_active: true
      });

      // Reload data to get updated roles
      await loadData();

      setNewRole({ name: '', description: '' });
      setShowAddRoleModal(false);
      setSuccess('Yeni rol başarıyla eklendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Add role error:', error);
      setError('Rol eklenirken hata oluştu: ' + error.message);
    }
  };

  const getRolePermission = (moduleId: string, action: string) => {
    const key = `${normalizeModuleId(moduleId)}:${action}`;
    return stagedPermissions.has(key);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowEditRoleModal(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await rolesService.delete(roleId);
      await loadData();
      setSuccess('Rol başarıyla silindi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Delete role error:', error);
      setError('Rol silinirken hata oluştu: ' + error.message);
    } finally {
      setRoleToDelete(null);
    }
  };



  if (loading) {
    return <LoadingSpinner message="Rol ve yetkiler yükleniyor..." />;
  }


  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Rol ve Yetki Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Rol seçip modüllere ait izinleri hızlı biçimde yönetin</p>
          </div>
          {canEdit(Module.USERS) && (
            <button
              onClick={() => setShowAddRoleModal(true)}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              + Yeni Rol
            </button>
          )}
        </div>
        {/* Stats Cards */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Rol</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{roles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 5.04c-.233 2.411.269 4.9 1.462 7.045 1.373 2.47 3.541 4.417 6.156 5.584a11.91 11.91 0 0010 0c2.615-1.167 4.783-3.114 6.156-5.584 1.193-2.145 1.695-4.634 1.462-7.045a11.955 11.955 0 01-8.618-5.04z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Modül</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{moduleList.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-2 p-2 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 rounded-md text-xs">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-0">
          <div className="xl:col-span-1 rounded-2xl border border-slate-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 shadow-sm p-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Roller</h2>
            <div className="space-y-2 overflow-y-auto pr-1">
              {roles.map((role) => {
                const active = role.id === selectedRoleEffectiveId;
                return (
                  <div
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition-all cursor-pointer ${
                      active
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm text-slate-900 dark:text-white">{role.name}</div>
                      {canEdit(Module.USERS) && (
                        <div className="flex items-center gap-1">

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRole(role);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleToDelete(role.id);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{role.description || 'Aciklama yok'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-3 rounded-2xl border border-slate-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 shadow-sm p-3 md:p-4 flex flex-col min-h-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {selectedRole ? `${selectedRole.name} - Yetki Duzenleme` : 'Rol secin'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modul kartlarindan goruntuleme, ekleme, duzenleme ve silme izinlerini yonetebilirsiniz.
                </p>
              </div>
              <input
                type="text"
                value={moduleQuery}
                onChange={(e) => setModuleQuery(e.target.value)}
                placeholder="Modul ara..."
                className="w-full md:w-64 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-auto pr-1">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 dark:bg-gray-800/50 sticky top-0 z-10">
                  <tr>
                    <th className="border-b border-slate-200 dark:border-gray-700 py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Modül
                    </th>
                    {PERMISSIONS.map(perm => {
                      // Check if all available modules have this permission
                      let totalAvailable = 0;
                      let totalSelected = 0;
                      filteredModules.forEach(mod => {
                        if (permissions.some(p => normalizeModuleId(p.module) === mod.id && p.action === perm.id)) {
                          totalAvailable++;
                          if (getRolePermission(mod.id, perm.id)) totalSelected++;
                        }
                      });
                      const isAllSelected = totalAvailable > 0 && totalSelected === totalAvailable;
                      
                      return (
                        <th key={perm.id} className="border-b border-slate-200 dark:border-gray-700 py-3 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center gap-1">
                            <span>{perm.name}</span>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              disabled={!canEdit(Module.USERS) || !selectedRoleEffectiveId}
                              onChange={(e) => handleToggleColumn(perm.id, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              title="Tümünü Seç"
                            />
                          </div>
                        </th>
                      );
                    })}
                    <th className="border-b border-slate-200 dark:border-gray-700 py-3 px-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-1">
                        <span>Satır Tümünü Seç</span>
                        <input
                          type="checkbox"
                          checked={(() => {
                            let totalAvailable = 0;
                            let totalSelected = 0;
                            filteredModules.forEach(mod => {
                              PERMISSIONS.forEach(perm => {
                                if (permissions.some(p => normalizeModuleId(p.module) === mod.id && p.action === perm.id)) {
                                  totalAvailable++;
                                  if (getRolePermission(mod.id, perm.id)) totalSelected++;
                                }
                              });
                            });
                            return totalAvailable > 0 && totalSelected === totalAvailable;
                          })()}
                          disabled={!canEdit(Module.USERS) || !selectedRoleEffectiveId}
                          onChange={(e) => handleToggleAll(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          title="Sayfadaki Tüm Yetkileri Seç"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {filteredModules.map((module) => {
                    // Check if all permissions for this row are selected
                    let rowTotalAvailable = 0;
                    let rowTotalSelected = 0;
                    PERMISSIONS.forEach(perm => {
                      if (permissions.some(p => normalizeModuleId(p.module) === module.id && p.action === perm.id)) {
                        rowTotalAvailable++;
                        if (getRolePermission(module.id, perm.id)) rowTotalSelected++;
                      }
                    });
                    const isRowSelected = rowTotalAvailable > 0 && rowTotalSelected === rowTotalAvailable;

                    return (
                      <tr key={module.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{module.icon}</span>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">{module.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{module.id}</div>
                            </div>
                          </div>
                        </td>
                        {PERMISSIONS.map((permission) => {
                          const permissionRecord = permissions.find((p) => normalizeModuleId(p.module) === module.id && p.action === permission.id);
                          const isChecked = getRolePermission(module.id, permission.id);
                          const isDisabled = !permissionRecord || !canEdit(Module.USERS) || !selectedRoleEffectiveId;
                          
                          return (
                            <td key={permission.id} className="py-3 px-4 text-center">
                              {permissionRecord ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={(e) => handlePermissionChange(module.id, permission.id, e.target.checked)}
                                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                                />
                              ) : (
                                <span className="text-slate-300 dark:text-gray-600">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            disabled={!canEdit(Module.USERS) || !selectedRoleEffectiveId || rowTotalAvailable === 0}
                            onChange={(e) => handleToggleRow(module.id, e.target.checked)}
                            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            title="Bu modülün tüm yetkilerini seç"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredModules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Aramanıza uygun modül bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Save Button Container */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleSavePermissions}
                disabled={!hasUnsavedChanges || isSaving || !canEdit(Module.USERS)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  hasUnsavedChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <Modal
        isOpen={showAddRoleModal}
        onClose={() => setShowAddRoleModal(false)}
        title="Yeni Rol Ekle"
      >
        <form onSubmit={handleAddRole} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" />
              Rol Adı
            </label>
            <input
              type="text"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white transition-all"
              placeholder="Örn: Proje Yöneticisi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              Açıklama
            </label>
            <textarea
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white transition-all"
              rows={3}
              placeholder="Rol yetkileri hakkında kısa bilgi..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddRoleModal(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Rolü Oluştur
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => setShowEditRoleModal(false)}
        title="Rol Düzenle"
      >
        {editingRole && (
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                Rol Adı
              </label>
              <input
                type="text"
                value={editingRole.name}
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                Açıklama
              </label>
              <textarea
                value={editingRole.description}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white transition-all"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditRoleModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Pencil size={18} />
                Güncelle
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!roleToDelete}
        title="Rolü Sil"
        message="Bu rolü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={() => roleToDelete && handleDeleteRole(roleToDelete)}
        onCancel={() => setRoleToDelete(null)}
        confirmText="Evet, Sil"
        cancelText="İptal"
        type="danger"
      />

      {/* Unsaved Changes Modal */}
      <ConfirmModal
        isOpen={showUnsavedModal}
        title="Kaydedilmemiş Değişiklikler"
        message="Bu roldeki yetkilerde değişiklik yaptınız ama kaydetmediniz. Başka bir role geçerseniz bu değişiklikler iptal edilecek. Devam etmek istiyor musunuz?"
        onConfirm={confirmRoleSwitch}
        onCancel={() => {
          setShowUnsavedModal(false);
          setPendingRoleSwitch(null);
        }}
        confirmText="Evet, Değişiklikleri İptal Et"
        cancelText="Hayır, Geri Dön"
        type="danger"
      />


    </div>
  );
} 