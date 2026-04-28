'use client';

import { useState, useEffect } from 'react';
import { usersService, userPermissionsService } from '@/lib/supabaseService';
import type { User } from '@/lib/supabase';
import Link from 'next/link';
import { storage } from '@/utils/safeStorage';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserPermission {
  user_id: string;
  permission_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'quotes', name: 'Teklif Yönetimi', icon: '📋' },
  { id: 'projects', name: 'Proje Yönetimi', icon: '📁' },
  { id: 'budget', name: 'Bütçe Yönetimi', icon: '💰' },
  { id: 'agencies', name: 'Acenteler', icon: '🏢' },
  { id: 'hotels', name: 'Oteller', icon: '🏨' },
  { id: 'users', name: 'Kullanıcılar', icon: '👥' },
  { id: 'categories', name: 'Kategoriler', icon: '🏷️' },
  { id: 'reports', name: 'Raporlar', icon: '📈' },
  { id: 'settings', name: 'Ayarlar', icon: '⚙️' }
];

const PERMISSIONS = [
  { id: 'view', name: 'Görüntüleme', color: 'blue' },
  { id: 'create', name: 'Ekleme', color: 'green' },
  { id: 'edit', name: 'Düzenleme', color: 'yellow' },
  { id: 'delete', name: 'Silme', color: 'red' }
];

export default function UserPermissionsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');



  const loadData = async () => {
    try {
      // Load users from localStorage first
      const savedUsers = storage.getItem('users');
      let currentUsers: User[] = [];
      
      if (savedUsers) {
        currentUsers = JSON.parse(savedUsers);
        setUsers(currentUsers);
      } else {
        // Load from service if no local data
        const serviceUsers = await usersService.getAll();
        setUsers(serviceUsers);
        currentUsers = serviceUsers;
      }

      // Load user permissions from localStorage first
      const savedPermissions = storage.getItem('userPermissions');
      let currentPermissions: UserPermission[] = [];
      
      if (savedPermissions) {
        currentPermissions = JSON.parse(savedPermissions);
        setUserPermissions(currentPermissions);
      } else {
        // Initialize default permissions
        const defaultPermissions: UserPermission[] = [];
        
        currentUsers.forEach((user: User) => {
          MODULES.forEach(module => {
            PERMISSIONS.forEach(permission => {
              defaultPermissions.push({
                user_id: user.id,
                permission_id: `${module.id}_${permission.id}`,
                can_view: user.role === 'super_admin' || user.role === 'admin',
                can_create: user.role === 'super_admin' || user.role === 'admin',
                can_edit: user.role === 'super_admin' || user.role === 'admin',
                can_delete: user.role === 'super_admin'
              });
            });
          });
        });
        
        setUserPermissions(defaultPermissions);
        storage.setItem('userPermissions', JSON.stringify(defaultPermissions));
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePermissionChange = async (userId: string, permissionId: string, permissionType: string, value: boolean) => {
    try {
      const existingPermission = userPermissions.find(perm => 
        perm.user_id === userId && perm.permission_id === permissionId
      );

      if (existingPermission) {
        // Update existing permission in localStorage
        const updatedPermissions = userPermissions.map(perm => 
          perm.user_id === userId && perm.permission_id === permissionId
            ? { ...perm, [permissionType]: value }
            : perm
        );
        
        setUserPermissions(updatedPermissions);
        storage.setItem('userPermissions', JSON.stringify(updatedPermissions));
        setSuccess('Yetki başarıyla güncellendi');
      } else {
        // Create new permission
        const newPermission: UserPermission = {
          user_id: userId,
          permission_id: permissionId,
          can_view: permissionType === 'can_view' ? value : false,
          can_create: permissionType === 'can_create' ? value : false,
          can_edit: permissionType === 'can_edit' ? value : false,
          can_delete: permissionType === 'can_delete' ? value : false
        };
        
        const updatedPermissions = [...userPermissions, newPermission];
        setUserPermissions(updatedPermissions);
        storage.setItem('userPermissions', JSON.stringify(updatedPermissions));
        setSuccess('Yetki başarıyla oluşturuldu');
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating permission:', error);
      setError('Yetki güncellenirken hata oluştu');
    }
  };

  const getUserPermission = (userId: string, moduleId: string, permissionType: string) => {
    const permissionId = `${moduleId}_${permissionType}`;
    const permission = userPermissions.find(p => p.user_id === userId && p.permission_id === permissionId);
    return permission ? permission[`can_${permissionType}` as keyof UserPermission] as boolean : false;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Süper Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Müdür';
      case 'user': return 'Kullanıcı';
      default: return role;
    }
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.USERS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/permissions" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            İzinlere Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
            <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-r-blue-500 dark:border-r-blue-300 animate-spin" style={{animationDelay: '0.1s', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Yükleniyor...</h2>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Lütfen bekleyin</p>
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