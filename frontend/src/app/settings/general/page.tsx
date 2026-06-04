'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { usePermissions, Module } from '@/lib/permissions';
import { SketchPicker, ColorResult } from 'react-color';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
// import { loadTanimlamalar } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const tanimlamalar = await loadTanimlamalar();
//   console.log(tanimlamalar);
// }

// fetchData();

interface GeneralSettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  default_currency: string;
  timezone: string;
  date_format: string;
  language: string;
  // Koyu Tema Logoları (Base64 data URL)
  dark_icon_logo?: string;       // koyu tema simge/ikon logo
  dark_wordmark_logo?: string;   // koyu tema yazı tipi/wordmark logo
  dark_menu_logo?: string;       // koyu tema menü logo
  // Açık Tema Logoları (Base64 data URL)
  light_icon_logo?: string;      // açık tema simge/ikon logo
  light_wordmark_logo?: string;  // açık tema yazı tipi/wordmark logo
  light_menu_logo?: string;      // açık tema menü logo
  // Mail Ayarları
  smtp_host: string;             // SMTP sunucu adresi
  smtp_port: string;             // SMTP port numarası
  smtp_username: string;         // SMTP kullanıcı adı
  smtp_password: string;         // SMTP şifre
  smtp_secure: boolean;          // SSL/TLS kullanımı
  mail_from_name: string;        // Gönderen adı
  mail_from_email: string;       // Gönderen e-posta
  mail_reply_to: string;         // Yanıt adresi
  // Renk Ayarları
  primary_color?: string;        // Ana renk
  secondary_color?: string;      // İkincil renk
  success_color?: string;        // Başarı rengi
  warning_color?: string;        // Uyarı rengi
  error_color?: string;          // Hata rengi
  info_color?: string;           // Bilgi rengi
  // Koyu Tema Renkleri
  dark_bg_primary?: string;     // Koyu tema ana zemin rengi
  dark_bg_secondary?: string;   // Koyu tema ikincil zemin rengi
  dark_card_bg?: string;         // Koyu tema kart rengi
  dark_sidebar_bg?: string;      // Koyu tema sidebar menü rengi
  dark_sidebar_header_bg?: string; // Koyu tema sidebar header rengi
  dark_text_color?: string;      // Koyu tema yazı rengi
  dark_sidebar_border?: string;  // Koyu tema sidebar çerçeve rengi
  // Açık Tema Renkleri
  light_bg_primary?: string;     // Açık tema ana zemin rengi
  light_bg_secondary?: string;   // Açık tema ikincil zemin rengi
  light_card_bg?: string;        // Açık tema kart rengi
  light_sidebar_bg?: string;     // Açık tema sidebar menü rengi
  light_sidebar_header_bg?: string; // Açık tema sidebar header rengi
  light_text_color?: string;     // Açık tema yazı rengi
  light_sidebar_border?: string; // Açık tema sidebar çerçeve rengi
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  company_name: '',
  company_email: '',
  company_phone: '',
  company_address: '',
  default_currency: 'TRY',
  timezone: 'Europe/Istanbul',
  date_format: 'DD.MM.YYYY',
  language: 'tr',
  dark_icon_logo: '',
  dark_wordmark_logo: '',
  dark_menu_logo: '',
  light_icon_logo: '',
  light_wordmark_logo: '',
  light_menu_logo: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_username: '',
  smtp_password: '',
  smtp_secure: true,
  mail_from_name: 'TEMPUS TRAVEL',
  mail_from_email: 'noreply@tempustravel.co',
  mail_reply_to: 'info@tempustravel.co',
  primary_color: '#2563eb',
  secondary_color: '#6b7280',
  success_color: '#10b981',
  warning_color: '#f59e0b',
  error_color: '#ef4444',
  info_color: '#3b82f6',
  dark_bg_primary: '#030712',
  dark_bg_secondary: '#111827',
  dark_card_bg: '#1f2937',
  dark_sidebar_bg: '#030712',
  dark_sidebar_header_bg: '#111827',
  dark_text_color: '#f9fafb',
  dark_sidebar_border: '#374151',
  light_bg_primary: '#f9fafb',
  light_bg_secondary: '#ffffff',
  light_card_bg: '#ffffff',
  light_sidebar_bg: '#f9fafb',
  light_sidebar_header_bg: '#ffffff',
  light_text_color: '#111827',
  light_sidebar_border: '#e5e7eb'
};

export default function GeneralSettingsPage() {
  const { canView, canEdit, loading: permissionsLoading } = usePermissions();
  const { isDark } = useTheme();

  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Supabase'e kaydet
      const { SettingsService } = await import('@/lib/supabaseService');
      await SettingsService.updateSetting('general_settings', settings);

      // Renkleri hemen uygula
      applyAllColors(settings);

      // Renkleri tekrar uygula (elementler render olabilir)
      setTimeout(() => {
        applyAllColors(settings);
      }, 100);
      setTimeout(() => {
        applyAllColors(settings);
      }, 500);

      // Custom event dispatch et (Sidebar/Theme canlı güncellensin)
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { settings } }));

      // Sekme başlığını anında güncelle
      if (settings.company_name) {
        document.title = `${settings.company_name} - MICE Yönetim Sistemi`;
      } else {
        document.title = 'MICE Yönetim Sistemi';
      }

      setSuccess('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Settings save error:', error);
      setError('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GeneralSettings, value: string | boolean) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Renk değişikliklerini CSS değişkenlerine uygula
      if (field.includes('_color') && typeof value === 'string') {
        applyColorToCSS(field, value);
      }

      return updated;
    });
  };

  const applyColorToCSS = (field: string, color: string) => {
    const root = document.documentElement;

    // Renk tipine göre CSS değişkeni adını oluştur (sadece kayıt için)
    let cssVarName = '';

    if (field.includes('dark_')) {
      const colorName = field.replace('dark_', '');
      cssVarName = `--dark-${colorName.replace(/_/g, '-')}`;
    } else if (field.includes('light_')) {
      const colorName = field.replace('light_', '');
      cssVarName = `--light-${colorName.replace(/_/g, '-')}`;
    } else {
      const colorName = field.replace('_color', '');
      cssVarName = `--color-${colorName}`;
    }

    // CSS değişkenini kaydet (her zaman)
    root.style.setProperty(cssVarName, color);

    // Tema bazlı renkleri uygula - sadece aktif tema için
    if (field.startsWith('dark_')) {
      // Koyu tema rengi - sadece koyu tema aktifse uygula
      if (isDark) {
        applyThemeColor(field, color);
      }
    } else if (field.startsWith('light_')) {
      // Açık tema rengi - sadece açık tema aktifse uygula
      if (!isDark) {
        applyThemeColor(field, color);
      }
    }
  };

  const applyThemeColor = (field: string, color: string) => {
    const root = document.documentElement;

    // Sadece aktif tema için renkleri uygula - tema kontrolü yap
    const isDarkField = field.startsWith('dark_');
    const isLightField = field.startsWith('light_');

    // Eğer renk değişikliği yapılan tema aktif değilse, sadece CSS değişkenini kaydet, uygulama
    if (isDarkField && !isDark) {
      return;
    }
    if (isLightField && isDark) {
      return;
    }

    // Tema renklerini doğrudan CSS değişkenlerine uygula
    if (field === 'dark_bg_primary' || field === 'light_bg_primary') {
      root.style.setProperty('--theme-bg-primary', color);
    } else if (field === 'dark_bg_secondary' || field === 'light_bg_secondary') {
      root.style.setProperty('--theme-bg-secondary', color);
    } else if (field === 'dark_card_bg' || field === 'light_card_bg') {
      root.style.setProperty('--theme-card-bg', color);
    } else if (field === 'dark_sidebar_bg' || field === 'light_sidebar_bg') {
      root.style.setProperty('--theme-sidebar-bg', color);
    } else if (field === 'dark_sidebar_header_bg' || field === 'light_sidebar_header_bg') {
      root.style.setProperty('--theme-sidebar-header-bg', color);
    } else if (field === 'dark_text_color' || field === 'light_text_color') {
      root.style.setProperty('--theme-text-color', color);
    } else if (field === 'dark_sidebar_border' || field === 'light_sidebar_border') {
      root.style.setProperty('--theme-sidebar-border', color);
    }
  };

  const handleColorChange = (
    field: 'primary_color' | 'secondary_color' | 'success_color' | 'warning_color' | 'error_color' | 'info_color' |
      'dark_bg_primary' | 'dark_bg_secondary' | 'dark_card_bg' | 'dark_sidebar_bg' | 'dark_sidebar_header_bg' | 'dark_text_color' | 'dark_sidebar_border' |
      'light_bg_primary' | 'light_bg_secondary' | 'light_card_bg' | 'light_sidebar_bg' | 'light_sidebar_header_bg' | 'light_text_color' | 'light_sidebar_border',
    color: ColorResult
  ) => {
    handleChange(field, color.hex);
  };

  // Renk seçici modal render helper
  const renderColorPicker = (field: string, currentColor: string) => {
    if (!mounted) return null;

    return colorPickerOpen === field ? createPortal(
      <>
        <div
          className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
          onClick={() => setColorPickerOpen(null)}
        ></div>
        <div className="fixed z-[9999] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[90vw] max-h-[90vh] overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Renk Seç</h3>
              <button
                onClick={() => setColorPickerOpen(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <SketchPicker
              color={currentColor}
              onChange={(color) => handleColorChange(field as any, color)}
              disableAlpha
              styles={{
                default: {
                  picker: {
                    boxShadow: 'none',
                  }
                }
              }}
            />
          </div>
        </div>
      </>,
      document.body
    ) : null;
  };

  const updateFavicon = (dataUrl: string) => {
    try {
      // Favicon link elementini bul veya oluştur
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }

      // Base64 data URL'i favicon olarak ayarla
      faviconLink.href = dataUrl;

      // Apple touch icon'u da güncelle
      let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleTouchIcon);
      }
      appleTouchIcon.href = dataUrl;

      // Shortcut icon'u da güncelle
      let shortcutIcon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      if (!shortcutIcon) {
        shortcutIcon = document.createElement('link');
        shortcutIcon.rel = 'shortcut icon';
        document.head.appendChild(shortcutIcon);
      }
      shortcutIcon.href = dataUrl;

    } catch (error) {
      console.error('Favicon güncelleme hatası:', error);
    }
  };

  const handleImageChange = async (field: 'dark_icon_logo' | 'dark_wordmark_logo' | 'dark_menu_logo' | 'light_icon_logo' | 'light_wordmark_logo' | 'light_menu_logo', file?: File | null) => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      console.log('Logo yükleniyor:', { field, fileName: file.name, fileSize: file.size, fileType: file.type });

      // Backend API'ye yükle (Service role key ile RLS bypass)
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('field', field);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE}/api/settings/upload-logo`, {
        method: 'POST',
        headers: {
           ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Logo yüklenemedi' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Logo yüklenemedi`);
      }

      const result = await response.json();

      if (!result.success || !result.url) {
        throw new Error('Logo yüklendi ama URL alınamadı.');
      }

      const logoUrl = result.url;

      // State'i hemen güncelle (önizleme için) - cache busting için timestamp ekle
      const logoUrlWithCache = `${logoUrl}?t=${Date.now()}`;
      const updatedSettingsForDisplay = { ...settings, [field]: logoUrlWithCache };
      setSettings(updatedSettingsForDisplay);

      // Eski logoyu sil (varsa ve farklı dosya adı ise) - Backend API üzerinden
      const oldLogoUrl = settings[field];
      if (oldLogoUrl && oldLogoUrl.startsWith('http') && oldLogoUrl.includes('/storage/v1/object/public/logos/')) {
        try {
          const oldFileName = oldLogoUrl.split('/logos/')[1]?.split('?')[0];
          const newFileName = logoUrl.split('/logos/')[1]?.split('?')[0];

          // Sadece farklı dosya adı ise sil (artık aynı dosya adını kullandığımız için genelde silmeye gerek yok)
          if (oldFileName && oldFileName !== newFileName) {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            await fetch(`${API_BASE}/api/settings/delete-logo`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ fileName: oldFileName })
            });
          }
        } catch (deleteError) {
          console.warn('Eski logo silinemedi:', deleteError);
          // Hata olsa bile devam et
        }
      }

      // Ayarları otomatik olarak kaydet (temiz URL ile - cache busting parametresi olmadan)
      const updatedSettingsForSave = { ...settings, [field]: logoUrl };
      try {
        const { SettingsService } = await import('@/lib/supabaseService');
        await SettingsService.updateSetting('general_settings', updatedSettingsForSave);

        // Custom event dispatch et (Sidebar/Theme canlı güncellensin)
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { settings: updatedSettingsForSave } }));

        console.log('✅ Ayarlar otomatik olarak kaydedildi');
        console.log('✅ Logo URL:', logoUrl);
        console.log('✅ Updated settings:', updatedSettingsForSave);
      } catch (saveError) {
        console.error('❌ Ayarlar kaydedilirken hata:', saveError);
        // Hata olsa bile devam et
      }

      // Eğer ikon logo değişiyorsa favicon'u da güncelle
      if (field === 'dark_icon_logo' || field === 'light_icon_logo') {
        // Mevcut tema için uygun logoyu kullan
        const currentIconLogo = isDark ? settings.dark_icon_logo : settings.light_icon_logo;
        const newIconLogo = field.includes('dark') ? (isDark ? logoUrl : currentIconLogo) : (isDark ? currentIconLogo : logoUrl);
        if (newIconLogo) {
          updateFavicon(newIconLogo);
        }
      }

      setSuccess('Logo başarıyla yüklendi ve kaydedildi');
    } catch (e: any) {
      console.error('Logo yükleme hatası:', e);
      setError(e?.message || 'Logo yüklenemedi. Lütfen farklı bir dosya deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const clearLogo = async (field: 'dark_icon_logo' | 'dark_wordmark_logo' | 'dark_menu_logo' | 'light_icon_logo' | 'light_wordmark_logo' | 'light_menu_logo') => {
    const logoUrl = settings[field];

    // Backend API üzerinden sil (varsa)
    if (logoUrl && logoUrl.startsWith('http') && logoUrl.includes('/storage/v1/object/public/logos/')) {
      try {
        const fileName = logoUrl.split('/logos/')[1]?.split('?')[0];
        if (fileName) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          const response = await fetch(`${API_BASE}/api/settings/delete-logo`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ fileName })
          });

          if (!response.ok) {
            console.warn('Logo silme hatası:', await response.text());
          }
        }
      } catch (error) {
        console.warn('Logo silme hatası:', error);
      }
    }

    // State'i güncelle
    const updatedSettings = { ...settings, [field]: '' };
    setSettings(updatedSettings);

    // Ayarları otomatik olarak kaydet
    try {
      const { SettingsService } = await import('@/lib/supabaseService');
      await SettingsService.updateSetting('general_settings', updatedSettings);

      // Custom event dispatch et (Sidebar/Theme canlı güncellensin)
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: { settings: updatedSettings } }));

      console.log('✅ Ayarlar otomatik olarak kaydedildi');
    } catch (saveError) {
      console.error('❌ Ayarlar kaydedilirken hata:', saveError);
      // Hata olsa bile devam et
    }

    // Eğer ikon logo siliniyorsa favicon'u varsayılan haline döndür
    if (field === 'dark_icon_logo' || field === 'light_icon_logo') {
      const defaultFavicon = '/favicon.ico';
      updateFavicon(defaultFavicon);
    }

    setSuccess('Logo başarıyla silindi ve kaydedildi');
  };

  const handleMailTest = async () => {
    setLoading(true);
    setError('');

    try {
      // Debug: Mail ayarlarını kontrol et
      console.log('Mail Test Ayarları:', {
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_username: settings.smtp_username,
        smtp_password: settings.smtp_password ? '***' : 'BOŞ',
        smtp_secure: settings.smtp_secure,
        mail_from_name: settings.mail_from_name,
        mail_from_email: settings.mail_from_email,
        mail_reply_to: settings.mail_reply_to,
        test_email: settings.company_email
      });

      // Mail ayarlarını test et
      const response = await fetch('/api/test-mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_username: settings.smtp_username,
          smtp_password: settings.smtp_password,
          smtp_secure: settings.smtp_secure,
          mail_from_name: settings.mail_from_name,
          mail_from_email: settings.mail_from_email,
          mail_reply_to: settings.mail_reply_to,
          test_email: settings.company_email // Test maili şirket e-postasına gönder
        }),
      });

      if (response.ok) {
        setSuccess('Test maili başarıyla gönderildi! Mail ayarlarınız doğru çalışıyor.');
      } else {
        const errorData = await response.json();
        setError(`Mail testi başarısız: ${errorData.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Mail test hatası:', error);
      setError('Mail testi sırasında bir hata oluştu. Lütfen ayarlarınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Önce Supabase'den yükle
        const { SettingsService } = await import('@/lib/supabaseService');
        const settings = await SettingsService.getSettings();
        const generalSettings = settings.general_settings || {};

        if (Object.keys(generalSettings).length > 0) {
          const mergedSettings: GeneralSettings = {
            ...DEFAULT_GENERAL_SETTINGS,
            ...generalSettings,
            smtp_port: String(generalSettings.smtp_port ?? DEFAULT_GENERAL_SETTINGS.smtp_port),
            smtp_host: String(generalSettings.smtp_host ?? DEFAULT_GENERAL_SETTINGS.smtp_host),
            smtp_username: String(generalSettings.smtp_username ?? DEFAULT_GENERAL_SETTINGS.smtp_username),
            smtp_password: String(generalSettings.smtp_password ?? DEFAULT_GENERAL_SETTINGS.smtp_password),
            mail_from_name: String(generalSettings.mail_from_name ?? DEFAULT_GENERAL_SETTINGS.mail_from_name),
            mail_from_email: String(generalSettings.mail_from_email ?? DEFAULT_GENERAL_SETTINGS.mail_from_email),
            mail_reply_to: String(generalSettings.mail_reply_to ?? DEFAULT_GENERAL_SETTINGS.mail_reply_to)
          };
          setSettings(mergedSettings);

          // Eğer ikon logo varsa favicon'u güncelle
          const currentIconLogo = isDark ? mergedSettings.dark_icon_logo : mergedSettings.light_icon_logo;
          if (currentIconLogo) {
            updateFavicon(currentIconLogo);
          }

          // Renkleri uygula
          applyAllColors(mergedSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Tüm renkleri uygula
  const applyAllColors = (settingsData: GeneralSettings) => {
    const root = document.documentElement;

    // Genel renkler
    if (settingsData.primary_color) root.style.setProperty('--color-primary', settingsData.primary_color);
    if (settingsData.secondary_color) root.style.setProperty('--color-secondary', settingsData.secondary_color);
    if (settingsData.success_color) root.style.setProperty('--color-success', settingsData.success_color);
    if (settingsData.warning_color) root.style.setProperty('--color-warning', settingsData.warning_color);
    if (settingsData.error_color) root.style.setProperty('--color-error', settingsData.error_color);
    if (settingsData.info_color) root.style.setProperty('--color-info', settingsData.info_color);

    // Tema bazlı renkleri uygula
    if (isDark) {
      if (settingsData.dark_bg_primary) {
        root.style.setProperty('--theme-bg-primary', settingsData.dark_bg_primary);
      }
      if (settingsData.dark_bg_secondary) {
        root.style.setProperty('--theme-bg-secondary', settingsData.dark_bg_secondary);
      }
      if (settingsData.dark_card_bg) {
        root.style.setProperty('--theme-card-bg', settingsData.dark_card_bg);
      }
      if (settingsData.dark_sidebar_bg) {
        root.style.setProperty('--theme-sidebar-bg', settingsData.dark_sidebar_bg);
      }
      if (settingsData.dark_sidebar_header_bg) {
        root.style.setProperty('--theme-sidebar-header-bg', settingsData.dark_sidebar_header_bg);
      }
      if (settingsData.dark_text_color) {
        root.style.setProperty('--theme-text-color', settingsData.dark_text_color);
      }
      if (settingsData.dark_sidebar_border) {
        root.style.setProperty('--theme-sidebar-border', settingsData.dark_sidebar_border);
      }
    } else {
      if (settingsData.light_bg_primary) {
        root.style.setProperty('--theme-bg-primary', settingsData.light_bg_primary);
      }
      if (settingsData.light_bg_secondary) {
        root.style.setProperty('--theme-bg-secondary', settingsData.light_bg_secondary);
      }
      if (settingsData.light_card_bg) {
        root.style.setProperty('--theme-card-bg', settingsData.light_card_bg);
      }
      if (settingsData.light_sidebar_bg) {
        root.style.setProperty('--theme-sidebar-bg', settingsData.light_sidebar_bg);
      }
      if (settingsData.light_sidebar_header_bg) {
        root.style.setProperty('--theme-sidebar-header-bg', settingsData.light_sidebar_header_bg);
      }
      if (settingsData.light_text_color) {
        root.style.setProperty('--theme-text-color', settingsData.light_text_color);
      }
      if (settingsData.light_sidebar_border) {
        root.style.setProperty('--theme-sidebar-border', settingsData.light_sidebar_border);
      }
    }
  };

  // Tema değişikliklerini dinle
  useEffect(() => {
    const currentIconLogo = isDark ? settings.dark_icon_logo : settings.light_icon_logo;
    if (currentIconLogo) {
      updateFavicon(currentIconLogo);
    }
  }, [isDark, settings.dark_icon_logo, settings.light_icon_logo]);

  // Renkleri CSS değişkenlerine uygula
  useEffect(() => {
    if (settings.primary_color) applyColorToCSS('primary_color', settings.primary_color);
    if (settings.secondary_color) applyColorToCSS('secondary_color', settings.secondary_color);
    if (settings.success_color) applyColorToCSS('success_color', settings.success_color);
    if (settings.warning_color) applyColorToCSS('warning_color', settings.warning_color);
    if (settings.error_color) applyColorToCSS('error_color', settings.error_color);
    if (settings.info_color) applyColorToCSS('info_color', settings.info_color);

    // Koyu tema renkleri
    if (settings.dark_bg_primary) applyColorToCSS('dark_bg_primary', settings.dark_bg_primary);
    if (settings.dark_bg_secondary) applyColorToCSS('dark_bg_secondary', settings.dark_bg_secondary);
    if (settings.dark_card_bg) applyColorToCSS('dark_card_bg', settings.dark_card_bg);
    if (settings.dark_sidebar_bg) applyColorToCSS('dark_sidebar_bg', settings.dark_sidebar_bg);
    if (settings.dark_sidebar_header_bg) applyColorToCSS('dark_sidebar_header_bg', settings.dark_sidebar_header_bg);
    if (settings.dark_text_color) applyColorToCSS('dark_text_color', settings.dark_text_color);
    if (settings.dark_sidebar_border) applyColorToCSS('dark_sidebar_border', settings.dark_sidebar_border);

    // Açık tema renkleri
    if (settings.light_bg_primary) applyColorToCSS('light_bg_primary', settings.light_bg_primary);
    if (settings.light_bg_secondary) applyColorToCSS('light_bg_secondary', settings.light_bg_secondary);
    if (settings.light_card_bg) applyColorToCSS('light_card_bg', settings.light_card_bg);
    if (settings.light_sidebar_bg) applyColorToCSS('light_sidebar_bg', settings.light_sidebar_bg);
    if (settings.light_sidebar_header_bg) applyColorToCSS('light_sidebar_header_bg', settings.light_sidebar_header_bg);
    if (settings.light_text_color) applyColorToCSS('light_text_color', settings.light_text_color);
    if (settings.light_sidebar_border) applyColorToCSS('light_sidebar_border', settings.light_sidebar_border);
  }, [
    settings.primary_color,
    settings.secondary_color,
    settings.success_color,
    settings.warning_color,
    settings.error_color,
    settings.info_color,
    settings.dark_bg_primary,
    settings.dark_bg_secondary,
    settings.dark_card_bg,
    settings.dark_sidebar_bg,
    settings.dark_sidebar_header_bg,
    settings.dark_text_color,
    settings.dark_sidebar_border,
    settings.light_bg_primary,
    settings.light_bg_secondary,
    settings.light_card_bg,
    settings.light_sidebar_bg,
    settings.light_sidebar_header_bg,
    settings.light_text_color,
    settings.light_sidebar_border
  ]);

  // Tema değiştiğinde renkleri uygula
  useEffect(() => {
    if (isDark) {
      if (settings.dark_bg_primary) applyThemeColor('dark_bg_primary', settings.dark_bg_primary);
      if (settings.dark_bg_secondary) applyThemeColor('dark_bg_secondary', settings.dark_bg_secondary);
      if (settings.dark_card_bg) applyThemeColor('dark_card_bg', settings.dark_card_bg);
      if (settings.dark_sidebar_bg) applyThemeColor('dark_sidebar_bg', settings.dark_sidebar_bg);
      if (settings.dark_sidebar_header_bg) applyThemeColor('dark_sidebar_header_bg', settings.dark_sidebar_header_bg);
      if (settings.dark_text_color) applyThemeColor('dark_text_color', settings.dark_text_color);
      if (settings.dark_sidebar_border) applyThemeColor('dark_sidebar_border', settings.dark_sidebar_border);
    } else {
      if (settings.light_bg_primary) applyThemeColor('light_bg_primary', settings.light_bg_primary);
      if (settings.light_bg_secondary) applyThemeColor('light_bg_secondary', settings.light_bg_secondary);
      if (settings.light_card_bg) applyThemeColor('light_card_bg', settings.light_card_bg);
      if (settings.light_sidebar_bg) applyThemeColor('light_sidebar_bg', settings.light_sidebar_bg);
      if (settings.light_sidebar_header_bg) applyThemeColor('light_sidebar_header_bg', settings.light_sidebar_header_bg);
      if (settings.light_text_color) applyThemeColor('light_text_color', settings.light_text_color);
      if (settings.light_sidebar_border) applyThemeColor('light_sidebar_border', settings.light_sidebar_border);
    }
  }, [isDark,
    settings.dark_bg_primary, settings.dark_bg_secondary, settings.dark_card_bg,
    settings.dark_sidebar_bg, settings.dark_sidebar_header_bg, settings.dark_text_color, settings.dark_sidebar_border,
    settings.light_bg_primary, settings.light_bg_secondary, settings.light_card_bg,
    settings.light_sidebar_bg, settings.light_sidebar_header_bg, settings.light_text_color, settings.light_sidebar_border
  ]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Settings görüntüleme yetkisi kontrolü
  if (!canView(Module.SETTINGS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Ayarlar sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-2 transition-colors duration-200"
      style={{
        backgroundColor: isDark
          ? 'var(--theme-bg-primary, #030712)'
          : 'var(--theme-bg-primary, #f9fafb)'
      }}
    >
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Genel Ayarlar</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sistem genel ayarlarını yapılandırın</p>
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
        <div
          className="rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors duration-200"
          style={{
            backgroundColor: isDark
              ? 'var(--theme-card-bg, #1f2937)'
              : 'var(--theme-card-bg, #ffffff)'
          }}
        >
          <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Şirket Bilgileri</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-2 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Şirket Adı *
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  required
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  E-posta *
                </label>
                <input
                  type="email"
                  value={settings.company_email}
                  onChange={(e) => handleChange('company_email', e.target.value)}
                  required
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={settings.company_phone}
                  onChange={(e) => handleChange('company_phone', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  Adres
                </label>
                <input
                  type="text"
                  value={settings.company_address}
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Sistem Ayarları</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Varsayılan Para Birimi
                  </label>
                  <select
                    value={settings.default_currency}
                    onChange={(e) => handleChange('default_currency', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value="TRY">Türk Lirası (₺)</option>
                    <option value="USD">Amerikan Doları ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">İngiliz Sterlini (£)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Saat Dilimi
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                    <option value="Europe/London">Londra (UTC+0)</option>
                    <option value="Europe/Paris">Paris (UTC+1)</option>
                    <option value="America/New_York">New York (UTC-5)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Tarih Formatı
                  </label>
                  <select
                    value={settings.date_format}
                    onChange={(e) => handleChange('date_format', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value="DD.MM.YYYY">DD.MM.YYYY (GG.AA.YYYY)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                    Dil
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition-colors duration-200 text-xs"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logolar */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Logolar</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">PNG tercih edilir. İkon logo kare, wordmark logo yatay, menü logo yatay önerilir. Tema değişikliklerinde logolar otomatik olarak güncellenir.</p>

              {/* Koyu Tema Logoları */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-gray-800 dark:bg-gray-200 rounded-full mr-2"></span>
                  Koyu Tema Logoları
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Koyu Tema İkon Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Koyu Tema İkon Logo</label>
                    <div className="flex items-center gap-3">
                      {settings.dark_icon_logo ? (
                        <img src={settings.dark_icon_logo} alt="Dark Icon Logo" className="h-12 w-12 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" key={settings.dark_icon_logo} />
                      ) : (
                        <div className="h-12 w-12 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">Önizleme</div>
                      )}
                      <div className="flex gap-2">
                        <label className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                          Yükle
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('dark_icon_logo', e.target.files?.[0])} />
                        </label>
                        {settings.dark_icon_logo && (
                          <button type="button" onClick={() => clearLogo('dark_icon_logo')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Koyu Tema Wordmark Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Koyu Tema Wordmark Logo</label>
                    <div className="flex items-center gap-3">
                      {settings.dark_wordmark_logo ? (
                        <img src={settings.dark_wordmark_logo} alt="Dark Wordmark Logo" className="h-12 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-[200px]" key={settings.dark_wordmark_logo} />
                      ) : (
                        <div className="h-12 w-40 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">Önizleme</div>
                      )}
                      <div className="flex gap-2">
                        <label className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                          Yükle
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('dark_wordmark_logo', e.target.files?.[0])} />
                        </label>
                        {settings.dark_wordmark_logo && (
                          <button type="button" onClick={() => clearLogo('dark_wordmark_logo')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Koyu Tema Menü Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Koyu Tema Menü Logo</label>
                    <div className="flex items-center gap-3">
                      {settings.dark_menu_logo ? (
                        <img src={settings.dark_menu_logo} alt="Dark Menu Logo" className="h-12 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-[200px]" key={settings.dark_menu_logo} />
                      ) : (
                        <div className="h-12 w-40 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">Önizleme</div>
                      )}
                      <div className="flex gap-2">
                        <label className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                          Yükle
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('dark_menu_logo', e.target.files?.[0])} />
                        </label>
                        {settings.dark_menu_logo && (
                          <button type="button" onClick={() => clearLogo('dark_menu_logo')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Açık Tema Logoları */}
              <div>
                <h4 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-gray-200 dark:bg-gray-800 rounded-full mr-2"></span>
                  Açık Tema Logoları
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Açık Tema İkon Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Açık Tema İkon Logo</label>
                    <div className="flex items-center gap-3">
                      {settings.light_icon_logo ? (
                        <img src={settings.light_icon_logo} alt="Light Icon Logo" className="h-12 w-12 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" key={settings.light_icon_logo} />
                      ) : (
                        <div className="h-12 w-12 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">Önizleme</div>
                      )}
                      <div className="flex gap-2">
                        <label className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                          Yükle
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('light_icon_logo', e.target.files?.[0])} />
                        </label>
                        {settings.light_icon_logo && (
                          <button type="button" onClick={() => clearLogo('light_icon_logo')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Açık Tema Wordmark Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Açık Tema Wordmark Logo</label>
                    <div className="flex items-center gap-3">
                      {settings.light_wordmark_logo ? (
                        <img src={settings.light_wordmark_logo} alt="Light Wordmark Logo" className="h-12 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-[200px]" key={settings.light_wordmark_logo} />
                      ) : (
                        <div className="h-12 w-40 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">Önizleme</div>
                      )}
                      <div className="flex gap-2">
                        <label className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                          Yükle
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('light_wordmark_logo', e.target.files?.[0])} />
                        </label>
                        {settings.light_wordmark_logo && (
                          <button type="button" onClick={() => clearLogo('light_wordmark_logo')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Açık Tema Menü Logo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Açık Tema Menü Logo</label>
                    <div className="flex items-center gap-3">
                      {settings.light_menu_logo ? (
                        <img src={settings.light_menu_logo} alt="Light Menu Logo" className="h-12 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 max-w-[200px]" key={settings.light_menu_logo} />
                      ) : (
                        <div className="h-12 w-40 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">Önizleme</div>
                      )}
                      <div className="flex gap-2">
                        <label className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                          Yükle
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('light_menu_logo', e.target.files?.[0])} />
                        </label>
                        {settings.light_menu_logo && (
                          <button type="button" onClick={() => clearLogo('light_menu_logo')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">Kaldır</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mail Ayarları */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Mail Ayarları</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Sistem otomatik mail gönderimi için SMTP ayarları. Bu ayarlar sistem genelinde kullanılacaktır.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SMTP Sunucu */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">SMTP Sunucu</label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* SMTP Port */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">SMTP Port</label>
                  <input
                    type="text"
                    value={settings.smtp_port}
                    onChange={(e) => handleChange('smtp_port', e.target.value)}
                    placeholder="587"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* SMTP Kullanıcı Adı */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">SMTP Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={settings.smtp_username}
                    onChange={(e) => handleChange('smtp_username', e.target.value)}
                    placeholder="kullanici@domain.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* SMTP Şifre */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">SMTP Şifre</label>
                  <input
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => handleChange('smtp_password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* SSL/TLS */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Güvenli Bağlantı</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="smtp_secure"
                        checked={settings.smtp_secure === true}
                        onChange={() => handleChange('smtp_secure', true)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SSL/TLS</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="smtp_secure"
                        checked={settings.smtp_secure === false}
                        onChange={() => handleChange('smtp_secure', false)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">None</span>
                    </label>
                  </div>
                </div>

                {/* Gönderen Adı */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gönderen Adı</label>
                  <input
                    type="text"
                    value={settings.mail_from_name}
                    onChange={(e) => handleChange('mail_from_name', e.target.value)}
                    placeholder="TEMPUS TRAVEL"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* Gönderen E-posta */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Gönderen E-posta</label>
                  <input
                    type="email"
                    value={settings.mail_from_email}
                    onChange={(e) => handleChange('mail_from_email', e.target.value)}
                    placeholder="noreply@tempustravel.co"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* Yanıt Adresi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Yanıt Adresi</label>
                  <input
                    type="email"
                    value={settings.mail_reply_to}
                    onChange={(e) => handleChange('mail_reply_to', e.target.value)}
                    placeholder="info@tempustravel.co"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Mail Test Butonu */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleMailTest}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Mail Ayarlarını Test Et
                </button>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Test maili göndererek ayarların doğru çalıştığını kontrol edin</p>
              </div>
            </div>

            {/* Renk Ayarları */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">Renk Ayarları</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Sistem genelinde kullanılacak renkleri özelleştirin. Renkler CSS değişkenleri olarak uygulanır.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Primary Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ana Renk (Primary)</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.primary_color || '#2563eb' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'primary' ? null : 'primary')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.primary_color || '#2563eb'}
                      </span>
                    </div>
                    {renderColorPicker('primary', settings.primary_color || '#2563eb')}
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">İkincil Renk (Secondary)</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.secondary_color || '#6b7280' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'secondary' ? null : 'secondary')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.secondary_color || '#6b7280'}
                      </span>
                    </div>
                    {renderColorPicker('secondary', settings.secondary_color || '#6b7280')}
                  </div>
                </div>

                {/* Success Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Başarı Rengi (Success)</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.success_color || '#10b981' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'success' ? null : 'success')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.success_color || '#10b981'}
                      </span>
                    </div>
                    {renderColorPicker('success', settings.success_color || '#10b981')}
                  </div>
                </div>

                {/* Warning Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Uyarı Rengi (Warning)</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.warning_color || '#f59e0b' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'warning' ? null : 'warning')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.warning_color || '#f59e0b'}
                      </span>
                    </div>
                    {renderColorPicker('warning', settings.warning_color || '#f59e0b')}
                  </div>
                </div>

                {/* Error Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Hata Rengi (Error)</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.error_color || '#ef4444' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'error' ? null : 'error')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.error_color || '#ef4444'}
                      </span>
                    </div>
                    {renderColorPicker('error', settings.error_color || '#ef4444')}
                  </div>
                </div>

                {/* Info Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Bilgi Rengi (Info)</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.info_color || '#3b82f6' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'info' ? null : 'info')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.info_color || '#3b82f6'}
                      </span>
                    </div>
                    {renderColorPicker('info', settings.info_color || '#3b82f6')}
                  </div>
                </div>
              </div>

              {/* Renk Önizleme */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Renk Önizleme</p>
                <div className="flex flex-wrap gap-2">
                  <div
                    className="px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: settings.primary_color || '#2563eb' }}
                  >
                    Primary
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: settings.secondary_color || '#6b7280' }}
                  >
                    Secondary
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: settings.success_color || '#10b981' }}
                  >
                    Success
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: settings.warning_color || '#f59e0b' }}
                  >
                    Warning
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: settings.error_color || '#ef4444' }}
                  >
                    Error
                  </div>
                  <div
                    className="px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: settings.info_color || '#3b82f6' }}
                  >
                    Info
                  </div>
                </div>
              </div>
            </div>

            {/* Koyu Tema Renk Ayarları */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200 flex items-center">
                <span className="w-3 h-3 bg-gray-800 dark:bg-gray-200 rounded-full mr-2"></span>
                Koyu Tema Renk Ayarları
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Koyu tema için zemin, kart, sidebar ve yazı renklerini özelleştirin.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Koyu Tema Ana Zemin */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ana Zemin Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_bg_primary || '#030712' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_bg_primary' ? null : 'dark_bg_primary')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.dark_bg_primary || '#030712'}
                      </span>
                    </div>
                    {renderColorPicker('dark_bg_primary', settings.dark_bg_primary || '#030712')}
                  </div>
                </div>

                {/* Koyu Tema İkincil Zemin */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">İkincil Zemin Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_bg_secondary || '#111827' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_bg_secondary' ? null : 'dark_bg_secondary')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.dark_bg_secondary || '#111827'}
                      </span>
                    </div>
                    {renderColorPicker('dark_bg_secondary', settings.dark_bg_secondary || '#111827')}
                  </div>
                </div>

                {/* Koyu Tema Kart Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kart Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_card_bg || '#1f2937' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_card_bg' ? null : 'dark_card_bg')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.dark_card_bg || '#1f2937'}
                      </span>
                    </div>
                    {renderColorPicker('dark_card_bg', settings.dark_card_bg || '#1f2937')}
                  </div>
                </div>

                {/* Koyu Tema Sidebar Menü Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sidebar Menü Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_sidebar_bg || '#030712' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_sidebar_bg' ? null : 'dark_sidebar_bg')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.dark_sidebar_bg || '#030712'}
                      </span>
                    </div>
                    {renderColorPicker('dark_sidebar_bg', settings.dark_sidebar_bg || '#030712')}
                  </div>
                </div>

                {/* Koyu Tema Sidebar Header Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sidebar Header Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_sidebar_header_bg || '#111827' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_sidebar_header_bg' ? null : 'dark_sidebar_header_bg')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.dark_sidebar_header_bg || '#111827'}
                      </span>
                    </div>
                    {renderColorPicker('dark_sidebar_header_bg', settings.dark_sidebar_header_bg || '#111827')}
                  </div>
                </div>

                {/* Koyu Tema Yazı Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Yazı Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_text_color || '#f9fafb' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_text_color' ? null : 'dark_text_color')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.dark_text_color || '#f9fafb'}
                      </span>
                    </div>
                    {renderColorPicker('dark_text_color', settings.dark_text_color || '#f9fafb')}
                  </div>
                </div>

                {/* Koyu Tema Sidebar Çerçeve Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sidebar Çerçeve Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.dark_sidebar_border || '#374151' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'dark_sidebar_border' ? null : 'dark_sidebar_border')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.dark_sidebar_border || '#374151'}
                      </span>
                    </div>
                    {renderColorPicker('dark_sidebar_border', settings.dark_sidebar_border || '#374151')}
                  </div>
                </div>
              </div>
            </div>

            {/* Açık Tema Renk Ayarları */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200 flex items-center">
                <span className="w-3 h-3 bg-gray-200 dark:bg-gray-800 rounded-full mr-2"></span>
                Açık Tema Renk Ayarları
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Açık tema için zemin, kart, sidebar ve yazı renklerini özelleştirin.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Açık Tema Ana Zemin */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ana Zemin Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_bg_primary || '#f9fafb' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_bg_primary' ? null : 'light_bg_primary')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.light_bg_primary || '#f9fafb'}
                      </span>
                    </div>
                    {renderColorPicker('light_bg_primary', settings.light_bg_primary || '#f9fafb')}
                  </div>
                </div>

                {/* Açık Tema İkincil Zemin */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">İkincil Zemin Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_bg_secondary || '#ffffff' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_bg_secondary' ? null : 'light_bg_secondary')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.light_bg_secondary || '#ffffff'}
                      </span>
                    </div>
                    {renderColorPicker('light_bg_secondary', settings.light_bg_secondary || '#ffffff')}
                  </div>
                </div>

                {/* Açık Tema Kart Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kart Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_card_bg || '#ffffff' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_card_bg' ? null : 'light_card_bg')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.light_card_bg || '#ffffff'}
                      </span>
                    </div>
                    {renderColorPicker('light_card_bg', settings.light_card_bg || '#ffffff')}
                  </div>
                </div>

                {/* Açık Tema Sidebar Menü Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sidebar Menü Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_sidebar_bg || '#f9fafb' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_sidebar_bg' ? null : 'light_sidebar_bg')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.light_sidebar_bg || '#f9fafb'}
                      </span>
                    </div>
                    {renderColorPicker('light_sidebar_bg', settings.light_sidebar_bg || '#f9fafb')}
                  </div>
                </div>

                {/* Açık Tema Sidebar Header Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sidebar Header Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_sidebar_header_bg || '#ffffff' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_sidebar_header_bg' ? null : 'light_sidebar_header_bg')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.light_sidebar_header_bg || '#ffffff'}
                      </span>
                    </div>
                    {renderColorPicker('light_sidebar_header_bg', settings.light_sidebar_header_bg || '#ffffff')}
                  </div>
                </div>

                {/* Açık Tema Yazı Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Yazı Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_text_color || '#111827' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_text_color' ? null : 'light_text_color')}
                    >
                      <span className="text-white text-xs font-medium drop-shadow-lg">
                        {settings.light_text_color || '#111827'}
                      </span>
                    </div>
                    {renderColorPicker('light_text_color', settings.light_text_color || '#111827')}
                  </div>
                </div>

                {/* Açık Tema Sidebar Çerçeve Rengi */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Sidebar Çerçeve Rengi</label>
                  <div className="relative">
                    <div
                      className="w-full h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer flex items-center justify-center hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: settings.light_sidebar_border || '#e5e7eb' }}
                      onClick={() => setColorPickerOpen(colorPickerOpen === 'light_sidebar_border' ? null : 'light_sidebar_border')}
                    >
                      <span className="text-gray-900 text-xs font-medium drop-shadow-lg">
                        {settings.light_sidebar_border || '#e5e7eb'}
                      </span>
                    </div>
                    {renderColorPicker('light_sidebar_border', settings.light_sidebar_border || '#e5e7eb')}
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
                {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 