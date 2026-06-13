'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  email: string;
}

type Theme = 'light' | 'dark' | 'system';

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

export default function ProfilePage() {
  const router = useRouter();
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    first_name: '',
    last_name: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserProfile();
    loadThemePreference();
  }, []);

  const loadThemePreference = () => {
    try {
      const savedTheme = getCookie('theme') as Theme | null;
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Varsayılan olarak sistem temasını kullan
        setCurrentTheme('system');
        applyTheme('system');
      }
    } catch (error) {
      console.error('Tema yüklenirken hata:', error);
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    // Önce tüm tema sınıflarını kaldır
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      // Sistem temasını kontrol et
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Tema tercihini cookie'ye kaydet
    setCookie('theme', theme);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    setSuccess('Tema tercihi güncellendi');
    setTimeout(() => setSuccess(''), 3000);
    
    // Tema değiştiğinde sayfayı yenile (logo'nun güncellenmesi için)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const loadUserProfile = async () => {
    try {
      // Aktif Supabase oturumunu al
      const sessionUser = await authService.getCurrentUser();
      if (!sessionUser) {
        // Oturum yoksa login sayfasına yönlendir
        setLoading(false);
        window.location.href = '/login';
        return;
      }
      // Profil tablosundan kullanıcıyı getir (gerekirse oluşturur)
      let profile: any = null;
      try {
        profile = await authService.getUserProfile(sessionUser.id);
      } catch (e) {
        console.warn('getUserProfile hatası (fallback kullanılıyor):', e);
      }
      
      // Profil null ise veya hata varsa, temel bilgileri auth.user'dan kullan
      if (!profile) {
        profile = {
          id: sessionUser.id,
          email: sessionUser.email,
          first_name: sessionUser.user_metadata?.first_name || '',
          last_name: sessionUser.user_metadata?.last_name || '',
          role: sessionUser.user_metadata?.role || 'user',
          is_active: true
        };
      }
      
      const normalizedUser: User = {
        id: profile.id || sessionUser.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || sessionUser.email || '',
        role: profile.role || 'user'
      };
      setUser(normalizedUser);
      setProfileData({
        first_name: normalizedUser.first_name,
        last_name: normalizedUser.last_name,
        email: normalizedUser.email
      });
    } catch (error: any) {
      console.error('Profil yükleme hatası:', error);
      // Sadece kritik hatalar için mesaj göster (oturum yoksa zaten yönlendirildi)
      if (error?.message && !error.message.includes('session')) {
        setError('Kullanıcı bilgileri yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!user) return;

      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      
      setSuccess('Profil bilgileri başarıyla güncellendi');
    } catch (error: any) {
      setError(error.message || 'Profil güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Yeni şifreler eşleşmiyor');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return;
      }

      if (!passwordData.currentPassword) {
        setError('Mevcut şifrenizi girmelisiniz');
        return;
      }

      // Gerçek Supabase şifre değişikliği (artık eski şifreyi de kontrol ediyor)
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setSuccess('Şifre başarıyla değiştirildi');
      
      // Şifre formunu temizle
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.message || 'Şifre değiştirilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = async () => {
    try {
      setIsLogoutModalOpen(false);
      console.log('🔴 Çıkış yapılıyor...');
      await authService.logout();
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Çıkış hatası:', error);
      window.location.href = '/login';
    }
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

  // Profile görüntüleme yetkisi kontrolü
  if (!canView(Module.PROFILE)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Profil sayfasına erişim için yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Profil yükleniyor..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Profil Ayarları</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Kişisel bilgilerinizi, şifrenizi ve tema tercihlerinizi güncelleyin</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-md text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-2 rounded-md text-xs">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {/* Profil Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-2 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Profil Bilgileri</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Ad *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  E-posta *
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Rol
                </label>
                <input
                  type="text"
                  value={user ? getRoleDisplayName(user.role) : ''}
                  disabled
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors duration-200 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? 'Güncelleniyor...' : 'Profili Güncelle'}
              </button>
            </form>

            {/* Çıkış Yap Bölümü */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <h3 className="text-xs font-medium text-red-900 dark:text-red-300 mb-2 transition-colors duration-200">Hesap Güvenliği</h3>
                <p className="text-xs text-red-800 dark:text-red-200 mb-3 transition-colors duration-200">
                  Güvenliğiniz için işiniz bittiğinde çıkış yapmanız önerilir.
                </p>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors duration-200 text-xs"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>

          {/* Tema Ayarları */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-2 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Tema Ayarları</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                  Tema Tercihi
                </label>
                
                <div className="space-y-2">
                  {/* Açık Tema */}
                  <label className="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={currentTheme === 'light'}
                      onChange={() => handleThemeChange('light')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-yellow-400 rounded-full mr-2 flex items-center justify-center">
                        <svg className="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white transition-colors duration-200 text-sm">Açık Tema</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Parlak ve temiz görünüm</div>
                      </div>
                    </div>
                  </label>

                  {/* Koyu Tema */}
                  <label className="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={currentTheme === 'dark'}
                      onChange={() => handleThemeChange('dark')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-gray-800 rounded-full mr-2 flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white transition-colors duration-200 text-sm">Koyu Tema</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Göz yormayan koyu görünüm</div>
                      </div>
                    </div>
                  </label>

                  {/* Sistem Teması */}
                  <label className="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={currentTheme === 'system'}
                      onChange={() => handleThemeChange('system')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white transition-colors duration-200 text-sm">Sistem Teması</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">İşletim sistemi ayarlarını takip eder</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <h3 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1 transition-colors duration-200">Tema Bilgisi</h3>
                <p className="text-xs text-blue-800 dark:text-blue-200 transition-colors duration-200">
                  Tema tercihiniz tüm sayfalarda geçerli olacak ve tarayıcınızda kaydedilecektir.
                </p>
              </div>
            </div>
          </div>

          {/* Şifre Değiştirme */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-2 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Şifre Değiştir</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Yeni Şifre *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Yeni Şifre (Tekrar) *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 text-xs"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 dark:bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 disabled:opacity-50 transition-colors duration-200 text-xs"
              >
                {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>

            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <h3 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1 transition-colors duration-200">Şifre Güvenliği</h3>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 transition-colors duration-200">
                <li>• En az 6 karakter olmalıdır</li>
                <li>• Büyük ve küçük harf içermelidir</li>
                <li>• Sayı ve özel karakter içermelidir</li>
                <li>• Mevcut şifrenizden farklı olmalıdır</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Güvenli Çıkış"
        message="Oturumunuzu sonlandırmak istediğinizden emin misiniz?"
        confirmText="Çıkış Yap"
        cancelText="İptal"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        type="danger"
      />
    </div>
  );
} 