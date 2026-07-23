"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  rolesService,
  permissionsService,
  rolePermissionsService,
} from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";
import { storage } from "@/utils/safeStorage";
import { Pencil, Trash2, Shield, Info, Plus } from "lucide-react";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

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
  home: { id: "home", name: "Ana Sayfa", icon: "🏠" },
  dashboard: { id: "dashboard", name: "Dashboard", icon: "📊" },
  quotes: { id: "quotes", name: "Teklif", icon: "📋" },
  projects: { id: "projects", name: "Proje", icon: "📁" },
  accounting: { id: "accounting", name: "Muhasebe (Grup)", icon: "💰" },
  cash_flow: { id: "cash_flow", name: "Nakit Akış", icon: "💵" },
  invoices: { id: "invoices", name: "Faturalar (Gelir/Gider)", icon: "📄" },
  exchange_rates: { id: "exchange_rates", name: "Döviz Kurları", icon: "💱" },
  sejour: { id: "sejour", name: "Sejour", icon: "🏖️" },
  operations: { id: "operations", name: "Operasyon (Grup)", icon: "⚙️" },
  transfers: { id: "transfers", name: "Transfer", icon: "🚐" },
  guides: { id: "guides", name: "Kokartlı Rehber", icon: "👨‍💼" },
  part_time: { id: "part_time", name: "Part-Time", icon: "⏰" },
  tickets: { id: "tickets", name: "Bilet Yönetimi", icon: "🎫" },
  reports: { id: "reports", name: "Raporlar", icon: "📈" },
  hotels: { id: "hotels", name: "Otel", icon: "🏨" },
  suppliers: { id: "suppliers", name: "Tedarikçi", icon: "🏢" },
  agencies: { id: "agencies", name: "Acenta", icon: "🏛️" },
  categories: { id: "categories", name: "Kategori", icon: "🏷️" },
  users: { id: "users", name: "Kullanıcı Yönetimi", icon: "👥" },
  settings: { id: "settings", name: "Ayarlar", icon: "⚙️" },
  marketing: { id: "marketing", name: "Pazarlama (Marketing)", icon: "📢" },
  profile: { id: "profile", name: "Profil", icon: "👤" },
};

const MODULE_ORDER = [
  "home",
  "dashboard",
  "quotes",
  "projects",
  "accounting",
  "cash_flow",
  "invoices",
  "exchange_rates",
  "sejour",
  "operations",
  "transfers",
  "guides",
  "part_time",
  "tickets",
  "reports",
  "hotels",
  "suppliers",
  "agencies",
  "categories",
  "users",
  "marketing",
  "settings",
  "profile",
];

const MODULE_ALIASES: Record<string, string> = {
  mice: "quotes",
  quote: "quotes",
  teklif: "quotes",
  proje: "projects",
  project: "projects",
  otel: "hotels",
  hotel: "hotels",
  kategori: "categories",
  rapor: "reports",
  operation: "operations",
  bilet: "tickets",
  marketing: "marketing",
  pazarlama: "marketing",
  sejur: "sejour",
  service_types: "supplier_categories",
  "service-types": "supplier_categories",
  budgets: "budget",
  part_time: "part_time",
  parttime: "part_time",
  "part-time": "part_time",
  cash_flow: "cash_flow",
  cashflow: "cash_flow",
  exchange_rates: "exchange_rates",
  "exchange-rates": "exchange_rates",
};

const normalizeModuleId = (moduleId: string) => {
  const raw = String(moduleId || "")
    .trim()
    .toLowerCase();
  return MODULE_ALIASES[raw] || raw;
};

const PERMISSIONS = [
  { id: "view", name: "Görüntüleme", color: "blue" },
  { id: "create", name: "Ekleme", color: "green" },
  { id: "edit", name: "Düzenleme", color: "yellow" },
  { id: "delete", name: "Silme", color: "red" },
];

export default function RolePermissionsPage() {
  const { canView, canEdit, loading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [moduleQuery, setModuleQuery] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // New state for batch saving
  const [stagedPermissions, setStagedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<string | null>(
    null,
  );
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load roles from Supabase
      const rolesData = await rolesService.getAll();
      // Türkçe rolleri önceliklendir: Eğer hem İngilizce hem Türkçe varsa, Türkçe olanı tut
      const filteredRoles = rolesData.filter((role: Role) => {
        // Standart İngilizce roller: admin, manager, user, super_admin, viewer
        const standardRoles = [
          "admin",
          "manager",
          "user",
          "super_admin",
          "viewer",
        ];
        const isStandard = standardRoles.includes(role.name.toLowerCase());

        // Eğer standart İngilizce rol ise ve Türkçe versiyonu varsa, İngilizce olanı filtrele
        if (isStandard) {
          const turkishVersion = rolesData.find((r: Role) => {
            const nameLower = role.name.toLowerCase();
            return (
              (nameLower === "admin" && r.name === "Admin") ||
              (nameLower === "manager" &&
                (r.name === "Müdür" || r.name === "Manager")) ||
              (nameLower === "user" && r.name === "Kullanıcı") ||
              (nameLower === "super_admin" && r.name === "Süper Admin")
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
      console.log("Role permissions loaded:", rolePermissionsData);
      setRolePermissions(rolePermissionsData);
    } catch (error: any) {
      console.error("Load data error:", error);
      setError("Veriler yüklenirken hata oluştu: " + error.message);

      // Fallback to localStorage if Supabase fails
      try {
        const storedRoles = storage.getItem("roles");
        if (storedRoles) {
          const parsedRoles = JSON.parse(storedRoles);
          setRoles(parsedRoles);
        }

        const storedPermissions = storage.getItem("rolePermissions");
        if (storedPermissions) {
          const parsedPermissions = JSON.parse(storedPermissions);
          setRolePermissions(parsedPermissions);
        }
      } catch (localError) {
        console.error("localStorage fallback error:", localError);
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
      return (
        MODULE_META[normalized] || {
          id: normalized,
          name: normalized,
          icon: "🧩",
        }
      );
    });
    const dynamicModules = Array.from(
      new Set(permissions.map((p) => p.module)),
    ).map((moduleId) => {
      const normalized = normalizeModuleId(moduleId);
      return (
        MODULE_META[normalized] || {
          id: normalized,
          name: normalized,
          icon: "🧩",
        }
      );
    });
    const merged = [...fromEnum, ...dynamicModules].reduce<
      Record<string, ModuleMeta>
    >((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    return MODULE_ORDER.filter((moduleId) => !!merged[moduleId]).map(
      (moduleId) => merged[moduleId],
    );
  }, [permissions]);

  const filteredModules = useMemo(() => {
    const query = moduleQuery.trim().toLowerCase();
    if (!query) return moduleList;
    return moduleList.filter((module) => {
      return (
        module.name.toLowerCase().includes(query) ||
        module.id.toLowerCase().includes(query)
      );
    });
  }, [moduleList, moduleQuery]);

  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0];
  const selectedRoleEffectiveId = selectedRole?.id || "";

  // Initialize staged permissions when role changes or data loads
  useEffect(() => {
    if (selectedRoleEffectiveId) {
      const initialStaged = new Set<string>();
      rolePermissions.forEach((rp) => {
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
    return rolePermissions.filter(
      (rp) => rp.role_id === selectedRoleEffectiveId,
    ).length;
  }, [rolePermissions, selectedRoleEffectiveId]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRoleEffectiveId) return false;
    const initialStaged = new Set<string>();
    rolePermissions.forEach((rp) => {
      if (rp.role_id === selectedRoleEffectiveId && rp.permissions) {
        initialStaged.add(
          `${normalizeModuleId(rp.permissions.module)}:${rp.permissions.action}`,
        );
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
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Rol ve Yetki Yönetimi sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <Link
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const handlePermissionChange = (
    moduleId: string,
    permissionId: string,
    value: boolean,
  ) => {
    const key = `${moduleId}:${permissionId}`;
    setStagedPermissions((prev) => {
      const next = new Set(prev);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleToggleColumn = (permissionId: string, value: boolean) => {
    setStagedPermissions((prev) => {
      const next = new Set(prev);
      filteredModules.forEach((mod) => {
        const key = `${mod.id}:${permissionId}`;
        const hasPermissionRecord = permissions.some(
          (p) =>
            normalizeModuleId(p.module) === mod.id && p.action === permissionId,
        );
        if (hasPermissionRecord) {
          if (value) next.add(key);
          else next.delete(key);
        }
      });
      return next;
    });
  };

  const handleToggleRow = (moduleId: string, value: boolean) => {
    setStagedPermissions((prev) => {
      const next = new Set(prev);
      PERMISSIONS.forEach((perm) => {
        const key = `${moduleId}:${perm.id}`;
        const hasPermissionRecord = permissions.some(
          (p) =>
            normalizeModuleId(p.module) === moduleId && p.action === perm.id,
        );
        if (hasPermissionRecord) {
          if (value) next.add(key);
          else next.delete(key);
        }
      });
      return next;
    });
  };

  const handleToggleAll = (value: boolean) => {
    setStagedPermissions((prev) => {
      const next = new Set(prev);
      filteredModules.forEach((mod) => {
        PERMISSIONS.forEach((perm) => {
          const key = `${mod.id}:${perm.id}`;
          const hasPermissionRecord = permissions.some(
            (p) =>
              normalizeModuleId(p.module) === mod.id && p.action === perm.id,
          );
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
      const initialRolePerms = rolePermissions.filter(
        (rp) => rp.role_id === selectedRoleEffectiveId && rp.permissions,
      );

      const permissionRecordMap = new Map<string, string>(); // 'module:action' -> permission_id
      permissions.forEach((p) => {
        permissionRecordMap.set(
          `${normalizeModuleId(p.module)}:${p.action}`,
          p.id,
        );
      });

      initialRolePerms.forEach((rp) => {
        if (rp.permissions) {
          initialStaged.add(
            `${normalizeModuleId(rp.permissions.module)}:${rp.permissions.action}`,
          );
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
        await rolePermissionsService.deleteByRoleAndPermission(
          selectedRoleEffectiveId,
          permId,
        );
      }

      await loadData();
      setSuccess("Yetkiler başarıyla kaydedildi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Save permissions error:", error);
      setError("Yetkiler kaydedilirken hata oluştu: " + error.message);
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
        description: editingRole.description,
      });

      // Reload data to get updated roles
      await loadData();

      setEditingRole(null);
      setShowEditRoleModal(false);
      setSuccess("Rol başarıyla güncellendi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Update role error:", error);
      setError("Rol güncellenirken hata oluştu: " + error.message);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      setError("Rol adı gereklidir");
      return;
    }

    try {
      const newRoleData = await rolesService.create({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        is_active: true,
      });

      // Reload data to get updated roles
      await loadData();

      setNewRole({ name: "", description: "" });
      setShowAddRoleModal(false);
      setSuccess("Yeni rol başarıyla eklendi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Add role error:", error);
      setError("Rol eklenirken hata oluştu: " + error.message);
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
      setSuccess("Rol başarıyla silindi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Delete role error:", error);
      setError("Rol silinirken hata oluştu: " + error.message);
    } finally {
      setRoleToDelete(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Rol ve yetkiler yükleniyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0">
              <Shield size={24} />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
                Rol ve Yetki Yönetimi
              </h1>
              <p className="text-xs text-v3-muted mt-1">
                Rol seçip modüllere ait izinleri yönetin
              </p>
            </div>
          </div>
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {canEdit(Module.USERS) && (
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                + YENİ ROL
              </button>
            )}
          </div>
        </div>
        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-v3-border">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-v3-text">Durum:</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-v3-muted">
            TOPLAM ROL
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/10">
              {roles.length}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-v3-muted">
            TOPLAM MODÜL
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/10">
              {moduleList.length}
            </span>
          </div>
        </div>
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-0">
          <div className="xl:col-span-1 rounded-2xl bg-v3-surface backdrop-blur-md border border-v3-border flex flex-col min-h-0 p-3 shadow-sm">
            <h2 className="text-[11px] font-semibold text-v3-text uppercase tracking-wider mb-2">
              Roller
            </h2>
            <div className="space-y-2 overflow-y-auto pr-1">
              {roles.map((role) => {
                const active = role.id === selectedRoleEffectiveId;
                return (
                  <div
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition-all cursor-pointer ${
                      active
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                        : "border-v3-border hover:bg-v3-border text-v3-text"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">{role.name}</div>
                      {canEdit(Module.USERS) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRole(role);
                            }}
                            className="p-2 rounded-lg text-v3-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleToDelete(role.id);
                            }}
                            className="p-2 rounded-lg text-v3-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-v3-muted dark:text-v3-muted mt-1 line-clamp-2">
                      {role.description || "Aciklama yok"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-3 rounded-2xl bg-v3-surface backdrop-blur-md border border-v3-border shadow-sm flex flex-col min-h-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-v3-border shrink-0">
              <div>
                <h2 className="text-base font-medium text-v3-text">
                  {selectedRole
                    ? `${selectedRole.name} - Yetkileri`
                    : "Rol seçin"}
                </h2>
                <p className="text-[11px] text-v3-muted mt-1">
                  Modül izinlerini buradan yönetebilirsiniz.
                </p>
              </div>
              <div className="w-full md:w-72 h-10">
                <input
                  type="text"
                  value={moduleQuery}
                  onChange={(e) => setModuleQuery(e.target.value)}
                  placeholder="Modül ara..."
                  className="w-full h-full rounded-xl border border-v3-border bg-v3-surface px-3 py-2 text-sm text-v3-text focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-0">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-v3-border sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                      Modül
                    </th>
                    {PERMISSIONS.map((perm) => {
                      // Check if all available modules have this permission
                      let totalAvailable = 0;
                      let totalSelected = 0;
                      filteredModules.forEach((mod) => {
                        if (
                          permissions.some(
                            (p) =>
                              normalizeModuleId(p.module) === mod.id &&
                              p.action === perm.id,
                          )
                        ) {
                          totalAvailable++;
                          if (getRolePermission(mod.id, perm.id))
                            totalSelected++;
                        }
                      });
                      const isAllSelected =
                        totalAvailable > 0 && totalSelected === totalAvailable;

                      return (
                        <th
                          key={perm.id}
                          className="px-4 py-3 text-center text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{perm.name}</span>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              disabled={
                                !canEdit(Module.USERS) ||
                                !selectedRoleEffectiveId
                              }
                              onChange={(e) =>
                                handleToggleColumn(perm.id, e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              title="Tümünü Seç"
                            />
                          </div>
                        </th>
                      );
                    })}
                    <th className="border-b border-slate-200 dark:border-v3-border py-3 px-4 text-center text-xs font-semibold text-v3-muted dark:text-v3-muted">
                      <div className="flex flex-col items-center gap-1">
                        <span>Satır Tümünü Seç</span>
                        <input
                          type="checkbox"
                          checked={(() => {
                            let totalAvailable = 0;
                            let totalSelected = 0;
                            filteredModules.forEach((mod) => {
                              PERMISSIONS.forEach((perm) => {
                                if (
                                  permissions.some(
                                    (p) =>
                                      normalizeModuleId(p.module) === mod.id &&
                                      p.action === perm.id,
                                  )
                                ) {
                                  totalAvailable++;
                                  if (getRolePermission(mod.id, perm.id))
                                    totalSelected++;
                                }
                              });
                            });
                            return (
                              totalAvailable > 0 &&
                              totalSelected === totalAvailable
                            );
                          })()}
                          disabled={
                            !canEdit(Module.USERS) || !selectedRoleEffectiveId
                          }
                          onChange={(e) => handleToggleAll(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          title="Sayfadaki Tüm Yetkileri Seç"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredModules.map((module) => {
                    // Check if all permissions for this row are selected
                    let rowTotalAvailable = 0;
                    let rowTotalSelected = 0;
                    PERMISSIONS.forEach((perm) => {
                      if (
                        permissions.some(
                          (p) =>
                            normalizeModuleId(p.module) === module.id &&
                            p.action === perm.id,
                        )
                      ) {
                        rowTotalAvailable++;
                        if (getRolePermission(module.id, perm.id))
                          rowTotalSelected++;
                      }
                    });
                    const isRowSelected =
                      rowTotalAvailable > 0 &&
                      rowTotalSelected === rowTotalAvailable;

                    return (
                      <tr
                        key={module.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{module.icon}</span>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-v3-text">
                                {module.name}
                              </div>
                              <div className="text-xs text-v3-muted dark:text-v3-muted">
                                {module.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        {PERMISSIONS.map((permission) => {
                          const permissionRecord = permissions.find(
                            (p) =>
                              normalizeModuleId(p.module) === module.id &&
                              p.action === permission.id,
                          );
                          const isChecked = getRolePermission(
                            module.id,
                            permission.id,
                          );
                          const isDisabled =
                            !permissionRecord ||
                            !canEdit(Module.USERS) ||
                            !selectedRoleEffectiveId;

                          return (
                            <td
                              key={permission.id}
                              className="py-3 px-4 text-center"
                            >
                              {permissionRecord ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      module.id,
                                      permission.id,
                                      e.target.checked,
                                    )
                                  }
                                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                                />
                              ) : (
                                <span className="text-v3-text dark:text-gray-600">
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            disabled={
                              !canEdit(Module.USERS) ||
                              !selectedRoleEffectiveId ||
                              rowTotalAvailable === 0
                            }
                            onChange={(e) =>
                              handleToggleRow(module.id, e.target.checked)
                            }
                            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            title="Bu modülün tüm yetkilerini seç"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredModules.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-sm text-v3-muted dark:text-v3-muted"
                      >
                        Aramanıza uygun modül bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Save Button Container */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-v3-border flex justify-end">
              <button
                onClick={handleSavePermissions}
                disabled={
                  !hasUnsavedChanges || isSaving || !canEdit(Module.USERS)
                }
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  hasUnsavedChanges
                    ? "bg-blue-500 text-white hover:bg-blue-500/90 shadow-lg shadow-blue-600/20"
                    : "bg-slate-100 text-v3-muted dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-v3-text mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-600 dark:text-blue-400" />
              Rol Adı
            </label>
            <input
              type="text"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-v3-surface dark:text-v3-text transition-all"
              placeholder="Örn: Proje Yöneticisi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-v3-text mb-2 flex items-center gap-2">
              <Info size={16} className="text-blue-600 dark:text-blue-400" />
              Açıklama
            </label>
            <textarea
              value={newRole.description}
              onChange={(e) =>
                setNewRole({ ...newRole, description: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-v3-surface dark:text-v3-text transition-all"
              rows={3}
              placeholder="Rol yetkileri hakkında kısa bilgi..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddRoleModal(false)}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-v3-muted bg-slate-100 dark:bg-v3-surface rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-500/90 dark:hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-v3-text mb-2 flex items-center gap-2">
                <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                Rol Adı
              </label>
              <input
                type="text"
                value={editingRole.name}
                onChange={(e) =>
                  setEditingRole({ ...editingRole, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-v3-surface dark:text-v3-text transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-v3-text mb-2 flex items-center gap-2">
                <Info size={16} className="text-blue-600 dark:text-blue-400" />
                Açıklama
              </label>
              <textarea
                value={editingRole.description}
                onChange={(e) =>
                  setEditingRole({
                    ...editingRole,
                    description: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-v3-surface dark:text-v3-text transition-all"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditRoleModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-v3-muted bg-slate-100 dark:bg-v3-surface rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-500 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-500/90 dark:hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
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
