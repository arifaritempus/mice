'use client';

import { useLayoutEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SettingsService } from '@/lib/supabaseService';

interface ThemeSettings {
  primary_color?: string;
  secondary_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  info_color?: string;
  dark_bg_primary?: string;
  light_bg_primary?: string;
  dark_bg_secondary?: string;
  light_bg_secondary?: string;
  dark_card_bg?: string;
  light_card_bg?: string;
  dark_sidebar_bg?: string;
  light_sidebar_bg?: string;
  dark_sidebar_header_bg?: string;
  light_sidebar_header_bg?: string;
  dark_text_color?: string;
  light_text_color?: string;
  dark_sidebar_border?: string;
  light_sidebar_border?: string;
}

interface SettingsUpdateEvent extends CustomEvent {
  detail: {
    settings?: ThemeSettings;
  };
}

export default function ColorThemeApplier() {
  const { isDark } = useTheme();

  useLayoutEffect(() => {
    const applyColors = async (overrideSettings?: ThemeSettings) => {
      try {
        const resolvedSettings = overrideSettings || (await SettingsService.getSettings())?.general_settings as ThemeSettings;
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
        
        // CSS Değişkenlerini root'a ekle
        if (themeBgPrimary) root.style.setProperty('--theme-bg-primary', themeBgPrimary);
        if (themeBgSecondary) root.style.setProperty('--theme-bg-secondary', themeBgSecondary);
        if (themeCardBg) root.style.setProperty('--theme-card-bg', themeCardBg);
        if (themeSidebarBg) root.style.setProperty('--theme-sidebar-bg', themeSidebarBg);
        if (themeSidebarHeaderBg) root.style.setProperty('--theme-sidebar-header-bg', themeSidebarHeaderBg);
        if (themeTextColor) root.style.setProperty('--theme-text-color', themeTextColor);
        if (themeSidebarBorder) root.style.setProperty('--theme-sidebar-border', themeSidebarBorder);

        const styleId = 'tt-dynamic-theme-styles';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }

        let css = '';
        
        // Exclusion selector for elements that should NEVER be themed (like Vouchers)
        const exclude = ':not(.no-theme-root):not(.no-theme-root *)';

        // Body, Main ve Container elementleri için zemin rengi
        if (themeBgPrimary) {
          css += `
            body${exclude}, main${exclude}, .min-h-screen${exclude} { background-color: var(--theme-bg-primary) !important; }
            .bg-gray-50:not(button):not(input):not(select)${exclude}, 
            .bg-slate-50:not(button):not(input):not(select)${exclude},
            .bg-zinc-50:not(button):not(input):not(select)${exclude} { background-color: var(--theme-bg-primary) !important; }
          `;
          if (isDark) {
            css += `
              .dark body${exclude}, .dark main${exclude}, .dark .min-h-screen${exclude} { background-color: var(--theme-bg-primary) !important; }
              .dark .dark\\:bg-gray-950${exclude}, .dark .dark\\:bg-slate-950${exclude}, .dark .dark\\:bg-zinc-950${exclude} { background-color: var(--theme-bg-primary) !important; }
            \n`;
          }
        }
        
        // Card (Kart) bileşenleri
        if (themeCardBg) {
          css += `
            .card { background-color: var(--theme-card-bg) !important; }
            .bg-white:not(button):not(input):not(select):not(.sidebar):not(.sidebar-header)${exclude} { background-color: var(--theme-card-bg) !important; }
          `;
          if (isDark) {
            css += `
              .dark .dark\\:bg-gray-900${exclude}, .dark .dark\\:bg-slate-900${exclude}, .dark .dark\\:bg-zinc-900${exclude},
              .dark .dark\\:bg-gray-800${exclude}, .dark .dark\\:bg-slate-800${exclude}, .dark .dark\\:bg-zinc-800${exclude} { 
                background-color: var(--theme-card-bg) !important; 
              }
            \n`;
          }
        }

        // Metin Renkleri
        if (themeTextColor) {
          css += `
            body${exclude} { color: var(--theme-text-color) !important; }
            p:not([class*="text-"])${exclude}, 
            span:not([class*="text-"]):not([class*="blue"]):not([class*="red"]):not([class*="green"]):not([class*="yellow"])${exclude},
            h1:not([class*="text-"])${exclude}, 
            h2:not([class*="text-"])${exclude}, 
            h3:not([class*="text-"])${exclude}, 
            h4:not([class*="text-"])${exclude}, 
            h5:not([class*="text-"])${exclude} {
              color: var(--theme-text-color) !important;
            }
          `;
        }

        // Sidebar stilleri
        if (themeSidebarBg) css += `aside${exclude}, .sidebar, [class*="sidebar"] { background-color: var(--theme-sidebar-bg) !important; }\n`;
        if (themeSidebarHeaderBg) css += `aside header, .sidebar-header, [class*="sidebar"] [class*="header"] { background-color: var(--theme-sidebar-header-bg) !important; }\n`;
        if (themeSidebarBorder) css += `aside, .sidebar, [class*="sidebar"] { border-color: var(--theme-sidebar-border) !important; border-right-width: 1px; }\n`;

        styleEl.innerHTML = css;

      } catch (error) {
        console.error('Renk uygulama hatası:', error);
      }
    };

    applyColors();
    
    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as SettingsUpdateEvent;
      applyColors(customEvent?.detail?.settings);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [isDark]);

  return null;
}
