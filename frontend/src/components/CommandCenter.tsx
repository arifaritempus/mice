"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  X,
  LayoutDashboard,
  Target,
  BarChart2,
  Briefcase,
  FileText,
  Hotel,
  Plane,
  Bus,
  Users,
  Ticket,
  Wallet,
  Receipt,
  DollarSign,
  Settings,
  Building2,
  UserCog,
  Tags,
  Landmark,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions, Module, getModuleFromHref } from "@/lib/permissions";

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function CommandCenter({ isOpen, onClose, initialQuery = "" }: CommandCenterProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Reset search query when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const { canView } = usePermissions();

  const isHrefVisible = (href: string) => {
    const mod = getModuleFromHref(href);
    if (!mod) return true;
    return canView(mod);
  };

  // Klavye kısayolu (Cmd+K veya Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
      // Kısayol TopNavigation seviyesinde yakalandığı için burada sadece Escape'i dinliyoruz
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const menuGroups = [
    {
      id: "main",
      title: "Ana Menü",
      icon: <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      color: "blue",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
        {
          label: "Pazarlama & CRM",
          href: "/marketing",
          icon: <Target size={16} />,
        },
        { label: "Raporlar", href: "/reports", icon: <BarChart2 size={16} /> },
      ],
    },
    {
      id: "mice",
      title: "MICE",
      icon: <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: "emerald",
      items: [
        { label: "Projeler", href: "/projects", icon: <Briefcase size={16} /> },
        { label: "Teklifler", href: "/quotes", icon: <FileText size={16} /> },
      ],
    },
    {
      id: "sejour",
      title: "Sejour",
      icon: <Hotel className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      color: "amber",
      items: [
        {
          label: "Sejour Yönetimi",
          href: "/sejour",
          icon: <Hotel size={16} />,
        },
        {
          label: "Servisler",
          href: "/sejour/services",
          icon: <Plane size={16} />,
        },
      ],
    },
    {
      id: "operations",
      title: "Operasyon",
      icon: <Bus className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      color: "violet",
      items: [
        {
          label: "Uçuş & Biletler",
          href: "/operations/tickets",
          icon: <Ticket size={16} />,
        },
        {
          label: "Transferler",
          href: "/operations/transfers",
          icon: <Bus size={16} />,
        },
        {
          label: "Rehberler",
          href: "/operations/guides",
          icon: <Users size={16} />,
        },
        {
          label: "Part-Time",
          href: "/operations/part-time",
          icon: <UserCog size={16} />,
        },
        {
          label: "Bilet Opsiyonları",
          href: "/tickets/options",
          icon: <Target size={16} />,
        },
        {
          label: "Bilet Ödemeleri",
          href: "/tickets/payments",
          icon: <DollarSign size={16} />,
        },
        {
          label: "Bilet Takvim",
          href: "/tickets/calendar",
          icon: <Plane size={16} />,
        },
      ],
    },
    {
      id: "finance",
      title: "Finans",
      icon: <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      color: "rose",
      items: [
        {
          label: "Nakit Akış",
          href: "/accounting/cash-flow",
          icon: <Wallet size={16} />,
        },
        {
          label: "Bekleyen Gelir Faturaları",
          href: "/accounting/invoices/income/pending",
          icon: <Receipt size={16} />,
        },
        {
          label: "Tamamlanan Gelir Faturaları",
          href: "/accounting/invoices/income/completed",
          icon: <Receipt size={16} />,
        },
        {
          label: "Bekleyen Gider Faturaları",
          href: "/accounting/invoices/expense/pending",
          icon: <Receipt size={16} />,
        },
        {
          label: "Tamamlanan Gider Faturaları",
          href: "/accounting/invoices/expense/completed",
          icon: <Receipt size={16} />,
        },
        {
          label: "Döviz Kurları",
          href: "/accounting/exchange-rates",
          icon: <DollarSign size={16} />,
        },
      ],
    },
    {
      id: "system",
      title: "Tanımlamalar",
      icon: <Settings className="w-5 h-5 text-v3-muted" />,
      color: "slate",
      items: [
        { label: "Oteller", href: "/hotels", icon: <Hotel size={16} /> },
        {
          label: "Acentalar",
          href: "/agencies",
          icon: <Building2 size={16} />,
        },
        {
          label: "Tedarikçiler",
          href: "/suppliers",
          icon: <Landmark size={16} />,
        },
        { label: "Kategoriler", href: "/categories", icon: <Tags size={16} /> },
        {
          label: "Hizmet Tipleri",
          href: "/suppliers/service-types",
          icon: <Tags size={16} />,
        },
        { label: "Kullanıcılar", href: "/users", icon: <Users size={16} /> },
        {
          label: "Yetkilendirme",
          href: "/permissions/roles",
          icon: <ShieldCheck size={16} />,
        },
        {
          label: "Sistem Ayarları",
          href: "/settings",
          icon: <Settings size={16} />,
        },
        { label: "Profil", href: "/profile", icon: <UserCog size={16} /> },
      ],
    },
  ];

  // Arama filtrelemesi
  const filteredGroups = menuGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) =>
        isHrefVisible(item.href) && item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);

  // Enter tuşuna basınca ilk sonuca git
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      filteredGroups.length > 0 &&
      filteredGroups[0].items.length > 0
    ) {
      router.push(filteredGroups[0].items[0].href);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 backdrop-blur-md bg-black/20 dark:bg-[#0a0f1c]/80"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col bg-v3-surface rounded-3xl border border-v3-border shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            {/* Header / Search */}
            <div className="p-6 border-b border-v3-border flex items-center gap-4 relative shrink-0">
              <Search className="w-6 h-6 text-v3-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Modül veya sayfa ara... (Örn: Rehberler)"
                className="flex-1 bg-transparent text-xl md:text-2xl text-v3-text placeholder:text-v3-muted outline-none"
              />
              <div className="hidden sm:flex items-center gap-2 mr-4">
                <span className="px-2 py-1 bg-white/10 rounded-md text-xs font-mono text-v3-muted">
                  ESC
                </span>
                <span className="text-xs text-v3-muted">çıkış</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-v3-border hover:bg-rose-500/20 text-v3-muted hover:text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-v3-muted">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg">Sonuç bulunamadı.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-v3-border rounded-2xl border border-v3-border p-5 hover:bg-white/[0.07] hover:border-v3-border transition-colors group"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-v3-border">
                        <div className="w-10 h-10 rounded-xl bg-v3-border flex items-center justify-center">
                          {group.icon}
                        </div>
                        <h3 className="text-lg font-bold text-v3-text tracking-wide">
                          {group.title}
                        </h3>
                      </div>

                      <div className="flex flex-col gap-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-v3-text hover:text-v3-text hover:bg-v3-surface transition-all group/link"
                          >
                            <span className="opacity-70 group-hover/link:opacity-100 group-hover/link:scale-110 transition-transform">
                              {item.icon}
                            </span>
                            <span className="font-medium text-sm">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
