"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/auth";
import { Module, Permission, Role, checkPermission } from "@/lib/permissions";
import TopNavigation from "@/components/TopNavigation";
import BottomNavigation from "@/components/BottomNavigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [debugInfo, setDebugInfo] = useState({ role: "", module: "" });
  const pathname = usePathname();
  const router = useRouter();

  // Giriş sayfası ve şifre sıfırlama sayfası için authentication gerekmez
  const publicPages = [
    "/login",
    "/forgot-password",
    "/reset-password",
    // Public view sayfaları
    "/quotes/view/",
    "/projects/view/",
  ];

  // Route -> Module eşlemesi
  const resolveModule = (path: string): Module | undefined => {
    if (!path) return undefined;
    if (path === "/") return Module.HOME;
    if (path.startsWith("/dashboard")) return Module.DASHBOARD;
    if (path.startsWith("/quotes/view/")) return undefined; // public
    if (path.startsWith("/projects/view/")) return undefined; // public
    if (path.startsWith("/quotes")) return Module.QUOTES;
    if (path.startsWith("/projects")) return Module.PROJECTS;
    if (path.startsWith("/accounting/cash-flow")) return Module.CASH_FLOW;
    if (path.startsWith("/accounting/invoices")) return Module.INVOICES;
    if (path.startsWith("/accounting")) return Module.ACCOUNTING;
    if (path.startsWith("/agencies")) return Module.AGENCIES;
    if (path.startsWith("/hotels")) return Module.HOTELS;
    if (path.startsWith("/categories")) return Module.CATEGORIES;
    if (path.startsWith("/users") || path.startsWith("/permissions"))
      return Module.USERS;
    if (path.startsWith("/reports")) return Module.REPORTS;
    if (path.startsWith("/settings")) return Module.SETTINGS;
    if (path.startsWith("/sejour")) return Module.SEJOUR;
    if (path.startsWith("/operations/transfers")) return Module.TRANSFERS;
    if (path.startsWith("/operations/guides")) return Module.GUIDES;
    if (path.startsWith("/operations/part-time")) return Module.PART_TIME;
    if (path.startsWith("/operations")) return Module.OPERATIONS;
    if (path.startsWith("/suppliers")) return Module.SUPPLIERS;
    if (path.startsWith("/tickets")) return Module.TICKETS;
    if (path.startsWith("/profile")) return Module.PROFILE;
    return undefined;
  };

  useEffect(() => {
    let isMounted = true;
    let maxLoadingTimeout: NodeJS.Timeout;
    const finishLoading = () => {
      if (maxLoadingTimeout) clearTimeout(maxLoadingTimeout);
      setLoading(false);
    };

    maxLoadingTimeout = setTimeout(() => {
      if (isMounted) {
        // Timeout dolunca sessizce loading'i kapat; dev konsol spam'ini engelle.
        finishLoading();
      }
    }, 15000); // 15 seconds to reduce false timeout logs on slow requests

    const checkAuthAndPermissions = async () => {
      // Latest pathname check inside the closure capture
      const currentPathname = pathname;

      try {
        // Public pages return early
        const isPublic =
          publicPages.includes(currentPathname) ||
          publicPages.some(
            (p) => p.endsWith("/") && currentPathname.startsWith(p),
          );

        if (isPublic) {
          if (isMounted && pathname === currentPathname) {
            setHasAccess(true);
            finishLoading();
          }
          return;
        }

        // Session check
        const {
          data: { session },
          error: sessionError,
        } = await authService.supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.debug("[AuthWrapper] No session found, redirecting to login");
          if (isMounted && pathname === currentPathname) {
            // Yönlendirme sırasında loading'i kapatmıyoruz ki "Erişim Sınırlandırıldı" ekranı gözükmesin
            router.push("/login");
          }
          return;
        }

        const user = session.user;

        // Profile check (non-blocking)
        let role = Role.VIEWER as string;
        try {
          const profile = await Promise.race([
            authService.getUserProfile(user.id),
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 3500),
            ), // Increased timeout to 3.5s
          ]);

          if (profile?.role) {
            role = profile.role;
            console.debug(`[AuthWrapper] Profile role detected: "${role}"`);
          } else {
            console.warn(
              "[AuthWrapper] Profile or role not found, using default viewer",
            );
          }
        } catch (e) {
          console.warn(
            "[AuthWrapper] Profile fetch error, defaulting to viewer:",
            e,
          );
        }

        if (!isMounted || pathname !== currentPathname) return;

        const resolvedRole = (role || Role.VIEWER) as string;
        const module = resolveModule(currentPathname);

        if (!module) {
          console.debug(
            `[AuthWrapper] Path "${currentPathname}" has no module mapping, allowing access`,
          );
          setHasAccess(true);
          finishLoading();
          return;
        }

        const allowed = await checkPermission(
          resolvedRole,
          module,
          Permission.VIEW,
        );
        console.debug(
          `[AuthWrapper] Access check for path "${currentPathname}" (Module: ${module}, Role: ${resolvedRole}): ${allowed ? "ALLOWED" : "DENIED"}`,
        );

        setHasAccess(allowed);
        setDebugInfo({ role: resolvedRole, module: module as string });
        finishLoading();
      } catch (error) {
        console.error("Auth check global catch:", error);
        if (isMounted && pathname === currentPathname) {
          // Yönlendirme sırasında loading'i kapatmıyoruz ki "Erişim Sınırlandırıldı" ekranı gözükmesin
          router.push("/login");
        }
      }
    };

    checkAuthAndPermissions();

    // Cleanup
    return () => {
      isMounted = false;
      if (maxLoadingTimeout) clearTimeout(maxLoadingTimeout);
    };
  }, [pathname, router]);

  // Idle Timeout (30 dakika) - Oturum zaman aşımı kontrolü
  useEffect(() => {
    const isPublic =
      publicPages.includes(pathname) ||
      publicPages.some((p) => p.endsWith("/") && pathname.startsWith(p));

    if (isPublic || loading || !hasAccess) return;

    let idleTimer: NodeJS.Timeout;

    const logoutUser = async () => {
      try {
        console.log(
          "[AuthWrapper] Kullanıcı 30 dakika boyunca işlem yapmadı, oturum kapatılıyor...",
        );
        await authService.supabase.auth.signOut();
        router.push("/login");
      } catch (error) {
        console.error("Oturum kapatılırken hata oluştu:", error);
      }
    };

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      // 30 dakika = 30 * 60 * 1000 = 1800000 ms
      idleTimer = setTimeout(logoutUser, 1800000);
    };

    // Kullanıcı etkileşimlerini dinle
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // İlk zamanlayıcıyı başlat
    resetTimer();

    // Event listener'ları ekle
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Temizlik (Cleanup)
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, loading, hasAccess, router]);

  // Loading durumu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner message="Oturum kontrol ediliyor..." />
      </div>
    );
  }

  // Yetki kontrolü başarısızsa uyarı göster
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 shadow-2xl backdrop-blur-md p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400 shadow-inner">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-v3-text mb-3 tracking-tight">
            Erişim Sınırlandırıldı
          </h2>
          <p className="text-sm font-medium text-v3-muted dark:text-gray-400 leading-relaxed">
            Bu bölüme erişmek için gerekli yetki seviyesine sahip değilsiniz.{" "}
            <br />
            Lütfen bir yönetici ile iletişime geçin.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-blue-500 px-6 py-3.5 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-500/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
            >
              Ana Sayfaya Dön
            </button>
            <button
              type="button"
              onClick={() => {
                authService.supabase.auth.signOut();
                router.push("/login");
              }}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 px-6 py-3.5 text-xs font-black text-slate-600 dark:text-gray-300 uppercase tracking-widest border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all"
            >
              Farklı Hesapla Giriş Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Public sayfalar için layout
  const isPublicExact = publicPages.includes(pathname);
  const isPublicPrefix = publicPages.some(
    (p) => p.endsWith("/") && pathname.startsWith(p),
  );
  if (isPublicExact || isPublicPrefix) {
    return <>{children}</>;
  }

  // Tüm sayfalar için Merkezi Cam Pencere (Floating App Window) layout'u
  return (
    <div className="flex items-center justify-center h-screen w-screen overflow-hidden transition-colors duration-200 mobile-auth-wrapper bg-transparent relative">
      {/* Arka plan renkli çember efektleri (Blurred Circles) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Main Glass Window (Now Edge to Edge) */}
      <div className="w-full h-full glass-panel shadow-2xl flex flex-col overflow-hidden relative z-10 backdrop-blur-2xl bg-[#0a0f1c]/60">
        <TopNavigation />
        <main className="flex-1 overflow-hidden transition-colors duration-200 bg-transparent relative pb-[84px] md:pb-0 md:pt-[76px]">
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
