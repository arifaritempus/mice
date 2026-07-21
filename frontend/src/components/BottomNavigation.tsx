"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, BarChart2, Settings } from "lucide-react";
import { usePermissions, Module, getModuleFromHref } from "@/lib/permissions";

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { id: "dashboard", label: "Home", href: "/", icon: Home },
    { id: "activity", label: "Activity", href: "/operations", icon: Activity },
    { id: "insights", label: "Insights", href: "/reports", icon: BarChart2 },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ];

  const { canView } = usePermissions();

  const isHrefVisible = (href: string) => {
    const mod = getModuleFromHref(href);
    if (!mod) return true;
    return canView(mod);
  };


  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full h-[84px] z-50 px-6 pb-6 pt-2 bg-[#0a0f1c]/80 backdrop-blur-3xl border-t border-v3-border">
      <div className="flex items-center justify-between h-full max-w-md mx-auto">
        {navItems.filter(item => isHrefVisible(item.href)).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1.5 min-w-[64px] transition-all duration-300 ${
                isActive ? "text-blue-600 dark:text-blue-400" : "text-v3-muted hover:text-v3-text"
              }`}
            >
              <div
                className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    : ""
                }`}
              >
                <item.icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? "scale-110" : "scale-100"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide ${isActive ? "opacity-100" : "opacity-70"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
