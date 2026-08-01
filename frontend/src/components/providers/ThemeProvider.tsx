"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
// SSR sırasında tam ekran spinner ile ilk render'ı bloklamamak için

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getThemeFromCookie = (): Theme | null => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)nexus_theme=([^;]+)/);
    const value = match ? decodeURIComponent(match[1]) : "";
    if (value === "light" || value === "dark" || value === "system")
      return value;
    return null;
  };

  const setThemeCookie = (value: Theme) => {
    if (typeof document === "undefined") return;
    document.cookie = `nexus_theme=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
  };

  useEffect(() => {
    setMounted(true);

    // Load theme from cookie
    const savedTheme = getThemeFromCookie();
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Varsayılan her zaman açık tema
      setThemeState("light");
      applyTheme("light");
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    root.classList.remove("light", "dark");

    if (newTheme === "dark" || (newTheme === "system" && systemDark)) {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.add("light");
      setIsDark(false);
    }
    
    setThemeCookie(newTheme);

    // Fetch and apply dynamic color
    fetch("/api/theme-settings")
      .then((res) => res.json())
      .then((settings) => {
        if (!settings || !settings.general_settings?.colorPrimary) return;

        function hexToRgb(hex: string) {
          var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
          hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
          });
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
              }
            : null;
        }

        var baseRgb = hexToRgb(settings.general_settings?.colorPrimary);
        if (!baseRgb) return;

        var mix = function (c1: any, c2: any, weight: number) {
          return (
            Math.round(c1.r * weight + c2.r * (1 - weight)) +
            " " +
            Math.round(c1.g * weight + c2.g * (1 - weight)) +
            " " +
            Math.round(c1.b * weight + c2.b * (1 - weight))
          );
        };
        var white = { r: 255, g: 255, b: 255 };
        var black = { r: 0, g: 0, b: 0 };

        root.style.setProperty("--color-primary-50", mix(baseRgb, white, 0.1));
        root.style.setProperty("--color-primary-100", mix(baseRgb, white, 0.2));
        root.style.setProperty("--color-primary-200", mix(baseRgb, white, 0.4));
        root.style.setProperty("--color-primary-300", mix(baseRgb, white, 0.6));
        root.style.setProperty("--color-primary-400", mix(baseRgb, white, 0.8));
        root.style.setProperty(
          "--color-primary-500",
          baseRgb.r + " " + baseRgb.g + " " + baseRgb.b,
        );
        root.style.setProperty("--color-primary-600", mix(baseRgb, black, 0.8));
        root.style.setProperty("--color-primary-700", mix(baseRgb, black, 0.6));
        root.style.setProperty("--color-primary-800", mix(baseRgb, black, 0.4));
        root.style.setProperty("--color-primary-900", mix(baseRgb, black, 0.2));
        root.style.setProperty("--color-primary-950", mix(baseRgb, black, 0.1));
      })
      .catch(() => {});
  };

  const setTheme = (newTheme: Theme) => {
    // Tema değiştiğinde sayfayı yenilemeye gerek yok, React state'leri otomatik güncelleyecek.
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // İlk render'da da context'in mevcut olması için Provider'ı her zaman kur
  // (mounted olana kadar varsayılan değerlerle devam edilir)

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
