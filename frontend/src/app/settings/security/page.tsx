'use client';

import { useState, useEffect } from 'react';
import { SettingsService } from '@/lib/supabaseService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermissions, Module } from '@/lib/permissions';

interface SecuritySettings {
  password_min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  session_timeout: number;
  max_login_attempts: number;
  enable_two_factor: boolean;
  enable_login_notifications: boolean;
  enable_audit_log: boolean;
}

export default function SecuritySettingsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [settings, setSettings] = useState<SecuritySettings>({
    password_min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    session_timeout: 30,
    max_login_attempts: 5,
    enable_two_factor: false,
    enable_login_notifications: true,
    enable_audit_log: true
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await SettingsService.updateSetting('security_settings', settings);
      
      setSuccess('Güvenlik ayarları başarıyla kaydedildi');
    } catch (error) {
      setError('Güvenlik ayarları kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const allSettings = await SettingsService.getSettings();
        if (allSettings?.security_settings) {
          setSettings(allSettings.security_settings);
        }
      } catch (error) {
        console.error('Security settings load error:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadSecuritySettings();
  }, []);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SETTINGS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/settings" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ayarlara Dön
          </a>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingSpinner message="Güvenlik ayarları yükleniyor..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Güvenlik Ayarları</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sistem güvenlik ayarlarını yapılandırın</p>
        </div>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-2 py-2 rounded-md text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-2 py-2 rounded-md text-xs">
            {success}
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-200">Şifre Politikası</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-2 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Minimum Şifre Uzunluğu
                </label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.password_min_length}
                  onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">6-20 karakter arası</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Maksimum Giriş Denemesi
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.max_login_attempts}
                  onChange={(e) => handleChange('max_login_attempts', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">3-10 deneme arası</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white transition-colors duration-200">Şifre Gereksinimleri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.require_uppercase}
                    onChange={(e) => handleChange('require_uppercase', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Büyük harf zorunlu</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.require_lowercase}
                    onChange={(e) => handleChange('require_lowercase', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Küçük harf zorunlu</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.require_numbers}
                    onChange={(e) => handleChange('require_numbers', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Sayı zorunlu</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.require_special_chars}
                    onChange={(e) => handleChange('require_special_chars', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Özel karakter zorunlu</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Oturum Yönetimi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Oturum Zaman Aşımı (dakika)
                  </label>
                  <select
                    value={settings.session_timeout}
                    onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value={15}>15 dakika</option>
                    <option value={30}>30 dakika</option>
                    <option value={60}>1 saat</option>
                    <option value={120}>2 saat</option>
                    <option value={480}>8 saat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    İki Faktörlü Doğrulama
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.enable_two_factor}
                      onChange={(e) => handleChange('enable_two_factor', e.target.checked)}
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                    />
                                          <span className="ml-2 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Etkinleştir</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">SMS veya e-posta ile doğrulama</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Güvenlik Bildirimleri</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable_login_notifications}
                    onChange={(e) => handleChange('enable_login_notifications', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <div className="ml-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Giriş bildirimleri</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">Yeni girişlerde e-posta bildirimi gönder</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable_audit_log}
                    onChange={(e) => handleChange('enable_audit_log', e.target.checked)}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <div className="ml-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">Denetim günlüğü</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">Tüm kullanıcı işlemlerini kaydet</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Güvenlik Durumu</h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Güvenli</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">🔒</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Şifreli Bağlantı</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">📊</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">İzleniyor</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-xs"
              >
                {loading ? 'Kaydediliyor...' : 'Güvenlik Ayarlarını Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 