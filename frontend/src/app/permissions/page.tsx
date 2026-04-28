'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { storage } from '@/utils/safeStorage';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  user_count: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  is_active: boolean;
}

export default function PermissionsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalPermissions: 0
  });


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users from localStorage
      const storedUsers = storage.getItem('users');
      let currentUsers: User[] = [];
      
      if (storedUsers) {
        currentUsers = JSON.parse(storedUsers);
      } else {
        // Default users
        currentUsers = [
          {
            id: '1',
            email: 'admin@tempustravel.com',
            first_name: 'Sistem',
            last_name: 'Yöneticisi',
            role: 'super_admin',
            is_active: true,
            last_login: new Date().toISOString()
          },
          {
            id: '2',
            email: 'manager@tempustravel.com',
            first_name: 'Proje',
            last_name: 'Müdürü',
            role: 'manager',
            is_active: true,
            last_login: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            email: 'user@tempustravel.com',
            first_name: 'Standart',
            last_name: 'Kullanıcı',
            role: 'user',
            is_active: true,
            last_login: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        storage.setItem('users', JSON.stringify(currentUsers));
      }

      // Load roles from localStorage
      const storedRoles = storage.getItem('roles');
      let currentRoles: Role[] = [];
      
      if (storedRoles) {
        currentRoles = JSON.parse(storedRoles);
      } else {
        // Default roles
        currentRoles = [
          {
            id: 'super_admin',
            name: 'Süper Admin',
            description: 'Tüm yetkilere sahip sistem yöneticisi',
            is_active: true,
            user_count: 1
          },
          {
            id: 'admin',
            name: 'Admin',
            description: 'Sistem yöneticisi',
            is_active: true,
            user_count: 0
          },
          {
            id: 'manager',
            name: 'Müdür',
            description: 'Proje ve operasyon müdürü',
            is_active: true,
            user_count: 1
          },
          {
            id: 'user',
            name: 'Kullanıcı',
            description: 'Standart kullanıcı',
            is_active: true,
            user_count: 1
          }
        ];
        storage.setItem('roles', JSON.stringify(currentRoles));
      }

      // Load permissions from localStorage
      const storedPermissions = storage.getItem('permissions');
      let currentPermissions: Permission[] = [];
      
      if (storedPermissions) {
        currentPermissions = JSON.parse(storedPermissions);
      } else {
        // Default permissions
        currentPermissions = [
          // Dashboard permissions
          { id: 'dashboard_view', name: 'Dashboard Görüntüleme', description: 'Dashboard sayfasını görüntüleme', module: 'dashboard', is_active: true },
          { id: 'dashboard_edit', name: 'Dashboard Düzenleme', description: 'Dashboard ayarlarını düzenleme', module: 'dashboard', is_active: true },
          
          // Quotes permissions
          { id: 'quotes_view', name: 'Teklif Görüntüleme', description: 'Teklifleri görüntüleme', module: 'quotes', is_active: true },
          { id: 'quotes_create', name: 'Teklif Oluşturma', description: 'Yeni teklif oluşturma', module: 'quotes', is_active: true },
          { id: 'quotes_edit', name: 'Teklif Düzenleme', description: 'Mevcut teklifleri düzenleme', module: 'quotes', is_active: true },
          { id: 'quotes_delete', name: 'Teklif Silme', description: 'Teklifleri silme', module: 'quotes', is_active: true },
          
          // Projects permissions
          { id: 'projects_view', name: 'Proje Görüntüleme', description: 'Projeleri görüntüleme', module: 'projects', is_active: true },
          { id: 'projects_create', name: 'Proje Oluşturma', description: 'Yeni proje oluşturma', module: 'projects', is_active: true },
          { id: 'projects_edit', name: 'Proje Düzenleme', description: 'Mevcut projeleri düzenleme', module: 'projects', is_active: true },
          { id: 'projects_delete', name: 'Proje Silme', description: 'Projeleri silme', module: 'projects', is_active: true },
          
          // Sejour permissions
          { id: 'sejour_view', name: 'Sejour Görüntüleme', description: 'Sejour rezervasyonlarını görüntüleme', module: 'sejour', is_active: true },
          { id: 'sejour_create', name: 'Sejour Oluşturma', description: 'Yeni sejour rezervasyonu oluşturma', module: 'sejour', is_active: true },
          { id: 'sejour_edit', name: 'Sejour Düzenleme', description: 'Mevcut sejour rezervasyonlarını düzenleme', module: 'sejour', is_active: true },
          { id: 'sejour_delete', name: 'Sejour Silme', description: 'Sejour rezervasyonlarını silme', module: 'sejour', is_active: true },
          
          // Operations permissions
          { id: 'operations_view', name: 'Operasyon Görüntüleme', description: 'Operasyon işlemlerini görüntüleme', module: 'operations', is_active: true },
          { id: 'operations_create', name: 'Operasyon Oluşturma', description: 'Yeni operasyon işlemi oluşturma', module: 'operations', is_active: true },
          { id: 'operations_edit', name: 'Operasyon Düzenleme', description: 'Mevcut operasyon işlemlerini düzenleme', module: 'operations', is_active: true },
          { id: 'operations_delete', name: 'Operasyon Silme', description: 'Operasyon işlemlerini silme', module: 'operations', is_active: true },
          
          // Users permissions
          { id: 'users_view', name: 'Kullanıcı Görüntüleme', description: 'Kullanıcıları görüntüleme', module: 'users', is_active: true },
          { id: 'users_create', name: 'Kullanıcı Oluşturma', description: 'Yeni kullanıcı oluşturma', module: 'users', is_active: true },
          { id: 'users_edit', name: 'Kullanıcı Düzenleme', description: 'Mevcut kullanıcıları düzenleme', module: 'users', is_active: true },
          { id: 'users_delete', name: 'Kullanıcı Silme', description: 'Kullanıcıları silme', module: 'users', is_active: true },
          
          // Settings permissions
          { id: 'settings_view', name: 'Ayar Görüntüleme', description: 'Sistem ayarlarını görüntüleme', module: 'settings', is_active: true },
          { id: 'settings_edit', name: 'Ayar Düzenleme', description: 'Sistem ayarlarını düzenleme', module: 'settings', is_active: true }
        ];
        storage.setItem('permissions', JSON.stringify(currentPermissions));
      }

      // Update user counts for roles
      const updatedRoles = currentRoles.map(role => ({
        ...role,
        user_count: currentUsers.filter(user => user.role === role.id).length
      }));

      setUsers(currentUsers);
      setRoles(updatedRoles);
      setPermissions(currentPermissions);

      // Calculate stats
      setStats({
        totalUsers: currentUsers.length,
        activeUsers: currentUsers.filter(user => user.is_active).length,
        totalRoles: updatedRoles.length,
        totalPermissions: currentPermissions.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'super_admin':
        return 'bg-red-600';
      case 'admin':
        return 'bg-purple-600';
      case 'manager':
        return 'bg-blue-600';
      case 'user':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }`}>
      {isActive ? 'Aktif' : 'Pasif'}
    </span>
  );

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.USERS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yetkiler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim için yetkiniz bulunmuyor.</p>
        <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
} 