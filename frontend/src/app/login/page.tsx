'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, LoginCredentials } from '@/lib/auth';
import { permissionService } from '@/lib/permissions';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SettingsService } from '@/lib/supabaseService';

export default function LoginPage() {
  const setCookie = (name: string, value: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
  };
  const router = useRouter();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [menuLogo, setMenuLogo] = useState<string>('');
  const [logoLoading, setLogoLoading] = useState(true);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  useEffect(() => {
    const loadMenuLogo = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const generalSettings = settings.general_settings || {};
        setAppSettings(generalSettings);
        
        // Use wordmark logo by default for login page, fallback to icon or menu logo
        const currentLogo = isDark 
          ? (generalSettings.dark_wordmark_logo || generalSettings.dark_menu_logo || generalSettings.dark_icon_logo)
          : (generalSettings.light_wordmark_logo || generalSettings.light_menu_logo || generalSettings.light_icon_logo);
        setMenuLogo(currentLogo || '');
      } catch {
        setMenuLogo('');
      } finally {
        setLogoLoading(false);
      }
    };
    loadMenuLogo();
  }, [isDark]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await authService.supabase.auth.getSession();
        if (session && session.user && !error) {
          setTimeout(() => { router.push('/'); }, 100);
        }
      } catch {}
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Önce eski cache'i temizle
      permissionService.clearCache();
      
      const result = await authService.login(credentials);

      if (!result || !result.user) {
        setError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getUserProfile(result.user.id);
        if (profile && !profile.is_active) {
          setError('Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.');
          await authService.logout();
          setLoading(false);
          return;
        }
        try {
          const resolvedRole = profile?.role || result.user.user_metadata?.role || 'user';
          setCookie('currentUserRole', resolvedRole);
        } catch {}
      } catch (profileError: any) {
        console.warn('Profil yükleme hatası (devam ediliyor):', profileError);
      }

      window.location.href = '/';
    } catch (error: any) {
      console.error('Login hatası:', error);

      let errorMessage = 'Giriş yapılırken bir hata oluştu';

      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        if (
          errorMsg.includes('invalid login credentials') ||
          errorMsg.includes('invalid email or password') ||
          errorMsg.includes('invalid credentials')
        ) {
          errorMessage = 'E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.';
        } else if (errorMsg.includes('email not confirmed')) {
          errorMessage = 'E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.';
        } else if (errorMsg.includes('user not found')) {
          errorMessage = 'Kullanıcı bulunamadı. Lütfen e-posta adresinizi kontrol edin.';
        } else {
          errorMessage = error.message;
        }
      } else if (error?.originalError?.message) {
        const origMsg = error.originalError.message.toLowerCase();
        if (origMsg.includes('invalid login credentials') || origMsg.includes('invalid email or password')) {
          errorMessage = 'E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.';
        } else {
          errorMessage = error.originalError.message || 'Giriş yapılırken bir hata oluştu';
        }
      }

      setError(errorMessage);
      setErrorKey(k => k + 1);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-6 sm:px-4 lg:px-6 relative overflow-hidden">
      {/* Dekoratif arka plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-700/20 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {logoLoading ? (
            <div className="h-32 w-32" />
          ) : menuLogo ? (
            <img
              src={menuLogo}
              alt="Logo"
              className="h-32 w-auto object-contain drop-shadow-2xl"
              key={menuLogo}
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
              <span className="text-white text-2xl font-bold">
                {appSettings?.company_name ? appSettings.company_name.substring(0, 2).toUpperCase() : (process.env.NEXT_PUBLIC_AGENCY_NAME ? process.env.NEXT_PUBLIC_AGENCY_NAME.substring(0, 2).toUpperCase() : 'TT')}
              </span>
            </div>
          )}
        </div>

        {/* Kart */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-8 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white text-center">Hoş Geldiniz</h1>
            <p className="text-sm text-slate-400 text-center mt-1">Devam etmek için giriş yapın</p>
          </div>

          {/* Hata mesajı — key ile her hata değişiminde shake tekrar çalışır */}
          {error && (
            <div
              key={errorKey}
              className="login-error-shake mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl"
            >
              <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200"
                placeholder="ornek@mail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Şifremi unuttum
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">{appSettings?.company_name || process.env.NEXT_PUBLIC_AGENCY_NAME || 'Sistem'} v2.0</p>
            <p className="text-xs text-slate-600 mt-0.5">© {new Date().getFullYear()} Tüm Hakları Saklıdır</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loginShake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-6px); }
          30%      { transform: translateX(6px); }
          45%      { transform: translateX(-4px); }
          60%      { transform: translateX(4px); }
          75%      { transform: translateX(-2px); }
          90%      { transform: translateX(2px); }
        }
        .login-error-shake {
          animation: loginShake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  );
}