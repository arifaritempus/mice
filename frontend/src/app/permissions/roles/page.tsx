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

  const selectedRolePermissionCount = useMemo(() => {
    if (!selectedRoleEffectiveId) return 0;
    return rolePermissions.filter((rp) => rp.role_id === selectedRoleEffectiveId).length;
  }, [rolePermissions, selectedRoleEffectiveId]);

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

  const handlePermissionChange = async (roleId: string, permissionId: string, value: boolean) => {
    try {
      if (value) {
        // Add permission
        await rolePermissionsService.upsert(roleId, permissionId);
      } else {
        // Remove permission
        await rolePermissionsService.deleteByRoleAndPermission(roleId, permissionId);
      }

      // Reload data to get updated permissions
      await loadData();
      setSuccess('Rol yetkisi güncellendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Permission change error:', error);
      setError('Yetki güncellenirken hata oluştu: ' + error.message);
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

  const getRolePermission = (roleId: string, moduleId: string, action: string) => {
    // Check if role has this permission
    const normalizedModule = normalizeModuleId(moduleId);
    const rolePermission = rolePermissions.find(rp => 
      rp.role_id === roleId && 
      rp.permissions && 
      normalizeModuleId(rp.permissions.module) === normalizedModule && 
      rp.permissions.action === action
    );
    
    return !!rolePermission;
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
                    onClick={() => setSelectedRoleId(role.id)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
              {filteredModules.map((module) => (
                <div key={module.id} className="rounded-xl border border-slate-200 dark:border-gray-700 p-3 bg-slate-50/70 dark:bg-gray-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{module.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{module.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{module.id}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSIONS.map((permission) => {
                      const permissionRecord = permissions.find((p) => normalizeModuleId(p.module) === module.id && p.action === permission.id);
                      const isChecked = selectedRoleEffectiveId
                        ? getRolePermission(selectedRoleEffectiveId, module.id, permission.id)
                        : false;
                      const isDisabled = !permissionRecord || !canEdit(Module.USERS) || !selectedRoleEffectiveId;
                      return (
                        <label
                          key={`${module.id}-${permission.id}`}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-xs ${
                            isDisabled
                              ? 'border-slate-200 dark:border-gray-700 text-slate-400 dark:text-slate-500'
                              : 'border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (permissionRecord && selectedRoleEffectiveId && canEdit(Module.USERS)) {
                                handlePermissionChange(selectedRoleEffectiveId, permissionRecord.id, e.target.checked);
                              }
                            }}
                            disabled={isDisabled}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{permission.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 dark:border-gray-600 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Aramaniza uygun modul bulunamadi.
                </div>
              )}
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


    </div>
  );
} 