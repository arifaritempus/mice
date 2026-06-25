"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import PaginationControls from "@/components/PaginationControls";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatNumber } from "@/utils/formatters";
import { ExcelUtils, ExcelImportUtils } from "@/utils/excelUtils";
import { usersService } from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  UserPlus,
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Pencil,
} from "lucide-react";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string; // full_name eklendi
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  password?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function UsersPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    loading: permissionsLoading,
  } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [statsFilter, setStatsFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<RegisterData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "user",
  });

  const [editUser, setEditUser] = useState<
    Partial<User & { password?: string }>
  >({});

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchTokens, statsFilter]);

  const searchAndFilterUsers = (list: User[]) => {
    return list.filter((u) => {
      // Stats filter
      if (statsFilter === "active" && !u.is_active) return false;
      if (statsFilter === "passive" && u.is_active) return false;

      // Search term & tokens
      if (!searchTerm && (!searchTokens || searchTokens.length === 0))
        return true;

      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();

        const roleName = roles.find((r) => r.id === u.role)?.name || u.role;
        const mappedRole =
          roleName === "super_admin"
            ? "Süper Admin"
            : roleName === "admin"
              ? "Admin"
              : roleName === "manager"
                ? "Müdür"
                : roleName === "user"
                  ? "Kullanıcı"
                  : roleName;

        return (
          (u.first_name || "").toLowerCase().includes(lowerS) ||
          (u.last_name || "").toLowerCase().includes(lowerS) ||
          (u.full_name || "").toLowerCase().includes(lowerS) ||
          (u.email || "").toLowerCase().includes(lowerS) ||
          (mappedRole || "").toLowerCase().includes(lowerS)
        );
      };

      if (searchTerm && !matches(searchTerm)) return false;

      if (searchTokens && searchTokens.length > 0) {
        for (const t of searchTokens) {
          if (!matches(t)) return false;
        }
      }

      return true;
    });
  };

  const loadUsers = async () => {
    try {
      const rows = await usersService.getAll();
      const normalized: User[] = (rows || []).map((u: any) => {
        let firstName = u.first_name || "";
        let lastName = u.last_name || "";

        // Eğer first_name/last_name yoksa ama full_name varsa parçala
        if (!firstName && !lastName && u.full_name) {
          const parts = u.full_name.trim().split(" ");
          if (parts.length > 1) {
            lastName = parts.pop();
            firstName = parts.join(" ");
          } else {
            firstName = parts[0];
          }
        } else if (!firstName && !lastName && u.name) {
          // name alanı varsa onu kullan
          const parts = u.name.trim().split(" ");
          if (parts.length > 1) {
            lastName = parts.pop();
            firstName = parts.join(" ");
          } else {
            firstName = parts[0];
          }
        }

        return {
          id: u.id,
          first_name: firstName,
          last_name: lastName,
          full_name: u.full_name || u.name || `${firstName} ${lastName}`.trim(),
          email: u.email || "",
          role: u.role || "user",
          is_active: u.is_active ?? true,
          created_at: u.created_at || new Date().toISOString(),
        };
      });
      setUsers(normalized);

      // Rolleri Supabase'ten yükle
      try {
        const rows = await (
          await import("@/lib/supabaseService")
        ).rolesService.getAll();
        const normalizedRoles: Role[] = (rows || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || "",
          is_active: r.is_active ?? true,
        }));
        setRoles(normalizedRoles);
      } catch (e) {
        console.error("Roles load error:", e);
        // Supabase başarısız olursa, en azından minimum set
        setRoles([
          {
            id: "super_admin",
            name: "Süper Admin",
            description: "",
            is_active: true,
          },
          { id: "admin", name: "Admin", description: "", is_active: true },
          { id: "manager", name: "Müdür", description: "", is_active: true },
          { id: "user", name: "Kullanıcı", description: "", is_active: true },
        ]);
      }
    } catch (error: any) {
      setError("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Sunucu tarafı admin API'si ile kullanıcı oluştur
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Kullanıcı oluşturulamadı");
      }
      await loadUsers();

      setSuccess("Kullanıcı başarıyla oluşturuldu");
      setShowCreateModal(false);
      setNewUser({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "user",
      });
    } catch (error: any) {
      setError(error.message || "Kullanıcı oluşturulurken hata oluştu");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError("");
    setSuccess("");

    try {
      // Şifre kontrolü - eğer şifre girilmişse Auth tarafında güncelle
      const updateData = { ...editUser } as any;
      if (editUser.password && editUser.password.trim() !== "") {
        const res = await fetch(
          `/api/admin/users/${selectedUser.id}/password`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: editUser.password }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Şifre güncellenemedi");
        }
      }
      delete updateData.password;
      await usersService.update(selectedUser.id, updateData);
      await loadUsers();

      setSuccess("Kullanıcı başarıyla güncellendi");
      setShowEditModal(false);
      setSelectedUser(null);
      setEditUser({});
    } catch (error: any) {
      setError(error.message || "Kullanıcı güncellenirken hata oluştu");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersService.delete(userId);
      await loadUsers();
      setSuccess("Kullanıcı başarıyla silindi");
    } catch (error: any) {
      setError(error.message || "Kullanıcı silinirken hata oluştu");
    } finally {
      setUserToDelete(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await usersService.toggleActive(userId, !currentStatus);
      await loadUsers();

      setSuccess("Kullanıcı durumu güncellendi");
    } catch (error) {
      setError("Kullanıcı durumu güncellenirken hata oluştu");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      password: "", // Şifre alanını boş başlat
    });
    setShowEditModal(true);
  };

  const getRoleDisplayName = (role: string) => {
    // Önce mevcut rollerden bul
    const found = roles.find((r) => r.id === role);
    if (found) return found.name;
    // Geriye dönük uyumluluk için varsayılanlar
    switch (role) {
      case "super_admin":
        return "Süper Admin";
      case "admin":
        return "Admin";
      case "manager":
        return "Müdür";
      case "user":
        return "Kullanıcı";
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    let roleKey = role;
    if (role.length > 20) {
      const found = roles.find((r) => r.id === role);
      if (found) {
        const nameLower = found.name.toLowerCase();
        if (nameLower.includes("super") || nameLower.includes("süper"))
          roleKey = "super_admin";
        else if (nameLower.includes("admin")) roleKey = "admin";
        else if (nameLower.includes("müdür") || nameLower.includes("manager"))
          roleKey = "manager";
        else roleKey = "user";
      }
    }

    switch (roleKey) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "manager":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300";
      case "user":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white";
    }
  };

  // Excel Export Fonksiyonu
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await ExcelUtils.exportUsers(users);
      setSuccess("Excel dosyası başarıyla indirildi!");
    } catch (error) {
      console.error("Excel export hatası:", error);
      setError("Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  // Excel Import Fonksiyonu
  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = ExcelImportUtils.validateExcelFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Dosya geçersiz");
      return;
    }

    setImporting(true);
    try {
      const importedUsers = await ExcelImportUtils.importUsers(file);

      // Validate imported data
      const validUsers = importedUsers.filter(
        (user) => user.first_name && user.last_name && user.email,
      );

      if (validUsers.length === 0) {
        setError("Geçerli kullanıcı verisi bulunamadı");
        return;
      }

      // Add imported users
      const newUsers = validUsers.map((user) => ({
        ...user,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      }));

      const updatedUsers = [...users, ...newUsers];
      setUsers(updatedUsers);
      // Eski cache kullanımı kaldırıldı

      setSuccess(`${validUsers.length} kullanıcı başarıyla içe aktarıldı`);
    } catch (error) {
      console.error("Excel import hatası:", error);
      setError("Excel dosyası okunurken bir hata oluştu.");
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };
  const filteredUsers = searchAndFilterUsers(users);
  const paginatedUsers = paginateItems(filteredUsers, page, pageSize);

  // 1. Yetki yükleniyor mu?
  if (permissionsLoading) {
    return <LoadingSpinner message="Yetkiler kontrol ediliyor..." />;
  }

  // 2. Yetki yok mu?
  if (!canView(Module.USERS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-all duration-500">
        <div className="text-center p-8 rounded-3xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🛡️
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erişim Engellendi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto">
            Bu sayfayı görüntülemek için gerekli yetkilere sahip değilsiniz.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-500/90 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  // 3. Veri yükleniyor mu?
  if (loading) {
    return <LoadingSpinner message="Kullanıcı verileri hazırlanıyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-white glow-text">
                Kullanıcı Yönetimi
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Sistem kullanıcılarını ve rollerini yönetin
              </p>
            </div>
          </div>

          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                GENEL ARAMA (İSİM, E-POSTA, ROL...)
              </label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchTerm}
                  onInputChange={setSearchTerm}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchTerm("");
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter((st) => st !== t));
                  }}
                />
              </div>
            </div>

            {/* Trash Button */}
            <button
              onClick={() => {
                setStatsFilter("all");
                setSearchTerm("");
                setSearchTokens([]);
              }}
              className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all shrink-0"
              title="Filtreleri Temizle"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="h-10 bg-[#0f172a]/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 py-2 px-4 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
            >
              {exporting ? (
                <>
                  <span className="animate-spin">⏳</span> İNDİRİLİYOR...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>{" "}
                  EXCEL İNDİR
                </>
              )}
            </button>
            <label className="h-10 bg-[#0f172a]/40 text-orange-400 border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30 py-2 px-4 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 cursor-pointer">
              {importing ? (
                <>
                  <span className="animate-spin">⏳</span> YÜKLENİYOR...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>{" "}
                  EXCEL YÜKLE
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                disabled={importing}
              />
            </label>

            {canCreate(Module.USERS) && (
              <button
                onClick={() => {
                  const defaultRole =
                    roles && roles.length > 0
                      ? roles.find((r) => r.is_active)?.id || "user"
                      : "user";
                  setNewUser((prev) => ({ ...prev, role: defaultRole }));
                  setShowCreateModal(true);
                }}
                className="h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                + YENİ KULLANICI
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {success}
          </div>
        )}
        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-white">Durum:</span>
          </div>

          <button
            onClick={() => setStatsFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "all" ? "bg-blue-500/20 border border-blue-500/30 text-blue-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            TÜMÜ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "all" ? "bg-blue-500/20 text-blue-300" : "bg-white/10"}`}
            >
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "active" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            AKTİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10"}`}
            >
              {users.filter((u) => u.is_active).length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("passive")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "passive" ? "bg-red-500/20 border border-red-500/30 text-red-300" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
          >
            PASİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "passive" ? "bg-red-500/20 text-red-300" : "bg-white/10"}`}
            >
              {users.filter((u) => !u.is_active).length}
            </span>
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl w-full min-w-0 flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <div className="overflow-auto w-full flex-1 custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white uppercase tracking-wider border-b border-white/10">
                    Kullanıcı
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white uppercase tracking-wider border-b border-white/10">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white uppercase tracking-wider border-b border-white/10">
                    Durum
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white uppercase tracking-wider border-b border-white/10">
                    Kayıt Tarihi
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-white uppercase tracking-wider border-b border-white/10">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedUsers.items.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-blue-500/10 cursor-pointer transition-colors group"
                    onDoubleClick={() => {
                      openEditModal(user);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.full_name ||
                            `${user.first_name} ${user.last_name}`.trim() ||
                            "İsimsiz Kullanıcı"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getRoleBadgeClass(user.role).replace("bg-", "bg-").replace("text-", "text-").replace("dark:", "")} bg-opacity-20 border-opacity-30`}
                      >
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(user.id, user.is_active || false);
                        }}
                        className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                        title="Durumu Değiştir"
                      >
                        {user.is_active ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-white">
                      {new Date(user.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        {canEdit(Module.USERS) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(user);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                            title="Düzenle"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}
                        {canDelete(Module.USERS) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(user.id);
                            }}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                            title="Sil"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                        {canEdit(Module.USERS) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(user.id, user.is_active);
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100 ${
                              user.is_active
                                ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                                : "text-teal-400 hover:text-teal-300 hover:bg-teal-500/20"
                            }`}
                            title={user.is_active ? "Pasif Yap" : "Aktif Yap"}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <PaginationControls
          page={paginatedUsers.page}
          pageSize={paginatedUsers.pageSize}
          total={paginatedUsers.total}
          totalPages={paginatedUsers.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="users_page_size"
          compactRight
        />
      </div>

      {/* Yeni Kullanıcı Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          const defaultRole =
            roles && roles.length > 0
              ? roles.find((r) => r.is_active)?.id || "user"
              : "user";
          setNewUser({
            email: "",
            password: "",
            first_name: "",
            last_name: "",
            role: defaultRole,
          });
        }}
        title="Yeni Kullanıcı Ekle"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-400" />
                Ad *
              </label>
              <input
                type="text"
                value={newUser.first_name}
                onChange={(e) =>
                  setNewUser((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                required
                className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                placeholder="Ad"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <UserIcon size={16} className="text-blue-400" />
                Soyad *
              </label>
              <input
                type="text"
                value={newUser.last_name}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, last_name: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                placeholder="Soyad"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Mail size={16} className="text-blue-400" />
              E-posta *
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              placeholder="e-posta@adresiniz.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Key size={16} className="text-blue-400" />
              Şifre *
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, password: e.target.value }))
              }
              required
              className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              Rol *
            </label>
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, role: e.target.value }))
              }
              required
              className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm appearance-none cursor-pointer"
            >
              {roles && roles.length > 0 ? (
                roles
                  .filter((r) => r.is_active)
                  .map((r) => {
                    let roleKey = r.id;
                    const nameLower = r.name.toLowerCase();
                    if (roleKey.length > 20) {
                      // UUID check
                      if (
                        nameLower.includes("super") ||
                        nameLower.includes("süper")
                      )
                        roleKey = "super_admin";
                      else if (nameLower.includes("admin")) roleKey = "admin";
                      else if (
                        nameLower.includes("müdür") ||
                        nameLower.includes("manager")
                      )
                        roleKey = "manager";
                      else roleKey = "user";
                    }
                    return (
                      <option key={r.id} value={roleKey}>
                        {r.name}
                      </option>
                    );
                  })
              ) : (
                <option value="user">Kullanıcı</option>
              )}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#0f172a]/40 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-500/90 dark:hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <UserPlus size={18} />
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title="Kullanıcı Düzenle"
        maxWidth="max-w-xl"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                  <UserIcon size={16} className="text-blue-400" />
                  Ad *
                </label>
                <input
                  type="text"
                  value={editUser.first_name || ""}
                  onChange={(e) =>
                    setEditUser((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                  <UserIcon size={16} className="text-blue-400" />
                  Soyad *
                </label>
                <input
                  type="text"
                  value={editUser.last_name || ""}
                  onChange={(e) =>
                    setEditUser((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Mail size={16} className="text-blue-400" />
                E-posta *
              </label>
              <input
                type="email"
                value={editUser.email || ""}
                onChange={(e) =>
                  setEditUser((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Key size={16} className="text-blue-400" />
                Yeni Şifre (boş bırakılırsa değişmez)
              </label>
              <input
                type="password"
                value={editUser.password || ""}
                onChange={(e) =>
                  setEditUser((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                Rol *
              </label>
              <select
                value={editUser.role || ""}
                onChange={(e) =>
                  setEditUser((prev) => ({ ...prev, role: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-[#0f172a]/40 border border-white/10 text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                {roles && roles.length > 0 ? (
                  roles
                    .filter((r) => r.is_active)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))
                ) : (
                  <option value="user">Kullanıcı</option>
                )}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#0f172a]/40 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-bold rounded-xl hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all flex items-center gap-2"
              >
                <Pencil size={18} />
                Güncelle
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Kullanıcıyı Sil"
        message="Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
        onCancel={() => setUserToDelete(null)}
        type="danger"
        confirmText="Evet, Sil"
        cancelText="İptal"
      />
    </div>
  );
}
