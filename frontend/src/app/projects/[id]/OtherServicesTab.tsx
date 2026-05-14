'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface OtherServicesTabProps {
  otherServices: any[];
  setOtherServices: (services: any[]) => void;
  projectId: string;
  otherServiceSearch: string;
  setOtherServiceSearch: (search: string) => void;
  editingOtherServiceIndex: number | null;
  setEditingOtherServiceIndex: (index: number | null) => void;
  tempOtherServiceItem: any;
  setTempOtherServiceItem: (item: any) => void;
  otherServiceAmountInput: string;
  setOtherServiceAmountInput: (value: string) => void;
  otherServiceTotalTRYInput: string;
  setOtherServiceTotalTRYInput: (value: string) => void;
  otherServiceFxInput: string;
  setOtherServiceFxInput: (value: string) => void;
  otherServiceSupplierSearch: string;
  setOtherServiceSupplierSearch: (value: string) => void;
  showOtherServiceSupplierDropdown: boolean;
  setShowOtherServiceSupplierDropdown: (show: boolean) => void;
  selectedOtherServiceSupplierIndex: number;
  setSelectedOtherServiceSupplierIndex: (index: number) => void;
  otherSubCategories: any[];
  allSuppliers: any[];
  dropdownPosition: { top: number; left: number; width: number } | null;
  updateDropdownPosition: () => void;
  setOtherServiceSupplierInputRef: (el: HTMLInputElement | null) => void;
  handleOtherServiceAdd: () => void;
  handleOtherServiceSave: () => void;
  handleOtherServiceCancel: () => void;
  handleOtherServiceEdit: (index: number) => void;
  handleOtherServiceDelete: (index: number) => void;
  clearOtherServiceSearch: () => void;
  handleOtherServiceClear: () => void;
  handleOtherServiceExport: () => void;
  handleOtherServiceSupplierSelect: (supplier: any) => void;
  handleOtherServiceKeyDown: (e: React.KeyboardEvent) => void;
  parseTurkishNumber: (value: string) => number;
  formatNumberForDisplay: (value: number) => string;
  formatExchangeRateForDisplay: (value: number | string) => string;
  formatNumberForInput: (value: string) => string;
  formatNumber: (value: number) => string;
  formatTRY: (value: number) => string;
  formatDateForDisplay: (date: string) => string;
  getCategoryName: (id: string) => string;
  otherServicesTotals: any;
}

export default function OtherServicesTab({
  otherServices,
  setOtherServices,
  projectId,
  otherServiceSearch,
  setOtherServiceSearch,
  editingOtherServiceIndex,
  setEditingOtherServiceIndex,
  tempOtherServiceItem,
  setTempOtherServiceItem,
  otherServiceAmountInput,
  setOtherServiceAmountInput,
  otherServiceTotalTRYInput,
  setOtherServiceTotalTRYInput,
  otherServiceFxInput,
  setOtherServiceFxInput,
  otherServiceSupplierSearch,
  setOtherServiceSupplierSearch,
  showOtherServiceSupplierDropdown,
  setShowOtherServiceSupplierDropdown,
  selectedOtherServiceSupplierIndex,
  setSelectedOtherServiceSupplierIndex,
  otherSubCategories,
  allSuppliers,
  dropdownPosition,
  updateDropdownPosition,
  setOtherServiceSupplierInputRef,
  handleOtherServiceAdd,
  handleOtherServiceSave,
  handleOtherServiceCancel,
  handleOtherServiceEdit,
  handleOtherServiceDelete,
  clearOtherServiceSearch,
  handleOtherServiceClear,
  handleOtherServiceExport,
  handleOtherServiceSupplierSelect,
  handleOtherServiceKeyDown,
  parseTurkishNumber,
  formatNumberForDisplay,
  formatExchangeRateForDisplay,
  formatNumberForInput,
  formatNumber,
  formatTRY,
  formatDateForDisplay,
  getCategoryName,
  otherServicesTotals,
}: OtherServicesTabProps) {
  // Filtrelenmiş tedarikçiler
  const filteredOtherServiceSuppliers = useMemo(() => {
    // allSuppliers boşsa, boş array döndür
    if (!allSuppliers || allSuppliers.length === 0) return [];
    
    // Arama yoksa tüm listeyi döndür
    if (!otherServiceSupplierSearch || !otherServiceSupplierSearch.trim()) return allSuppliers;
    
    // Arama varsa filtrele
    return allSuppliers.filter((item: any) =>
      (item.name && item.name.toLowerCase().includes(otherServiceSupplierSearch.toLowerCase())) ||
      (item.title && item.title.toLowerCase().includes(otherServiceSupplierSearch.toLowerCase())) ||
      (item.displayName && item.displayName.toLowerCase().includes(otherServiceSupplierSearch.toLowerCase()))
    );
  }, [allSuppliers, otherServiceSupplierSearch]);

  // Filtrelenmiş diğer servisler
  const filteredOtherServices = useMemo(() => {
    if (!otherServiceSearch) return otherServices;
    const searchLower = otherServiceSearch.toLowerCase();
    return otherServices.filter((item: any) =>
      (item.supplier || item.hotel || '').toLowerCase().includes(searchLower) ||
      (item.subCategory || item.sub_category || '').toLowerCase().includes(searchLower) ||
      (item.description || '').toLowerCase().includes(searchLower) ||
      (item.currency || '').toLowerCase().includes(searchLower)
    );
  }, [otherServices, otherServiceSearch]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="Diğer Servisler ara..."
            value={otherServiceSearch}
            onChange={(e) => setOtherServiceSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOtherServiceAdd}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Yeni Ekle
          </button>
          <button
            onClick={handleOtherServiceExport}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Excel Dışa Aktar
          </button>
          <button
            onClick={handleOtherServiceClear}
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
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TARİH</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">OTEL/TEDARİKÇİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white hidden">ANA KATEGORİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">ALT KATEGORİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">AÇIKLAMA</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TUTAR</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">DÖVİZ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">KUR</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TOPLAM TL</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">İŞLEMLER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {editingOtherServiceIndex !== null && editingOtherServiceIndex === otherServices.length && (
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={tempOtherServiceItem?.date || ''}
                        onChange={(e) => setTempOtherServiceItem(prev => ({ ...prev, date: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2 relative">
                      <input
                        ref={setOtherServiceSupplierInputRef}
                        type="text"
                        value={otherServiceSupplierSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOtherServiceSupplierSearch(value);
                          setShowOtherServiceSupplierDropdown(true);
                          setTimeout(() => updateDropdownPosition(), 0);
                          setSelectedOtherServiceSupplierIndex(-1);
                          // tempOtherServiceItem'ı da güncelle
                          setTempOtherServiceItem(prev => ({ ...prev, supplier: value, hotel: value }));
                        }}
                        onFocus={() => {
                          setShowOtherServiceSupplierDropdown(true);
                          setTimeout(() => updateDropdownPosition(), 0);
                          setSelectedOtherServiceSupplierIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            // Eğer dropdown açıksa ve bir öğe seçiliyse, önce onu seç
                            if (showOtherServiceSupplierDropdown && selectedOtherServiceSupplierIndex >= 0 && selectedOtherServiceSupplierIndex < filteredOtherServiceSuppliers.length) {
                              const supplier = filteredOtherServiceSuppliers[selectedOtherServiceSupplierIndex];
                              handleOtherServiceSupplierSelect(supplier);
                            } else {
                              // Input'un mevcut değerini doğrudan al ve tempOtherServiceItem'a ekle
                              const currentInputValue = (e.target as HTMLInputElement).value;
                              const updatedTempOtherServiceItem = {
                                ...tempOtherServiceItem,
                                supplier: currentInputValue || tempOtherServiceItem?.supplier || '',
                                hotel: currentInputValue || tempOtherServiceItem?.hotel || ''
                              };
                              setTempOtherServiceItem(updatedTempOtherServiceItem);
                              handleOtherServiceSave();
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOtherServiceCancel();
                          } else {
                            handleOtherServiceKeyDown(e);
                          }
                        }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        placeholder="Otel/Tedarikçi ara..."
                      />
                    </td>
                    <td className="px-2 py-2 hidden">
                      <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                        DİĞER SERVİSLER
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={tempOtherServiceItem?.subCategory || ''}
                        onChange={(e) => setTempOtherServiceItem(prev => ({ ...prev, subCategory: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Alt Kategori Seçin</option>
                        {otherSubCategories.map(sub => (
                          <option key={sub.id} value={sub.name}>{sub.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={tempOtherServiceItem?.description || ''}
                        onChange={(e) => setTempOtherServiceItem(prev => ({ ...prev, description: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                        placeholder="Açıklama"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={otherServiceAmountInput}
                        onChange={(e) => {
                          const input = e.target.value;
                          setOtherServiceAmountInput(input);
                        }}
                        onBlur={(e) => {
                          const input = e.target.value;
                          const clean = input.replace(/[^\d,]/g, '');
                          const amount = parseTurkishNumber(clean);
                          const rate = parseTurkishNumber(otherServiceFxInput || '1');
                          // Tutar x Kur = Toplam TL
                          const total = amount * rate;
                          setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                          setTempOtherServiceItem(prev => ({ ...prev, amount, totalTRY: total, exchangeRate: rate, fx: rate }));
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={tempOtherServiceItem?.currency || 'TRY'}
                        onChange={(e) => {
                          const newCur = e.target.value;
                          const amount = parseTurkishNumber(otherServiceAmountInput || '0');
                          const rate = parseTurkishNumber(otherServiceFxInput || '1');
                          // Toplam TL = Tutar * Kur (her zaman)
                          const total = amount * rate;
                          setTempOtherServiceItem(prev => ({ ...prev, currency: newCur, totalTRY: total }));
                          setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
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
                        value={otherServiceFxInput || ''}
                        onChange={(e) => {
                          const input = e.target.value;
                          setOtherServiceFxInput(input);
                          const rate = parseTurkishNumber(input || '1');
                          const amountInput = parseTurkishNumber(otherServiceAmountInput || '0');
                          
                          // Kur değiştiğinde: Toplam TL = Tutar x Kur (Tutar sabit kalır)
                          const total = amountInput * rate;
                          setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                          setTempOtherServiceItem(prev => ({ ...prev, exchangeRate: rate, fx: rate, amount: amountInput, totalTRY: total }));
                        }}
                        onBlur={(e) => {
                          // parseTurkishNumber kullan - kuruşları korur
                          const value = parseTurkishNumber(e.target.value) || 1;
                          setOtherServiceFxInput(formatNumberForDisplay(value));
                          // Blur'da da hesaplamayı yap: Toplam TL = Tutar x Kur
                          const rate = value;
                          const amountInput = parseTurkishNumber(otherServiceAmountInput || '0');
                          const total = amountInput * rate;
                          setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                          setTempOtherServiceItem(prev => ({ ...prev, exchangeRate: rate, fx: rate, amount: amountInput, totalTRY: total }));
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                        placeholder="1,0000"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={otherServiceTotalTRYInput}
                        onChange={(e) => {
                          const input = e.target.value;
                          setOtherServiceTotalTRYInput(input);
                        }}
                        onBlur={(e) => {
                          const input = e.target.value;
                          const clean = input.replace(/[^\d,]/g, '');
                          const tl = parseTurkishNumber(clean);
                          const rate = parseTurkishNumber(otherServiceFxInput || '1');
                          // Tutar = Toplam TL / Kur
                          const newAmount = rate > 0 ? tl / rate : 0;
                          setOtherServiceAmountInput(formatNumberForDisplay(newAmount));
                          setTempOtherServiceItem(prev => ({ ...prev, totalTRY: tl, amount: newAmount, exchangeRate: rate, fx: rate }));
                          setOtherServiceTotalTRYInput(formatNumberForDisplay(tl));
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleOtherServiceSave(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleOtherServiceCancel(); } }}
                        className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOtherServiceSave()} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOtherServiceSave();
                            }
                          }}
                          className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" 
                          title="Kaydet"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button onClick={handleOtherServiceCancel} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>
                  </>
                </tr>
              )}

              {filteredOtherServices.length === 0 && editingOtherServiceIndex === null ? (
                <tr>
                  <td colSpan={10} className="px-2 py-8 text-center text-gray-500 dark:text-gray-400">Henüz diğer servis eklenmemiş</td>
                </tr>
              ) : (
                filteredOtherServices
                  .map((item, index) => {
                    // Orijinal index'i bul (filteredOtherServices'deki index değil, otherServices'deki index)
                    const originalIndex = otherServices.findIndex(os => os.id === item.id);
                    return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {editingOtherServiceIndex === originalIndex ? (
                        <>
                          <td className="px-2 py-2">
                            <input type="date" value={tempOtherServiceItem?.date || ''} onChange={(e) => setTempOtherServiceItem(prev => ({ ...prev, date: e.target.value }))} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white" />
                          </td>
                          <td className="px-2 py-2 relative">
                            <input
                              ref={setOtherServiceSupplierInputRef}
                              type="text"
                              value={otherServiceSupplierSearch}
                              onChange={(e) => {
                                const value = e.target.value;
                                setOtherServiceSupplierSearch(value);
                                setShowOtherServiceSupplierDropdown(true);
                                setTimeout(() => updateDropdownPosition(), 0);
                                setSelectedOtherServiceSupplierIndex(-1);
                                setTempOtherServiceItem(prev => ({ ...prev, supplier: value, hotel: value }));
                              }}
                              onFocus={() => {
                                setShowOtherServiceSupplierDropdown(true);
                                setTimeout(() => updateDropdownPosition(), 0);
                                setSelectedOtherServiceSupplierIndex(-1);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Eğer dropdown açıksa ve bir öğe seçiliyse, önce onu seç
                                  if (showOtherServiceSupplierDropdown && selectedOtherServiceSupplierIndex >= 0 && selectedOtherServiceSupplierIndex < filteredOtherServiceSuppliers.length) {
                                    const supplier = filteredOtherServiceSuppliers[selectedOtherServiceSupplierIndex];
                                    handleOtherServiceSupplierSelect(supplier);
                                  } else {
                                    // Input'un mevcut değerini doğrudan al ve geç
                                    const currentInputValue = (e.target as HTMLInputElement).value;
                                    handleOtherServiceSave();
                                  }
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOtherServiceCancel();
                                } else {
                                  handleOtherServiceKeyDown(e);
                                }
                              }}
                              className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                              placeholder="Otel/Tedarikçi ara..."
                            />
                          </td>
                          <td className="px-2 py-2 hidden"><div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">DİĞER SERVİSLER</div></td>
                          <td className="px-2 py-2">
                            <select value={tempOtherServiceItem?.subCategory || ''} onChange={(e) => setTempOtherServiceItem(prev => ({ ...prev, subCategory: e.target.value }))} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white">
                              <option value="">Alt Kategori Seçin</option>
                              {otherSubCategories.map(sub => (<option key={sub.id} value={sub.name}>{sub.name}</option>))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="text" value={tempOtherServiceItem?.description || ''} onChange={(e) => setTempOtherServiceItem(prev => ({ ...prev, description: e.target.value }))} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white" placeholder="Açıklama" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="text" value={otherServiceAmountInput} onChange={(e) => {
                              const input = e.target.value;
                              setOtherServiceAmountInput(input);
                            }} onBlur={(e) => {
                              const input = e.target.value;
                              const clean = input.replace(/[^\d,]/g, '');
                              const amount = parseTurkishNumber(clean);
                              const rate = parseTurkishNumber(otherServiceFxInput || '1');
                              // Tutar x Kur = Toplam TL
                              const total = amount * rate;
                              setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                              setTempOtherServiceItem(prev => ({ ...prev, amount, totalTRY: total, exchangeRate: rate, fx: rate }));
                            }} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right" placeholder="0,00" inputMode="decimal" />
                          </td>
                          <td className="px-2 py-2">
                            <select value={tempOtherServiceItem?.currency || 'TRY'} onChange={(e) => {
                              const newCur = e.target.value;
                              const amount = parseTurkishNumber(otherServiceAmountInput || '0');
                              const rate = parseTurkishNumber(otherServiceFxInput || '1');
                              // Toplam TL = Tutar * Kur (her zaman)
                              const total = amount * rate;
                              setTempOtherServiceItem(prev => ({ ...prev, currency: newCur, totalTRY: total }));
                              setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                            }} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white">
                              <option value="TRY">TRY</option>
                              <option value="EUR">EUR</option>
                              <option value="USD">USD</option>
                              <option value="GBP">GBP</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="text" value={otherServiceFxInput || ''} onChange={(e) => {
                              const input = e.target.value;
                              setOtherServiceFxInput(input);
                              const rate = parseTurkishNumber(input || '1');
                              const amountInput = parseTurkishNumber(otherServiceAmountInput || '0');
                              
                              // Kur değiştiğinde: Toplam TL = Tutar x Kur (Tutar sabit kalır)
                              const total = amountInput * rate;
                              setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                              setTempOtherServiceItem(prev => ({ ...prev, exchangeRate: rate, fx: rate, amount: amountInput, totalTRY: total }));
                            }} onBlur={(e) => {
                              // parseTurkishNumber kullan - kuruşları korur
                              const value = parseTurkishNumber(e.target.value) || 1;
                              setOtherServiceFxInput(formatNumberForDisplay(value));
                              // Blur'da da hesaplamayı yap: Toplam TL = Tutar x Kur
                              const rate = value;
                              const amountInput = parseTurkishNumber(otherServiceAmountInput || '0');
                              const total = amountInput * rate;
                              setOtherServiceTotalTRYInput(formatNumberForDisplay(total));
                              setTempOtherServiceItem(prev => ({ ...prev, exchangeRate: rate, fx: rate, amount: amountInput, totalTRY: total }));
                            }} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right" placeholder="1,00" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="text" value={otherServiceTotalTRYInput} onChange={(e) => {
                              const input = e.target.value;
                              setOtherServiceTotalTRYInput(input);
                            }} onBlur={(e) => {
                              const input = e.target.value;
                              const clean = input.replace(/[^\d,]/g, '');
                              const tl = parseTurkishNumber(clean);
                              const rate = parseTurkishNumber(otherServiceFxInput || '1');
                              // Tutar = Toplam TL / Kur
                              const newAmount = rate > 0 ? tl / rate : 0;
                              setOtherServiceAmountInput(formatNumberForDisplay(newAmount));
                              setTempOtherServiceItem(prev => ({ ...prev, totalTRY: tl, amount: newAmount, exchangeRate: rate, fx: rate }));
                              setOtherServiceTotalTRYInput(formatNumberForDisplay(tl));
                            }} className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right" placeholder="0,00" inputMode="decimal" />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleOtherServiceSave()} 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleOtherServiceSave();
                                  }
                                }}
                                className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" 
                                title="Kaydet"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button onClick={handleOtherServiceCancel} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">{formatDateForDisplay(item.date)}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">{item.supplier || item.hotel || '-'}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white hidden">DİĞER SERVİSLER</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">{item.subCategory || item.sub_category || '-'}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">{item.description || '-'}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">{formatNumberForDisplay(item.amount || 0)}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">{item.currency || 'TRY'}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatNumberForDisplay(item.exchange_rate || item.fx || item.exchangeRate || 1)}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white text-right">{formatNumberForDisplay(item.totalTRY || item.total_try || 0)}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            <div className="flex gap-1">
                              <button onClick={() => handleOtherServiceEdit(originalIndex)} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Düzenle"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={() => handleOtherServiceDelete(originalIndex)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
      {otherServices.length > 0 && (
        <div className="bg-blue-600 dark:bg-blue-700 rounded-md p-3">
          <div className="grid grid-cols-12 gap-2 text-white text-sm">
            <div className="col-span-2 font-bold">GENEL TOPLAM</div>
            <div className="col-span-6 text-right font-bold">
              {Object.entries(otherServicesTotals).map(([cur, val]: any) => `${formatNumber(Number(val.toplamMaliyet || 0))} ${cur}`).join(' + ')}
            </div>
            <div className="col-span-3 text-right font-bold">
              {formatNumber(otherServices.reduce((sum: number, item: any) => sum + (parseFloat(item.totalTRY || item.total_try || 0) || 0), 0))} TL
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
      )}

      {/* Portal ile render edilen dropdown - Diğer Servisler */}
      {showOtherServiceSupplierDropdown && createPortal(
        <div
          className="other-service-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl max-h-80 overflow-y-auto"
          style={dropdownPosition ? { 
            top: dropdownPosition.top, 
            left: dropdownPosition.left, 
            width: dropdownPosition.width,
            minWidth: '300px'
          } : { display: 'none' }}
        >
          {filteredOtherServiceSuppliers.length > 0 ? (
            filteredOtherServiceSuppliers.map((supplier, index) => (
              <div
                key={`other-service-supplier-${supplier.id}-${supplier.type}-${index}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOtherServiceSupplierSelect(supplier);
                }}
                onMouseEnter={() => setSelectedOtherServiceSupplierIndex(index)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 ${
                  index === selectedOtherServiceSupplierIndex 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="text-xs font-medium">{supplier.name}</div>
                {supplier.title && <div className="text-[10px] text-gray-500 dark:text-gray-400">{supplier.title}</div>}
              </div>
            ))
          ) : (
            <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">Sonuç bulunamadı</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}



