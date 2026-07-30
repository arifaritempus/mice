"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Globe,
  Maximize,
  Minimize,
  User,
  X,
  LayoutGrid,
  BarChart3,
  Plus,
  FilePlus,
  Hotel,
  Eye,
  Edit,
  Briefcase,
  Menu,
  ClipboardList,
  ListPlus,
  Check,
  ChevronDown,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import CommandCenter from "@/components/CommandCenter";
import NotificationModal from "./NotificationModal";
import moment from "moment";
import "moment/locale/tr";
import { supabase } from "@/lib/supabase";
import { usePermissions, Module } from "@/lib/permissions";
import { SettingsService } from "@/lib/supabaseService";

const SYSTEM_PAGES = [
  { title: "Dashboard", href: "/dashboard", keywords: "ana menü anasayfa" },
  { title: "Pazarlama & CRM", href: "/marketing", keywords: "pazarlama crm" },
  { title: "Raporlar", href: "/reports", keywords: "rapor analiz" },
  { title: "Projeler", href: "/projects", keywords: "mice proje" },
  { title: "Teklifler", href: "/quotes", keywords: "mice teklif" },
  { title: "Talepler", href: "/requests", keywords: "mice talep" },
  { title: "Sejour Yönetimi", href: "/sejour", keywords: "sejour tur" },
  { title: "Servisler", href: "/sejour/services", keywords: "sejour servis" },
  { title: "Uçuş & Biletler", href: "/operations/tickets", keywords: "operasyon bilet uçuş" },
  { title: "Transferler", href: "/operations/transfers", keywords: "operasyon transfer araç" },
  { title: "Rehberler", href: "/operations/guides", keywords: "operasyon rehber" },
  { title: "Part-Time", href: "/operations/part-time", keywords: "operasyon part-time personel" },
  { title: "Bilet Opsiyonları", href: "/tickets/options", keywords: "bilet opsiyon" },
  { title: "Bilet Ödemeleri", href: "/tickets/payments", keywords: "bilet ödeme finans" },
  { title: "Bilet Takvim", href: "/tickets/calendar", keywords: "bilet takvim uçuş" },
  { title: "Nakit Akış", href: "/accounting/cash-flow", keywords: "finans muhasebe nakit akış" },
  { title: "Bekleyen Gelir Faturaları", href: "/accounting/invoices/income/pending", keywords: "finans fatura gelir bekleyen" },
  { title: "Tamamlanan Gelir Faturaları", href: "/accounting/invoices/income/completed", keywords: "finans fatura gelir tamamlanan" },
  { title: "Bekleyen Gider Faturaları", href: "/accounting/invoices/expense/pending", keywords: "finans fatura gider bekleyen" },
  { title: "Tamamlanan Gider Faturaları", href: "/accounting/invoices/expense/completed", keywords: "finans fatura gider tamamlanan" },
  { title: "Döviz Kurları", href: "/accounting/exchange-rates", keywords: "finans kur döviz" },
  { title: "Oteller", href: "/hotels", keywords: "tanımlamalar otel konaklama" },
  { title: "Acentalar", href: "/agencies", keywords: "tanımlamalar acenta acente" },
  { title: "Tedarikçiler", href: "/suppliers", keywords: "tanımlamalar tedarikçi" },
  { title: "Kategoriler", href: "/categories", keywords: "tanımlamalar kategori" },
  { title: "Hizmet Tipleri", href: "/suppliers/service-types", keywords: "tanımlamalar hizmet" },
  { title: "Kullanıcılar", href: "/users", keywords: "tanımlamalar kullanıcı personel" },
  { title: "Yetkilendirme", href: "/permissions/roles", keywords: "tanımlamalar yetki rol güvenlik" },
  { title: "Sistem Ayarları", href: "/settings", keywords: "tanımlamalar ayar sistem" },
  { title: "Profil", href: "/profile", keywords: "hesap profil şifre" },
];

export default function TopNavigation() {
  const { canCreate, canView } = usePermissions();
  const router = useRouter();

  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    initial: string;
    avatar_url?: string;
  } | null>(null);

  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await SettingsService.getSettings();
        if (settings?.general_settings) {
          setGeneralSettings(settings.general_settings);
        }
      } catch (err) {
        console.error("TopNav settings error:", err);
      }
    };
    fetchSettings();

    const handleSettingsUpdate = (e: any) => {
      if (e?.detail?.settings) {
        setGeneralSettings(e.detail.settings);
      }
    };
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const email = user.email || "";
        const name = user.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
          : email.split("@")[0];
        setUserProfile({
          name,
          email,
          initial: name.charAt(0).toUpperCase() || "U",
          avatar_url: user.user_metadata?.avatar_url,
        });
      }
    };
    fetchUser();
  }, []);



  useEffect(() => {
    let cleanup: any;
    let channel: any;

    const setupNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          fetchNotifications();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      cleanup = () => document.removeEventListener("visibilitychange", handleVisibilityChange);

      const channelName = `topnav-notifications-${user.id}`;
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
            setNotifications((prev) => [payload.new, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);
            // Audio feature removed to prevent 404 error
          },
        )
        .subscribe();
    };

    setupNotifications();

    return () => {
      if (cleanup) cleanup();
      if (channel) supabase.removeChannel(channel);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (headerSearchQuery.length < 2) {
      setSearchResults([]);
      setSearchSelectedIndex(-1);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const queryLower = headerSearchQuery.toLowerCase();
        const matchedPages = SYSTEM_PAGES
          .filter(p => p.title.toLowerCase().includes(queryLower) || p.keywords.includes(queryLower))
          .map(p => ({
            type: "page",
            id: p.href,
            title: p.title,
            subtitle: "Sayfa / Modül",
            href: p.href
          }));

        const res = await fetch(`/api/search?q=${encodeURIComponent(headerSearchQuery)}`);
        const data = await res.json();
        
        setSearchResults([...matchedPages, ...(data.results || [])]);
        setSearchSelectedIndex(-1); // Reset selection when results change
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearchLoading(false);
      }
    }, 400);
    
    return () => clearTimeout(timeoutId);
  }, [headerSearchQuery]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    // Sayfa değiştiğinde arama durumunu sıfırla
    setIsSearchExpanded(false);
    setHeaderSearchQuery("");
    setSearchResults([]);
    setSearchSelectedIndex(-1);
  }, [pathname]);

  // Click outside listener for the search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setHeaderSearchQuery("");
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Kısayollar: F10 (CommandCenter) ve Alt+Shift / Option+Shift Navigasyonları
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. F10 ile CommandCenter'ı (Menü Modalı) aç
      if (e.key === "F10") {
        e.preventDefault();
        setIsCommandCenterOpen(true);
        return;
      }

      // 2. Alt + Shift + [Harf] kombinasyonları
      if (e.altKey && e.shiftKey) {
        let targetPath = "";
        
        // Farklı klavye dillerinde sorun yaşamamak için e.key yerine e.code kullanıyoruz.
        switch (e.code) {
          case "KeyH": targetPath = "/"; break;
          case "KeyD": targetPath = "/dashboard"; break;
          case "KeyQ": targetPath = "/quotes"; break;
          case "KeyP": targetPath = "/projects"; break;
          case "KeyS": targetPath = "/sejour"; break;
          case "KeyR": targetPath = "/reports"; break;
          case "KeyM": targetPath = "/marketing"; break;
        }

        if (targetPath) {
          e.preventDefault();
          router.push(targetPath);
        }
      }
    };
    
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [router]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to enable full-screen mode:", err);
    }
  };

  const navItems = [
    { id: "home", label: "Ana Sayfa", href: "/", icon: LayoutDashboard, module: Module.HOME },
    {
      id: "dashboard",
      label: t("nav.dashboard") || "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      module: Module.DASHBOARD
    },
    {
      id: "reports",
      label: t("nav.reports") || "Raporlar",
      href: "/reports",
      icon: FileText,
      module: Module.REPORTS
    },
  ].filter(item => !item.module || canView(item.module));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-50 pointer-events-none justify-center pt-4 px-4 transition-all duration-500">
        <style dangerouslySetInnerHTML={{ __html: `
          .nav-expand-container {
            max-width: 0px;
            opacity: 0;
            margin-left: 0;
            margin-right: 0;
            overflow: hidden;
            transition: all 0.5s ease-in-out;
            white-space: nowrap;
          }
          .group:hover .nav-expand-container {
            max-width: 500px;
            opacity: 1;
            margin-left: 8px;
            margin-right: 4px;
          }
          .logo-expand-container {
            max-width: 0px;
            opacity: 0;
            margin-left: 0;
            overflow: hidden;
            transition: all 0.5s ease-in-out;
            white-space: nowrap;
          }
          .group:hover .logo-expand-container {
            max-width: 200px;
            opacity: 1;
            margin-left: 12px;
          }
        `}} />
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="pointer-events-auto flex items-center justify-between bg-v3-surface backdrop-blur-2xl border border-v3-border rounded-full px-4 py-2 shadow-[0_8px_32px_rgba(59,130,246,0.15)] w-auto transition-all"
        >
          {/* Left: App Grid & Logo Area */}
          <div className="flex items-center mr-8 gap-4">
            <button
              onClick={() => setIsCommandCenterOpen(true)}
              className="w-10 h-10 rounded-full bg-v3-border hover:bg-v3-surface text-v3-text hover:text-v3-text flex items-center justify-center transition-all group"
              title="Tüm Modüller (Cmd+K)"
            >
              <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:-translate-y-full transition-transform duration-500 ease-in-out" />
                {generalSettings?.darkIconLogo ? (
                  <img src={generalSettings.darkIconLogo} alt="Logo" className="w-8 h-8 object-contain relative z-10" />
                ) : (
                  <span className="text-v3-text font-black text-xl relative z-10">
                    {generalSettings?.companyName?.charAt(0) || "N"}
                  </span>
                )}
              </div>
              <div className="flex flex-col logo-expand-container">
                <span className="text-v3-text font-black text-sm tracking-widest leading-none">
                  {generalSettings?.companyName?.split(" ")[0] || "NEXUS"}
                </span>
                <span className="text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                  {generalSettings?.companyName?.split(" ").slice(1).join(" ") || "Analytics"}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Fluid Navigation */}
          <div className="flex items-center gap-2">
            {/* Görüntüleme Genişleyen Buton */}
            <div className="flex items-center group bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full p-1 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Eye size={16} />
              </div>
              <div className="flex items-center nav-expand-container gap-2">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                        isActive 
                          ? "bg-blue-500/30 text-white border border-blue-500/30" 
                          : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200"
                      }`}
                    >
                      <item.icon size={14} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Yeni Oluştur Genişleyen Buton */}
            {(canCreate(Module.QUOTES) || canCreate(Module.SEJOUR)) && (
            <div className="flex items-center group ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full p-1 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:rotate-90 transition-transform duration-500 relative z-10">
                <Plus size={18} className="font-black" />
              </div>
              <div className="flex items-center nav-expand-container gap-2">
                {canCreate(Module.QUOTES) && (
                <Link
                  href="/requests/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors"
                >
                  <ListPlus size={14} />
                  <span className="text-xs font-bold">Yeni Talep</span>
                </Link>
                )}
                {canCreate(Module.QUOTES) && (
                <Link
                  href="/quotes/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors"
                >
                  <FilePlus size={14} />
                  <span className="text-xs font-bold">Yeni Teklif</span>
                </Link>
                )}
                {canCreate(Module.SEJOUR) && (
                <Link
                  href="/sejour/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors"
                >
                  <Hotel size={14} />
                  <span className="text-xs font-bold">Yeni Sejour</span>
                </Link>
                )}
              </div>
            </div>
            )}

            {/* Düzenleme/Listeleme Genişleyen Buton */}
            {(canView(Module.QUOTES) || canView(Module.PROJECTS) || canView(Module.SEJOUR)) && (
            <div className="flex items-center group ml-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full p-1 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500 relative z-10">
                <Edit size={16} />
              </div>
              <div className="flex items-center nav-expand-container gap-2">
                {canView(Module.QUOTES) && (
                <Link
                  href="/requests"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                >
                  <ClipboardList size={14} />
                  <span className="text-xs font-bold">Talep</span>
                </Link>
                )}
                {canView(Module.QUOTES) && (
                <Link
                  href="/quotes"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                >
                  <FileText size={14} />
                  <span className="text-xs font-bold">Teklif</span>
                </Link>
                )}
                {canView(Module.PROJECTS) && (
                <Link
                  href="/projects"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                >
                  <Briefcase size={14} />
                  <span className="text-xs font-bold">Proje</span>
                </Link>
                )}
                {canView(Module.SEJOUR) && (
                <Link
                  href="/sejour"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
                >
                  <Hotel size={14} />
                  <span className="text-xs font-bold">Sejour</span>
                </Link>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 ml-8">
            {/* Expandable Search */}
            <div className="relative" ref={searchContainerRef}>
              <motion.div
                animate={{ width: isSearchExpanded ? 260 : 40 }}
                className={`relative flex items-center h-10 rounded-full overflow-hidden transition-colors duration-300 ${isSearchExpanded ? "bg-white/10 border border-v3-border" : "bg-transparent border border-transparent hover:bg-v3-border"}`}
              >
                <button
                  onClick={() => {
                    if (isSearchExpanded && headerSearchQuery) {
                      setIsCommandCenterOpen(true);
                    } else {
                      setIsSearchExpanded(true);
                    }
                  }}
                  className="absolute left-0 w-10 h-10 flex items-center justify-center text-v3-muted hover:text-v3-text z-10"
                >
                  <Search className="w-[18px] h-[18px]" />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  placeholder="Herhangi bir şey ara..."
                  className={`w-full h-full bg-transparent pl-10 pr-10 text-sm text-v3-text placeholder:text-v3-muted outline-none transition-opacity duration-300 ${isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (searchSelectedIndex >= 0 && searchResults[searchSelectedIndex]) {
                        e.preventDefault();
                        router.push(searchResults[searchSelectedIndex].href);
                        setIsSearchExpanded(false);
                        setHeaderSearchQuery("");
                      } else if (headerSearchQuery) {
                        setIsCommandCenterOpen(true);
                      }
                    } else if (e.key === "Escape") {
                      setIsSearchExpanded(false);
                      setHeaderSearchQuery("");
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSearchSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSearchSelectedIndex(prev => Math.max(prev - 1, -1));
                    }
                  }}
                />
                {isSearchExpanded && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setHeaderSearchQuery("");
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-0 w-10 h-10 flex items-center justify-center text-v3-muted hover:text-v3-text z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>

              {/* Live Search Dropdown */}
              <AnimatePresence>
                {isSearchExpanded && headerSearchQuery.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-12 right-0 w-80 bg-v3-surface rounded-2xl border border-v3-border shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px]"
                  >
                    {isSearchLoading ? (
                      <div className="p-4 flex items-center justify-center text-v3-muted">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm">Aranıyor...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="overflow-y-auto p-2 flex flex-col gap-1">
                        {searchResults.map((res: any, idx: number) => (
                          <Link
                            key={`${res.type}-${res.id}-${idx}`}
                            href={res.href}
                            onClick={() => {
                              setHeaderSearchQuery("");
                              setIsSearchExpanded(false);
                            }}
                            className={`flex items-start flex-col p-3 rounded-xl transition-colors group ${idx === searchSelectedIndex ? "bg-white/10" : "hover:bg-v3-border"}`}
                          >
                            <span className="text-sm text-v3-text font-medium group-hover:text-blue-600 dark:text-blue-400 transition-colors line-clamp-1">{res.title}</span>
                            <span className="text-xs text-v3-muted mt-0.5 flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded-md bg-v3-border text-[10px] uppercase font-semibold text-v3-muted">{res.type}</span>
                              <span className="line-clamp-1">{res.subtitle}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-v3-muted">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Hiçbir sonuç bulunamadı.</p>
                      </div>
                    )}
                    
                    {/* Footer link to full command center */}
                    <button 
                      onClick={() => setIsCommandCenterOpen(true)}
                      className="p-3 border-t border-v3-border text-xs text-center text-v3-muted hover:text-v3-text hover:bg-v3-border transition-colors w-full"
                    >
                      Tüm sonuçları ve menüleri görmek için Enter'a basın
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Segmented Controls (Language, Fullscreen, Bell) */}
            <div
              className="flex items-center bg-v3-border rounded-full p-1 border border-v3-border"
              onMouseLeave={() => setActiveSegment(null)}
            >
              {/* Theme Toggle */}
              <button
                onMouseEnter={() => setActiveSegment("theme")}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative w-9 h-9 flex items-center justify-center text-v3-text hover:text-v3-text z-10"
                title={theme === "dark" ? "Aydınlık Temaya Geç" : "Karanlık Temaya Geç"}
              >
                {activeSegment === "theme" && (
                  <motion.div
                    layoutId="segmentHover"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {theme === "dark" ? (
                  <Sun className="w-[18px] h-[18px] relative z-20" />
                ) : (
                  <Moon className="w-[18px] h-[18px] relative z-20" />
                )}
              </button>

              {/* Language */}
              <div className="relative group/lang">
                <button
                  onMouseEnter={() => setActiveSegment("lang")}
                  className="relative w-9 h-9 flex items-center justify-center text-v3-text hover:text-v3-text z-10"
                >
                  {activeSegment === "lang" && (
                    <motion.div
                      layoutId="segmentHover"
                      className="absolute inset-0 bg-white/10 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <Globe className="w-[18px] h-[18px] relative z-20" />
                </button>
                <div className="absolute top-full right-0 mt-4 w-32 bg-v3-surface backdrop-blur-xl border border-v3-border rounded-2xl shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-200 overflow-hidden z-50 origin-top-right transform group-hover/lang:scale-100 scale-95">
                  <button
                    onClick={() => setLanguage("tr")}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-v3-surface transition-colors ${language === "tr" ? "text-blue-600 dark:text-blue-400 bg-v3-border" : "text-v3-text"}`}
                  >
                    Türkçe
                  </button>
                  <div className="h-px w-full bg-v3-border" />
                  <button
                    onClick={() => setLanguage("en")}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-v3-surface transition-colors ${language === "en" ? "text-blue-600 dark:text-blue-400 bg-v3-border" : "text-v3-text"}`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Fullscreen */}
              <button
                onMouseEnter={() => setActiveSegment("fs")}
                onClick={toggleFullscreen}
                className="relative w-9 h-9 flex items-center justify-center text-v3-text hover:text-v3-text z-10"
              >
                {activeSegment === "fs" && (
                  <motion.div
                    layoutId="segmentHover"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {isFullscreen ? (
                  <Minimize className="w-[18px] h-[18px] relative z-20" />
                ) : (
                  <Maximize className="w-[18px] h-[18px] relative z-20" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative group/bell">
                <button
                  onMouseEnter={() => setActiveSegment("bell")}
                  className="relative w-9 h-9 flex items-center justify-center text-v3-text hover:text-v3-text z-10"
                >
                  {activeSegment === "bell" && (
                    <motion.div
                      layoutId="segmentHover"
                      className="absolute inset-0 bg-white/10 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <Bell className="w-[18px] h-[18px] relative z-20 group-hover/bell:rotate-12 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] border border-[#0f172a] z-30"></span>
                  )}
                </button>
                <div className="absolute top-full right-0 mt-4 w-80 bg-v3-surface backdrop-blur-xl border border-v3-border rounded-2xl shadow-2xl opacity-0 invisible group-hover/bell:opacity-100 group-hover/bell:visible transition-all duration-200 overflow-hidden z-50 origin-top-right transform group-hover/bell:scale-100 scale-95 flex flex-col">
                  <div className="p-4 border-b border-v3-border">
                    <h3 className="text-v3-text font-bold text-sm">
                      Bildirimler
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-96 custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="flex flex-col">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full p-4 text-left transition-all flex gap-3 border-b border-v3-border last:border-0 ${
                              !n.is_read ? "bg-blue-500/5 hover:bg-blue-500/10" : "hover:bg-v3-border"
                            }`}
                          >
                            <div className="text-xl shrink-0 mt-0.5">
                              {n.type === "error" ? "🚫" : n.type === "warning" ? "⚠️" : n.type === "success" ? "✅" : "ℹ️"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1 gap-2">
                                <h4 className={`text-xs truncate ${!n.is_read ? "font-bold text-v3-text" : "font-medium text-v3-muted"}`}>
                                  {n.title}
                                </h4>
                                <span className="text-[9px] text-v3-muted shrink-0">
                                  {moment.utc(n.created_at).local().fromNow(true)}
                                </span>
                              </div>
                              <p className="text-[10px] text-v3-muted line-clamp-2 leading-relaxed">
                                {n.message.replace(/<[^>]*>?/gm, "")}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center p-8 text-v3-muted">
                        <span className="text-3xl mb-2">📭</span>
                        <p className="text-xs font-medium uppercase tracking-widest">
                          Bildirim yok
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rotating Gradient Profile Seal */}
            <div className="relative group/profile cursor-pointer ml-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full animate-[spin_4s_linear_infinite] opacity-70 group-hover/profile:opacity-100 transition-opacity blur-[2px]" />
              <div className="absolute inset-0.5 bg-v3-surface rounded-full z-10" />
              <div className="relative z-20 w-11 h-11 rounded-full overflow-hidden p-0.5 flex items-center justify-center bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 text-blue-600 dark:text-blue-300 font-bold group-hover/profile:text-v3-text transition-colors">
{userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : userProfile ? (
                  userProfile.initial
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>

              <div className="absolute top-full right-0 mt-4 w-56 bg-v3-surface backdrop-blur-xl border border-v3-border rounded-2xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 overflow-hidden z-50 origin-top-right transform group-hover/profile:scale-100 scale-95 flex flex-col">
                <div className="p-4 border-b border-v3-border flex items-center gap-3 bg-v3-border">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
{userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : userProfile ? (
                      userProfile.initial
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-v3-text text-sm font-bold truncate">
                      {userProfile ? userProfile.name : "Yönetici"}
                    </h4>
                    <p className="text-xs text-v3-muted truncate">
                      {userProfile ? userProfile.email : "Sistem Yetkilisi"}
                    </p>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-v3-text hover:text-v3-text hover:bg-v3-border rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4" /> Profilim
                  </Link>
                  {canView(Module.SETTINGS) && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-v3-text hover:text-v3-text hover:bg-v3-border rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Ayarlar
                  </Link>
                  )}
                </div>
                <div className="p-2 border-t border-v3-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" /> Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      <CommandCenter
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        initialQuery={headerSearchQuery}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notification={selectedNotification}
      />
    </>
  );
}
