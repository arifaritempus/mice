"use client";
import { useEffect } from "react";


import { usePermissions, Module, Permission } from "@/lib/permissions";
import FieldsetGuard from "@/components/permissions/FieldsetGuard";
import PermissionBoundary from "@/components/permissions/PermissionBoundary";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface KarZararTabProps {
  profitLossData: {
    rows: any[];
    totals: {
      salesByCurrency: Record<string, number>;
      salesTRY: number;
      purchaseByCurrency: Record<string, number>;
      purchaseTRY: number;
      profitTRY: number;
    };
  };
  salesTotals: {
    totalByCurrency: Record<string, number>;
    totalTRY: number;
  };
  purchaseTotals: {
    totalByCurrency: Record<string, number>;
    totalTRY: number;
  };
  groupedProfitLossData: {
    mainNames: string[];
    groups: Record<string, any[]>;
  };
  formatNumber: (value: number) => string;
  formatByCurrencySummary: (byCur: Record<string, number>) => string;
}

export default function KarZararTab({
  profitLossData,
  salesTotals,
  purchaseTotals,
  groupedProfitLossData,
  formatNumber,
  formatByCurrencySummary,
}: KarZararTabProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        {t('projects.profitAndLossAnalysis') || "Kar/Zarar Analizi"}
      </h2>

      {/* Tablo Yatay Kaydırma Sarmalayıcısı */}
      <div className="overflow-x-auto custom-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-max md:min-w-full">
          {/* Başlık satırı - Kar/Zarar için optimize edilmiş */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white">
            <div className="w-48">{t('projects.subCategoryUpper') || "ALT KATEGORİ"}</div>
            <div className="w-32 text-right pr-1">{t('projects.salesCurrencyUpper') || "SATIŞ DÖVİZ"}</div>
            <div className="w-20 text-right pr-1">{t('projects.exchangeRateUpper') || "KUR"}</div>
            <div className="w-32 text-right pr-1">{t('projects.salesTRYUpper') || "SATIŞ TL"}</div>
            <div className="w-32 text-right pr-1">{t('projects.purchaseCurrencyUpper') || "ALIŞ DÖVİZ"}</div>
            <div className="w-20 text-right pr-1">{t('projects.exchangeRateUpper') || "KUR"}</div>
            <div className="w-32 text-right pr-1">{t('projects.purchaseTRYUpper') || "ALIŞ TL"}</div>
            <div className="w-32 text-right pr-1">{t('projects.profitAndLossUpper') || "KAR/ZARAR"}</div>
            <div className="w-24 text-right pr-1">{t('projects.profitMarginUpper') || "KAR MARJI"}</div>
          </div>

          {/* Veri satırları - Satış tabı ile aynı yapı */}
          <div className="space-y-2">
            {profitLossData.rows.length === 0 ? (
              salesTotals.totalTRY > 0 || purchaseTotals.totalTRY > 0 ? (
                <div className="rounded-md p-2 flex flex-nowrap items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="w-48 text-xs text-gray-900 dark:text-white">
                    {t('projects.totalFallbackUpper') || "TOPLAM (fallback)"}
                  </div>
                  <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    {formatByCurrencySummary(salesTotals.totalByCurrency)}
                  </div>
                  <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    —
                  </div>
                  <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    {formatNumber(salesTotals.totalTRY)}
                  </div>
                  <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    {formatByCurrencySummary(purchaseTotals.totalByCurrency)}
                  </div>
                  <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    —
                  </div>
                  <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    {formatNumber(purchaseTotals.totalTRY)}
                  </div>
                  <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    <span
                      className={
                        salesTotals.totalTRY - purchaseTotals.totalTRY >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatNumber(
                        salesTotals.totalTRY - purchaseTotals.totalTRY,
                      )}
                    </span>
                  </div>
                  <div className="w-24 text-right pr-1 text-xs text-gray-900 dark:text-white">
                    {salesTotals.totalTRY > 0
                      ? `${formatNumber(((salesTotals.totalTRY - purchaseTotals.totalTRY) / salesTotals.totalTRY) * 100)} %`
                      : "—"}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
                  {t('projects.noData') || "Veri yok"}
                </div>
              )
            ) : (
              <>
                <div>
                  {groupedProfitLossData.mainNames.map((mainName) => (
                    <div key={mainName}>
                      {/* Ana kategori başlığı */}
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-md p-2 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {mainName}
                        </h3>
                      </div>

                      {/* Alt kategori satırları */}
                      {groupedProfitLossData.groups[mainName].map((r) => (
                        <div
                          key={`${r.mainCategoryId}|${r.subCategoryId}`}
                          className="rounded-md p-2 flex flex-nowrap items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <div
                            className="w-48 text-xs text-gray-900 dark:text-white"
                            title={r.subCategoryName}
                          >
                            {r.subCategoryName}
                          </div>
                          <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            {formatByCurrencySummary(r.salesByCurrency)}
                          </div>
                          <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            —
                          </div>
                          <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            {formatNumber(r.salesTRY)}
                          </div>
                          <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            {formatByCurrencySummary(r.purchaseByCurrency)}
                          </div>
                          <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            —
                          </div>
                          <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            {formatNumber(r.purchaseTRY)}
                          </div>
                          <div className="w-32 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            <span
                              className={
                                r.profitTRY >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {formatNumber(r.profitTRY)}
                            </span>
                          </div>
                          <div className="w-24 text-right pr-1 text-xs text-gray-900 dark:text-white">
                            {Number.isFinite(r.marginPercent)
                              ? `${formatNumber(r.marginPercent)} %`
                              : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Genel Toplam - Kar/Zarar için optimize edilmiş */}
                <div className="mt-4 bg-blue-500 dark:bg-blue-700 rounded-md p-3">
                  <div className="flex flex-nowrap items-center gap-2">
                    <div className="w-48 text-sm font-bold text-white">
                      {t('projects.grandTotalUpper') || "GENEL TOPLAM"}
                    </div>
                    <div className="w-32 text-sm font-bold text-white text-right pr-1">
                      {formatByCurrencySummary(
                        profitLossData.totals.salesByCurrency,
                      )}
                    </div>
                    <div className="w-20 text-sm font-bold text-white text-right pr-1">
                      —
                    </div>
                    <div className="w-32 text-sm font-bold text-white text-right pr-1">
                      {formatNumber(profitLossData.totals.salesTRY)}
                    </div>
                    <div className="w-32 text-sm font-bold text-white text-right pr-1">
                      {formatByCurrencySummary(
                        profitLossData.totals.purchaseByCurrency,
                      )}
                    </div>
                    <div className="w-20 text-sm font-bold text-white text-right pr-1">
                      —
                    </div>
                    <div className="w-32 text-sm font-bold text-white text-right pr-1">
                      {formatNumber(profitLossData.totals.purchaseTRY)}
                    </div>
                    <div className="w-32 text-sm font-bold text-white text-right pr-1">
                      {formatNumber(profitLossData.totals.profitTRY)}
                    </div>
                    <div className="w-24 text-sm font-bold text-white text-right pr-1">
                      {profitLossData.totals.salesTRY > 0
                        ? `${formatNumber((profitLossData.totals.profitTRY / profitLossData.totals.salesTRY) * 100)} %`
                        : "—"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
