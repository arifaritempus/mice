"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SettingsService } from "@/lib/supabaseService";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { isDark } = useTheme();
  const [appSettings, setAppSettings] = useState<any>(null);
  const [menuLogo, setMenuLogo] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const loadMenuLogo = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const generalSettings = settings.general_settings || {};
        setAppSettings(generalSettings);

        const currentLogo =
          generalSettings.dark_menu_logo ||
          generalSettings.dark_wordmark_logo ||
          generalSettings.dark_icon_logo ||
          generalSettings.light_menu_logo ||
          generalSettings.light_wordmark_logo ||
          generalSettings.light_icon_logo;
        setMenuLogo(currentLogo || "");
      } catch {
        setMenuLogo("");
      } finally {
        setLogoLoading(false);
      }
    };
    loadMenuLogo();
  }, [isDark]);

  useEffect(() => {
    const verifyToken = async () => {
      // Sadece token_hash varsa doğrula, çünkü eğer yoksa zaten Supabase'in varsayılan
      // yönlendirmesiyle (cookie/session üzerinden) girmiş olabilir.
      if (token_hash && type === "recovery") {
        const { error } = await authService.supabase.auth.verifyOtp({
          token_hash,
          type: "recovery",
        });
        if (error) {
          setError("Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
        }
      }
    };
    verifyToken();
  }, [token_hash, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await authService.supabase.auth.updateUser(
        {
          password: newPassword,
        },
      );

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Şifre güncelleme hatası:", error);
      setError(
        error.message ||
          "Şifre güncellenirken bir hata oluştu. Bağlantı süresi dolmuş olabilir.",
      );
    } finally {
      setLoading(false);
    }
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
              <span className="text-v3-text text-2xl font-bold">
                {appSettings?.company_name
                  ? appSettings.company_name.substring(0, 2).toUpperCase()
                  : process.env.NEXT_PUBLIC_AGENCY_NAME
                    ? process.env.NEXT_PUBLIC_AGENCY_NAME.substring(
                        0,
                        2,
                      ).toUpperCase()
                    : "TT"}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white/[0.04] backdrop-blur-2xl border border-v3-border rounded-2xl shadow-2xl shadow-black/40 px-8 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-v3-text text-center">
              Yeni Şifre Belirle
            </h1>
            <p className="text-sm text-v3-muted text-center mt-1">
              Lütfen yeni şifrenizi girin.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-5">
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
                Şifreniz başarıyla güncellendi. Giriş sayfasına
                yönlendiriliyorsunuz...
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-v3-text mb-1.5">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-v3-border border border-v3-border text-v3-text placeholder:text-v3-muted text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-v3-text mb-1.5">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-v3-border border border-v3-border text-v3-text placeholder:text-v3-muted text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !!error}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-v3-text bg-blue-500 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center"
              >
                {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-v3-surface flex items-center justify-center text-v3-text">
          Yükleniyor...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
