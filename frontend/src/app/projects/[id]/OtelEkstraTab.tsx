"use client";

import React from "react";
import { createPortal } from "react-dom";

interface OtelEkstraTabProps {
  hotelExtras: any[];
  setHotelExtras: (extras: any[]) => void;
  editingHotelExtraIndex: number | null;
  setEditingHotelExtraIndex: (index: number | null) => void;
  tempHotelExtraItem: any;
  setTempHotelExtraItem: (item: any) => void;
  hotelExtraSearch: string;
  setHotelExtraSearch: (search: string) => void;
  hotelExtraSortField: string;
  hotelExtraSortDirection: "asc" | "desc";
  handleSort: (field: string) => void;
  handleHotelExtraAdd: () => void;
  handleHotelExtraEdit: (id: string) => void;
  handleHotelExtraSave: () => void;
  handleHotelExtraCancel: () => void;
  handleHotelExtraDelete: (id: string) => void;
  clearHotelExtraSearch: () => void;
  handleHotelExtraClear: () => void;
  handleHotelExtraExport: () => void;
  filteredHotelExtras: any[];
  formatNumberForDisplay: (value: number | string) => string;
  formatDateForDisplay: (dateValue: any) => string;
  formatNumberForInput: (value: number | string) => string;
  formatTRY: (value: number | string) => string;
  formatNumber: (value: number | string) => string;
  parseTurkishNumber: (value: string) => number;
  hotelExtraTotals: any;
  hotelSupplierSearch: string;
  setHotelSupplierSearch: (search: string) => void;
  showHotelSupplierDropdown: boolean;
  setShowHotelSupplierDropdown: (show: boolean) => void;
  selectedSupplierIndex: number;
  setSelectedSupplierIndex: (index: number) => void;
  filteredHotelSuppliers: any[];
  hotelExtraAmountInput: string;
  setHotelExtraAmountInput: (value: string) => void;
  hotelExtraTotalTRYInput: string;
  setHotelExtraTotalTRYInput: (value: string) => void;
  hotelExtraSubCategories: any[];
  hotelExtraMainCategories: any[];
  isNewHotelExtraItem: boolean;
  setIsNewHotelExtraItem: (isNew: boolean) => void;
  updateDropdownPosition: () => void;
  dropdownPosition: { top: number; left: number; width: number } | null;
  hotelSupplierInputRef: React.RefObject<HTMLInputElement>;
  allSuppliers: any[];
}

export default function OtelEkstraTab({
  hotelExtras,
  setHotelExtras,
  editingHotelExtraIndex,
  setEditingHotelExtraIndex,
  tempHotelExtraItem,
  setTempHotelExtraItem,
  hotelExtraSearch,
  setHotelExtraSearch,
  hotelExtraSortField,
  hotelExtraSortDirection,
  handleSort,
  handleHotelExtraAdd,
  handleHotelExtraEdit,
  handleHotelExtraSave,
  handleHotelExtraCancel,
  handleHotelExtraDelete,
  clearHotelExtraSearch,
  handleHotelExtraClear,
  handleHotelExtraExport,
  filteredHotelExtras,
  formatNumberForDisplay,
  formatDateForDisplay,
  formatNumberForInput,
  formatTRY,
  formatNumber,
  parseTurkishNumber,
  hotelExtraTotals,
  hotelSupplierSearch,
  setHotelSupplierSearch,
  showHotelSupplierDropdown,
  setShowHotelSupplierDropdown,
  selectedSupplierIndex,
  setSelectedSupplierIndex,
  filteredHotelSuppliers,
  hotelExtraAmountInput,
  setHotelExtraAmountInput,
  hotelExtraTotalTRYInput,
  setHotelExtraTotalTRYInput,
  hotelExtraSubCategories,
  hotelExtraMainCategories,
  isNewHotelExtraItem,
  setIsNewHotelExtraItem,
  updateDropdownPosition,
  dropdownPosition,
  hotelSupplierInputRef,
  allSuppliers,
}: OtelEkstraTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="Otel Ekstra ara..."
            value={hotelExtraSearch}
            onChange={(e) => setHotelExtraSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHotelExtraAdd}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 transition-colors"
          >
            Yeni Ekle
          </button>
          <button
            onClick={handleHotelExtraExport}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Excel Dışa Aktar
          </button>
          <button
            onClick={handleHotelExtraClear}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Otel Ekstra Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("date")}
                >
                  TARİH{" "}
                  {hotelExtraSortField === "date" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("hotel")}
                >
                  OTEL/TEDARIKÇİ{" "}
                  {hotelExtraSortField === "hotel" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white hidden">
                  ANA KATEGORİ
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("subCategoryName")}
                >
                  ALT KATEGORİ{" "}
                  {hotelExtraSortField === "subCategoryName" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("roomNumber")}
                >
                  ODA NO{" "}
                  {hotelExtraSortField === "roomNumber" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("guestName")}
                >
                  MİSAFİR ADI{" "}
                  {hotelExtraSortField === "guestName" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("description")}
                >
                  AÇIKLAMA{" "}
                  {hotelExtraSortField === "description" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("amount")}
                >
                  TUTAR{" "}
                  {hotelExtraSortField === "amount" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("currency")}
                >
                  DÖVİZ{" "}
                  {hotelExtraSortField === "currency" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("fx")}
                >
                  KUR{" "}
                  {hotelExtraSortField === "fx" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleSort("totalTRY")}
                >
                  TOPLAM TL{" "}
                  {hotelExtraSortField === "totalTRY" &&
                    (hotelExtraSortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">
                  İŞLEMLER
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Yeni ekleme modu */}
              {editingHotelExtraIndex !== null && isNewHotelExtraItem && (
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {/* Edit Mode */}
                  <>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={tempHotelExtraItem?.date || ""}
                        onChange={(e) =>
                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2 relative">
                      <input
                        ref={hotelSupplierInputRef}
                        type="text"
                        value={hotelSupplierSearch}
                        onChange={(e) => {
                          setHotelSupplierSearch(e.target.value);
                          setShowHotelSupplierDropdown(true);
                          updateDropdownPosition();
                          setSelectedSupplierIndex(-1);
                        }}
                        onClick={() => {
                          setShowHotelSupplierDropdown(true);
                          updateDropdownPosition();
                          setSelectedSupplierIndex(-1);
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        placeholder="Otel/Tedarikçi ara..."
                      />
                    </td>
                    <td className="px-2 py-2 hidden">
                      <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                        OTEL | DİĞER HİZMETLER
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={tempHotelExtraItem?.subCategory || ""}
                        onChange={(e) => {
                          console.log(
                            "🔍 Alt kategori değişti:",
                            e.target.value,
                          );
                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            subCategory: e.target.value,
                            sub_category: e.target.value,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Alt Kategori Seçin</option>
                        {hotelExtraSubCategories.map((subCategory) => (
                          <option key={subCategory.id} value={subCategory.name}>
                            {subCategory.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={tempHotelExtraItem?.roomNumber || ""}
                        onChange={(e) => {
                          console.log("🔍 Oda no değişti:", e.target.value);
                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            roomNumber: e.target.value,
                            room_number: e.target.value,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        placeholder="Oda No"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={tempHotelExtraItem?.guestName || ""}
                        onChange={(e) => {
                          console.log(
                            "🔍 Misafir adı değişti:",
                            e.target.value,
                          );
                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            guestName: e.target.value,
                            guest_name: e.target.value,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        placeholder="Misafir Adı"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={tempHotelExtraItem?.description || ""}
                        onChange={(e) =>
                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        placeholder="Açıklama"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={hotelExtraAmountInput || ""}
                        onChange={(e) => {
                          // Serbest giriş - raw değeri kaydet
                          const inputValue = e.target.value;
                          setHotelExtraAmountInput(inputValue);

                          // Aynı zamanda amount'u da güncelle
                          // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                          const cleanValue = inputValue.replace(/[^\d.,]/g, "");
                          const numericValue = parseTurkishNumber(cleanValue);

                          // Satış tabındaki gibi anlık hesaplama yap
                          const currency =
                            tempHotelExtraItem?.currency || "TRY";
                          const rate = tempHotelExtraItem?.exchangeRate || 1;
                          const totalTRY =
                            currency === "TRY"
                              ? numericValue
                              : numericValue * rate;

                          console.log("🔍 Debug - Tutar hesaplama:");
                          console.log("  - numericValue:", numericValue);
                          console.log("  - currency:", currency);
                          console.log("  - rate:", rate);
                          console.log("  - totalTRY:", totalTRY);

                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            amount: numericValue,
                            totalTRY: totalTRY,
                          }));

                          // Toplam TL input'unu güncelle (formatlanmış)
                          setHotelExtraTotalTRYInput(
                            formatNumberForDisplay(totalTRY),
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        onFocus={(e) => {
                          // Focus olduğunda tüm metni seç
                          e.target.select();
                        }}
                        onBlur={(e) => {
                          // Blur olduğunda formatı düzelt ve display değerini güncelle
                          // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                          const cleanValue = e.target.value.replace(
                            /[^\d.,]/g,
                            "",
                          );
                          const value = parseTurkishNumber(cleanValue);
                          const currency =
                            tempHotelExtraItem?.currency || "TRY";
                          const rate = tempHotelExtraItem?.exchangeRate || 1;
                          const totalTRY =
                            currency === "TRY" ? value : value * rate;

                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            amount: value,
                            totalTRY: totalTRY,
                          }));
                          setHotelExtraAmountInput(
                            formatNumberForDisplay(value),
                          );
                          setHotelExtraTotalTRYInput(
                            formatNumberForDisplay(totalTRY),
                          );
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={tempHotelExtraItem?.currency || "TRY"}
                        onChange={(e) => {
                          const newCurrency = e.target.value;
                          const amount = tempHotelExtraItem?.amount || 0;

                          // Döviz değiştiğinde exchange rate'i ayarla
                          let newRate = tempHotelExtraItem?.exchangeRate || 1;
                          if (newCurrency === "TRY") {
                            newRate = 1;
                          } else if (
                            tempHotelExtraItem?.currency === "TRY" &&
                            newCurrency !== "TRY"
                          ) {
                            // TRY'den başka bir dövize geçiliyorsa, rate'i 1 yap (kullanıcı girecek)
                            newRate = 1;
                          }
                          // Aksi halde mevcut rate'i koru

                          // TRY dövizi seçildiyse çarpma, diğerleri için çarp
                          const totalTRY =
                            newCurrency === "TRY" ? amount : amount * newRate;

                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            currency: newCurrency,
                            exchangeRate: newRate,
                            totalTRY: totalTRY,
                          }));
                          // Toplam TL input'unu güncelle (formatlanmış)
                          setHotelExtraTotalTRYInput(
                            formatNumberForDisplay(totalTRY),
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
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
                        value={tempHotelExtraItem?.exchangeRate || ""}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value) || 0;
                          const amount = tempHotelExtraItem?.amount || 0;
                          const currency =
                            tempHotelExtraItem?.currency || "TRY";

                          // TRY dövizi seçildiyse çarpma, diğerleri için çarp
                          const totalTRY =
                            currency === "TRY" ? amount : amount * rate;

                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            exchangeRate: rate, // Kullanıcının girdiği değeri kaydet
                            totalTRY: totalTRY,
                          }));
                          // TOPLAM TL alanını da güncelle
                          setHotelExtraTotalTRYInput(
                            formatNumberForDisplay(totalTRY),
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                        placeholder="1.00"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={hotelExtraTotalTRYInput}
                        onChange={(e) => {
                          setHotelExtraTotalTRYInput(e.target.value);
                          // Anlık hesaplama
                          // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                          const inputValue = e.target.value;
                          const cleanValue = inputValue.replace(/[^\d.,]/g, "");
                          const numericValue = parseTurkishNumber(cleanValue);
                          const currency =
                            tempHotelExtraItem?.currency || "TRY";
                          const rate = tempHotelExtraItem?.exchangeRate || 1;

                          // Toplam TL'den tutarı hesapla: TRY ise direkt numericValue, değilse numericValue / rate
                          const newAmount =
                            currency === "TRY"
                              ? numericValue
                              : rate > 0
                                ? numericValue / rate
                                : 0;

                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            totalTRY: numericValue,
                            amount: newAmount,
                          }));
                          // TUTAR alanını da güncelle
                          setHotelExtraAmountInput(
                            formatNumberForDisplay(newAmount),
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleHotelExtraSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            handleHotelExtraCancel();
                          }
                        }}
                        onFocus={(e) => {
                          e.target.select();
                        }}
                        onBlur={(e) => {
                          // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                          const cleanValue = e.target.value.replace(
                            /[^\d.,]/g,
                            "",
                          );
                          const value = parseTurkishNumber(cleanValue);
                          const currency =
                            tempHotelExtraItem?.currency || "TRY";
                          const rate = tempHotelExtraItem?.exchangeRate || 1;

                          // Toplam TL'den tutarı hesapla: TRY ise direkt value, değilse value / rate
                          const newAmount =
                            currency === "TRY"
                              ? value
                              : rate > 0
                                ? value / rate
                                : 0;

                          setTempHotelExtraItem((prev) => ({
                            ...prev,
                            totalTRY: value,
                            amount: newAmount,
                          }));
                          setHotelExtraAmountInput(
                            formatNumberForDisplay(newAmount),
                          );
                          setHotelExtraTotalTRYInput(
                            formatNumberForDisplay(value),
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
                          onClick={handleHotelExtraSave}
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
                          onClick={handleHotelExtraCancel}
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

              {filteredHotelExtras.length === 0 &&
              editingHotelExtraIndex === null ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-2 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Henüz otel ekstra hizmeti eklenmemiş
                  </td>
                </tr>
              ) : (
                filteredHotelExtras.map((extra, index) => {
                  const originalIndex = hotelExtras.findIndex(
                    (e: any) => e.id === extra.id,
                  );
                  return (
                    <tr
                      key={extra.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {editingHotelExtraIndex === originalIndex &&
                      !isNewHotelExtraItem ? (
                        // Edit Mode
                        <>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={tempHotelExtraItem?.date || ""}
                              onChange={(e) =>
                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                            />
                          </td>
                          <td className="px-2 py-2 relative">
                            <input
                              ref={hotelSupplierInputRef}
                              type="text"
                              value={hotelSupplierSearch}
                              onChange={(e) => {
                                setHotelSupplierSearch(e.target.value);
                                setShowHotelSupplierDropdown(true);
                                updateDropdownPosition();
                                setSelectedSupplierIndex(-1);
                              }}
                              onFocus={() => {
                                setShowHotelSupplierDropdown(true);
                                updateDropdownPosition();
                                setSelectedSupplierIndex(-1);
                              }}
                              onClick={() => {
                                setShowHotelSupplierDropdown(true);
                                updateDropdownPosition();
                                setSelectedSupplierIndex(-1);
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="Otel/Tedarikçi ara..."
                            />
                          </td>
                          <td className="px-2 py-2 hidden">
                            <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                              OTEL | DİĞER HİZMETLER
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={tempHotelExtraItem?.subCategory || ""}
                              onChange={(e) => {
                                console.log(
                                  "🔍 Alt kategori değişti (kopya):",
                                  e.target.value,
                                );
                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  subCategory: e.target.value,
                                  sub_category: e.target.value,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                            >
                              <option value="">Alt Kategori Seçin</option>
                              {hotelExtraSubCategories.map((subCategory) => (
                                <option
                                  key={subCategory.id}
                                  value={subCategory.name}
                                >
                                  {subCategory.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={tempHotelExtraItem?.roomNumber || ""}
                              onChange={(e) => {
                                console.log(
                                  "🔍 Oda no değişti (kopya):",
                                  e.target.value,
                                );
                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  roomNumber: e.target.value,
                                  room_number: e.target.value,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="101"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={tempHotelExtraItem?.guestName || ""}
                              onChange={(e) => {
                                console.log(
                                  "🔍 Misafir adı değişti (kopya):",
                                  e.target.value,
                                );
                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  guestName: e.target.value,
                                  guest_name: e.target.value,
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="Ad Soyad"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={tempHotelExtraItem?.description || ""}
                              onChange={(e) =>
                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="Açıklama"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={hotelExtraAmountInput || ""}
                              onChange={(e) => {
                                // Serbest giriş - raw değeri kaydet
                                const inputValue = e.target.value;
                                setHotelExtraAmountInput(inputValue);

                                // Aynı zamanda amount'u da güncelle
                                // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                                const cleanValue = inputValue.replace(
                                  /[^\d.,]/g,
                                  "",
                                );
                                const numericValue =
                                  parseTurkishNumber(cleanValue);

                                // Satış tabındaki gibi anlık hesaplama yap
                                const currency =
                                  tempHotelExtraItem?.currency || "TRY";
                                const rate =
                                  tempHotelExtraItem?.exchangeRate || 1;
                                const totalTRY =
                                  currency === "TRY"
                                    ? numericValue
                                    : numericValue * rate;

                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  amount: numericValue,
                                  totalTRY: totalTRY,
                                }));

                                // Toplam TL input'unu güncelle
                                setHotelExtraTotalTRYInput(totalTRY.toString());
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              onFocus={(e) => {
                                // Focus olduğunda tüm metni seç
                                e.target.select();
                              }}
                              onBlur={(e) => {
                                // Blur olduğunda formatı düzelt ve display değerini güncelle
                                // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                                const cleanValue = e.target.value.replace(
                                  /[^\d.,]/g,
                                  "",
                                );
                                const value = parseTurkishNumber(cleanValue);
                                const currency =
                                  tempHotelExtraItem?.currency || "TRY";
                                const rate =
                                  tempHotelExtraItem?.exchangeRate || 1;
                                const totalTRY =
                                  currency === "TRY" ? value : value * rate;

                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  amount: value,
                                  totalTRY: totalTRY,
                                }));
                                setHotelExtraAmountInput(
                                  formatNumberForDisplay(value),
                                );
                                setHotelExtraTotalTRYInput(
                                  formatNumberForDisplay(totalTRY),
                                );
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                              placeholder="0,00"
                              inputMode="decimal"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={tempHotelExtraItem?.currency || "TRY"}
                              onChange={(e) => {
                                const newCurrency = e.target.value;
                                const amount = tempHotelExtraItem?.amount || 0;

                                // Döviz değiştiğinde exchange rate'i sıfırla (kullanıcı girecek)
                                let newRate = 1;
                                if (newCurrency === "TRY") newRate = 1;

                                // TRY dövizi seçildiyse çarpma, diğerleri için çarp
                                const totalTRY =
                                  newCurrency === "TRY"
                                    ? amount
                                    : amount * newRate;

                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  currency: newCurrency,
                                  exchangeRate: newRate,
                                  totalTRY: totalTRY,
                                }));
                                // Toplam TL input'unu güncelle
                                setHotelExtraTotalTRYInput(totalTRY.toString());
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
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
                              value={tempHotelExtraItem?.exchangeRate || ""}
                              onChange={(e) => {
                                const rate = parseFloat(e.target.value) || 0;
                                const amount = tempHotelExtraItem?.amount || 0;
                                const currency =
                                  tempHotelExtraItem?.currency || "TRY";

                                // TRY dövizi seçildiyse çarpma, diğerleri için çarp
                                const totalTRY =
                                  currency === "TRY" ? amount : amount * rate;

                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  exchangeRate: rate, // Kullanıcının girdiği değeri kaydet
                                  totalTRY: totalTRY,
                                }));
                                // TOPLAM TL alanını da güncelle
                                setHotelExtraTotalTRYInput(
                                  formatNumberForDisplay(totalTRY),
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                              placeholder="1.00"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={hotelExtraTotalTRYInput}
                              onChange={(e) => {
                                setHotelExtraTotalTRYInput(e.target.value);
                                // Anlık hesaplama
                                const inputValue = e.target.value;
                                // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                                const cleanValue = inputValue.replace(
                                  /[^\d.,]/g,
                                  "",
                                );
                                const numericValue =
                                  parseTurkishNumber(cleanValue);
                                const currency =
                                  tempHotelExtraItem?.currency || "TRY";
                                const rate =
                                  tempHotelExtraItem?.exchangeRate || 1;
                                const newAmount =
                                  rate > 0 ? numericValue / rate : 0;

                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  totalTRY: numericValue,
                                  amount: newAmount,
                                }));
                                // TUTAR alanını da güncelle
                                setHotelExtraAmountInput(
                                  formatNumberForDisplay(newAmount),
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleHotelExtraSave();
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  handleHotelExtraCancel();
                                }
                              }}
                              onFocus={(e) => {
                                e.target.select();
                              }}
                              onBlur={(e) => {
                                // Türkçe format: binlik ayırıcı . (nokta), kuruş ayırıcı , (virgül)
                                const cleanValue = e.target.value.replace(
                                  /[^\d.,]/g,
                                  "",
                                );
                                const value = parseTurkishNumber(cleanValue);
                                const currency =
                                  tempHotelExtraItem?.currency || "TRY";
                                const rate =
                                  tempHotelExtraItem?.exchangeRate || 1;

                                // Toplam TL'den tutarı hesapla: TRY ise direkt value, değilse value / rate
                                const newAmount =
                                  currency === "TRY"
                                    ? value
                                    : rate > 0
                                      ? value / rate
                                      : 0;

                                setTempHotelExtraItem((prev) => ({
                                  ...prev,
                                  totalTRY: value,
                                  amount: newAmount,
                                }));
                                setHotelExtraAmountInput(
                                  formatNumberForDisplay(newAmount),
                                );
                                setHotelExtraTotalTRYInput(
                                  formatNumberForDisplay(value),
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
                                onClick={handleHotelExtraSave}
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
                                onClick={handleHotelExtraCancel}
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
                        // Display Mode
                        <>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {formatDateForDisplay(extra.date)}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {extra.hotel}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white hidden">
                            {hotelExtraMainCategories.find(
                              (cat) => cat.id === extra.mainCategory,
                            )?.name || ""}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {extra.subCategory}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {extra.roomNumber}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {extra.guestName}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {extra.description}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {formatNumberForDisplay(extra.amount)}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {extra.currency}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                            {formatTRY(
                              extra.exchange_rate || extra.exchangeRate || 1,
                            )}
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                            {formatTRY(
                              extra.total_try || extra.totalTRY || extra.amount,
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleHotelExtraEdit(extra.id)}
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
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Bu satırı silmek istediğinizden emin misiniz?",
                                    )
                                  ) {
                                    handleHotelExtraDelete(extra.id);
                                  }
                                }}
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

      {/* Genel Toplam */}
      {hotelExtras.length > 0 && (
        <div className="bg-blue-500 dark:bg-blue-700 rounded-md p-3">
          <div className="grid grid-cols-12 gap-2 text-white text-sm responsive-filter-grid">
            <div className="col-span-1 font-bold">GENEL TOPLAM</div>
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            <div className="col-span-1 text-right font-bold">
              {Object.entries(hotelExtraTotals)
                .map(
                  ([cur, val]: any) =>
                    `${formatNumber(Number(val.toplamMaliyet || 0))} ${cur}`,
                )
                .join(" + ")}
            </div>
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            <div className="col-span-1 text-right font-bold">
              {formatNumber(
                hotelExtras.reduce(
                  (sum: number, item: any) =>
                    sum +
                    (parseFloat(item.total_try || item.totalTRY || 0) || 0),
                  0,
                ),
              )}{" "}
              TL
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
      )}

      {/* Portal ile render edilen dropdown */}
      {showHotelSupplierDropdown &&
        dropdownPosition &&
        createPortal(
          <div
            className="hotel-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-40 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {allSuppliers.filter((s) =>
              s.displayName
                ?.toLowerCase()
                .includes(hotelSupplierSearch?.toLowerCase() || ""),
            ).length > 0 ? (
              allSuppliers
                .filter((s) =>
                  s.displayName
                    ?.toLowerCase()
                    .includes(hotelSupplierSearch?.toLowerCase() || ""),
                )
                .map((supplier, index) => (
                  <div
                    key={`hotel-supplier-${supplier.id}-${supplier.type}-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Supplier seçildi:", supplier);
                      setTempHotelExtraItem((prev) => ({
                        ...prev,
                        hotel: supplier.displayName,
                      }));
                      setHotelSupplierSearch(supplier.displayName);
                      setShowHotelSupplierDropdown(false);
                      setSelectedSupplierIndex(-1);
                    }}
                    className={`px-2 py-1 text-xs cursor-pointer flex items-center justify-between ${
                      index === selectedSupplierIndex
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span>{supplier.displayName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {supplier.type === "hotel" ? "Otel" : "Tedarikçi"}
                    </span>
                  </div>
                ))
            ) : (
              <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                Sonuç bulunamadı
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
