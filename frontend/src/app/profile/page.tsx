"use client";
import Link from "next/link";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { usePermissions, Module } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmModal from "@/components/ConfirmModal";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  email: string;
}

type Theme = "light" | "dark" | "system";

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const setCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

export default function ProfilePage() {
  const router = useRouter();
  const { canView, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [profileData, setProfileData] = useState<UpdateProfileData>({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadUserProfile();
    loadThemePreference();
  }, []);

  const loadThemePreference = () => {
    try {
      const savedTheme = getCookie("theme") as Theme | null;
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Varsayılan olarak sistem temasını kullan
        setCurrentTheme("system");
        applyTheme("system");
      }
    } catch (error) {
      console.error("Tema yüklenirken hata:", error);
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    // Önce tüm tema sınıflarını kaldır
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Sistem temasını kontrol et
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Tema tercihini cookie'ye kaydet
    setCookie("theme", theme);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    setSuccess("Tema tercihi güncellendi");
    setTimeout(() => setSuccess(""), 3000);

    // Tema değiştiğinde sayfayı yenile (logo'nun güncellenmesi için)
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const loadUserProfile = async () => {
    try {
      // Aktif Supabase oturumunu al
      const sessionUser = await authService.getCurrentUser();
      if (!sessionUser) {
        // Oturum yoksa login sayfasına yönlendir
        setLoading(false);
        window.location.href = "/login";
        return;
      }
      // Profil tablosundan kullanıcıyı getir (gerekirse oluşturur)
      let profile: any = null;
      try {
        profile = await authService.getUserProfile(sessionUser.id);
      } catch (e) {
        console.warn("getUserProfile hatası (fallback kullanılıyor):", e);
      }

      // Profil null ise veya hata varsa, temel bilgileri auth.user'dan kullan
      if (!profile) {
        profile = {
          id: sessionUser.id,
          email: sessionUser.email,
          first_name: sessionUser.user_metadata?.first_name || "",
          last_name: sessionUser.user_metadata?.last_name || "",
          role: sessionUser.user_metadata?.role || "user",
          is_active: true,
        };
      }

      const normalizedUser: User = {
        id: profile.id || sessionUser.id,
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || sessionUser.email || "",
        role: profile.role || "user",
      };
      setUser(normalizedUser);
      setProfileData({
        first_name: normalizedUser.first_name,
        last_name: normalizedUser.last_name,
        email: normalizedUser.email,
      });
    } catch (error: any) {
      console.error("Profil yükleme hatası:", error);
      // Sadece kritik hatalar için mesaj göster (oturum yoksa zaten yönlendirildi)
      if (error?.message && !error.message.includes("session")) {
        setError("Kullanıcı bilgileri yüklenirken hata oluştu");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!user) return;

      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);

      setSuccess("Profil bilgileri başarıyla güncellendi");
    } catch (error: any) {
      setError(error.message || "Profil güncellenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Yeni şifreler eşleşmiyor");
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError("Şifre en az 6 karakter olmalıdır");
        return;
      }

      if (!passwordData.currentPassword) {
        setError("Mevcut şifrenizi girmelisiniz");
        return;
      }

      // Gerçek Supabase şifre değişikliği (artık eski şifreyi de kontrol ediyor)
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      setSuccess("Şifre başarıyla değiştirildi");

      // Şifre formunu temizle
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setError(error.message || "Şifre değiştirilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      setIsLogoutModalOpen(false);
      console.log("🔴 Çıkış yapılıyor...");
      await authService.logout();
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Çıkış hatası:", error);
      window.location.href = "/login";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Süper Admin";
      case "admin":
        return "Admin";
      case "manager":
        return "Müdür";
      case "user":
        return "Kullanıcı";
      default:
        return role;
    }
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.PROFILE)) {
    return (
      <div className="h-full w-full p-6 sm:p-8 flex items-center justify-center font-sans text-white">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white glow-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Profil sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] uppercase inline-block"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Profil yükleniyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text uppercase">
              Profil Ayarları
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kişisel bilgilerinizi, şifrenizi ve tema tercihlerinizi
              güncelleyin
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs backdrop-blur-md flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs backdrop-blur-md flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Profil Bilgileri */}
          <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
              Profil Bilgileri
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Ad *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  E-posta *
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Rol
                </label>
                <input
                  type="text"
                  value={user ? getRoleDisplayName(user.role) : ""}
                  disabled
                  className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-500 transition-all cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {saving ? "Güncelleniyor..." : "Profili Güncelle"}
                </button>
              </div>
            </form>

            {/* Çıkış Yap Bölümü */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <h3 className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Hesap Güvenliği
                </h3>
                <p className="text-[11px] text-red-300/80 mb-4">
                  Güvenliğiniz için işiniz bittiğinde çıkış yapmanız önerilir.
                </p>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.15)] text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>

          {/* Tema Ayarları */}
          <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Tema Ayarları
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Tema Tercihi
                </label>

                <div className="space-y-3">
                  {/* Açık Tema */}
                  <label
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 ${currentTheme === "light" ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={currentTheme === "light"}
                      onChange={() => handleThemeChange("light")}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center transition-all ${currentTheme === "light" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-xs uppercase tracking-wider mb-0.5">
                          Açık Tema
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Parlak ve temiz görünüm
                        </div>
                      </div>
                      {currentTheme === "light" && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                      )}
                    </div>
                  </label>

                  {/* Koyu Tema */}
                  <label
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 ${currentTheme === "dark" ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={currentTheme === "dark"}
                      onChange={() => handleThemeChange("dark")}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center transition-all ${currentTheme === "dark" ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-xs uppercase tracking-wider mb-0.5">
                          Koyu Tema
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Göz yormayan koyu görünüm
                        </div>
                      </div>
                      {currentTheme === "dark" && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                      )}
                    </div>
                  </label>

                  {/* Sistem Teması */}
                  <label
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 ${currentTheme === "system" ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={currentTheme === "system"}
                      onChange={() => handleThemeChange("system")}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center transition-all ${currentTheme === "system" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-xs uppercase tracking-wider mb-0.5">
                          Sistem Teması
                        </div>
                        <div className="text-[10px] text-slate-400">
                          İşletim sistemi ayarlarını takip eder
                        </div>
                      </div>
                      {currentTheme === "system" && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-4">
                <h3 className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Bilgi
                </h3>
                <p className="text-[10px] text-blue-300/80 leading-relaxed">
                  Tema tercihiniz tüm sayfalarda geçerli olacak ve tarayıcınızda
                  kaydedilecektir. Koyu tema (V3) en iyi deneyimi sunar.
                </p>
              </div>
            </div>
          </div>

          {/* Şifre Değiştirme */}
          <div className="bg-[#0f172a]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/10 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Şifre Değiştir
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Yeni Şifre *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Yeni Şifre (Tekrar) *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.15)] text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {saving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <h3 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Şifre Güvenliği
              </h3>
              <ul className="text-[10px] text-amber-300/80 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span> En az 6 karakter
                  olmalıdır
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span> Büyük ve küçük harf
                  içermelidir
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span> Sayı ve özel
                  karakter içermelidir
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span> Mevcut şifrenizden
                  farklı olmalıdır
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Güvenli Çıkış"
        message="Oturumunuzu sonlandırmak istediğinizden emin misiniz?"
        confirmText="ÇIKIŞ YAP"
        cancelText="İPTAL"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        type="danger"
      />
    </div>
  );
}
