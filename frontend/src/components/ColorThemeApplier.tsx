'use client';

import { useLayoutEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SettingsService } from '@/lib/supabaseService';

export default function ColorThemeApplier() {
  const { isDark } = useTheme();

  useLayoutEffect(() => {
    const applyColors = async (overrideSettings?: any) => {
      try {
        const resolvedSettings = overrideSettings || (await SettingsService.getSettings())?.general_settings;
        if (!resolvedSettings) return;

        const settings = resolvedSettings;
        const root = document.documentElement;

        // Genel renkler
        if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
        if (settings.secondary_color) root.style.setProperty('--color-secondary', settings.secondary_color);
        if (settings.success_color) root.style.setProperty('--color-success', settings.success_color);
        if (settings.warning_color) root.style.setProperty('--color-warning', settings.warning_color);
        if (settings.error_color) root.style.setProperty('--color-error', settings.error_color);
        if (settings.info_color) root.style.setProperty('--color-info', settings.info_color);

        // Tema bazlı renkleri belirle
        const themeBgPrimary = isDark ? settings.dark_bg_primary : settings.light_bg_primary;
        const themeBgSecondary = isDark ? settings.dark_bg_secondary : settings.light_bg_secondary;
        const themeCardBg = isDark ? settings.dark_card_bg : settings.light_card_bg;
        const themeSidebarBg = isDark ? settings.dark_sidebar_bg : settings.light_sidebar_bg;
        const themeSidebarHeaderBg = isDark ? settings.dark_sidebar_header_bg : settings.light_sidebar_header_bg;
        const themeTextColor = isDark ? settings.dark_text_color : settings.light_text_color;
        const themeSidebarBorder = isDark ? settings.dark_sidebar_border : settings.light_sidebar_border;
        
        // CSS Değişkenlerini root'a ekle (Böylece tailwind ile uyumlu child öğeler kullanabilir)
        if (themeBgPrimary) root.style.setProperty('--theme-bg-primary', themeBgPrimary);
        if (themeBgSecondary) root.style.setProperty('--theme-bg-secondary', themeBgSecondary);
        if (themeCardBg) root.style.setProperty('--theme-card-bg', themeCardBg);
        if (themeSidebarBg) root.style.setProperty('--theme-sidebar-bg', themeSidebarBg);
        if (themeSidebarHeaderBg) root.style.setProperty('--theme-sidebar-header-bg', themeSidebarHeaderBg);
        if (themeTextColor) root.style.setProperty('--theme-text-color', themeTextColor);
        if (themeSidebarBorder) root.style.setProperty('--theme-sidebar-border', themeSidebarBorder);

        // Dinamik <style> etiketi ekle
        // Bu yapı sayesinde querySelectorAll ile zorla stil basmak gerekmez.
        // React component'leri mount/unmount olduğunda stiller otomatik çalışmaya devam eder.
        const styleId = 'tt-dynamic-theme-styles';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }

        let css = '';

        // Body, Main ve Container elementleri için zemin rengi
        if (themeBgPrimary) {
          css += `
            body, main, .min-h-screen { background-color: var(--theme-bg-primary) !important; }
            .bg-gray-50:not(button):not(input):not(select) { background-color: var(--theme-bg-primary) !important; }
          `;
          if (isDark) css += `.dark body, .dark main, .dark .min-h-screen { background-color: var(--theme-bg-primary) !important; }\n`;
        }
        
        // Card (Kart) bileşenleri
        if (themeCardBg) {
          css += `
            .card { background-color: var(--theme-card-bg) !important; }
            .bg-white:not(button):not(input):not(select):not(.sidebar):not(.sidebar-header) { background-color: var(--theme-card-bg) !important; }
          `;
          if (isDark) css += `.dark .dark\\:bg-gray-800:not(button):not(input):not(select):not(.sidebar):not(.sidebar-header) { background-color: var(--theme-card-bg) !important; }\n`;
        }

        // Metin Renkleri
        // Utility color class'larını (text-red-500 vb.) ezmemek için ':not' kurallarıyla seçiyoruz.
        if (themeTextColor) {
          css += `
            body { color: var(--theme-text-color) !important; }
            p:not([class*="text-"]), span:not([class*="text-"]):not([class*="blue"]):not([class*="red"]):not([class*="green"]):not([class*="yellow"]),
            h1:not([class*="text-"]), h2:not([class*="text-"]), h3:not([class*="text-"]), h4:not([class*="text-"]), h5:not([class*="text-"]) {
              color: var(--theme-text-color);
            }
          `;
        }

        // Sidebar stilleri (aside etiketi veya varsayılan klaslar yakalanıyor)
        if (themeSidebarBg) {
          css += `aside, .sidebar, [class*="sidebar"] { background-color: var(--theme-sidebar-bg) !important; }\n`;
        }
        if (themeSidebarHeaderBg) {
          css += `aside header, .sidebar-header, [class*="sidebar"] [class*="header"] { background-color: var(--theme-sidebar-header-bg) !important; }\n`;
        }
        if (themeSidebarBorder) {
          css += `aside, .sidebar, [class*="sidebar"] { border-color: var(--theme-sidebar-border) !important; border-right-width: 1px; }\n`;
        }

        styleEl.innerHTML = css;

      } catch (error) {
        console.error('Renk uygulama hatası:', error);
      }
    };

    applyColors();
    
    // Ayarlar güncellendiğinde tekrar tetikle
    const handleSettingsUpdate = (e: any) => applyColors(e?.detail?.settings);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [isDark]);

  return null;
}
