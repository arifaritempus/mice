'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';

interface InsanKaynaklariTabProps {
  humanResources: any[];
  setHumanResources: (resources: any[]) => void;
  editingHrIndex: number | null;
  setEditingHrIndex: (index: number | null) => void;
  tempHrItem: any;
  setTempHrItem: (item: any) => void;
  isNewHrItem: boolean;
  setIsNewHrItem: (isNew: boolean) => void;
  hrSearch: string;
  setHrSearch: (search: string) => void;
  hrSortField: string;
  hrSortDirection: 'asc' | 'desc';
  hrSubCategories: any[];
  selectedHrMainCategory: string;
  setSelectedHrMainCategory: (category: string) => void;
  hrSupplierSearch: string;
  setHrSupplierSearch: (search: string) => void;
  showHrSupplierDropdown: boolean;
  setShowHrSupplierDropdown: (show: boolean) => void;
  selectedHrSupplierIndex: number;
  setSelectedHrSupplierIndex: (index: number) => void;
  filteredHrSuppliers: any[];
  projectId: string;
  handleHrAdd: () => void;
  handleHrEdit: (index: number) => void;
  handleHrSave: (overrideTempHrItem?: any) => void;
  handleHrCancel: () => void;
  handleHrDelete: (index: number) => void;
  filteredHr: any[];
  sortedHr: any[];
  formatNumberForDisplay: (value: number | string) => string;
  formatDateForDisplay: (dateValue: any) => string;
  formatNumber: (value: number) => string;
  handleHrSort: (field: string) => void;
  handleHrKeyDown: (e: React.KeyboardEvent) => void;
  handleHrSupplierKeyDown: (e: React.KeyboardEvent, itemId: string) => void;
  handleHrSupplierSelect: (supplier: any, itemId: string) => void;
  clearHrSearch: () => void;
  handleHrClear: () => void;
  handleHrExport: () => void;
  filteredHrExtras: any[];
  hrExtras: any[];
  setHrExtras: (extras: any[]) => void;
  hrTotals: { [key: string]: { toplamMaliyet: number } };
  hrAmountInput: string;
  setHrAmountInput: (value: string) => void;
  hrFxInput: string;
  setHrFxInput: (value: string) => void;
  hrTotalTRYInput: string;
  setHrTotalTRYInput: (value: string) => void;
  [key: string]: any;
}

export default function InsanKaynaklariTab(props: InsanKaynaklariTabProps) {
  const {
    humanResources,
    setHumanResources,
    editingHrIndex,
    setEditingHrIndex,
    tempHrItem,
    setTempHrItem,
    isNewHrItem,
    setIsNewHrItem,
    hrSearch,
    setHrSearch,
    hrSortField,
    hrSortDirection,
    hrSubCategories,
    selectedHrMainCategory,
    setSelectedHrMainCategory,
    hrSupplierSearch,
    setHrSupplierSearch,
    showHrSupplierDropdown,
    setShowHrSupplierDropdown,
    selectedHrSupplierIndex,
    setSelectedHrSupplierIndex,
    filteredHrSuppliers,
    projectId,
    handleHrAdd,
    handleHrEdit,
    handleHrSave,
    handleHrCancel,
    handleHrDelete,
    filteredHr,
    sortedHr,
    formatNumberForDisplay,
    formatDateForDisplay,
    formatNumber,
    handleHrSort,
    handleHrKeyDown,
    handleHrSupplierKeyDown,
    handleHrSupplierSelect,
    clearHrSearch,
    handleHrClear,
    handleHrExport,
    filteredHrExtras,
    hrExtras,
    setHrExtras,
    hrTotals,
    hrAmountInput,
    setHrAmountInput,
    hrFxInput,
    setHrFxInput,
    hrTotalTRYInput,
    setHrTotalTRYInput,
  } = props;

  const hrSupplierInputRef = useRef<HTMLInputElement | null>(null);
  const [hrSupplierDropdownPosition, setHrSupplierDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateDropdownPosition = () => {
    if (hrSupplierInputRef.current) {
      const rect = hrSupplierInputRef.current.getBoundingClientRect();
      setHrSupplierDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (showHrSupplierDropdown) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setHrSupplierDropdownPosition(null);
    }
  }, [showHrSupplierDropdown]);

  const setHrSupplierInputRef = (el: HTMLInputElement | null) => {
    hrSupplierInputRef.current = el;
  };

  // parseTurkishNumber fonksiyonu (Otel Ekstra tabından alınan)
  const parseTurkishNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;
    
    // Türkçe format: 1.234,56 -> 1234.56
    const cleaned = value.toString().replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="İnsan Kaynakları ara..."
            value={hrSearch}
            onChange={(e) => setHrSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleHrAdd}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Yeni Ekle
          </button>
          <button
            onClick={handleHrExport}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Excel Dışa Aktar
          </button>
          <button
            onClick={handleHrClear}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>


      {/* Toplam İstatistikler */}
      {humanResources.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-2">Özet</h3>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Toplam Kayıt</div>
              <div className="text-lg font-bold">{humanResources.length}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Toplam Tutar</div>
              <div className="text-lg font-bold">
                {humanResources.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {humanResources[0]?.currency || 'TRY'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Toplam TL</div>
              <div className="text-lg font-bold text-green-600">
                ₺{humanResources.reduce((sum, e) => sum + parseFloat(e.totalTRY || e.total_tl || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Ortalama Tutar</div>
              <div className="text-lg font-bold">
                {humanResources.length > 0 ? (humanResources.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) / humanResources.length).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} {humanResources[0]?.currency || 'TRY'}
              </div>
            </div>
          </div>
        </div>
      )}

                  {/* İnsan Kaynakları Tablosu */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('date')}
                            >
                              TARİH {hrSortField === 'date' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('hotel')}
                            >
                              OTEL/TEDARİKÇİ {hrSortField === 'hotel' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white hidden">ANA KATEGORİ</th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('subCategoryName')}
                            >
                              ALT KATEGORİ {hrSortField === 'subCategoryName' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('description')}
                            >
                              AÇIKLAMA {hrSortField === 'description' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('amount')}
                            >
                              TUTAR {hrSortField === 'amount' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('currency')}
                            >
                              DÖVİZ {hrSortField === 'currency' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('fx')}
                            >
                              KUR {hrSortField === 'fx' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => handleHrSort('totalTRY')}
                            >
                              TOPLAM TL {hrSortField === 'totalTRY' && (hrSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">İŞLEMLER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {/* Yeni ekleme modu */}
                          {editingHrIndex !== null && isNewHrItem && (
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-2 py-2">
                                  <input
                                    type="date"
                                  value={tempHrItem?.date || ''}
                                  onChange={(e) => setTempHrItem(prev => ({ ...prev, date: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      handleHrSave(tempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                      handleHrCancel();
                                      }
                                    }}
                                  className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                />
                                </td>
                                <td className="px-2 py-2 relative">
                                  <input
                                    ref={setHrSupplierInputRef}
                                    type="text"
                                  value={hrSupplierSearch || ''}
                                    onChange={(e) => {
                                    const value = e.target.value;
                                    console.log('🔍 Otel/Tedarikçi input değişti:', value);
                                    setHrSupplierSearch(value);
                                    setShowHrSupplierDropdown(true);
                                      setTimeout(() => updateDropdownPosition(), 0);
                                    setSelectedHrSupplierIndex(-1);
                                    // tempHrItem'ı da güncelle
                                    setTempHrItem(prev => ({ ...prev, hotel: value }));
                                    console.log('🔍 hrSupplierSearch güncellendi:', value);
                                    }}
                                    onFocus={() => {
                                      setTimeout(() => updateDropdownPosition(), 0);
                                    setShowHrSupplierDropdown(true);
                                      updateDropdownPosition();
                                    setSelectedHrSupplierIndex(-1);
                                    }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                      const currentInputValue = (e.target as HTMLInputElement).value;
                                      const updatedTempHrItem = {
                                        ...tempHrItem,
                                        hotel: currentInputValue || tempHrItem?.hotel || ''
                                      };
                                      // hrSupplierSearch state'ini de güncelle
                                      setHrSupplierSearch(currentInputValue);
                                      handleHrSave(updatedTempHrItem);
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleHrCancel();
                                    } else {
                                      handleHrKeyDown(e);
                                    }
                                  }}
                                  className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  placeholder="Otel/Tedarikçi ara..."
                                  />
                                </td>
                                <td className="px-2 py-2 hidden">
                                  <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                                    İNSAN KAYNAKLARI
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                  value={tempHrItem?.subCategory || ''}
                                  onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    // Seçilen alt kategorinin ID'sini bul
                                    const selectedSubCategory = hrSubCategories.find(sub => sub.name === selectedValue);
                                    setTempHrItem(prev => ({ 
                                      ...prev, 
                                      subCategory: selectedValue,
                                      subCategoryName: selectedValue,
                                      subCategoryId: selectedSubCategory?.id || null
                                    }));
                                  }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      handleHrSave(tempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                      handleHrCancel();
                                      }
                                    }}
                                  className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="">Alt Kategori Seçin</option>
                                  {hrSubCategories.length > 0 ? (
                                    hrSubCategories.map(subCategory => (
                                      <option key={subCategory.id} value={subCategory.name}>{subCategory.name}</option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Alt kategori yükleniyor...</option>
                                  )}
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                  value={tempHrItem?.description || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setTempHrItem(prev => {
                                      const updated = { ...prev, description: value };
                                      return updated;
                                    });
                                  }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                        const currentInputValue = (e.target as HTMLInputElement).value;
                                        const updatedTempHrItem = {
                                          ...tempHrItem,
                                          description: currentInputValue || tempHrItem?.description || ''
                                        };
                                        handleHrSave(updatedTempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleHrCancel();
                                      }
                                    }}
                                  className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                  placeholder="Açıklama"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={hrAmountInput || ''}
                                    onChange={(e) => {
                                      // Serbest giriş - raw değeri kaydet
                                      const inputValue = e.target.value;
                                      setHrAmountInput(inputValue);
                                      // Aynı zamanda amount'u da güncelle
                                      const cleanValue = inputValue.replace(/[^\d,]/g, '');
                                      const numericValue = parseTurkishNumber(cleanValue);
                                      const fx = parseTurkishNumber(hrFxInput || '1');
                                      // Toplam TL = Tutar * Kur
                                      const newTotalTRY = numericValue * fx;

                                      setTempHrItem(prev => ({
                                        ...prev,
                                        amount: numericValue,
                                        totalTRY: newTotalTRY
                                      }));
                                      
                                      // Toplam TL input'unu da güncelle
                                      setHrTotalTRYInput(formatNumberForDisplay(newTotalTRY));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const cleanValue = currentInputValue.replace(/[^\d,]/g, '');
                                          const numericValue = parseTurkishNumber(cleanValue);
                                          const fx = parseTurkishNumber(hrFxInput || '1');
                                          const newTotalTRY = numericValue * fx;
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            amount: numericValue,
                                            totalTRY: newTotalTRY
                                          };
                                          handleHrSave(updatedTempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleHrCancel();
                                      }
                                    }}
                                  className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                                  placeholder="0,00"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                  value={tempHrItem?.currency || 'TRY'}
                                    onChange={(e) => {
                                      const newCurrency = e.target.value;
                                    setTempHrItem(prev => ({ ...prev, currency: newCurrency }));
                                      
                                    const amount = parseTurkishNumber(hrAmountInput || '0') || parseFloat(tempHrItem?.amount || '0');
                                    const fx = parseTurkishNumber(hrFxInput || '1');
                                      // Toplam TL = Tutar * Kur
                                      const totalTRY = amount * fx;
                                    setTempHrItem(prev => ({ ...prev, fx, totalTRY }));
                                    setHrTotalTRYInput(formatNumberForDisplay(totalTRY));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      handleHrSave(tempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                      handleHrCancel();
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
                                    value={hrFxInput || ''}
                                    onChange={(e) => {
                                      // Serbest giriş - raw değeri kaydet
                                      const inputValue = e.target.value;
                                      setHrFxInput(inputValue);
                                      // Aynı zamanda fx'i de güncelle
                                      const cleanValue = inputValue.replace(/[^\d,]/g, '');
                                      const numericValue = parseTurkishNumber(cleanValue) || 1;
                                      const amount = parseTurkishNumber(hrAmountInput || '0');
                                      // Toplam TL = Tutar * Kur
                                      const newTotalTRY = amount * numericValue;

                                      setTempHrItem(prev => ({
                                        ...prev,
                                        fx: numericValue,
                                        totalTRY: newTotalTRY
                                      }));
                                      
                                      // Toplam TL input'unu da güncelle
                                      setHrTotalTRYInput(formatNumberForDisplay(newTotalTRY));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const cleanValue = currentInputValue.replace(/[^\d,]/g, '');
                                          const numericValue = parseTurkishNumber(cleanValue) || 1;
                                          const amount = parseTurkishNumber(hrAmountInput || '0');
                                          const newTotalTRY = amount * numericValue;
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            fx: numericValue,
                                            totalTRY: newTotalTRY
                                          };
                                          handleHrSave(updatedTempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleHrCancel();
                                      }
                                    }}
                                  className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                                  placeholder="1,00"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={hrTotalTRYInput}
                                    onChange={(e) => {
                                      setHrTotalTRYInput(e.target.value);
                                      // Toplam TL girildiğinde Tutar'ı hesapla: Tutar = Toplam TL / Kur
                                      const inputValue = e.target.value;
                                      const cleanValue = inputValue.replace(/[^\d,]/g, '');
                                      const numericTotalTRY = parseFloat(cleanValue.replace(',', '.')) || 0;
                                      const fx = parseFloat(hrFxInput.replace(',', '.')) || 1;
                                      
                                      // Eğer Toplam TL girildiyse, Tutar'ı hesapla: Tutar = Toplam TL / Kur
                                      let newAmount = 0;
                                      if (numericTotalTRY > 0 && fx > 0) {
                                        newAmount = numericTotalTRY / fx;
                                      }

                                      setTempHrItem(prev => ({
                                        ...prev,
                                        totalTRY: numericTotalTRY,
                                        amount: newAmount > 0 ? newAmount : (prev.amount || 0)
                                      }));
                                      
                                      // Tutar input'unu da güncelle
                                      if (newAmount > 0) {
                                        setHrAmountInput(formatNumberForDisplay(newAmount));
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const cleanValue = currentInputValue.replace(/[^\d,]/g, '');
                                          const numericTotalTRY = parseFloat(cleanValue.replace(',', '.')) || 0;
                                          const fx = parseTurkishNumber(hrFxInput || '1');
                                          let newAmount = 0;
                                          if (numericTotalTRY > 0 && fx > 0) {
                                            newAmount = numericTotalTRY / fx;
                                          }
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            totalTRY: numericTotalTRY,
                                            amount: newAmount > 0 ? newAmount : (tempHrItem?.amount || 0)
                                          };
                                          handleHrSave(updatedTempHrItem);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleHrCancel();
                                      }
                                    }}
                                    className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                                    placeholder="0,00"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <div className="flex space-x-2">
                                    <button
                                    onClick={async () => {
                                      if (typeof handleHrSave !== 'function') {
                                        return;
                                      }
                                      
                                      // tempHrItem'ı parametre olarak geç - böylece güncel değerleri kullanır
                                      // Eğer tempHrItem boş veya geçersizse, undefined geç - handleHrSave state'ten alacak
                                      const itemToPass = (tempHrItem && typeof tempHrItem === 'object' && Object.keys(tempHrItem).length > 0) ? tempHrItem : undefined;
                                      
                                      // handleHrSave'yi çağır
                                      try {
                                        await handleHrSave(itemToPass);
                                      } catch (error) {
                                        console.error('HR kaydetme hatası:', error);
                                      }
                                    }}
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // onClick handler'ını çağır
                                        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
                                        (e.currentTarget as HTMLButtonElement).click();
                                      }
                                    }}
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
                                      title="Kaydet"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                    onClick={handleHrCancel}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                      title="İptal"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                            </tr>
                          )}

                          {/* Mevcut kayıtları listele */}
                          {filteredHrExtras.length === 0 && editingHrIndex === null && !isNewHrItem ? (
                            <tr>
                              <td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                Henüz kayıt bulunmuyor
                              </td>
                            </tr>
                          ) : (
                            filteredHrExtras.map((extra, index) => (
                              <tr key={extra.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-2 py-2 text-gray-900 dark:text-white">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <input
                                      type="date"
                                      value={tempHrItem?.date || ''}
                                      onChange={(e) => setTempHrItem(prev => ({ ...prev, date: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleHrSave(tempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                    />
                                  ) : (
                                    extra.date ? formatDateForDisplay(extra.date) : '-'
                                  )}
                                </td>
                                <td className="px-2 py-2 text-gray-900 dark:text-white">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <input
                                      ref={setHrSupplierInputRef}
                                      type="text"
                                      value={hrSupplierSearch || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        console.log('🔍 Otel/Tedarikçi input değişti:', value);
                                        setHrSupplierSearch(value);
                                        setShowHrSupplierDropdown(true);
                                        setTimeout(() => updateDropdownPosition(), 0);
                                        setSelectedHrSupplierIndex(-1);
                                        // tempHrItem'ı da güncelle
                                        setTempHrItem(prev => ({ ...prev, hotel: value }));
                                      }}
                                      onFocus={() => {
                                        setShowHrSupplierDropdown(true);
                                        setTimeout(() => updateDropdownPosition(), 0);
                                        setSelectedHrSupplierIndex(-1);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            hotel: currentInputValue || tempHrItem?.hotel || ''
                                          };
                                          // hrSupplierSearch state'ini de güncelle
                                          setHrSupplierSearch(currentInputValue);
                                          handleHrSave(updatedTempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleHrCancel();
                                        } else if (showHrSupplierDropdown) {
                                          handleHrSupplierKeyDown(e, extra.id || '');
                                        } else {
                                          handleHrKeyDown(e);
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                      placeholder="Otel/Tedarikçi ara..."
                                    />
                                  ) : (
                                    (() => {
                                      console.log('🔍 extra.hotel değeri:', extra.hotel);
                                      if (typeof extra.hotel === 'object' && extra.hotel !== null) {
                                        return extra.hotel.name || extra.hotel.title || '-';
                                      }
                                      return extra.hotel || '-';
                                    })()
                                  )}
                                </td>
                                <td className="px-2 py-2 hidden text-gray-900 dark:text-white">
                                  <div className="w-full px-1 py-0.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded">
                                    İNSAN KAYNAKLARI
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <select
                                      value={tempHrItem?.subCategory || ''}
                                      onChange={(e) => {
                                        const selectedValue = e.target.value;
                                        // Seçilen alt kategorinin ID'sini bul
                                        const selectedSubCategory = hrSubCategories.find(sub => sub.name === selectedValue);
                                        setTempHrItem(prev => ({ 
                                          ...prev, 
                                          subCategory: selectedValue,
                                          subCategoryName: selectedValue,
                                          subCategoryId: selectedSubCategory?.id || null
                                        }));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleHrSave(tempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="">Alt Kategori Seçin</option>
                                      {hrSubCategories.length > 0 ? (
                                        hrSubCategories.map(subCategory => (
                                          <option key={subCategory.id} value={subCategory.name}>{subCategory.name}</option>
                                        ))
                                      ) : (
                                        <option value="" disabled>Alt kategori yükleniyor...</option>
                                      )}
                                    </select>
                                  ) : (
                                    extra.sub_category?.name || extra.subCategoryName || extra.sub_category || '-'
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <input
                                      type="text"
                                      value={tempHrItem?.description || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setTempHrItem(prev => {
                                          const updated = { ...prev, description: value };
                                          return updated;
                                        });
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            description: currentInputValue || tempHrItem?.description || ''
                                          };
                                          handleHrSave(updatedTempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                      placeholder="Açıklama"
                                    />
                                  ) : (
                                    extra.description || '-'
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <input
                                      type="text"
                                      value={hrAmountInput || ''}
                                      onChange={(e) => {
                                        // Serbest giriş - raw değeri kaydet
                                        const inputValue = e.target.value;
                                        setHrAmountInput(inputValue);
                                        // Aynı zamanda amount'u da güncelle
                                        const cleanValue = inputValue.replace(/[^\d,]/g, '');
                                        const numericValue = parseTurkishNumber(cleanValue);
                                        const currency = tempHrItem?.currency || 'TRY';
                                        const fx = parseTurkishNumber(hrFxInput || '1');
                                        // Toplam TL = Tutar * Kur (her zaman)
                                        const newTotalTRY = numericValue * fx;

                                        setTempHrItem(prev => ({
                                          ...prev,
                                          amount: numericValue,
                                          totalTRY: newTotalTRY
                                        }));
                                        
                                        // Toplam TL input'unu da güncelle
                                        setHrTotalTRYInput(formatNumberForDisplay(newTotalTRY));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const cleanValue = currentInputValue.replace(/[^\d,]/g, '');
                                          const numericValue = parseTurkishNumber(cleanValue);
                                          const fx = parseTurkishNumber(hrFxInput || '1');
                                          const newTotalTRY = numericValue * fx;
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            amount: numericValue,
                                            totalTRY: newTotalTRY
                                          };
                                          handleHrSave(updatedTempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                      placeholder="0,00"
                                    />
                                  ) : (
                                    <span className="text-gray-900 dark:text-white">{formatNumberForDisplay(extra.amount || 0)}</span>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <select
                                      value={tempHrItem?.currency || 'TRY'}
                                      onChange={(e) => {
                                        const newCurrency = e.target.value;
                                        setTempHrItem(prev => ({ ...prev, currency: newCurrency }));
                                        
                                        const amount = parseFloat(hrAmountInput.replace(',', '.')) || parseFloat(tempHrItem?.amount || '0');
                                        const fx = parseFloat(hrFxInput.replace(',', '.')) || 1;
                                        // Toplam TL = Tutar * Kur
                                        const totalTRY = amount * fx;
                                        setTempHrItem(prev => ({ ...prev, fx, totalTRY }));
                                        setHrTotalTRYInput(formatNumberForDisplay(totalTRY));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleHrSave(tempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="TRY">TRY</option>
                                      <option value="EUR">EUR</option>
                                      <option value="USD">USD</option>
                                      <option value="GBP">GBP</option>
                                    </select>
                                  ) : (
                                    <span className="text-gray-900 dark:text-white">{extra.currency || 'TRY'}</span>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <input
                                      type="text"
                                      value={hrFxInput || ''}
                                      onChange={(e) => {
                                        // Serbest giriş - raw değeri kaydet
                                        const inputValue = e.target.value;
                                        setHrFxInput(inputValue);
                                        // Aynı zamanda fx'i de güncelle
                                        const cleanValue = inputValue.replace(/[^\d,]/g, '');
                                        const numericValue = parseFloat(cleanValue.replace(',', '.')) || 1;
                                        const amount = parseFloat(hrAmountInput.replace(',', '.')) || 0;
                                        const newTotalTRY = numericValue > 0 ? amount * numericValue : amount;

                                        setTempHrItem(prev => ({
                                          ...prev,
                                          fx: numericValue,
                                          totalTRY: newTotalTRY
                                        }));
                                        
                                        // Toplam TL input'unu da güncelle
                                        setHrTotalTRYInput(formatNumberForDisplay(newTotalTRY));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const cleanValue = currentInputValue.replace(/[^\d,]/g, '');
                                          const numericValue = parseFloat(cleanValue.replace(',', '.')) || 1;
                                          const amount = parseTurkishNumber(hrAmountInput || '0');
                                          const newTotalTRY = numericValue > 0 ? amount * numericValue : amount;
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            fx: numericValue,
                                            totalTRY: newTotalTRY
                                          };
                                          handleHrSave(updatedTempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                                      placeholder="1,00"
                                    />
                                  ) : (
                                    <span className="text-gray-900 dark:text-white text-right block">{formatNumberForDisplay(extra.exchange_rate || extra.fx || 1)}</span>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <input
                                      type="text"
                                      value={hrTotalTRYInput}
                                      onChange={(e) => {
                                        setHrTotalTRYInput(e.target.value);
                                        // Toplam TL girildiğinde Tutar'ı hesapla: Tutar = Toplam TL / Kur
                                        const inputValue = e.target.value;
                                        const cleanValue = inputValue.replace(/[^\d,]/g, '');
                                        const numericTotalTRY = parseTurkishNumber(cleanValue);
                                        const fx = parseTurkishNumber(hrFxInput || '1');
                                        
                                        // Eğer Toplam TL girildiyse, Tutar'ı hesapla: Tutar = Toplam TL / Kur
                                        let newAmount = 0;
                                        if (numericTotalTRY > 0 && fx > 0) {
                                          newAmount = numericTotalTRY / fx;
                                        }

                                        setTempHrItem(prev => ({
                                          ...prev,
                                          totalTRY: numericTotalTRY,
                                          amount: newAmount > 0 ? newAmount : (prev.amount || 0)
                                        }));
                                        
                                        // Tutar input'unu da güncelle
                                        if (newAmount > 0) {
                                          setHrAmountInput(formatNumberForDisplay(newAmount));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          // Input'un mevcut değerini doğrudan al ve tempHrItem'a ekle
                                          const currentInputValue = (e.target as HTMLInputElement).value;
                                          const cleanValue = currentInputValue.replace(/[^\d,]/g, '');
                                          const numericTotalTRY = parseTurkishNumber(cleanValue);
                                          const fx = parseTurkishNumber(hrFxInput || '1');
                                          let newAmount = 0;
                                          if (numericTotalTRY > 0 && fx > 0) {
                                            newAmount = numericTotalTRY / fx;
                                          }
                                          const updatedTempHrItem = {
                                            ...tempHrItem,
                                            totalTRY: numericTotalTRY,
                                            amount: newAmount > 0 ? newAmount : (tempHrItem?.amount || 0)
                                          };
                                          handleHrSave(updatedTempHrItem);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          handleHrCancel();
                                        }
                                      }}
                                      className="w-full px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white text-right"
                                      placeholder="0,00"
                                    />
                                  ) : (
                                    <span className="text-gray-900 dark:text-white text-right block">{formatNumberForDisplay(extra.totalTRY || extra.total_try || 0)}</span>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  {editingHrIndex === extra.originalIndex ? (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleHrSave(tempHrItem)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleHrSave(tempHrItem);
                                          }
                                        }}
                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
                                        title="Kaydet"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={handleHrCancel}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                        title="İptal"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleHrEdit(extra.originalIndex)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                        title="Düzenle"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleHrDelete(extra.originalIndex)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                        title="Sil"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Genel Toplam */}
                  {hrExtras.length > 0 && (
                    <div className="bg-blue-600 dark:bg-blue-700 rounded-md p-3">
                      <div className="grid grid-cols-12 gap-2 text-white text-sm">
                        <div className="col-span-2 font-bold">GENEL TOPLAM</div>
                        <div className="col-span-6 text-right font-bold">
                          {Object.entries(hrTotals).map(([cur, val]: any) => `${formatNumber(Number(val.toplamMaliyet || 0))} ${cur}`).join(' + ')}
                        </div>
                        <div className="col-span-3 text-right font-bold">
                          {formatNumber(hrExtras.reduce((sum: number, item: any) => sum + (item.totalTRY || item.amount), 0))} TL
                        </div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                  )}

                  {/* Portal ile render edilen dropdown */}
                  {showHrSupplierDropdown && hrSupplierDropdownPosition && createPortal(
                    <div
                      className="hr-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-40 overflow-y-auto"
                      style={{
                        top: hrSupplierDropdownPosition.top,
                        left: hrSupplierDropdownPosition.left,
                        width: hrSupplierDropdownPosition.width
                      }}
                    >
                      {filteredHrSuppliers.map((supplier, index) => (
                        <div
                          key={`hr-supplier-${supplier.id}-${supplier.type}-${index}`}
                          className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            selectedHrSupplierIndex === index ? 'bg-blue-100 dark:bg-blue-800' : ''
                          }`}
                          onClick={() => handleHrSupplierSelect(supplier, tempHrItem?.id || '')}
                          onMouseEnter={() => setSelectedHrSupplierIndex(index)}
                        >
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {supplier.type === 'hotel' ? 'Otel' : supplier.type === 'supplier' ? 'Tedarikçi' : supplier.type}
                          </div>
                        </div>
                      ))}
                    </div>,
                    document.body
                  )}
    </div>
  );
}
