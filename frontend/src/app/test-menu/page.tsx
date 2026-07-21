"use client";

import { useState } from "react";
import { usePermissions, Role } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TestMenuPage() {
  const { userRole, loading: permissionsLoading } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["dashboard"]),
  );

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Sadece süper admin test sayfasına erişebilir
  if (userRole !== Role.SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  const toggleExpanded = (itemId: string) => {
    console.log("Toggle expanded for:", itemId);
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
        console.log("Collapsed:", itemId);
      } else {
        newExpanded.add(itemId);
        console.log("Expanded:", itemId);
      }
      console.log("New expanded items:", Array.from(newExpanded));
      return newExpanded;
    });
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
    },
    {
      id: "mice",
      label: "MICE Yönetimi",
      icon: "🎯",
      children: [
        {
          id: "quotes",
          label: "Teklif Yönetimi",
          icon: "📋",
        },
        {
          id: "projects",
          label: "Proje Yönetimi",
          icon: "📁",
        },
      ],
    },
  ];

  const renderMenuItem = (item: any, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const paddingLeft = level * 16 + 16;

    return (
      <div key={item.id}>
        {hasChildren ? (
          <div>
            <div
              className="flex items-center px-4 py-3 text-sm font-medium rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200 transition-all duration-150"
              style={{ paddingLeft: `${paddingLeft}px` }}
              onClick={() => toggleExpanded(item.id)}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span
                className={`ml-2 transform transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
              >
                ▶
              </span>
            </div>

            {hasChildren && isExpanded && (
              <div className="mt-1 space-y-1">
                {item.children.map((child: any) => (
                  <div
                    key={child.id}
                    className="flex items-center px-4 py-2 text-sm rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-150"
                    style={{ paddingLeft: `${paddingLeft + 16}px` }}
                  >
                    <span className="mr-3">{child.icon}</span>
                    <span className="flex-1">{child.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-blue-500/10 hover:bg-blue-100 transition-all duration-150"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Menü Ağacı Test Sayfası
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Menü
          </h2>

          <div className="space-y-1">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Bilgileri:</h3>
            <p>
              Genişletilmiş menü öğeleri: {Array.from(expandedItems).join(", ")}
            </p>
            <p>Toplam menü öğesi: {menuItems.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
