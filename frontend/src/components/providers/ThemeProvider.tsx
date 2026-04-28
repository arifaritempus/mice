'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
// SSR sırasında tam ekran spinner ile ilk render'ı bloklamamak için

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isInitialMount = useRef(true); // İlk yüklemede yenileme yapmamak için

  const getThemeFromCookie = (): Theme | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
    const value = match ? decodeURIComponent(match[1]) : '';
    if (value === 'light' || value === 'dark' || value === 'system') return value;
    return null;
  };

  const setThemeCookie = (value: Theme) => {
    if (typeof document === 'undefined') return;
    document.cookie = `theme=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
  };

  useEffect(() => {
    setMounted(true);
    
    // Load theme from cookie
    const savedTheme = getThemeFromCookie();
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Varsayılan her zaman koyu tema
      setThemeState('dark');
      applyTheme('dark');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
    } else {
      root.classList.add(newTheme);
      setIsDark(newTheme === 'dark');
    }
    
    // Save to cookie
    setThemeCookie(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    // İlk yüklemede yenileme yapma (sadece kullanıcı manuel olarak tema değiştirdiğinde)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setThemeState(newTheme);
      applyTheme(newTheme);
      return;
    }
    
    // Tema değiştiğinde sayfayı yenile (logo'nun güncellenmesi için)
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Kısa bir delay ile sayfayı yenile (tema değişikliğinin uygulanması için)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
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
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
} 