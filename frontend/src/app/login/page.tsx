"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService, LoginCredentials } from "@/lib/auth";
import { permissionService } from "@/lib/permissions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SettingsService } from "@/lib/supabaseService";

export default function LoginPage() {
  if (typeof window !== "undefined") {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        args[0] &&
        typeof args[0] === "string" &&
        args[0].includes("Invalid Refresh Token")
      )
        return;
      if (
        args[0] &&
        args[0].message &&
        args[0].message.includes("Invalid Refresh Token")
      )
        return;
      originalConsoleError(...args);
    };
  }

  const setCookie = (name: string, value: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
  };

  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [logo, setLogo] = useState<string>("");

  useEffect(() => {
    const loadLogo = async () => {
      try {
        let generalSettings: any = {};
        try {
          const res = await fetch('/api/theme-settings');
          if (res.ok) {
            const data = await res.json();
            generalSettings = data.general_settings || {};
          }
        } catch (fetchErr) {
          console.error("Theme settings fetch error:", fetchErr);
        }
        
        const currentLogo =
          generalSettings.darkMenuLogo ||
          generalSettings.dark_menu_logo ||
          generalSettings.darkIconLogo ||
          generalSettings.dark_icon_logo ||
          generalSettings.darkWordmarkLogo ||
          generalSettings.dark_wordmark_logo ||
          generalSettings.lightMenuLogo ||
          generalSettings.light_menu_logo ||
          generalSettings.lightIconLogo ||
          generalSettings.light_icon_logo ||
          generalSettings.lightWordmarkLogo ||
          generalSettings.light_wordmark_logo;
        if (currentLogo) {
          setLogo(currentLogo);
        }
      } catch (err) {
        console.error("Logo yükleme hatası:", err);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await authService.supabase.auth.getSession();
        if (session && session.user && !error) {
          setTimeout(() => {
            router.push("/");
          }, 100);
        }
      } catch {}
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      permissionService.clearCache();
      const result = await authService.login(credentials);

      if (!result || !result.user) {
        setError("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getUserProfile(result.user.id);
        if (profile && !profile.is_active) {
          setError(
            "Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.",
          );
          await authService.logout();
          setLoading(false);
          return;
        }
        try {
          const resolvedRole =
            profile?.role || result.user.user_metadata?.role || "user";
          setCookie("currentUserRole", resolvedRole);
        } catch {}
      } catch (profileError: any) {
        console.warn("Profil yükleme hatası:", profileError);
      }

      window.location.href = "/";
    } catch (error: any) {
      let errorMessage = "Giriş yapılırken bir hata oluştu";
      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        if (
          errorMsg.includes("invalid login credentials") ||
          errorMsg.includes("invalid email or password")
        ) {
          errorMessage =
            "E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.";
        } else if (errorMsg.includes("email not confirmed")) {
          errorMessage = "E-posta adresiniz doğrulanmamış.";
        } else if (errorMsg.includes("user not found")) {
          errorMessage = "Kullanıcı bulunamadı.";
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
      setErrorKey((k) => k + 1);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-v3-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-v3-bg/80 to-v3-bg z-0" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel backdrop-blur-2xl bg-v3-surface/80 border border-v3-border shadow-2xl rounded-2xl p-8 sm:p-10 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

          <div className="text-center mb-8 flex flex-col items-center">
            {logo ? (
              <div className="mb-6 relative h-16 w-full flex justify-center">
                <img
                  src={logo}
                  alt="System Logo"
                  className="h-full object-contain"
                />
              </div>
            ) : null}
            <h1 className="text-3xl font-light tracking-[0.2em] text-v3-text mb-2">
              {t("login.title")}
            </h1>
            <p className="text-sm text-v3-muted">{t("login.subtitle")}</p>
          </div>

          {error && (
            <div
              key={errorKey}
              className="login-error-shake mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
            >
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs text-v3-text mb-1.5"
                >
                  {t("login.email")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-v3-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username webauthn"
                    required
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm text-v3-text placeholder:text-v3-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    placeholder="ornek@eposta.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs text-v3-text mb-1.5"
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-v3-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password webauthn"
                    required
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm text-v3-text placeholder:text-v3-muted focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all tracking-[0.2em]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-blue-600 dark:text-blue-400 focus:ring-blue-500 focus:ring-offset-v3-bg"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs text-v3-text"
                >
                  {t("login.remember")}
                </label>
              </div>

              <div className="text-xs">
                <Link
                  href="/forgot-password"
                  className="text-v3-muted hover:text-v3-text transition-colors border-b border-transparent hover:border-slate-400"
                >
                  {t("login.forgot")}
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-v3-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
              >
                {loading ? t("login.loading") : t("login.button")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
