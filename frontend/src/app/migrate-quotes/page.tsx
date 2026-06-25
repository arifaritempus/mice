"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/utils/safeStorage";
import { usePermissions, Module, Role } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MigrateQuotesPage() {
  const router = useRouter();
  const { canView, userRole, loading: permissionsLoading } = usePermissions();
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState("");

  useEffect(() => {
    // 3 saniye sonra otomatik migration başlat
    const timer = setTimeout(() => {
      startMigration();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Sadece süper admin veya admin migrate edebilir
  const isAuthorized = userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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

  const startMigration = async () => {
    setMigrating(true);
    setMigrationResult("Migration başlatılıyor...");

    try {
      // Eski kategori kodlarını yeni sabit ID'lere dönüştür
      const categoryMapping = {
        "1": "CAT_001", // OTEL | KONAKLAMA
        "2": "SUBCAT_001", // DOUBLE ODA KİŞİ BAŞI
        "3": "SUBCAT_002", // SINGLE ODA
        "4": "CAT_002", // OTEL | DİĞER HİZMETLER
        "5": "SUBCAT_003", // TOPLANTI SALONU KULLANIMI
        "6": "SUBCAT_004", // TEKNİK EKİPMAN KULLANIMI
        "7": "CAT_003", // UÇAK BİLETİ
        "8": "SUBCAT_005", // GRUP UÇAK BİLETİ
        "9": "CAT_004", // TRANSFER & TUR
        "10": "SUBCAT_006", // ALAN - OTEL - ALAN | GRUP TRANSFERİ
        "11": "CAT_005", // ETKİNLİK
        "12": "SUBCAT_007", // GALA YEMEĞİ | MASA SÜSLEME
        "13": "CAT_006", // İNSAN KAYNAKLARI
        "14": "SUBCAT_008", // OPERASYON MÜDÜRÜ
        "15": "CAT_007", // DİĞER OPERASYONEL HİZMETLER
        "16": "SUBCAT_009", // KARŞILAMA DESKİ
      };

      // Eski format kodlarını yeni ID'lere dönüştür
      const oldFormatMapping = {
        "1-1": "SUBCAT_001", // DOUBLE ODA KİŞİ BAŞI
        "1-2": "SUBCAT_002", // SINGLE ODA
        "4-1": "SUBCAT_003", // TOPLANTI SALONU KULLANIMI
        "4-2": "SUBCAT_004", // TEKNİK EKİPMAN KULLANIMI
        "7-1": "SUBCAT_005", // GRUP UÇAK BİLETİ
        "9-1": "SUBCAT_006", // ALAN - OTEL - ALAN | GRUP TRANSFERİ
        "11-1": "SUBCAT_007", // GALA YEMEĞİ | MASA SÜSLEME
        "13-1": "SUBCAT_008", // OPERASYON MÜDÜRÜ
        "15-1": "SUBCAT_009", // KARŞILAMA DESKİ
      };

      // Teklifleri yükle
      const savedQuotes = storage.getItem("quotes");
      if (savedQuotes) {
        const quotes = JSON.parse(savedQuotes);
        let migratedCount = 0;

        const migratedQuotes = quotes.map((quote: any) => {
          const migratedItems = (quote.items || quote.service_items || []).map(
            (item: any) => {
              let migrated = false;

              // Eski kategori ID'lerini dönüştür
              if (
                item.category_id &&
                categoryMapping[
                  item.category_id as keyof typeof categoryMapping
                ]
              ) {
                item.category_id =
                  categoryMapping[
                    item.category_id as keyof typeof categoryMapping
                  ];
                migrated = true;
              }

              if (
                item.main_category &&
                categoryMapping[
                  item.main_category as keyof typeof categoryMapping
                ]
              ) {
                item.main_category =
                  categoryMapping[
                    item.main_category as keyof typeof categoryMapping
                  ];
                migrated = true;
              }

              // Eski format kodlarını dönüştür
              if (
                item.sub_category_id &&
                oldFormatMapping[
                  item.sub_category_id as keyof typeof oldFormatMapping
                ]
              ) {
                item.sub_category_id =
                  oldFormatMapping[
                    item.sub_category_id as keyof typeof oldFormatMapping
                  ];
                migrated = true;
              }

              if (
                item.sub_category &&
                oldFormatMapping[
                  item.sub_category as keyof typeof oldFormatMapping
                ]
              ) {
                item.sub_category =
                  oldFormatMapping[
                    item.sub_category as keyof typeof oldFormatMapping
                  ];
                migrated = true;
              }

              if (migrated) {
                migratedCount++;
              }

              return item;
            },
          );

          return {
            ...quote,
            items: migratedItems,
            service_items: migratedItems,
          };
        });

        // Migrated quotes'ları kaydet
        storage.setItem("quotes", JSON.stringify(migratedQuotes));
        setMigrationResult(
          `Migration tamamlandı! ${migratedCount} kategori kodu güncellendi.`,
        );
      } else {
        setMigrationResult("Migrate edilecek teklif bulunamadı.");
      }

      // 3 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        router.push("/quotes");
      }, 3000);
    } catch (error) {
      setMigrationResult(
        `Migration hatası: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Teklif Kategorileri Migrate Ediliyor...
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Eski kategori kodları yeni sabit ID'lere dönüştürülüyor...
        </p>
        {migrationResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <p className="text-green-800 text-sm">{migrationResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
