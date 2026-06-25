"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface FinancialTabProps {
  financialServices: any[];
  setFinancialServices: (services: any[]) => void;
  projectId: string;
  financialSearch: string;
  setFinancialSearch: (search: string) => void;
  editingFinancialServiceIndex: number | null;
  setEditingFinancialServiceIndex: (index: number | null) => void;
  tempFinancialServiceItem: any;
  setTempFinancialServiceItem: (item: any) => void;
  financialAmountInput: string;
  setFinancialAmountInput: (value: string) => void;
  financialTotalTRYInput: string;
  setFinancialTotalTRYInput: (value: string) => void;
  hotelSupplierSearch: string;
  setHotelSupplierSearch: (value: string) => void;
  showHotelSupplierDropdown: boolean;
  setShowHotelSupplierDropdown: (show: boolean) => void;
  selectedSupplierIndex: number;
  setSelectedSupplierIndex: (index: number) => void;
  financialSubCategories: any[];
  filteredHotelSuppliers: any[];
  dropdownPosition: { top: number; left: number; width: number } | null;
  updateDropdownPosition: () => void;
  setFinancialSupplierInputRef: (el: HTMLInputElement | null) => void;
  handleFinancialAdd: () => void;
  handleFinancialSave: () => void;
  handleFinancialCancel: () => void;
  handleFinancialEdit: (index: number) => void;
  handleFinancialDelete: (index: number) => void;
  handleFinancialSupplierSelect: (supplier: any) => void;
  handleFinancialKeyDown: (e: React.KeyboardEvent) => void;
  parseTurkishNumber: (value: string) => number;
  formatNumberForDisplay: (value: number) => string;
  formatNumberForInput: (value: string) => string;
  formatNumber: (value: number) => string;
  formatTRY: (value: number) => string;
  formatDateForDisplay: (date: string) => string;
  getCategoryName: (id: string) => string;
  financialTotals: any;
  handleFinancialClear: () => void;
  handleFinancialExport: () => void;
  activeHotelId: string;
  project: any;
  allSuppliers: any[];
}

export default function FinancialTab({
  financialServices,
  setFinancialServices,
  projectId,
  financialSearch,
  setFinancialSearch,
  editingFinancialServiceIndex,
  setEditingFinancialServiceIndex,
  tempFinancialServiceItem,
  setTempFinancialServiceItem,
  financialAmountInput,
  setFinancialAmountInput,
  financialTotalTRYInput,
  setFinancialTotalTRYInput,
  hotelSupplierSearch,
  setHotelSupplierSearch,
  showHotelSupplierDropdown,
  setShowHotelSupplierDropdown,
  selectedSupplierIndex,
  setSelectedSupplierIndex,
  financialSubCategories,
  filteredHotelSuppliers,
  dropdownPosition,
  updateDropdownPosition,
  setFinancialSupplierInputRef,
  handleFinancialAdd,
  handleFinancialSave,
  handleFinancialCancel,
  handleFinancialEdit,
  handleFinancialDelete,
  handleFinancialSupplierSelect,
  handleFinancialKeyDown,
  parseTurkishNumber,
  formatNumberForDisplay,
  formatNumberForInput,
  formatNumber,
  formatTRY,
  formatDateForDisplay,
  getCategoryName,
  financialTotals,
  handleFinancialClear,
  handleFinancialExport,
  activeHotelId,
  project,
  allSuppliers,
}: FinancialTabProps) {
  // Kullanıcı Toplam TL alanını elle düzenliyor mu?
  const [isEditingFinancialTotal, setIsEditingFinancialTotal] = useState(false);
  // Filtrelenmiş finansal servisler
  const filteredFinancialServices = useMemo(() => {
    let filtered = financialServices;

    if (activeHotelId !== "all") {
      const currentTab = (project?.hotels_data || []).find(
        (h: any) => h.id === activeHotelId,
      );
      const realHotelId = currentTab?.hotel_id;

      filtered = filtered.filter((item: any) => {
        if (activeHotelId === "general") {
          // Genel hizmetler: hotel_id yoksa VE description içinde başka bir [T:...] tag'i yoksa
          const desc = item.description || "";
          const hasTabTag = /\[T:.*?\]/.test(desc);
          return (
            (!item.hotel_id && !item.hotel) ||
            (!hasTabTag && activeHotelId === "general")
          );
        }

        // Tag ile filtrele (en güvenli yöntem)
        if (
          item.description &&
          item.description.includes(`[T:${activeHotelId}]`)
        ) {
          return true;
        }

        // Fallback: hotel_id (DB'deki gerçek ID veya bizim Tab UUID)
        return (
          item.hotel_id === activeHotelId ||
          (realHotelId && item.hotel_id === realHotelId)
        );
      });
    }

    if (financialSearch) {
      const searchLower = financialSearch.toLowerCase();
      filtered = filtered.filter(
        (item: any) =>
          (item.supplier || item.hotel || "")
            .toLowerCase()
            .includes(searchLower) ||
          (item.subCategory || item.sub_category || "")
            .toLowerCase()
            .includes(searchLower) ||
          (item.description || "").toLowerCase().includes(searchLower) ||
          (item.currency || "").toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [financialServices, financialSearch, activeHotelId, project?.hotels_data]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="Finansal ara..."
            value={financialSearch}
            onChange={(e) => setFinancialSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFinancialAdd}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 transition-colors"
          >
            Yeni Ekle
          </button>
          <button
            onClick={handleFinancialExport}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Excel Dışa Aktar
          </button>
          <button
            onClick={handleFinancialClear}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  TARİH
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  OTEL/TEDARİKÇİ
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white hidden">
                  ANA KATEGORİ
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  ALT KATEGORİ
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  AÇIKLAMA
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  TUTAR
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  DÖVİZ
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  KUR
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  TOPLAM TL
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  İŞLEMLER
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {editingFinancialServiceIndex !== null &&
                editingFinancialServiceIndex === financialServices.length && (
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={tempFinancialServiceItem?.date || ""}
                          onChange={(e) =>
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                      <td className="px-2 py-2 relative">
                        <input
                          ref={setFinancialSupplierInputRef}
                          type="text"
                          value={hotelSupplierSearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setHotelSupplierSearch(value);
                            setShowHotelSupplierDropdown(true);
                            setTimeout(() => updateDropdownPosition(), 0);
                            setSelectedSupplierIndex(-1);
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              supplier: value,
                              hotel: value,
                            }));
                          }}
                          onClick={() => {
                            setShowHotelSupplierDropdown(true);
                            setTimeout(() => updateDropdownPosition(), 0);
                            setSelectedSupplierIndex(-1);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              // Eğer dropdown açıksa ve bir öğe seçiliyse, önce onu seç
                              if (
                                showHotelSupplierDropdown &&
                                selectedSupplierIndex >= 0 &&
                                selectedSupplierIndex <
                                  filteredHotelSuppliers.length
                              ) {
                                const supplier =
                                  filteredHotelSuppliers[selectedSupplierIndex];
                                handleFinancialSupplierSelect(supplier);
                              } else {
                                // Input'un mevcut değerini doğrudan al ve tempFinancialServiceItem'a ekle
                                const currentInputValue = (
                                  e.target as HTMLInputElement
                                ).value;
                                const updatedTempFinancialServiceItem = {
                                  ...tempFinancialServiceItem,
                                  supplier:
                                    currentInputValue ||
                                    tempFinancialServiceItem?.supplier ||
                                    "",
                                  hotel:
                                    currentInputValue ||
                                    tempFinancialServiceItem?.hotel ||
                                    "",
                                };
                                setTempFinancialServiceItem(
                                  updatedTempFinancialServiceItem,
                                );
                                handleFinancialSave();
                              }
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            } else {
                              handleFinancialKeyDown(e);
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                          placeholder="Otel/Tedarikçi ara..."
                        />
                      </td>
                      <td className="px-2 py-2 hidden">
                        <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                          FİNANSAL
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={tempFinancialServiceItem?.subCategory || ""}
                          onChange={(e) =>
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              subCategory: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Alt Kategori Seçin</option>
                          {financialSubCategories.map((sub) => (
                            <option key={sub.id} value={sub.name}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={tempFinancialServiceItem?.description || ""}
                          onChange={(e) =>
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                          placeholder="Açıklama"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={financialAmountInput}
                          onChange={(e) => {
                            const input = e.target.value;
                            setFinancialAmountInput(input);
                            const clean = input.replace(/[^\d,]/g, "");
                            const amount =
                              parseFloat(clean.replace(",", ".")) || 0;
                            const rate =
                              tempFinancialServiceItem?.exchangeRate || 1;
                            const currency =
                              tempFinancialServiceItem?.currency || "TRY";
                            const total =
                              currency === "TRY" ? amount : amount * rate;
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              amount,
                              totalTRY: total,
                            }));
                            if (!isEditingFinancialTotal) {
                              setFinancialTotalTRYInput(
                                formatNumberForDisplay(total),
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const value =
                              parseFloat(
                                formatNumberForInput(e.target.value),
                              ) || 0;
                            setFinancialAmountInput(
                              formatNumberForDisplay(value),
                            );
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              amount: value,
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                          placeholder="0,00"
                          inputMode="decimal"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={tempFinancialServiceItem?.currency || "TRY"}
                          onChange={(e) => {
                            const newCur = e.target.value;
                            const amount =
                              tempFinancialServiceItem?.amount || 0;
                            const rate =
                              tempFinancialServiceItem?.exchangeRate || 1;
                            const total =
                              newCur === "TRY" ? amount : amount * rate;
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              currency: newCur,
                              totalTRY: total,
                            }));
                            if (!isEditingFinancialTotal) {
                              setFinancialTotalTRYInput(
                                formatNumberForDisplay(total),
                              );
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        >
                          <option value="TRY">TRY</option>
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={tempFinancialServiceItem?.exchangeRate || ""}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            const amount =
                              tempFinancialServiceItem?.amount || 0;
                            const currency =
                              tempFinancialServiceItem?.currency || "TRY";
                            const total =
                              currency === "TRY" ? amount : amount * rate;
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              exchangeRate: rate,
                              totalTRY: total,
                            }));
                            if (!isEditingFinancialTotal) {
                              setFinancialTotalTRYInput(
                                formatNumberForDisplay(total),
                              );
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                          placeholder="1.00"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={financialTotalTRYInput}
                          onFocus={() => setIsEditingFinancialTotal(true)}
                          onChange={(e) => {
                            const input = e.target.value;
                            setFinancialTotalTRYInput(input);
                            const clean = input.replace(/[^\d,]/g, "");
                            const tl = parseFloat(clean.replace(",", ".")) || 0;
                            const rate =
                              tempFinancialServiceItem?.exchangeRate || 1;
                            const newAmount = rate > 0 ? tl / rate : 0;
                            setTempFinancialServiceItem((prev) => ({
                              ...prev,
                              totalTRY: tl,
                              amount: newAmount,
                            }));
                            setFinancialAmountInput(
                              formatNumberForDisplay(newAmount),
                            );
                          }}
                          onBlur={(e) => {
                            setIsEditingFinancialTotal(false);
                            const value =
                              parseFloat(
                                formatNumberForInput(e.target.value),
                              ) || 0;
                            setFinancialTotalTRYInput(
                              formatNumberForDisplay(value),
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialSave();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFinancialCancel();
                            }
                          }}
                          className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                          placeholder="0,00"
                          inputMode="decimal"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={handleFinancialSave}
                            className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                            title="Kaydet"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={handleFinancialCancel}
                            className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                            title="İptal"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  </tr>
                )}

              {filteredFinancialServices.length === 0 &&
              editingFinancialServiceIndex === null ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-2 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Henüz finansal servis eklenmemiş
                  </td>
                </tr>
              ) : (
                filteredFinancialServices.map((item, index) => {
                  // Orijinal index'i bul (filteredFinancialServices'deki index değil, financials'deki index)
                  const originalIndex = financialServices.findIndex(
                    (os) => os.id === item.id,
                  );
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {editingFinancialServiceIndex === originalIndex ? (
                        <>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={tempFinancialServiceItem?.date || ""}
                              onChange={(e) =>
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          <td className="px-2 py-2 relative">
                            <input
                              ref={setFinancialSupplierInputRef}
                              type="text"
                              value={hotelSupplierSearch}
                              onChange={(e) => {
                                const value = e.target.value;
                                setHotelSupplierSearch(value);
                                setShowHotelSupplierDropdown(true);
                                setTimeout(() => updateDropdownPosition(), 0);
                                setSelectedSupplierIndex(-1);
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  supplier: value,
                                  hotel: value,
                                }));
                              }}
                              onClick={() => {
                                setShowHotelSupplierDropdown(true);
                                setTimeout(() => updateDropdownPosition(), 0);
                                setSelectedSupplierIndex(-1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Eğer dropdown açıksa ve bir öğe seçiliyse, önce onu seç
                                  if (
                                    showHotelSupplierDropdown &&
                                    selectedSupplierIndex >= 0 &&
                                    selectedSupplierIndex <
                                      filteredHotelSuppliers.length
                                  ) {
                                    const supplier =
                                      filteredHotelSuppliers[
                                        selectedSupplierIndex
                                      ];
                                    handleFinancialSupplierSelect(supplier);
                                  } else {
                                    // Input'un mevcut değerini doğrudan al ve tempFinancialServiceItem'a ekle
                                    const currentInputValue = (
                                      e.target as HTMLInputElement
                                    ).value;
                                    const updatedTempFinancialServiceItem = {
                                      ...tempFinancialServiceItem,
                                      supplier:
                                        currentInputValue ||
                                        tempFinancialServiceItem?.supplier ||
                                        "",
                                      hotel:
                                        currentInputValue ||
                                        tempFinancialServiceItem?.hotel ||
                                        "",
                                    };
                                    setTempFinancialServiceItem(
                                      updatedTempFinancialServiceItem,
                                    );
                                    handleFinancialSave();
                                  }
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFinancialCancel();
                                } else {
                                  handleFinancialKeyDown(e);
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="Otel/Tedarikçi ara..."
                            />
                          </td>
                          <td className="px-2 py-2 hidden">
                            <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                              FİNANSAL
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={
                                tempFinancialServiceItem?.subCategory || ""
                              }
                              onChange={(e) =>
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  subCategory: e.target.value,
                                }))
                              }
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Alt Kategori Seçin</option>
                              {financialSubCategories.map((sub) => (
                                <option key={sub.id} value={sub.name}>
                                  {sub.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={
                                tempFinancialServiceItem?.description || ""
                              }
                              onChange={(e) =>
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="Açıklama"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={financialAmountInput}
                              onChange={(e) => {
                                const input = e.target.value;
                                setFinancialAmountInput(input);
                              }}
                              onBlur={(e) => {
                                const input = e.target.value;
                                const clean = input.replace(/[^\d,]/g, "");
                                const amount = parseTurkishNumber(clean);
                                const rate = parseTurkishNumber(
                                  tempFinancialServiceItem?.exchangeRate || "1",
                                );
                                // Tutar x Kur = Toplam TL
                                const total = amount * rate;
                                if (!isEditingFinancialTotal) {
                                  setFinancialTotalTRYInput(
                                    formatNumberForDisplay(total),
                                  );
                                }
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  amount,
                                  totalTRY: total,
                                  exchangeRate: rate,
                                  fx: rate,
                                }));
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                              placeholder="0,00"
                              inputMode="decimal"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={
                                tempFinancialServiceItem?.currency || "TRY"
                              }
                              onChange={(e) => {
                                const newCur = e.target.value;
                                const amount = parseTurkishNumber(
                                  financialAmountInput || "0",
                                );
                                const rate = parseTurkishNumber(
                                  tempFinancialServiceItem?.exchangeRate || "1",
                                );
                                // Toplam TL = Tutar * Kur (her zaman)
                                const total = amount * rate;
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  currency: newCur,
                                  totalTRY: total,
                                }));
                                if (!isEditingFinancialTotal) {
                                  setFinancialTotalTRYInput(
                                    formatNumberForDisplay(total),
                                  );
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                            >
                              <option value="TRY">TRY</option>
                              <option value="EUR">EUR</option>
                              <option value="USD">USD</option>
                              <option value="GBP">GBP</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={
                                tempFinancialServiceItem?.exchangeRate || ""
                              }
                              onChange={(e) => {
                                const input = e.target.value;
                                // exchangeRate is managed in tempFinancialServiceItem(input);
                                const rate = parseTurkishNumber(input || "1");
                                const amountInput = parseTurkishNumber(
                                  financialAmountInput || "0",
                                );

                                // Kur değiştiğinde: Toplam TL = Tutar x Kur (Tutar sabit kalır)
                                const total = amountInput * rate;
                                if (!isEditingFinancialTotal) {
                                  setFinancialTotalTRYInput(
                                    formatNumberForDisplay(total),
                                  );
                                }
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  exchangeRate: rate,
                                  fx: rate,
                                  amount: amountInput,
                                  totalTRY: total,
                                }));
                              }}
                              onBlur={(e) => {
                                const value =
                                  parseFloat(
                                    formatNumberForInput(e.target.value),
                                  ) || 1;
                                // exchangeRate is managed in tempFinancialServiceItem(formatNumberForDisplay(value));
                                // Blur'da da hesaplamayı yap: Toplam TL = Tutar x Kur
                                const rate = value;
                                const amountInput = parseTurkishNumber(
                                  financialAmountInput || "0",
                                );
                                const total = amountInput * rate;
                                if (!isEditingFinancialTotal) {
                                  setFinancialTotalTRYInput(
                                    formatNumberForDisplay(total),
                                  );
                                }
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  exchangeRate: rate,
                                  fx: rate,
                                  amount: amountInput,
                                  totalTRY: total,
                                }));
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark-border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                              placeholder="1,00"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={financialTotalTRYInput}
                              onFocus={() => setIsEditingFinancialTotal(true)}
                              onChange={(e) => {
                                const input = e.target.value;
                                setFinancialTotalTRYInput(input);
                              }}
                              onBlur={(e) => {
                                setIsEditingFinancialTotal(false);
                                const input = e.target.value;
                                const clean = input.replace(/[^\d,]/g, "");
                                const tl = parseTurkishNumber(clean);
                                const rate = parseTurkishNumber(
                                  tempFinancialServiceItem?.exchangeRate || "1",
                                );
                                // Tutar = Toplam TL / Kur
                                const newAmount = rate > 0 ? tl / rate : 0;
                                setFinancialAmountInput(
                                  formatNumberForDisplay(newAmount),
                                );
                                setTempFinancialServiceItem((prev) => ({
                                  ...prev,
                                  totalTRY: tl,
                                  amount: newAmount,
                                  exchangeRate: rate,
                                  fx: rate,
                                }));
                                setFinancialTotalTRYInput(
                                  formatNumberForDisplay(tl),
                                );
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                              placeholder="0,00"
                              inputMode="decimal"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button
                                onClick={handleFinancialSave}
                                className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                                title="Kaydet"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={handleFinancialCancel}
                                className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                                title="İptal"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {formatDateForDisplay(item.date)}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {item.supplier || item.hotel || "-"}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white hidden">
                            FİNANSAL
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {item.subCategory || item.sub_category || "-"}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {item.description || "-"}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {formatNumberForDisplay(item.amount || 0)}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {item.currency || "TRY"}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                            {formatNumberForDisplay(
                              item.exchange_rate ||
                                item.fx ||
                                item.exchangeRate ||
                                1,
                            )}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                            {formatNumberForDisplay(
                              item.totalTRY || item.total_try || 0,
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleFinancialEdit(originalIndex)
                                }
                                className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30"
                                title="Düzenle"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleFinancialDelete(originalIndex)
                                }
                                className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                title="Sil"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Genel Toplam - Diğer Servisler */}
      {financialServices.length > 0 && (
        <div className="bg-blue-500 dark:bg-blue-700 rounded-md p-3">
          <div className="grid grid-cols-12 gap-2 text-white text-sm responsive-filter-grid">
            <div className="col-span-2 font-bold">GENEL TOPLAM</div>
            <div className="col-span-6 text-right font-bold">
              {Object.entries(financialTotals)
                .map(
                  ([cur, val]: any) =>
                    `${formatNumber(Number(val.toplamMaliyet || 0))} ${cur}`,
                )
                .join(" + ")}
            </div>
            <div className="col-span-3 text-right font-bold">
              {formatNumber(
                financialServices.reduce(
                  (sum: number, item: any) =>
                    sum +
                    (parseFloat(item.totalTRY || item.total_try || 0) || 0),
                  0,
                ),
              )}{" "}
              TL
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
      )}

      {/* Portal ile render edilen dropdown - Finansal */}
      {showHotelSupplierDropdown &&
        createPortal(
          <div
            className="hotel-supplier-dropdown financial-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-60 overflow-y-auto"
            style={
              dropdownPosition
                ? {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  }
                : { display: "none" }
            }
          >
            {allSuppliers
              .filter((s) =>
                (s.displayName || s.name || "")
                  .toLowerCase()
                  .includes(hotelSupplierSearch?.toLowerCase() || ""),
              )
              .map((supplier, index) => (
                <div
                  key={`financial-supplier-${supplier.id}-${supplier.type}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFinancialSupplierSelect(supplier);
                  }}
                  onMouseEnter={() => setSelectedSupplierIndex(index)}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 ${
                    index === selectedSupplierIndex
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="text-xs font-medium">
                    {supplier.displayName || supplier.name}
                  </div>
                  {supplier.title && (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {supplier.title}
                    </div>
                  )}
                </div>
              ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
