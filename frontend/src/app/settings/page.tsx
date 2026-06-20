'use client';

import { useState } from 'react';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';
export default function SettingsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [settings, setSettings] = useState({
    companyName: (typeof document !== "undefined" ? document.title.split("-")[0].trim() : "Firma"),
    companyEmail: 'info@tempustravel.com',
    companyPhone: '+90 212 555 0000',
    companyAddress: 'İstanbul, Türkiye',
    defaultCurrency: 'EUR',
    language: 'tr',
    timezone: 'Europe/Istanbul',
    notifications: {
      email: true,
      browser: true,
      sms: false
    }
  });

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Settings görüntüleme yetkisi kontrolü
  if (!canView(Module.SETTINGS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sistem Ayarları sayfasına erişim için yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    alert('Ayarlar kaydedildi!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2">
      <div className="w-full">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Sistem Ayarları</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sistem genelinde ayarları yapılandırın</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Genel Ayarlar</h2>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-2">
            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Şirket Adı
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Şirket E-posta
                </label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-colors duration-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Şirket Telefon
                </label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-colors duration-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Varsayılan Para Birimi
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-colors duration-200 text-xs"
                >
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dolar)</option>
                  <option value="TRY">TRY (Türk Lirası)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                Şirket Adresi
              </label>
              <textarea
                value={settings.companyAddress}
                onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-colors duration-200 text-xs"
              />
            </div>

            {/* System Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 transition-colors duration-200">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Sistem Ayarları</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Dil
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Saat Dilimi
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                    <option value="Europe/London">Londra (UTC+0)</option>
                    <option value="America/New_York">New York (UTC-5)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 transition-colors duration-200">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Bildirim Ayarları</h3>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings({
                      ...settings, 
                      notifications: {...settings.notifications, email: e.target.checked}
                    })}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    E-posta Bildirimleri
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="browserNotifications"
                    checked={settings.notifications.browser}
                    onChange={(e) => setSettings({
                      ...settings, 
                      notifications: {...settings.notifications, browser: e.target.checked}
                    })}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <label htmlFor="browserNotifications" className="ml-2 block text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    Tarayıcı Bildirimleri
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={settings.notifications.sms}
                    onChange={(e) => setSettings({
                      ...settings, 
                      notifications: {...settings.notifications, sms: e.target.checked}
                    })}
                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                  />
                  <label htmlFor="smsNotifications" className="ml-2 block text-xs text-gray-900 dark:text-white transition-colors duration-200">
                    SMS Bildirimleri
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200 text-xs"
              >
                Ayarları Kaydet
              </button>
            </div>
          </form>
        </div>

        {/* System Information */}
        <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sistem Bilgileri</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Sistem Versiyonu</h3>
              <p className="text-xs text-gray-900 dark:text-white">v2.0.0</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Son Güncelleme</h3>
              <p className="text-xs text-gray-900 dark:text-white">15.01.2024</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Veritabanı</h3>
              <p className="text-xs text-gray-900 dark:text-white">Supabase</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Framework</h3>
              <p className="text-xs text-gray-900 dark:text-white">Next.js 14</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 