"use client";

import { useState, useEffect, useMemo } from "react";
import {
  agenciesService,
  hotelsService,
  suppliersService,
  invoicesService,
  categoriesService,
} from "@/lib/supabaseService";
import Modal from "../Modal";

/** Fatura satırlarını kategori manuel ID düzenine göre diz (CAT_001, CAT_001_01 vb.) */
function sortInvoiceModalItems(items: any[], categories: any[]): any[] {
  if (!items.length) return [];
  const byKey: Record<string, any> = {};
  const byName: Record<string, any> = {};
  (categories || []).forEach((c: any) => {
    byKey[c.id] = c;
    if (c.code) byKey[c.code] = c;
    if (c.name) byName[String(c.name).toLowerCase()] = c;
  });

  const idToRank = (value: any) => {
    const key = String(value || "").trim();
    if (!key) return { w: Number.MAX_SAFE_INTEGER, key: "ZZZ" };
    const nums = key.match(/\d+/g);
    const weight = nums ? Number(nums.join("")) : Number.MAX_SAFE_INTEGER;
    return {
      w: Number.isFinite(weight) ? weight : Number.MAX_SAFE_INTEGER,
      key: key.toUpperCase(),
    };
  };

  const rank = (item: any) => {
    let mainManualId = "";
    let subManualId = "";

    if (item.category) {
      const c = byKey[item.category];
      const mainId = c?.parent_id ? String(c.parent_id) : String(item.category);
      const mainCat = byKey[mainId] || c;
      mainManualId = String(mainCat?.code || mainCat?.id || mainId || "");
      if (item.sub_category) {
        const subCat = byKey[item.sub_category];
        subManualId = String(
          subCat?.code || subCat?.id || item.sub_category || "",
        );
      }
    } else if (item.category_name) {
      const mainCat = byName[String(item.category_name || "").toLowerCase()];
      const subCat = byName[String(item.sub_category_name || "").toLowerCase()];
      mainManualId = String(
        mainCat?.code || mainCat?.id || item.category_name || "",
      );
      subManualId = String(
        subCat?.code || subCat?.id || item.sub_category_name || "",
      );
    }

    const mainRank = idToRank(mainManualId);
    const subRank = idToRank(subManualId);
    return { mainRank, subRank };
  };

  return [...items].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra.mainRank.w !== rb.mainRank.w) return ra.mainRank.w - rb.mainRank.w;
    const c0 = ra.mainRank.key.localeCompare(rb.mainRank.key, "en", {
      numeric: true,
    });
    if (c0 !== 0) return c0;
    if (ra.subRank.w !== rb.subRank.w) return ra.subRank.w - rb.subRank.w;
    return ra.subRank.key.localeCompare(rb.subRank.key, "en", {
      numeric: true,
    });
  });
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: any[];
  type: "income" | "expense";
  onSuccess: () => void;
  editInvoice?: any;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  selectedItems,
  type,
  onSuccess,
  editInvoice,
}: InvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchAccount, setSearchAccount] = useState("");

  // Local items state to allow row deletion
  const [currentItems, setCurrentItems] = useState<any[]>([]);

  // Invoice form state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState("");
  const [notes, setNotes] = useState("");

  // Per-item invoicing dynamics
  const [itemAmounts, setItemAmounts] = useState<Record<string, number>>({});
  const [itemVats, setItemVats] = useState<Record<string, number>>({});
  const [itemDescriptions, setItemDescriptions] = useState<
    Record<string, string>
  >({});
  const [itemCurrencies, setItemCurrencies] = useState<Record<string, string>>(
    {},
  );
  const [itemExchangeRates, setItemExchangeRates] = useState<
    Record<string, number>
  >({});

  // ESC key listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    categoriesService
      .getAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();

      const initialAmounts: Record<string, number> = {};
      const initialVats: Record<string, number> = {};
      const initialDescriptions: Record<string, string> = {};
      const initialCurrencies: Record<string, string> = {};
      const initialRates: Record<string, number> = {};

      if (editInvoice) {
        setInvoiceNo(editInvoice.invoice_no || "");
        setInvoiceDate(editInvoice.date ? editInvoice.date.split("T")[0] : "");
        setSelectedAccountId(editInvoice.contact_id || "");
        setSelectedAccountType(editInvoice.contact_type || "");
        setNotes(editInvoice.notes || "");

        const mappedItems = selectedItems.map((item) => ({
          ...item,
          id: item.item_id || item.id, // Ensure we use the source level ID for tracking
        }));

        setCurrentItems(mappedItems);
        mappedItems.forEach((item) => {
          initialAmounts[item.id] = Number(item.amount || item.balance || 0);
          initialVats[item.id] = Number(item.vat_rate || 0);
          initialDescriptions[item.id] = item.description || "";
          initialCurrencies[item.id] = item.currency || "TRY";
          initialRates[item.id] = Number(item.exchange_rate || 1);
        });
      } else {
        setInvoiceNo("");
        setInvoiceDate(new Date().toISOString().split("T")[0]);
        setSelectedAccountId("");
        setSelectedAccountType("");
        setNotes("");

        setCurrentItems([...selectedItems]);
        selectedItems.forEach((item) => {
          initialAmounts[item.id] = Number(item.balance);
          initialVats[item.id] = Number(item.vat_rate || 0);
          initialDescriptions[item.id] = item.description || "";
          initialCurrencies[item.id] = item.currency || "TRY";
          initialRates[item.id] = Number(item.fx || 1);
        });

        // Auto-select account logic
        if (selectedItems.length > 0) {
          if (type === "income") {
            const firstAgency = selectedItems[0].project?.agency_id;
            if (
              firstAgency &&
              selectedItems.every(
                (item) => item.project?.agency_id === firstAgency,
              )
            ) {
              setSelectedAccountId(firstAgency);
              setSelectedAccountType("agency");
            }
          } else {
            const firstSupplier = selectedItems[0].supplier_id;
            const firstHotel = selectedItems[0].hotel_id;
            if (
              firstSupplier &&
              selectedItems.every((item) => item.supplier_id === firstSupplier)
            ) {
              setSelectedAccountId(firstSupplier);
              setSelectedAccountType("vendor");
            } else if (
              firstHotel &&
              selectedItems.every((item) => item.hotel_id === firstHotel)
            ) {
              setSelectedAccountId(firstHotel);
              setSelectedAccountType("hotel");
            }
          }
        }
      }

      setItemAmounts(initialAmounts);
      setItemVats(initialVats);
      setItemDescriptions(initialDescriptions);
      setItemCurrencies(initialCurrencies);
      setItemExchangeRates(initialRates);
    }
  }, [isOpen, selectedItems, type, editInvoice]);

  const loadAccounts = async () => {
    try {
      if (type === "income") {
        const data = await agenciesService.getAll();
        setAccounts(data.map((d) => ({ ...d, type: "agency" })));
      } else {
        const [h, v] = await Promise.all([
          hotelsService.getAll(),
          suppliersService.getAll(),
        ]);
        setAccounts([
          ...h.map((d) => ({ ...d, type: "hotel" })),
          ...v.map((d) => ({ ...d, type: "vendor" })),
        ]);
      }
    } catch (err) {
      console.error("Account load error:", err);
    }
  };

  const removeItem = (id: string) => {
    setCurrentItems((prev) => prev.filter((item) => item.id !== id));
    const newItemAmounts = { ...itemAmounts };
    delete newItemAmounts[id];
    setItemAmounts(newItemAmounts);
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name?.toLowerCase().includes(searchAccount.toLowerCase()) ||
      acc.company_name?.toLowerCase().includes(searchAccount.toLowerCase()),
  );

  const calculateTotals = () => {
    let matrahTRY = 0;
    let kdvTRY = 0;
    const totalsByCurrency: Record<string, { matrah: number; kdv: number; total: number }> = {};
    
    currentItems.forEach((item) => {
      const grossAmount = itemAmounts[item.id] || 0;
      const vatRate = itemVats[item.id] || 0;
      const er = itemExchangeRates[item.id] || 1;
      const currency = itemCurrencies[item.id] || "TRY";

      const rowMatrahOriginal = grossAmount / (1 + vatRate / 100);
      const rowKdvOriginal = grossAmount - rowMatrahOriginal;
      
      matrahTRY += rowMatrahOriginal * er;
      kdvTRY += rowKdvOriginal * er;

      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = { matrah: 0, kdv: 0, total: 0 };
      }
      totalsByCurrency[currency].matrah += rowMatrahOriginal;
      totalsByCurrency[currency].kdv += rowKdvOriginal;
      totalsByCurrency[currency].total += grossAmount;
    });

    const genelToplamTRY = matrahTRY + kdvTRY;
    return { matrahTRY, kdvTRY, genelToplamTRY, totalsByCurrency };
  };

  const totals = calculateTotals();

  const sortedLineItems = useMemo(
    () => sortInvoiceModalItems(currentItems, categories),
    [currentItems, categories],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !invoiceNo || !invoiceDate) {
      alert(
        "Lütfen faturanın asıl zorunlu alanlarını (No, Tarih, Cari Hesap) doldurun.",
      );
      return;
    }
    if (currentItems.length === 0) {
      alert("Lütfen en az bir hizmet kalemi seçin.");
      return;
    }

    try {
      setLoading(true);
      const invoiceData = {
        type,
        invoice_no: invoiceNo,
        date: invoiceDate,
        contact_id: selectedAccountId,
        contact_type: selectedAccountType,
        total_amount: totals.genelToplamTRY,
        currency: "TRY",
        exchange_rate: 1,
        total_try: totals.genelToplamTRY,
        notes,
        status: "confirmed",
      };

      const ordered = sortInvoiceModalItems(currentItems, categories);
      const billItems = ordered.map((item) => ({
        item_type: type === "income" ? "sales" : "purchase",
        item_id: item.id,
        amount: itemAmounts[item.id] || 0,
        vat_rate: itemVats[item.id] || 0,
        description: itemDescriptions[item.id] || "",
        currency: itemCurrencies[item.id] || "TRY",
        exchange_rate: itemExchangeRates[item.id] || 1,
      }));

      if (editInvoice) {
        await invoicesService.update(editInvoice.id, invoiceData, billItems);
      } else {
        await invoicesService.create(invoiceData, billItems);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Invoice action error:", err);
      alert("İşlem sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editInvoice
          ? "✏️ Fatura Düzenle"
          : type === "income"
            ? "📄 Yeni Gelir Faturası"
            : "🧾 Yeni Gider Faturası"
      }
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col h-full">
        <form onSubmit={handleSubmit} className="flex-1 space-y-8">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Fatura No *
                </label>
                <input
                  required
                  type="text"
                  placeholder="ORN-2026-001"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Tarih *
                </label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col h-full space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Cari Hesap Seçimi *
              </label>
              <div className="relative flex flex-col h-full border rounded-xl dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/30">
                <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <input
                    type="text"
                    placeholder="Acente/Otel/Tedarikçi ara..."
                    className="w-full px-3 py-1.5 text-sm rounded bg-white dark:bg-gray-900 border dark:border-gray-700 dark:text-white focus:ring-2 outline-none"
                    value={searchAccount}
                    onChange={(e) => setSearchAccount(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto max-h-[120px] p-2 space-y-1">
                  {filteredAccounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const typeLabels = {
                      agency: "Acente",
                      hotel: "Otel",
                      vendor: "Tedarikçi",
                    };
                    // @ts-ignore
                    const typeLabel = typeLabels[acc.type] || acc.type;

                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setSelectedAccountType(acc.type);
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between border transition-all ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {acc.name || acc.company_name}
                            </h4>
                            <span className="text-[10px] uppercase text-gray-500">
                              {typeLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3 overflow-x-auto pb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              Fatura Satır Kalemleri
              <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-[10px]">
                {currentItems.length} Kalem
              </span>
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm min-w-[900px]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-[25%]">
                      Kategori & Proje
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-[25%]">
                      Satır Açıklaması
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-[15%]">
                      Döviz/Kur
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-[10%]">
                      KDV (%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-[15%]">
                      KDV Dahil Tutar
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-[10%]">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {sortedLineItems.map((item) => {
                    const isSejour = item.project?.quote_type === "SEJOUR";
                    const isMice = !!item.project && !isSejour;
                    const projectTypeBadge = isSejour
                      ? "SEJOUR"
                      : isMice
                        ? "MICE"
                        : "PROJE";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex gap-2 items-center mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                              {projectTypeBadge}
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {item.category_name}
                              {item.sub_category_name && (
                                <span className="text-gray-400 font-normal ml-1 text-xs">
                                  ({item.sub_category_name})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-blue-400 dark:text-blue-400 font-semibold truncate">
                            {item.project?.company_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Örn: Konaklama Bedeli"
                            className="w-full px-3 py-1.5 text-sm border rounded bg-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            value={itemDescriptions[item.id] || ""}
                            onChange={(e) =>
                              setItemDescriptions((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <select
                              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                              value={itemCurrencies[item.id] || "TRY"}
                              onChange={(e) =>
                                setItemCurrencies((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="TRY">TRY</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                            </select>
                            <input
                              type="number"
                              step="0.0001"
                              placeholder="Kur"
                              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                              value={itemExchangeRates[item.id] || ""}
                              onChange={(e) =>
                                setItemExchangeRates((prev) => ({
                                  ...prev,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1.5 text-right border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm font-medium focus:ring-1 outline-none"
                            value={itemVats[item.id] || 0}
                            onChange={(e) =>
                              setItemVats((prev) => ({
                                ...prev,
                                [item.id]: Number(e.target.value),
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <input
                              type="number"
                              step="0.01"
                              max={editInvoice ? undefined : item.balance}
                              placeholder="0.00 (KDV Dahil)"
                              className="w-full px-3 py-1.5 text-right border-2 border-blue-200 dark:border-blue-800/50 rounded bg-white dark:bg-gray-800 dark:text-white text-sm font-bold focus:border-blue-500 outline-none"
                              value={itemAmounts[item.id] || 0}
                              onChange={(e) =>
                                setItemAmounts((prev) => ({
                                  ...prev,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                            />
                            {!editInvoice && (
                              <span className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">
                                Max:{" "}
                                {new Intl.NumberFormat("tr-TR").format(
                                  item.balance,
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Satırı Kaldır"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Fatura Genel Açıklaması / Notlar
              </label>
              <textarea
                className="w-full px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Genel notlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center shadow-sm">
              <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                {Object.entries(totals.totalsByCurrency).map(([curr, vals]) => (
                  <div key={curr} className="flex flex-col gap-1.5 p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>Ara Toplam (Matrah)</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(vals.matrah)} <span className="text-xs font-semibold">{curr}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>KDV Toplamı</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(vals.kdv)} <span className="text-xs font-semibold">{curr}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-gray-800 dark:text-gray-200 mt-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span>Toplam</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(vals.total)} <span className="text-xs font-semibold">{curr}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-end pt-4">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Genel Toplam Karşılığı
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">TRY Bazında</span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 leading-none mb-1">
                    {new Intl.NumberFormat("tr-TR", {
                      minimumFractionDigits: 2,
                    }).format(totals.genelToplamTRY)}{" "}
                    <span className="text-lg font-bold">TRY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || currentItems.length === 0}
              className="px-10 py-3 bg-blue-500 hover:bg-blue-500/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              )}
              {editInvoice ? "GÜNCELLEMELERİ KAYDET" : "FATURAYI KAYDET"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
