import { useMemo } from "react";

interface FinancialDataProps {
  itemsSales: any[];
  itemsPurchase: any[];
  categories: any[];
  otherServices: any[];
  financialServices: any[];
  hrExtras: any[];
  collectionPlans: any[];
  collections: any[];
  paymentPlans: any[];
  payments: any[];
}

export function useFinancialData({
  itemsSales,
  itemsPurchase,
  categories,
  otherServices,
  financialServices,
  hrExtras,
  collectionPlans,
  collections,
  paymentPlans,
  payments,
}: FinancialDataProps) {
  // Kategori isimlerini Map ile cache'le
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c: any) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [categories]);

  const getCategoryName = (id: string) => {
    if (!id) return "";
    return categoryNameMap.get(id) || id;
  };

  // Diğer Servisler döviz cinsine göre toplam hesaplamaları
  const otherServicesTotals = useMemo(() => {
    const totalsByCurrency: { [key: string]: { toplamMaliyet: number } } = {};
    otherServices.forEach((item) => {
      const cur = item.currency || "TRY";
      if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { toplamMaliyet: 0 };
      totalsByCurrency[cur].toplamMaliyet += parseFloat(item.amount) || 0;
    });
    return totalsByCurrency;
  }, [otherServices]);

  // Finansal döviz cinsine göre toplam hesaplamaları
  const financialTotals = useMemo(() => {
    const totalsByCurrency: { [key: string]: { toplamMaliyet: number } } = {};
    financialServices.forEach((item) => {
      const cur = item.currency || "TRY";
      if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { toplamMaliyet: 0 };
      totalsByCurrency[cur].toplamMaliyet += parseFloat(item.amount) || 0;
    });
    return totalsByCurrency;
  }, [financialServices]);

  // Satış genel toplamları
  const salesTotals = useMemo(() => {
    const totalTRY = itemsSales.reduce(
      (sum: number, it: any) => sum + (Number(it.total_try) || 0),
      0,
    );
    const totalByCurrency: Record<string, number> = {};
    itemsSales.forEach((it: any) => {
      const cur = it.currency || "EUR";
      totalByCurrency[cur] =
        (totalByCurrency[cur] || 0) + (Number(it.total) || 0);
    });
    return { totalTRY, totalByCurrency };
  }, [itemsSales]);

  // Alış genel toplamları
  const purchaseTotals = useMemo(() => {
    const totalTRY = itemsPurchase.reduce(
      (sum: number, it: any) => sum + (Number(it.total_try) || 0),
      0,
    );
    const totalByCurrency: Record<string, number> = {};
    itemsPurchase.forEach((it: any) => {
      const cur = it.currency || "EUR";
      totalByCurrency[cur] =
        (totalByCurrency[cur] || 0) + (Number(it.total) || 0);
    });
    return { totalTRY, totalByCurrency };
  }, [itemsPurchase]);

  // Kar/Zarar hesapları
  const profitLossData = useMemo(() => {
    type CurrencyMap = Record<string, number>;
    type Row = {
      mainCategoryId: string;
      mainCategoryName: string;
      subCategoryId: string;
      subCategoryName: string;
      salesByCurrency: CurrencyMap;
      salesTRY: number;
      purchaseByCurrency: CurrencyMap;
      purchaseTRY: number;
      profitByCurrency: CurrencyMap;
      profitTRY: number;
      marginPercent: number;
    };

    const ensure = (
      map: Record<string, Row>,
      key: string,
      mainId: string,
      subId: string,
    ) => {
      if (!map[key]) {
        map[key] = {
          mainCategoryId: mainId,
          mainCategoryName: getCategoryName(mainId) || "Diğer",
          subCategoryId: subId,
          subCategoryName: getCategoryName(subId) || "—",
          salesByCurrency: {},
          salesTRY: 0,
          purchaseByCurrency: {},
          purchaseTRY: 0,
          profitByCurrency: {},
          profitTRY: 0,
          marginPercent: 0,
        };
      }
      return map[key];
    };

    const rowsByKey: Record<string, Row> = {};

    itemsSales.forEach((it: any) => {
      const mainId = it.main_category || "";
      const subId = it.sub_category || "";
      const key = `${mainId}|${subId}`;
      const row = ensure(rowsByKey, key, mainId, subId);
      const cur = it.currency || "EUR";
      const total = Number(it.total) || 0;
      const totalTRY = Number(it.total_try) || 0;
      row.salesByCurrency[cur] = (row.salesByCurrency[cur] || 0) + total;
      row.salesTRY += totalTRY;
    });

    itemsPurchase.forEach((it: any) => {
      const mainId = it.main_category || "";
      const subId = it.sub_category || "";
      const key = `${mainId}|${subId}`;
      const row = ensure(rowsByKey, key, mainId, subId);
      const cur = it.currency || "EUR";
      const total = Number(it.total) || 0;
      const totalTRY = Number(it.total_try) || 0;
      row.purchaseByCurrency[cur] = (row.purchaseByCurrency[cur] || 0) + total;
      row.purchaseTRY += totalTRY;
    });

    Object.values(rowsByKey).forEach((row) => {
      const currencies = new Set<string>([
        ...Object.keys(row.salesByCurrency),
        ...Object.keys(row.purchaseByCurrency),
      ]);
      currencies.forEach((c) => {
        const s = row.salesByCurrency[c] || 0;
        const p = row.purchaseByCurrency[c] || 0;
        row.profitByCurrency[c] = s - p;
      });
      row.profitTRY = row.salesTRY - row.purchaseTRY;
      row.marginPercent =
        row.salesTRY > 0 ? (row.profitTRY / row.salesTRY) * 100 : 0;
    });

    const trCompare = (x: string, y: string) =>
      x.localeCompare(y, "tr", { sensitivity: "base" });

    const getCategorySortKey = (c: any) => {
      const code = (c.code || "").toString().trim();
      if (code) return code;
      const id = (c.id || "").toString().trim();
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        );
      if (id && !isUuid) return id;
      return (c.name || "").toString().trim();
    };

    const getCategorySortWeight = (c: any) => {
      const key = getCategorySortKey(c);
      const nums = key.match(/\d+/g);
      if (!nums) return Number.MAX_SAFE_INTEGER;
      const weight = Number(nums.join(""));
      return Number.isFinite(weight) ? weight : Number.MAX_SAFE_INTEGER;
    };

    const sortedCategories = [...categories].sort((a: any, b: any) => {
      const aOrder = a.sort_order ?? 9999;
      const bOrder = b.sort_order ?? 9999;
      if (aOrder !== bOrder) return aOrder - bOrder;

      const wa = getCategorySortWeight(a);
      const wb = getCategorySortWeight(b);
      if (wa !== wb) return wa - wb;
      return getCategorySortKey(a).localeCompare(getCategorySortKey(b), "tr", {
        numeric: true,
        sensitivity: "base",
      });
    });

    const mainOrder: Record<string, number> = {};
    sortedCategories.forEach((c: any, idx: number) => {
      if (!c.parent_id) {
        mainOrder[c.id] = idx;
      }
    });

    const sortedRows: Row[] = Object.values(rowsByKey).sort((a, b) => {
      const aMainIdx = mainOrder[a.mainCategoryId] ?? Number.MAX_SAFE_INTEGER;
      const bMainIdx = mainOrder[b.mainCategoryId] ?? Number.MAX_SAFE_INTEGER;
      if (aMainIdx !== bMainIdx) return aMainIdx - bMainIdx;

      const subList = sortedCategories.filter(
        (c: any) => c.parent_id === a.mainCategoryId,
      );
      const subOrder: Record<string, number> = {};
      subList.forEach((c: any, idx: number) => {
        subOrder[c.id] = idx;
      });
      const aSubIdx = subOrder[a.subCategoryId] ?? Number.MAX_SAFE_INTEGER;
      const bSubIdx = subOrder[b.subCategoryId] ?? Number.MAX_SAFE_INTEGER;
      if (aSubIdx !== bSubIdx) return aSubIdx - bSubIdx;

      if (a.mainCategoryName !== b.mainCategoryName)
        return trCompare(a.mainCategoryName, b.mainCategoryName);
      return trCompare(a.subCategoryName, b.subCategoryName);
    });

    const totals = sortedRows.reduce(
      (acc, r) => {
        Object.entries(r.salesByCurrency).forEach(([c, v]) => {
          acc.salesByCurrency[c] = (acc.salesByCurrency[c] || 0) + (v || 0);
        });
        Object.entries(r.purchaseByCurrency).forEach(([c, v]) => {
          acc.purchaseByCurrency[c] =
            (acc.purchaseByCurrency[c] || 0) + (v || 0);
        });
        Object.entries(r.profitByCurrency).forEach(([c, v]) => {
          acc.profitByCurrency[c] = (acc.profitByCurrency[c] || 0) + (v || 0);
        });
        acc.salesTRY += r.salesTRY;
        acc.purchaseTRY += r.purchaseTRY;
        acc.profitTRY += r.profitTRY;
        return acc;
      },
      {
        salesByCurrency: {} as CurrencyMap,
        salesTRY: 0,
        purchaseByCurrency: {} as CurrencyMap,
        purchaseTRY: 0,
        profitByCurrency: {} as CurrencyMap,
        profitTRY: 0,
      },
    );

    const totalMarginPercent =
      totals.salesTRY > 0 ? (totals.profitTRY / totals.salesTRY) * 100 : 0;

    // Kar/Zarar tabı için gruplanmış veriler
    const groupedProfitLossData = {
      groups: sortedRows.reduce((acc: any, r) => {
        acc[r.mainCategoryName] = acc[r.mainCategoryName] || [];
        acc[r.mainCategoryName].push(r);
        return acc;
      }, {}),
      mainNames: Array.from(new Set(sortedRows.map((r) => r.mainCategoryName))),
    };

    return {
      rows: sortedRows,
      totals,
      totalMarginPercent,
      groupedProfitLossData,
    };
  }, [itemsSales, itemsPurchase, categories, categoryNameMap]);

  // Tahsilat hesapları
  const collectionSummary = useMemo(() => {
    const planTRY = Number(salesTotals.totalTRY || 0);
    const collectedTRY = collections.reduce(
      (sum: number, c: any) =>
        sum +
        (c.totalTRY || (Number(c.amount) || 0) * Number(c.exchangeRate || 1)),
      0,
    );
    const balanceTRY = planTRY - collectedTRY;
    return { planTRY, collectedTRY, balanceTRY };
  }, [collections, salesTotals.totalTRY]);

  const planByCurrency = useMemo(() => {
    const byCur: Record<string, number> = {};
    collectionPlans.forEach((p: any) => {
      const cur = p.currency || "TRY";
      byCur[cur] = (byCur[cur] || 0) + (Number(p.amount) || 0);
    });
    return byCur;
  }, [collectionPlans]);

  const collectedByCurrency = useMemo(() => {
    const byCur: Record<string, number> = {};
    collections.forEach((c: any) => {
      const cur = c.currency || "TRY";
      byCur[cur] = (byCur[cur] || 0) + (Number(c.amount) || 0);
    });
    return byCur;
  }, [collections]);

  const balanceByCurrency = useMemo(() => {
    const keys = new Set<string>([
      ...Object.keys(planByCurrency),
      ...Object.keys(collectedByCurrency),
    ]);
    const res: Record<string, number> = {};
    keys.forEach((k) => {
      res[k] = (planByCurrency[k] || 0) - (collectedByCurrency[k] || 0);
    });
    return res;
  }, [planByCurrency, collectedByCurrency]);

  // Ödeme hesapları
  const paymentSummary = useMemo(() => {
    const planTRY = paymentPlans.reduce(
      (sum: number, p: any) => sum + (p.totalTRY || p.amount || 0),
      0,
    );
    const paidTRY = payments.reduce(
      (sum: number, p: any) => sum + (p.totalTRY || p.amount || 0),
      0,
    );
    const balanceTRY = planTRY - paidTRY;
    return { planTRY, paidTRY, balanceTRY };
  }, [paymentPlans, payments]);

  const paymentPlanByCurrency = useMemo(() => {
    const byCur: Record<string, number> = {};
    paymentPlans.forEach((p: any) => {
      const cur = p.currency || "TRY";
      byCur[cur] = (byCur[cur] || 0) + (Number(p.amount) || 0);
    });
    return byCur;
  }, [paymentPlans]);

  const paidByCurrency = useMemo(() => {
    const byCur: Record<string, number> = {};
    payments.forEach((p: any) => {
      const cur = p.currency || "TRY";
      byCur[cur] = (byCur[cur] || 0) + (Number(p.amount) || 0);
    });
    return byCur;
  }, [payments]);

  const paymentBalanceByCurrency = useMemo(() => {
    const keys = new Set<string>([
      ...Object.keys(paymentPlanByCurrency),
      ...Object.keys(paidByCurrency),
    ]);
    const res: Record<string, number> = {};
    keys.forEach((k) => {
      res[k] = (paymentPlanByCurrency[k] || 0) - (paidByCurrency[k] || 0);
    });
    return res;
  }, [paymentPlanByCurrency, paidByCurrency]);

  // İnsan Kaynakları toplamları
  const hrTotals = useMemo(() => {
    const totalsByCurrency: { [key: string]: { toplamMaliyet: number } } = {};
    hrExtras.forEach((extra) => {
      const doviz = extra.currency || "TRY";
      if (!totalsByCurrency[doviz]) {
        totalsByCurrency[doviz] = { toplamMaliyet: 0 };
      }
      totalsByCurrency[doviz].toplamMaliyet += parseFloat(extra.amount) || 0;
    });
    return totalsByCurrency;
  }, [hrExtras]);

  return {
    salesTotals,
    purchaseTotals,
    profitLossData,
    otherServicesTotals,
    financialTotals,
    hrTotals,
    collectionSummary,
    planByCurrency,
    collectedByCurrency,
    balanceByCurrency,
    paymentSummary,
    paymentPlanByCurrency,
    paidByCurrency,
    paymentBalanceByCurrency,
  };
}
