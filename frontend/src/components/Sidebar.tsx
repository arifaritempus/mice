"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import moment from "moment";
import "moment/locale/tr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import { supabase } from "../lib/supabase";
import { authService } from "../lib/auth";
import { usePermissions, Module, getModuleFromHref } from "../lib/permissions";
import NotificationModal from "./NotificationModal";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  module?: Module;
  children?: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { canView, loading: permissionsLoading } = usePermissions();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isHrefVisible = (href: string | undefined, explicitModule?: Module) => {
    if (explicitModule) return canView(explicitModule);
    if (!href) return true;
    const mod = getModuleFromHref(href);
    if (!mod) return true;
    return canView(mod);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      );
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Browser Title Notification
  useEffect(() => {
    const originalTitle = document.title;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle.replace(/^\(\d+\) /, "")}`;
    } else {
      document.title = originalTitle.replace(/^\(\d+\) /, "");
    }
    return () => {
      document.title = originalTitle.replace(/^\(\d+\) /, "");
    };
  }, [unreadCount]);

  const navigation: MenuItem[] = [
    { id: "home", label: t('menu.home') || "Ana Sayfa", icon: "🏠", href: "/" },
    {
      id: "dashboard",
      label: t('menu.dashboard') || "Dashboard",
      icon: "📊",
      href: "/dashboard",
      module: Module.DASHBOARD,
    },
    {
      id: "mice",
      label: t('menu.mice') || "MICE",
      icon: "🎯",
      module: Module.QUOTES,
      children: [
        {
          id: "requests",
          label: "Talepler",
          icon: "📨",
          href: "/requests",
          module: Module.QUOTES,
        },
        {
          id: "quotes",
          label: t('menu.quotes') || "Teklif",
          icon: "📋",
          href: "/quotes",
          module: Module.QUOTES,
        },
        {
          id: "projects",
          label: t('menu.projects') || "Proje",
          icon: "📁",
          href: "/projects",
          module: Module.PROJECTS,
        },
      ],
    },
    {
      id: "sejour",
      label: t('menu.sejour') || "Sejour",
      icon: "🏖️",
      module: Module.SEJOUR,
      children: [
        {
          id: "sejour-list",
          label: t('menu.sejourList') || "Sejour Listesi",
          icon: "📋",
          href: "/sejour",
          module: Module.SEJOUR,
        },
        {
          id: "sejour-services",
          label: t('menu.sejourServices') || "Sejour Hizmet Listesi",
          icon: "🔧",
          href: "/sejour/services",
          module: Module.SEJOUR_SERVICES,
        },
      ],
    },
    {
      id: "operations",
      label: t('menu.operations') || "Operasyon",
      icon: "⚙️",
      module: Module.OPERATIONS,
      children: [
        {
          id: "op-tickets",
          label: t('menu.opTickets') || "Bilet",
          icon: "✈️",
          href: "/operations/tickets",
          module: Module.TICKETS,
        },
        {
          id: "transfers",
          label: t('menu.transfers') || "Transfer",
          icon: "🚐",
          href: "/operations/transfers",
          module: Module.TRANSFERS,
        },
        {
          id: "guides",
          label: t('menu.guides') || "Kokartlı Rehber",
          icon: "👨‍💼",
          href: "/operations/guides",
          module: Module.GUIDES,
        },
        {
          id: "part-time",
          label: t('menu.partTime') || "Part-Time",
          icon: "⏰",
          href: "/operations/part-time",
          module: Module.PART_TIME,
        },
      ],
    },
    {
      id: "tickets-group",
      label: t('menu.ticketsGroup') || "Bilet",
      icon: "✈️",
      module: Module.TICKETS,
      children: [
        {
          id: "ticket-options",
          label: t('menu.ticketOptions') || "Bilet Opsiyon Takip",
          icon: "📋",
          href: "/tickets/options",
          module: Module.TICKETS_OPTIONS,
        },
        {
          id: "ticket-payments",
          label: t('menu.ticketPayments') || "Bilet Ödeme Takip",
          icon: "💳",
          href: "/tickets/payments",
          module: Module.TICKETS_PAYMENTS,
        },
        {
          id: "ticket-calendar",
          label: t('menu.ticketCalendar') || "Bilet Takvim Takip",
          icon: "📅",
          href: "/tickets/calendar",
          module: Module.TICKETS_CALENDAR,
        },
      ],
    },
    {
      id: "marketing",
      label: t('menu.marketing') || "Pazarlama",
      icon: "📢",
      href: "/marketing",
      module: Module.MARKETING,
    },
    {
      id: "accounting",
      label: t('menu.accounting') || "Muhasebe",
      icon: "💰",
      module: Module.ACCOUNTING,
      children: [
        {
          id: "cash-flow",
          label: t('menu.cashFlow') || "Nakit Akış",
          icon: "💵",
          href: "/accounting/cash-flow",
          module: Module.CASH_FLOW,
        },
        {
          id: "aging",
          label: "Alacak Yaşlandırma",
          icon: "🕰️",
          href: "/accounting/aging",
          module: Module.ACCOUNTING,
        },
        {
          id: "income-invoices",
          label: t('menu.incomeInvoices') || "Gelir Faturaları",
          icon: "📄",
          children: [
            {
              id: "income-pending",
              label: t('menu.incomePending') || "Bekleyen",
              icon: "⏳",
              href: "/accounting/invoices/income/pending",
              module: Module.INVOICES_INCOME,
            },
            {
              id: "income-completed",
              label: t('menu.incomeCompleted') || "Tamamlanan",
              icon: "✅",
              href: "/accounting/invoices/income/completed",
              module: Module.INVOICES_INCOME,
            },
          ],
        },
        {
          id: "expense-invoices",
          label: t('menu.expenseInvoices') || "Gider Faturaları",
          icon: "🧾",
          children: [
            {
              id: "expense-pending",
              label: t('menu.expensePending') || "Bekleyen",
              icon: "⏳",
              href: "/accounting/invoices/expense/pending",
              module: Module.INVOICES_EXPENSE,
            },
            {
              id: "expense-completed",
              label: t('menu.expenseCompleted') || "Tamamlanan",
              icon: "✅",
              href: "/accounting/invoices/expense/completed",
              module: Module.INVOICES_EXPENSE,
            },
          ],
        },
        {
          id: "exchange-rates",
          label: t('menu.exchangeRates') || "Döviz Kurları",
          icon: "💱",
          href: "/accounting/exchange-rates",
          module: Module.EXCHANGE_RATES,
        },
      ],
    },
    {
      id: "reports",
      label: t('menu.reports') || "Raporlar",
      icon: "📈",
      href: "/reports",
      module: Module.REPORTS,
    },
    {
      id: "definitions",
      label: t('menu.definitions') || "Tanımlamalar",
      icon: "📝",
      module: Module.SETTINGS,
      children: [
        {
          id: "hotels",
          label: t('menu.hotels') || "Otel",
          icon: "🏨",
          href: "/hotels",
          module: Module.HOTELS,
        },
        {
          id: "suppliers",
          label: t('menu.suppliers') || "Tedarikçi",
          icon: "🏢",
          href: "/suppliers",
          module: Module.SUPPLIERS,
        },
        {
          id: "agencies",
          label: t('menu.agencies') || "Acente",
          icon: "🏛️",
          href: "/agencies",
          module: Module.AGENCIES,
        },
        {
          id: "categories",
          label: t('menu.categories') || "Kategori",
          icon: "🏷️",
          href: "/categories",
          module: Module.CATEGORIES,
        },
        {
          id: "supplier-categories",
          label: t('menu.supplierCategories') || "Tedarikçi Hizmet Kategorisi",
          icon: "🏷️",
          href: "/suppliers/service-types",
          module: Module.SUPPLIER_CATEGORIES,
        },
        {
          id: "users",
          label: t('menu.users') || "Kullanıcı",
          icon: "👥",
          href: "/users",
          module: Module.USERS,
        },
        {
          id: "roles",
          label: t('menu.roles') || "Yetkilendirme",
          icon: "🛡️",
          href: "/permissions/roles",
          module: Module.ROLES,
        },
      ],
    },
    {
      id: "settings-group",
      label: t('menu.settingsGroup') || "Ayarlar",
      icon: "⚙️",
      module: Module.SETTINGS,
      children: [
        {
          id: "settings-gen",
          label: t('menu.settingsGen') || "Genel Ayarlar",
          icon: "🔧",
          href: "/settings/general",
          module: Module.SETTINGS,
        },
        {
          id: "settings-sec",
          label: t('menu.settingsSec') || "Güvenlik Ayarları",
          icon: "🔒",
          href: "/settings/security",
          module: Module.SETTINGS,
        },
      ],
    },
    {
      id: "profile",
      label: t('menu.profile') || "Profil",
      icon: "👤",
      href: "/profile",
      module: Module.PROFILE,
    },
  ];

  const filteredNavigation = useMemo(() => {
    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items.filter((item) => {
        if (!isHrefVisible(item.href, item.module)) return false;
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          item.children = filteredChildren;
          return filteredChildren.length > 0 || !!item.href;
        }
        return true;
      });
    };
    return filterItems(JSON.parse(JSON.stringify(navigation)));
  }, [canView]);

  // Initial Data Fetching
  useEffect(() => {
    const fetchInitialData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Notifications
      const fetchNotifications = async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.is_read).length);
        }
      };

      fetchNotifications();

      // Refresh notifications when tab becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          fetchNotifications();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // 2. Fetch General Settings
      try {
        const { SettingsService } = await import("../lib/supabaseService");
        const settings = await SettingsService.getSettings();
        if (settings?.general_settings) {
          setGeneralSettings(settings.general_settings);
        }
      } catch (err) {
        console.error("Error fetching sidebar settings:", err);
      }

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    };

    let cleanup: any;
    fetchInitialData().then((c) => (cleanup = c));

    const handleSettingsUpdate = (e: any) => {
      if (e?.detail?.settings) {
        setGeneralSettings(e.detail.settings);
      }
    };
    window.addEventListener("settingsUpdated", handleSettingsUpdate);

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
    };
  }, []);

  // Real-time Notification Subscription
  useEffect(() => {
    let channel: any;

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const channelName = `sidebar-notifications-${user.id}`;
      supabase.getChannels().forEach((ch) => {
        if (ch.topic === `realtime:${channelName}`) {
          supabase.removeChannel(ch);
        }
      });

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("New notification received:", payload.new);
            setNotifications((prev) => [payload.new, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);

            // Play sound
            if (audioRef.current) {
              audioRef.current
                .play()
                .catch((err) => console.log("Audio play blocked:", err));
            }

            // Optional: Show a toast or update title (already handled by useEffect)
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Real-time notification subscription active");
          }
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleNotificationClick = async (n: any) => {
    setSelectedNotification(n);
    setIsNotificationModalOpen(true);
    if (!n.is_read) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", n.id);
      if (!error) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, is_read: true } : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = "/login";
  };

  const toggleMenu = (id: string, level: number) => {
    setExpandedMenus((prev) => {
      if (prev.includes(id)) {
        return prev.slice(0, level);
      } else {
        return [...prev.slice(0, level), id];
      }
    });
  };

  const navigationHrefs = useMemo(() => {
    const hrefs = new Set<string>();
    const extractHrefs = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.href) hrefs.add(item.href);
        if (item.children) extractHrefs(item.children);
      });
    };
    extractHrefs(navigation);
    return hrefs;
  }, [navigation]);

  const isLinkActive = (href: string) => {
    if (!href) return false;
    if (pathname === href) return true;
    if (href === "/") return false;

    // For deep routes (e.g. /projects/[id]), check if the pathname starts with href/
    // but only if pathname itself is NOT another defined route
    return pathname.startsWith(href + "/") && !navigationHrefs.has(pathname);
  };

  const renderItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const active = item.href ? isLinkActive(item.href) : false;
    const childActive = item.children?.some((c) =>
      c.href
        ? isLinkActive(c.href)
        : c.children?.some((cc) => cc.href && isLinkActive(cc.href)),
    );

    return (
      <div key={item.id} className="w-full">
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.id, level)}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 group mb-1 ${
              active
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner shadow-blue-500/20 border border-blue-500/20"
                : childActive
                  ? isDark
                    ? "bg-v3-border text-v3-text"
                    : "bg-slate-100 text-slate-900"
                  : isDark
                    ? "text-v3-text hover:bg-v3-border hover:text-v3-text"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${isCollapsed && !isHovered && !isMobileOpen ? "justify-center px-0" : ""}`}
          >
            <span
              className={`text-lg flex-shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
            >
              {item.icon}
            </span>
            {(!isCollapsed || isHovered || isMobileOpen) && (
              <>
                <span className="flex-1 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                  {item.label}
                </span>
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-300 ${isExpanded ? "rotate-90 text-blue-600 dark:text-blue-400" : isDark ? "opacity-40" : "text-v3-muted"}`}
                />
              </>
            )}
          </button>
        ) : (
          <Link
            onClick={() => setIsMobileOpen(false)}
            href={item.href || "#"}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 group mb-1 ${
              active
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner shadow-blue-500/20 border border-blue-500/20"
                : isDark
                  ? "text-v3-text hover:bg-v3-border hover:text-v3-text"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${isCollapsed && !isHovered && !isMobileOpen ? "justify-center px-0" : ""}`}
          >
            <span
              className={`text-lg flex-shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
            >
              {item.icon}
            </span>
            {(!isCollapsed || isHovered || isMobileOpen) && (
              <span className="flex-1 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {item.label}
              </span>
            )}
          </Link>
        )}

        {hasChildren &&
          isExpanded &&
          (!isCollapsed || isHovered || isMobileOpen) && (
            <div className="mt-0.5 ml-4 space-y-0.5">
              {item.children?.map((child) => renderItem(child, level + 1))}
            </div>
          )}
      </div>
    );
  };

  if (permissionsLoading) return null;

  // Get dynamic logo based on theme
  const getLogo = () => {
    if (!generalSettings) {
      return isDark ? "/LOGO_OFFWHITE.png" : "/LOGO_NAVY.png";
    }

    if (isDark) {
      if (isCollapsed && !isHovered && !isMobileOpen) {
        return (
          generalSettings.darkIconLogo ||
          generalSettings.darkMenuLogo ||
          generalSettings.darkWordmarkLogo ||
          "/LOGO_OFFWHITE.png"
        );
      }
      return (
        generalSettings.darkMenuLogo ||
        generalSettings.darkWordmarkLogo ||
        generalSettings.darkIconLogo ||
        "/LOGO_OFFWHITE.png"
      );
    } else {
      if (isCollapsed && !isHovered && !isMobileOpen) {
        return (
          generalSettings.lightIconLogo ||
          generalSettings.lightMenuLogo ||
          generalSettings.lightWordmarkLogo ||
          "/LOGO_NAVY.png"
        );
      }
      return (
        generalSettings.lightMenuLogo ||
        generalSettings.lightWordmarkLogo ||
        generalSettings.lightIconLogo ||
        "/LOGO_NAVY.png"
      );
    }
  };

  const currentLogo = getLogo();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="mobile-only-block fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Top Bar */}
      <div className="mobile-only items-center justify-between p-3 glass-panel border-b border-v3-border flex-shrink-0 z-40 relative w-full">
        <div className="flex items-center gap-3">
          <img
            src={currentLogo}
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-v3-text hover:bg-slate-100 dark:hover:bg-v3-surface transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div
        className={`h-[calc(100%-2rem)] my-4 ml-4 rounded-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isCollapsed && !isHovered && !isMobileOpen ? "w-20" : "w-64"
        } shadow-2xl overflow-hidden flex-shrink-0 mobile-sidebar-container glass-panel backdrop-blur-xl ${
          isMobileOpen ? "mobile-sidebar-open" : "mobile-sidebar-closed"
        }`}
        style={{
          backgroundColor: "var(--theme-sidebar-bg, rgba(15,23,42,0.4))",
          border:
            "1px solid var(--theme-sidebar-border, rgba(255,255,255,0.05))",
        }}
        onMouseEnter={() => !isMobileOpen && setIsHovered(true)}
        onMouseLeave={() => !isMobileOpen && setIsHovered(false)}
      >
        {/* Logo / Header */}
        <div
          className="p-6 flex flex-col items-center justify-center relative flex-shrink-0"
          style={{
            backgroundColor: "var(--theme-sidebar-header-bg, transparent)",
          }}
        >
          <Link
            href="/"
            className="flex flex-col items-center gap-2 w-full active:scale-95 transition-transform"
            onClick={() => {
              setIsMobileOpen(false);
              if (pathname === "/") window.location.reload();
            }}
          >
            <div className="relative flex items-center justify-center w-full min-h-[60px] transition-opacity duration-300">
              <img
                src={currentLogo}
                alt=""
                onLoad={() => setLogoLoaded(true)}
                className={`object-contain transition-all duration-700 ${
                  isCollapsed && !isHovered && !isMobileOpen
                    ? "h-10 w-10"
                    : "h-24 w-full"
                } ${logoLoaded ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute top-4 right-2 p-1.5 rounded-xl transition-all duration-200 ${
              isDark
                ? "hover:bg-v3-surface text-v3-text/50 hover:text-v3-text"
                : "hover:bg-slate-100 text-v3-muted hover:text-slate-600"
            }`}
          >
            <ChevronLeft
              size={16}
              className={isCollapsed ? "rotate-180" : ""}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1">
          {filteredNavigation.map((item) => renderItem(item))}
        </nav>

        <div
          className="p-4 border-t space-y-1 flex-shrink-0"
          style={{
            backgroundColor: "var(--theme-sidebar-header-bg, rgba(0,0,0,0.1))",
            borderColor: "var(--theme-sidebar-border, rgba(255,255,255,0.05))",
          }}
        >
          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 relative group ${
              isDark
                ? "text-v3-text hover:bg-v3-border hover:text-v3-text"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            } ${
              isCollapsed && !isHovered && !isMobileOpen
                ? "justify-center px-0"
                : ""
            }`}
          >
            <div className="relative">
              <Bell
                size={20}
                className={unreadCount > 0 ? "text-blue-600 dark:text-blue-400" : ""}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>
            {unreadCount > 0 && isCollapsed && !isHovered && (
              <span
                className={`absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 animate-pulse ${
                  isDark ? "ring-[#161d2b]" : "ring-white"
                }`}
              >
                {unreadCount}
              </span>
            )}
            {(!isCollapsed || isHovered || isMobileOpen) && (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Bildirimler
                </span>
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg shadow-red-600/20">
                    {unreadCount}
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-red-500 hover:bg-red-500/10 ${
              isCollapsed && !isHovered && !isMobileOpen
                ? "justify-center px-0"
                : ""
            }`}
          >
            <span className="text-lg">🚪</span>
            {(!isCollapsed || isHovered || isMobileOpen) && (
              <span className="text-xs font-bold tracking-wide">Çıkış Yap</span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            />
            <motion.div
              initial={{ x: -400 }}
              animate={{ x: 0 }}
              exit={{ x: -400 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed left-0 top-0 bottom-0 w-full max-w-sm z-[1000] shadow-2xl flex flex-col border-r ${
                isDark
                  ? "bg-[#1a2233] border-v3-border"
                  : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`p-6 border-b flex items-center justify-between ${
                  isDark
                    ? "bg-[#161d2b] border-v3-border"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${isDark ? "text-v3-text" : "text-slate-900"}`}
                    >
                      Bildirimler
                    </h3>
                    <p className="text-[10px] font-bold text-v3-muted uppercase tracking-widest">
                      Sistem Mesajları
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className={`p-2 rounded-lg ${isDark ? "hover:bg-v3-border text-v3-muted" : "hover:bg-slate-100 text-v3-muted"}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full p-5 text-left transition-all flex gap-4 relative ${
                          isDark
                            ? `hover:bg-v3-border ${!n.is_read ? "bg-blue-500/5" : ""}`
                            : `hover:bg-slate-50 ${!n.is_read ? "bg-blue-500/10/50" : ""}`
                        }`}
                      >
                        {!n.is_read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        )}
                        <div className="text-2xl mt-1">
                          {n.type === "error"
                            ? "🚫"
                            : n.type === "warning"
                              ? "⚠️"
                              : n.type === "success"
                                ? "✅"
                                : "ℹ️"}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4
                              className={`text-sm ${!n.is_read ? `font-bold ${isDark ? "text-v3-text" : "text-slate-900"}` : "font-medium text-v3-muted"}`}
                            >
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-v3-muted">
                              {moment(n.created_at).fromNow()}
                            </span>
                          </div>
                          <p className="text-xs text-v3-muted line-clamp-2">
                            {n.message.replace(/<[^>]*>?/gm, "")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-v3-muted">
                    <span className="text-5xl mb-4">📭</span>
                    <p className="text-sm font-medium uppercase tracking-widest">
                      Bildirim bulunamadı
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Güvenli Çıkış"
        message="Oturumunuzu sonlandırmak istediğinizden emin misiniz?"
        confirmText="Çıkış Yap"
        cancelText="İptal"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
        type="danger"
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notification={selectedNotification}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `,
        }}
      />
    </>
  );
}
