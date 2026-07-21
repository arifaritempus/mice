"use client";

import { useLayoutEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SettingsService } from "@/lib/supabaseService";

interface ThemeSettings {
  colorPrimary?: string;
  colorSecondary?: string;
  colorSuccess?: string;
  colorWarning?: string;
  colorError?: string;
  colorInfo?: string;
  darkBgMain?: string;
  lightBgMain?: string;
  darkBgSecondary?: string;
  lightBgSecondary?: string;
  darkCard?: string;
  lightCard?: string;
  darkSidebar?: string;
  lightSidebar?: string;
  darkSidebarHeader?: string;
  lightSidebarHeader?: string;
  darkText?: string;
  lightText?: string;
  darkSidebarBorder?: string;
  lightSidebarBorder?: string;
  darkIconLogo?: string;
  lightIconLogo?: string;
  darkMenuLogo?: string;
  lightMenuLogo?: string;
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
        const resolvedSettings =
          overrideSettings ||
          ((await SettingsService.getSettings())
            ?.general_settings as ThemeSettings);
        if (!resolvedSettings) return;

        const settings = resolvedSettings;
        const root = document.documentElement;

        // Genel renkler
        if (settings.colorPrimary)
          root.style.setProperty("--color-primary", settings.colorPrimary);
        if (settings.colorSecondary)
          root.style.setProperty("--color-secondary", settings.colorSecondary);
        if (settings.colorSuccess)
          root.style.setProperty("--color-success", settings.colorSuccess);
        if (settings.colorWarning)
          root.style.setProperty("--color-warning", settings.colorWarning);
        if (settings.colorError)
          root.style.setProperty("--color-error", settings.colorError);
        if (settings.colorInfo)
          root.style.setProperty("--color-info", settings.colorInfo);

        // Tema bazlı renkleri belirle
        const themeBgPrimary = isDark
          ? settings.darkBgMain
          : settings.lightBgMain;
        const themeBgSecondary = isDark
          ? settings.darkBgSecondary
          : settings.lightBgSecondary;
        const themeCardBg = isDark
          ? settings.darkCard
          : settings.lightCard;
        const themeSidebarBg = isDark
          ? settings.darkSidebar
          : settings.lightSidebar;
        const themeSidebarHeaderBg = isDark
          ? settings.darkSidebarHeader
          : settings.lightSidebarHeader;
        const themeTextColor = isDark
          ? settings.darkText
          : settings.lightText;
        const themeSidebarBorder = isDark
          ? settings.darkSidebarBorder
          : settings.lightSidebarBorder;

        // CSS Değişkenlerini root'a ekle
        if (themeBgPrimary)
          root.style.setProperty("--theme-bg-primary", themeBgPrimary);
        if (themeBgSecondary)
          root.style.setProperty("--theme-bg-secondary", themeBgSecondary);
        if (themeCardBg) root.style.setProperty("--theme-card-bg", themeCardBg);
        if (themeSidebarBg)
          root.style.setProperty("--theme-sidebar-bg", themeSidebarBg);
        if (themeSidebarHeaderBg)
          root.style.setProperty(
            "--theme-sidebar-header-bg",
            themeSidebarHeaderBg,
          );
        if (themeTextColor)
          root.style.setProperty("--theme-text-color", themeTextColor);
        if (themeSidebarBorder)
          root.style.setProperty("--theme-sidebar-border", themeSidebarBorder);

        // Dinamik favicon güncellemesi
        const faviconUrl = isDark
          ? settings.darkIconLogo ||
            settings.darkMenuLogo ||
            "/LOGO_NAVY.png"
          : settings.lightIconLogo ||
            settings.lightMenuLogo ||
            "/LOGO_NAVY.png";

        if (faviconUrl) {
          let link = document.querySelector(
            "link[rel~='icon']",
          ) as HTMLLinkElement;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        }

        const styleId = "tt-dynamic-theme-styles";
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }

        let css = "";

        // Exclusion selector for elements that should NEVER be themed (like Vouchers)
        const exclude = ":not(.no-theme-root):not(.no-theme-root *)";

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

        // İkincil zemin rengi (bg-secondary)
        if (themeBgSecondary) {
          css += `
            .bg-gray-100:not(button):not(input):not(select)${exclude}, 
            .bg-slate-100:not(button):not(input):not(select)${exclude},
            .bg-zinc-100:not(button):not(input):not(select)${exclude} { background-color: var(--theme-bg-secondary) !important; }
          `;
          if (isDark) {
            css += `
              .dark .dark\\:bg-gray-900${exclude}, .dark .dark\\:bg-v3-surface${exclude}, .dark .dark\\:bg-zinc-900${exclude} { background-color: var(--theme-bg-secondary) !important; }
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
              .dark .dark\\:bg-gray-800${exclude}, .dark .dark\\:bg-v3-surface${exclude}, .dark .dark\\:bg-zinc-800${exclude} { 
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
        if (themeSidebarBg)
          css += `aside${exclude}, .sidebar, [class*="sidebar"] { background-color: var(--theme-sidebar-bg) !important; }\n`;
        if (themeSidebarHeaderBg)
          css += `aside header, .sidebar-header, [class*="sidebar"] [class*="header"] { background-color: var(--theme-sidebar-header-bg) !important; }\n`;
        if (themeSidebarBorder)
          css += `aside, .sidebar, [class*="sidebar"] { border-color: var(--theme-sidebar-border) !important; border-right-width: 1px; }\n`;

        styleEl.innerHTML = css;
      } catch (error) {
        console.error("Renk uygulama hatası:", error);
      }
    };

    applyColors();

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as SettingsUpdateEvent;
      applyColors(customEvent?.detail?.settings);
    };
    window.addEventListener("settingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
    };
  }, [isDark]);

  return null;
}
