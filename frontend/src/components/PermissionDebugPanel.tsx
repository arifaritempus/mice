"use client";

import { useState } from "react";
import { usePermissions, Module } from "@/lib/permissions";

/**
 * Yetkilendirme sistemini test etmek için debug paneli
 * Sadece geliştirme ortamında görünür
 */
export default function PermissionDebugPanel() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    loading,
    getAllPermissions,
  } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);

  // Sadece geliştirme ortamında göster
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const allModules = Object.values(Module);
  const allPermissions = getAllPermissions();

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm"
        title="Yetki Debug Paneli"
      >
        🔍 Yetki Debug
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 w-96 max-h-[80vh] overflow-y-auto border-2 border-purple-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-v3-text">
              Yetki Debug Paneli
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Kullanıcı Bilgileri */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-v3-text mb-2">
                Kullanıcı Bilgileri
              </h4>
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Rol:</span>{" "}
                  {userRole || "Yükleniyor..."}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Durum:</span>{" "}
                  {loading ? (
                    <span className="text-yellow-600">⏳ Yükleniyor</span>
                  ) : (
                    <span className="text-green-600">✅ Hazır</span>
                  )}
                </p>
              </div>
            </div>

            {/* Modül Yetkileri */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-v3-text mb-2">
                Modül Yetkileri
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allModules.map((module) => {
                  const perms = allPermissions[module] || [];
                  const hasView = canView(module);
                  const hasCreate = canCreate(module);
                  const hasEdit = canEdit(module);
                  const hasDelete = canDelete(module);

                  return (
                    <div
                      key={module}
                      className={`border rounded-lg p-2 ${
                        hasView
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                          : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-v3-text">
                          {module}
                        </span>
                        <span
                          className={`text-xs ${hasView ? "text-green-600" : "text-red-600"}`}
                        >
                          {hasView ? "✅" : "❌"}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span
                          className={
                            hasView ? "text-green-600" : "text-gray-400"
                          }
                        >
                          👁️ View
                        </span>
                        <span
                          className={
                            hasCreate ? "text-blue-600" : "text-gray-400"
                          }
                        >
                          ➕ Create
                        </span>
                        <span
                          className={
                            hasEdit ? "text-yellow-600" : "text-gray-400"
                          }
                        >
                          ✏️ Edit
                        </span>
                        <span
                          className={
                            hasDelete ? "text-red-600" : "text-gray-400"
                          }
                        >
                          🗑️ Delete
                        </span>
                      </div>
                      {perms.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Yetkiler: {perms.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Butonları */}
            <div className="bg-blue-500/10 dark:bg-blue-900/20 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-v3-text mb-2">
                Hızlı Test
              </h4>
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => {
                    console.log("=== YETKİ DEBUG BİLGİLERİ ===");
                    console.log("Rol:", userRole);
                    console.log("Loading:", loading);
                    console.log("Tüm Yetkiler:", allPermissions);
                    console.log("Sejour View:", canView(Module.SEJOUR));
                    console.log("Sejour Create:", canCreate(Module.SEJOUR));
                    console.log("Sejour Edit:", canEdit(Module.SEJOUR));
                    console.log("Sejour Delete:", canDelete(Module.SEJOUR));
                    alert("Console'a bakın (F12)");
                  }}
                  className="w-full bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-500/90 text-xs"
                >
                  Console'a Yazdır
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
