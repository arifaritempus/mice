"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService, LoginCredentials } from "@/lib/auth";
import { permissionService } from "@/lib/permissions";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
    <div className="min-h-screen bg-[#020617] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617] z-0" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel backdrop-blur-2xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl p-8 sm:p-10 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-light tracking-[0.2em] text-white mb-2">
              {t("login.title")}
            </h1>
            <p className="text-sm text-slate-400">{t("login.subtitle")}</p>
          </div>

          {error && (
            <div
              key={errorKey}
              className="login-error-shake mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg"
            >
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs text-white mb-1.5"
                >
                  {t("login.email")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-slate-500"
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
                    required
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#0f172a]/80 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    placeholder="e.g., alex.chen@nexus.co"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs text-white mb-1.5"
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-slate-500"
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
                    required
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2.5 bg-[#0f172a]/80 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all tracking-[0.2em]"
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
                  className="h-4 w-4 rounded bg-white/5 border-white/10 text-blue-400 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs text-white"
                >
                  {t("login.remember")}
                </label>
              </div>

              <div className="text-xs">
                <Link
                  href="/forgot-password"
                  className="text-slate-400 hover:text-white transition-colors border-b border-transparent hover:border-slate-400"
                >
                  {t("login.forgot")}
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="relative w-full flex justify-center py-3 px-4 border border-blue-500/30 rounded-full text-sm font-medium text-white bg-gradient-to-b from-blue-500/20 to-blue-900/40 hover:from-blue-500/30 hover:to-blue-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#020617] transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)] disabled:opacity-50"
              >
                {loading ? t("login.loading") : t("login.button")}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-transparent text-slate-400 backdrop-blur-xl">
                  {t("login.or")}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 hover:text-white transition-colors">
                <span className="sr-only">Sign in with Google</span>
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </button>
              <button className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 hover:text-white transition-colors">
                <span className="sr-only">Sign in with GitHub</span>
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10 hover:text-white transition-colors">
                <span className="sr-only">Sign in with LinkedIn</span>
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            {t("login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-white hover:text-blue-400 transition-colors"
            >
              {t("login.signup")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
