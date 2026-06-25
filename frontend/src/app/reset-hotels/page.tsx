"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/utils/safeStorage";

export default function ResetHotelsPage() {
  const router = useRouter();

  useEffect(() => {
    // localStorage'ı temizle
    storage.removeItem("hotels");

    // 3 saniye sonra oteller sayfasına yönlendir
    const timer = setTimeout(() => {
      router.push("/hotels");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Oteller Sıfırlanıyor...
        </h2>
        <p className="text-sm text-gray-600">
          localStorage temizlendi, oteller yeniden yükleniyor...
        </p>
      </div>
    </div>
  );
}
