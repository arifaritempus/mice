"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  LayoutGrid, 
  FileText, 
  Briefcase,
  X,
  LayoutDashboard,
  Users,
  Building,
  BarChart3,
  Settings,
  Hotel,
  LogOut,
  Megaphone,
  Plane,
  Car,
  Compass,
  Clock,
  Calendar,
  CreditCard,
  CalendarDays,
  ArrowRightLeft,
  Receipt,
  FileCheck,
  DollarSign,
  Truck,
  Tags,
  Layers,
  Shield,
  User,
  List
} from "lucide-react";
import { usePermissions, getModuleFromHref } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canView } = usePermissions();

  const isHrefVisible = (href: string) => {
    const mod = getModuleFromHref(href);
    if (!mod) return true;
    return canView(mod);
  };

  const navItemsLeft = [
    { id: "home", label: "Ana Sayfa", href: "/", icon: Home },
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  const navItemsRight = [
    { id: "quotes", label: "Teklifler", href: "/quotes", icon: FileText },
    { id: "projects", label: "Projeler", href: "/projects", icon: Briefcase },
  ];

  const allModules = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { id: "marketing", label: "Pazarlama & CRM", href: "/marketing", icon: Megaphone, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { id: "reports", label: "Raporlar", href: "/reports", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { id: "projects", label: "Projeler", href: "/projects", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { id: "quotes", label: "Teklifler", href: "/quotes", icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { id: "sejour", label: "Sejour Yönetimi", href: "/sejour", icon: Hotel, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
    { id: "services", label: "Servisler", href: "/sejour/services", icon: List, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10" },
    { id: "tickets", label: "Uçuş & Biletler", href: "/operations/tickets", icon: Plane, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-500/10" },
    { id: "transfers", label: "Transferler", href: "/operations/transfers", icon: Car, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { id: "guides", label: "Rehberler", href: "/operations/guides", icon: Compass, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-500/10" },
    { id: "part-time", label: "Part-Time", href: "/operations/part-time", icon: Clock, color: "text-fuchsia-500", bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10" },
    { id: "tickets-options", label: "Bilet Opsiyonları", href: "/tickets/options", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { id: "tickets-payments", label: "Bilet Ödemeleri", href: "/tickets/payments", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { id: "tickets-calendar", label: "Bilet Takvim", href: "/tickets/calendar", icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { id: "cash-flow", label: "Nakit Akış", href: "/accounting/cash-flow", icon: ArrowRightLeft, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10" },
    { id: "aging", label: "Yaşlandırma", href: "/accounting/aging", icon: ArrowRightLeft, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { id: "income-pending", label: "Bekleyen Gelir Faturaları", href: "/accounting/invoices/income/pending", icon: Receipt, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { id: "income-completed", label: "Tamamlanan Gelir Faturaları", href: "/accounting/invoices/income/completed", icon: FileCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { id: "expense-pending", label: "Bekleyen Gider Faturaları", href: "/accounting/invoices/expense/pending", icon: Receipt, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { id: "expense-completed", label: "Tamamlanan Gider Faturaları", href: "/accounting/invoices/expense/completed", icon: FileCheck, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-500/10" },
    { id: "exchange-rates", label: "Döviz Kurları", href: "/accounting/exchange-rates", icon: DollarSign, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { id: "hotels", label: "Oteller", href: "/hotels", icon: Hotel, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-500/10" },
    { id: "agencies", label: "Acentalar", href: "/agencies", icon: Building, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { id: "suppliers", label: "Tedarikçiler", href: "/suppliers", icon: Truck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { id: "categories", label: "Kategoriler", href: "/categories", icon: Tags, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-500/10" },
    { id: "service-types", label: "Hizmet Tipleri", href: "/suppliers/service-types", icon: Layers, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-500/10" },
    { id: "users", label: "Kullanıcılar", href: "/users", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { id: "roles", label: "Yetkilendirme", href: "/permissions/roles", icon: Shield, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { id: "settings", label: "Sistem Ayarları", href: "/settings", icon: Settings, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-500/10" },
    { id: "profile", label: "Profil", href: "/profile", icon: User, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-500/10" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <div 
        className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white dark:bg-v3-surface border-t border-gray-100 dark:border-v3-border shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-end justify-between px-2 h-[72px] max-w-md mx-auto relative">
          
          {/* Left Items */}
          <div className="flex-1 flex justify-around items-center h-full pb-2">
            {navItemsLeft.map((item) => {
              if (!isHrefVisible(item.href)) return null;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link key={item.id} href={item.href} className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
                  <item.icon className={`w-[22px] h-[22px] ${isActive ? "text-blue-600" : "text-gray-400 dark:text-v3-muted"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-medium tracking-wide ${isActive ? "text-blue-600" : "text-gray-400 dark:text-v3-muted"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Center Button */}
          <div className="relative -top-6 mx-2 shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-14 h-14 rounded-full bg-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <LayoutGrid strokeWidth={2.5} size={26} />
            </button>
          </div>

          {/* Right Items */}
          <div className="flex-1 flex justify-around items-center h-full pb-2">
            {navItemsRight.map((item) => {
              if (!isHrefVisible(item.href)) return null;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link key={item.id} href={item.href} className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
                  <item.icon className={`w-[22px] h-[22px] ${isActive ? "text-blue-600" : "text-gray-400 dark:text-v3-muted"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-medium tracking-wide ${isActive ? "text-blue-600" : "text-gray-400 dark:text-v3-muted"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-50 bg-[#f8f9fa] dark:bg-[#0a0f1c] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 pt-12">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Tüm Modüller</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-200 dark:bg-v3-border flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                {allModules.map((mod) => {
                  if (!isHrefVisible(mod.href)) return null;
                  return (
                    <Link 
                      key={mod.id} 
                      href={mod.href}
                      onClick={() => setIsModalOpen(false)}
                      className="bg-white dark:bg-v3-surface rounded-[20px] p-5 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 dark:border-v3-border active:scale-95 transition-transform"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${mod.bg} ${mod.color} flex items-center justify-center`}>
                        <mod.icon size={26} strokeWidth={2} />
                      </div>
                      <span className="text-[13px] font-bold text-gray-800 dark:text-v3-text text-center">{mod.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer Logout */}
            <div className="px-6 py-6 border-t border-gray-200 dark:border-v3-border bg-[#f8f9fa] dark:bg-[#0a0f1c]">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-bold active:scale-95 transition-transform"
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span>Sistemden Çıkış</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
