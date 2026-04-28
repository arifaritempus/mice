'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/utils/formatters';
import { ExcelUtils, ExcelImportUtils } from '@/utils/excelUtils';
import { usersService } from '@/lib/supabaseService';
import { usePermissions, Module } from '@/lib/permissions';
import { DEFAULT_PAGE_SIZE, paginateItems } from '@/types/pagination';

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
  const { canView, canCreate, canEdit, canDelete, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [newUser, setNewUser] = useState<RegisterData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user'
  });

  const [editUser, setEditUser] = useState<Partial<User & { password?: string }>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const rows = await usersService.getAll();
      const normalized: User[] = (rows || []).map((u: any) => {
        let firstName = u.first_name || '';
        let lastName = u.last_name || '';
        
        // Eğer first_name/last_name yoksa ama full_name varsa parçala
        if (!firstName && !lastName && u.full_name) {
          const parts = u.full_name.trim().split(' ');
          if (parts.length > 1) {
            lastName = parts.pop();
            firstName = parts.join(' ');
          } else {
            firstName = parts[0];
          }
        } else if (!firstName && !lastName && u.name) { // name alanı varsa onu kullan
           const parts = u.name.trim().split(' ');
           if (parts.length > 1) {
             lastName = parts.pop();
             firstName = parts.join(' ');
           } else {
             firstName = parts[0];
           }
        }

        return {
          id: u.id,
          first_name: firstName,
          last_name: lastName,
          full_name: u.full_name || u.name || `${firstName} ${lastName}`.trim(),
          email: u.email || '',
          role: u.role || 'user',
          is_active: u.is_active ?? true,
          created_at: u.created_at || new Date().toISOString(),
        };
      });
      setUsers(normalized);

      // Rolleri Supabase'ten yükle
      try {
        const rows = await (await import('@/lib/supabaseService')).rolesService.getAll();
        const normalizedRoles: Role[] = (rows || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          is_active: r.is_active ?? true
        }));
        setRoles(normalizedRoles);
      } catch (e) {
        console.error('Roles load error:', e);
        // Supabase başarısız olursa, en azından minimum set
        setRoles([
          { id: 'super_admin', name: 'Süper Admin', description: '', is_active: true },
          { id: 'admin', name: 'Admin', description: '', is_active: true },
          { id: 'manager', name: 'Müdür', description: '', is_active: true },
          { id: 'user', name: 'Kullanıcı', description: '', is_active: true }
        ]);
      }
    } catch (error: any) {
      setError('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Sunucu tarafı admin API'si ile kullanıcı oluştur
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Kullanıcı oluşturulamadı');
      }
      await loadUsers();

      setSuccess('Kullanıcı başarıyla oluşturuldu');
      setShowCreateModal(false);
      setNewUser({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'user'
      });
    } catch (error: any) {
      setError(error.message || 'Kullanıcı oluşturulurken hata oluştu');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError('');
    setSuccess('');

    try {
      // Şifre kontrolü - eğer şifre girilmişse Auth tarafında güncelle
      const updateData = { ...editUser } as any;
      if (editUser.password && editUser.password.trim() !== '') {
        const res = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: editUser.password })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Şifre güncellenemedi');
        }
      }
      delete updateData.password;
      await usersService.update(selectedUser.id, updateData);
      await loadUsers();

      setSuccess('Kullanıcı başarıyla güncellendi');
      setShowEditModal(false);
      setSelectedUser(null);
      setEditUser({});
    } catch (error: any) {
      setError(error.message || 'Kullanıcı güncellenirken hata oluştu');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      await usersService.delete(userId);
      await loadUsers();

      setSuccess('Kullanıcı başarıyla silindi');
    } catch (error: any) {
      setError(error.message || 'Kullanıcı silinirken hata oluştu');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await usersService.toggleActive(userId, !currentStatus);
      await loadUsers();

      setSuccess('Kullanıcı durumu güncellendi');
    } catch (error) {
      setError('Kullanıcı durumu güncellenirken hata oluştu');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      password: '' // Şifre alanını boş başlat
    });
    setShowEditModal(true);
  };

  const getRoleDisplayName = (role: string) => {
    // Önce mevcut rollerden bul
    const found = roles.find(r => r.id === role);
    if (found) return found.name;
    // Geriye dönük uyumluluk için varsayılanlar
    switch (role) {
      case 'super_admin': return 'Süper Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Müdür';
      case 'user': return 'Kullanıcı';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-indigo-100 text-indigo-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Excel Export Fonksiyonu
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await ExcelUtils.exportUsers(users);
      setSuccess('Excel dosyası başarıyla indirildi!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      setError('Excel dosyası oluşturulurken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };

  // Excel Import Fonksiyonu
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = ExcelImportUtils.validateExcelFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Dosya geçersiz');
      return;
    }

    setImporting(true);
    try {
      const importedUsers = await ExcelImportUtils.importUsers(file);

      // Validate imported data
      const validUsers = importedUsers.filter(user =>
        user.first_name && user.last_name && user.email
      );

      if (validUsers.length === 0) {
        setError('Geçerli kullanıcı verisi bulunamadı');
        return;
      }

      // Add imported users
      const newUsers = validUsers.map(user => ({
        ...user,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      }));

      const updatedUsers = [...users, ...newUsers];
      setUsers(updatedUsers);
      // Eski cache kullanımı kaldırıldı

      setSuccess(`${validUsers.length} kullanıcı başarıyla içe aktarıldı`);
    } catch (error) {
      console.error('Excel import hatası:', error);
      setError('Excel dosyası okunurken bir hata oluştu.');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };
  const paginatedUsers = paginateItems(users, page, pageSize);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Users görüntüleme yetkisi kontrolü
  if (!canView(Module.USERS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Kullanıcılar sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Kullanıcılar yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Kullanıcı Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sistem kullanıcılarını yönetin</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 disabled:opacity-50 transition-colors duration-200 text-xs"
            >
              {exporting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  İndiriliyor...
                </>
              ) : (
                <>
                  📊 Excel İndir
                </>
              )}
            </button>
            <label className="bg-orange-600 dark:bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 disabled:opacity-50 cursor-pointer transition-colors duration-200 text-xs">
              {importing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Yükleniyor...
                </>
              ) : (
                <>
                  📥 Excel Yükle
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
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200 text-xs"
              >
                Yeni Kullanıcı Ekle
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-2 py-2 rounded-md transition-colors duration-200 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-2 py-2 rounded-md text-xs">
            {success}
          </div>
        )}

        {/* İstatistikler */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Aktif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{users.filter(u => u.is_active).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0">
            <div className="flex items-center">
              <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Pasif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{users.filter(u => !u.is_active).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.items.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 py-2">
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">
                          {user.full_name || `${user.first_name} ${user.last_name}`.trim() || 'İsimsiz Kullanıcı'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        {canEdit(Module.USERS) && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                            title="Düzenle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {canDelete(Module.USERS) && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {canEdit(Module.USERS) && (
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            className={`p-1 rounded transition-colors duration-200 ${user.is_active
                                ? 'text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                              }`}
                            title={user.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowCreateModal(false);
              setNewUser({ email: '', password: '', first_name: '', last_name: '', role: 'user' });
            }
          }}
        >
          <div className="relative top-20 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Yeni Kullanıcı Ekle</h3>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad *
                  </label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => {
                      setNewUser(prev => ({ ...prev, first_name: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => {
                      setNewUser(prev => ({ ...prev, last_name: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => {
                      setNewUser(prev => ({ ...prev, email: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => {
                      setNewUser(prev => ({ ...prev, password: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      setNewUser(prev => ({ ...prev, role: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  >
                    {roles && roles.length > 0 ? (
                      roles.filter(r => r.is_active).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))
                    ) : (
                      <option value="user">Kullanıcı</option>
                    )}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowEditModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="relative top-20 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Kullanıcı Düzenle</h3>
              <form onSubmit={handleUpdateUser} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad *
                  </label>
                  <input
                    type="text"
                    value={editUser.first_name || ''}
                    onChange={(e) => {
                      setEditUser(prev => ({ ...prev, first_name: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    value={editUser.last_name || ''}
                    onChange={(e) => {
                      setEditUser(prev => ({ ...prev, last_name: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-posta *
                  </label>
                  <input
                    type="email"
                    value={editUser.email || ''}
                    onChange={(e) => {
                      setEditUser(prev => ({ ...prev, email: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yeni Şifre (boş bırakılırsa değişmez)
                  </label>
                  <input
                    type="password"
                    value={editUser.password || ''}
                    onChange={(e) => {
                      setEditUser(prev => ({ ...prev, password: e.target.value }));
                    }}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol *
                  </label>
                  <select
                    value={editUser.role || ''}
                    onChange={(e) => {
                      setEditUser(prev => ({ ...prev, role: e.target.value }));
                    }}
                    required
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  >
                    {roles && roles.length > 0 ? (
                      roles.filter(r => r.is_active).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))
                    ) : (
                      <option value="user">Kullanıcı</option>
                    )}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 text-xs"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 text-xs"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 