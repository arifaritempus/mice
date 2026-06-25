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
  Briefcase,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import CommandCenter from "@/components/CommandCenter";
import { supabase } from "@/lib/supabase";

export default function TopNavigation() {
  const pathname = usePathname();
  const [unreadCount] = useState(3);
  const { t, language, setLanguage } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    initial: string;
  } | null>(null);

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
        });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

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
    { id: "home", label: "Ana Sayfa", href: "/", icon: LayoutDashboard },
    {
      id: "dashboard",
      label: t("nav.dashboard") || "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
    },
    {
      id: "reports",
      label: t("nav.reports") || "Raporlar",
      href: "/reports",
      icon: FileText,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-50 pointer-events-none justify-center pt-4 px-4 transition-all duration-500">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="pointer-events-auto flex items-center justify-between bg-[#0f172a]/65 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-[0_8px_32px_rgba(59,130,246,0.15)] min-w-[800px] w-auto transition-all"
        >
          {/* Left: App Grid & Logo Area */}
          <div className="flex items-center mr-8 gap-4">
            <button
              onClick={() => setIsCommandCenterOpen(true)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white hover:text-white flex items-center justify-center transition-all group"
              title="Tüm Modüller (Cmd+K)"
            >
              <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:-translate-y-full transition-transform duration-500 ease-in-out" />
                <span className="text-white font-black text-xl relative z-10">
                  N
                </span>
              </div>
              <div className="flex flex-col opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-white font-black text-sm tracking-widest leading-none">
                  NEXUS
                </span>
                <span className="text-blue-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                  Analytics
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Fluid Navigation */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative px-4 py-2.5 flex items-center gap-2 rounded-full transition-all duration-300 group ${
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] group-hover:-translate-y-0.5 transition-transform duration-300 ${isActive ? "text-blue-400" : ""}`}
                  />
                  <span className="text-sm font-bold tracking-wide">
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBubble"
                      className="absolute inset-0 bg-white/10 rounded-full border border-white/5 shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Yeni Oluştur Genişleyen Buton */}
            <div className="flex items-center gap-3 group ml-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full px-2 py-1.5 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:rotate-90 transition-transform duration-500">
                <Plus size={18} className="font-black" />
              </div>
              <div className="flex items-center opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-[220px] transition-all duration-500 ease-in-out whitespace-nowrap gap-2">
                <Link
                  href="/quotes/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <FilePlus size={14} />
                  <span className="text-xs font-bold">Yeni Teklif</span>
                </Link>
                <Link
                  href="/sejour/create"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  <Hotel size={14} />
                  <span className="text-xs font-bold">Yeni Sejour</span>
                </Link>
              </div>
            </div>

            {/* Görüntüleme Genişleyen Buton */}
            <div className="flex items-center gap-3 group ml-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full px-2 py-1.5 transition-all duration-300 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                <Eye size={16} />
              </div>
              <div className="flex items-center opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-[280px] transition-all duration-500 ease-in-out whitespace-nowrap gap-2">
                <Link
                  href="/quotes"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <FileText size={14} />
                  <span className="text-xs font-bold">Teklif</span>
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <Briefcase size={14} />
                  <span className="text-xs font-bold">Proje</span>
                </Link>
                <Link
                  href="/sejour"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-blue-300 hover:text-blue-200 transition-colors"
                >
                  <Hotel size={14} />
                  <span className="text-xs font-bold">Sejour</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 ml-8">
            {/* Expandable Search */}
            <motion.div
              animate={{ width: isSearchExpanded ? 240 : 40 }}
              className={`relative flex items-center h-10 rounded-full overflow-hidden transition-colors duration-300 ${isSearchExpanded ? "bg-white/10 border border-white/20" : "bg-transparent border border-transparent hover:bg-white/5"}`}
            >
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="absolute left-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white z-10"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Herhangi bir şey ara..."
                className={`w-full h-full bg-transparent pl-10 pr-10 text-sm text-white placeholder:text-slate-400 outline-none transition-opacity duration-300 ${isSearchExpanded ? "opacity-100" : "opacity-0"}`}
                onBlur={() => {
                  if (!searchInputRef.current?.value)
                    setIsSearchExpanded(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsCommandCenterOpen(true);
                  }
                }}
              />
              {isSearchExpanded && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (searchInputRef.current)
                      searchInputRef.current.value = "";
                    setIsSearchExpanded(false);
                  }}
                  className="absolute right-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>

            {/* Segmented Controls (Language, Fullscreen, Bell) */}
            <div
              className="flex items-center bg-white/5 rounded-full p-1 border border-white/5"
              onMouseLeave={() => setActiveSegment(null)}
            >
              {/* Language */}
              <div className="relative group/lang">
                <button
                  onMouseEnter={() => setActiveSegment("lang")}
                  className="relative w-9 h-9 flex items-center justify-center text-white hover:text-white z-10"
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
                <div className="absolute top-full right-0 mt-4 w-32 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-200 overflow-hidden z-50 origin-top-right transform group-hover/lang:scale-100 scale-95">
                  <button
                    onClick={() => setLanguage("tr")}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/10 transition-colors ${language === "tr" ? "text-blue-400 bg-white/5" : "text-white"}`}
                  >
                    Türkçe
                  </button>
                  <div className="h-px w-full bg-white/5" />
                  <button
                    onClick={() => setLanguage("en")}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/10 transition-colors ${language === "en" ? "text-blue-400 bg-white/5" : "text-white"}`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Fullscreen */}
              <button
                onMouseEnter={() => setActiveSegment("fs")}
                onClick={toggleFullscreen}
                className="relative w-9 h-9 flex items-center justify-center text-white hover:text-white z-10"
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
                  className="relative w-9 h-9 flex items-center justify-center text-white hover:text-white z-10"
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
                <div className="absolute top-full right-0 mt-4 w-80 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover/bell:opacity-100 group-hover/bell:visible transition-all duration-200 overflow-hidden z-50 origin-top-right transform group-hover/bell:scale-100 scale-95 flex flex-col">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-bold text-sm">
                      Bildirimler
                    </h3>
                  </div>
                  <div className="p-4 text-center text-slate-400 text-xs h-32 flex items-center justify-center">
                    Henüz yeni bildiriminiz yok.
                  </div>
                </div>
              </div>
            </div>

            {/* Rotating Gradient Profile Seal */}
            <div className="relative group/profile cursor-pointer ml-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full animate-[spin_4s_linear_infinite] opacity-70 group-hover/profile:opacity-100 transition-opacity blur-[2px]" />
              <div className="absolute inset-0.5 bg-[#0f172a] rounded-full z-10" />
              <div className="relative z-20 w-11 h-11 rounded-full overflow-hidden p-0.5 flex items-center justify-center bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 text-blue-300 font-bold group-hover/profile:text-white transition-colors">
                {userProfile ? (
                  userProfile.initial
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>

              <div className="absolute top-full right-0 mt-4 w-56 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 overflow-hidden z-50 origin-top-right transform group-hover/profile:scale-100 scale-95 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {userProfile ? (
                      userProfile.initial
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-white text-sm font-bold truncate">
                      {userProfile ? userProfile.name : "Yönetici"}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {userProfile ? userProfile.email : "Sistem Yetkilisi"}
                    </p>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4" /> Profilim
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Ayarlar
                  </Link>
                </div>
                <div className="p-2 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
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
      />
    </>
  );
}
