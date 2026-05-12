'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/auth';
import { Module, Permission, Role, checkPermission } from '@/lib/permissions';
import Sidebar from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [debugInfo, setDebugInfo] = useState({ role: '', module: '' });
  const pathname = usePathname();
  const router = useRouter();

  // Giriş sayfası ve şifre sıfırlama sayfası için authentication gerekmez
  const publicPages = [
    '/login',
    '/forgot-password',
    '/reset-password',
    // Public view sayfaları
    '/quotes/view/',
    '/projects/view/'
  ];

  // Route -> Module eşlemesi
  const resolveModule = (path: string): Module | undefined => {
    if (!path) return undefined;
    if (path === '/') return Module.HOME;
    if (path.startsWith('/dashboard')) return Module.DASHBOARD;
    if (path.startsWith('/quotes/view/')) return undefined; // public
    if (path.startsWith('/projects/view/')) return undefined; // public
    if (path.startsWith('/quotes')) return Module.QUOTES;
    if (path.startsWith('/projects')) return Module.PROJECTS;
    if (path.startsWith('/accounting/cash-flow')) return Module.CASH_FLOW;
    if (path.startsWith('/accounting/invoices')) return Module.INVOICES;
    if (path.startsWith('/accounting')) return Module.ACCOUNTING;
    if (path.startsWith('/agencies')) return Module.AGENCIES;
    if (path.startsWith('/hotels')) return Module.HOTELS;
    if (path.startsWith('/categories')) return Module.CATEGORIES;
    if (path.startsWith('/users') || path.startsWith('/permissions')) return Module.USERS;
    if (path.startsWith('/reports')) return Module.REPORTS;
    if (path.startsWith('/settings')) return Module.SETTINGS;
    if (path.startsWith('/sejour')) return Module.SEJOUR;
    if (path.startsWith('/operations/transfers')) return Module.TRANSFERS;
    if (path.startsWith('/operations/guides')) return Module.GUIDES;
    if (path.startsWith('/operations/part-time')) return Module.PART_TIME;
    if (path.startsWith('/operations')) return Module.OPERATIONS;
    if (path.startsWith('/suppliers')) return Module.SUPPLIERS;
    if (path.startsWith('/tickets')) return Module.TICKETS;
    if (path.startsWith('/profile')) return Module.PROFILE;
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
          publicPages.some((p) => p.endsWith('/') && currentPathname.startsWith(p));
        
        if (isPublic) {
          if (isMounted && pathname === currentPathname) {
            setHasAccess(true);
            finishLoading();
          }
          return;
        }
        
        // Session check
        const { data: { session }, error: sessionError } = await authService.supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.debug('[AuthWrapper] No session found, redirecting to login');
          if (isMounted && pathname === currentPathname) {
            setHasAccess(false);
            finishLoading();
            router.push('/login');
          }
          return;
        }
        
        const user = session.user;
        
        // Profile check (non-blocking)
        let role = Role.VIEWER as string;
        try {
          const profile = await Promise.race([
            authService.getUserProfile(user.id),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)) // Increased timeout to 3.5s
          ]);
          
          if (profile?.role) {
            role = profile.role;
            console.debug(`[AuthWrapper] Profile role detected: "${role}"`);
          } else {
            console.warn('[AuthWrapper] Profile or role not found, using default viewer');
          }
        } catch (e) {
          console.warn('[AuthWrapper] Profile fetch error, defaulting to viewer:', e);
        }
        
        if (!isMounted || pathname !== currentPathname) return;
        
        const resolvedRole = (role || Role.VIEWER) as string;
        const module = resolveModule(currentPathname);
        
        if (!module) {
          console.debug(`[AuthWrapper] Path "${currentPathname}" has no module mapping, allowing access`);
          setHasAccess(true);
          finishLoading();
          return;
        }
        
        const allowed = await checkPermission(resolvedRole, module, Permission.VIEW);
        console.debug(`[AuthWrapper] Access check for path "${currentPathname}" (Module: ${module}, Role: ${resolvedRole}): ${allowed ? 'ALLOWED' : 'DENIED'}`);
        
        setHasAccess(allowed);
        setDebugInfo({ role: resolvedRole, module: module as string });
        finishLoading();
        
      } catch (error) {
        console.error('Auth check global catch:', error);
        if (isMounted && pathname === currentPathname) {
          setHasAccess(false);
          finishLoading();
          router.push('/login');
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

  // Loading durumu
  if (loading) {
    return <LoadingSpinner message="Yukleniyor..." />;
  }

  // Yetki kontrolü başarısızsa uyarı göster
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 shadow-xl backdrop-blur-sm p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <span aria-hidden="true">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Bu sayfaya erisim yetkiniz yok</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hesabinizda bu bolumu goruntuleme izni tanimli degil. Gerekli ise yoneticinizden erisim talep edebilirsiniz.
          </p>
          <p className="text-xs text-slate-400 mt-4">Debug: Role: {debugInfo.role}, Module: {debugInfo.module}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
          >
            Ana sayfaya don
          </button>
        </div>
      </div>
    );
  }

  // Public sayfalar için layout
  const isPublicExact = publicPages.includes(pathname);
  const isPublicPrefix = publicPages.some((p) => p.endsWith('/') && pathname.startsWith(p));
  if (isPublicExact || isPublicPrefix) {
    return <>{children}</>;
  }

  // Tüm sayfalar için sidebar ile layout
  return (
    <div 
      className="flex h-screen transition-colors duration-200" 
      style={{ backgroundColor: 'var(--theme-bg-primary, #f9fafb)' }}
    >
      <Sidebar />
      <div 
        className="flex-1 flex flex-col overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: 'var(--theme-bg-primary, #f9fafb)' }}
      >
        <main 
          className="flex-1 overflow-y-auto p-4 transition-colors duration-200" 
          style={{ backgroundColor: 'var(--theme-bg-primary, #f9fafb)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
} 