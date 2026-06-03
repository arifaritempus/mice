'use client';

import { useMemo, useRef } from 'react';

interface SalesTabProps {
  itemsSales: any[];
  setItemsSales: (items: any[] | ((prev: any[]) => any[])) => void;
  showAddRowSales: boolean;
  setShowAddRowSales: (show: boolean) => void;
  showCategoryModalSales: boolean;
  setShowCategoryModalSales: (show: boolean) => void;
  selectedCategoriesSales: Set<string>;
  setSelectedCategoriesSales: (selected: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  expandedCategoriesSales: Set<string>;
  setExpandedCategoriesSales: (expanded: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  newItem: any;
  setNewItem: (item: any) => void;
  categories: any[];
  mainCategories: any[];
  subCategoriesByMain: Record<string, any[]>;
  groupedSalesItems: any[];
  exportSalesToExcel: () => void;
  exportSalesToPDF: () => void;
  saveItems: (side: 'sales' | 'purchase', items: any[]) => void;
  addItem: (side: 'sales' | 'purchase') => void;
  removeItem: (side: 'sales' | 'purchase', id: string) => void;
  editRow: (side: 'sales' | 'purchase', id: string) => void;
  addBelow: (side: 'sales' | 'purchase', itemId: string) => void;
  totalsByCurrency: (items: any[]) => Record<string, number>;
  formatNumber: (value: number) => string;
  formatTRY: (value: number) => string;
  getCategoryName: (id: string) => string;
  toggleAllCategories: (checked: boolean, side: 'sales' | 'purchase') => void;
  toggleCategoryExpansion: (mainCategoryId: string, side: 'sales' | 'purchase') => void;
  isAllSubCategoriesSelected: (mainCategoryId: string, side: 'sales' | 'purchase') => boolean;
  isSomeSubCategoriesSelected: (mainCategoryId: string, side: 'sales' | 'purchase') => boolean;
  handleAddSelectedCategories: (side: 'sales' | 'purchase') => void;
  toggleAllSubCategories: (mainCategoryId: string, checked: boolean, side: 'sales' | 'purchase') => void;
  CheckboxWithIndeterminate: React.ComponentType<{ checked: boolean; indeterminate: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }>;
  handleCreateLink?: () => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isLocked?: boolean;
  hotelsData: any[];
  hotels: any[];
}

export default function SalesTab({
  itemsSales,
  setItemsSales,
  showAddRowSales,
  setShowAddRowSales,
  showCategoryModalSales,
  setShowCategoryModalSales,
  selectedCategoriesSales,
  setSelectedCategoriesSales,
  expandedCategoriesSales,
  setExpandedCategoriesSales,
  newItem,
  setNewItem,
  categories,
  mainCategories,
  subCategoriesByMain,
  groupedSalesItems,
  exportSalesToExcel,
  exportSalesToPDF,
  saveItems,
  addItem,
  removeItem,
  editRow,
  addBelow,
  totalsByCurrency,
  formatNumber,
  formatTRY,
  getCategoryName,
  toggleAllCategories,
  toggleCategoryExpansion,
  isAllSubCategoriesSelected,
  isSomeSubCategoriesSelected,
  handleAddSelectedCategories,
  toggleAllSubCategories,
  CheckboxWithIndeterminate,
  handleCreateLink,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  isLocked = false,
  hotelsData = [],
  hotels = [],
}: SalesTabProps) {
  const categoryModalRefSales = useRef<HTMLDivElement>(null);

  const getHotelNameFromData = (hotelId: string) => {
    if (!hotelId || !hotelsData) return '-';
    if (hotelId === 'general') return 'GENEL HİZMETLER';

    // 1. Önce hotelsData (Tab Verileri) içinden eşleştir
    const hData = (hotelsData || []).find(h => h && h.id === hotelId);
    if (hData) {
      if (hData.hotel_name) return hData.hotel_name;
      // Master hotel listesinden isme bak
      const masterHotel = (hotels || []).find(ht => ht && ht.id === hData.hotel_id);
      return masterHotel?.name || hData.name || hData.hotel_name || hotelId;
    }

    // 2. Doğrudan master hotel UUID'si ise
    const masterDirect = (hotels || []).find(ht => ht && ht.id === hotelId);
    return masterDirect ? masterDirect.name : hotelId;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Satış</h2>
        <div className="flex items-center gap-2">
          {handleCreateLink && (
            <button 
              onClick={handleCreateLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Mutabakat Linki
            </button>
          )}
          {!isLocked && canCreate && (
            <button 
              onClick={() => {
                console.log('Başlık ekleme ikonuna tıklandı - kategori seçim modalı açılmalı');
                setShowCategoryModalSales(true);
              }} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Satış Kalemi
            </button>
          )}
          <button
            onClick={exportSalesToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white text-xs font-bold rounded-lg transition-all border border-green-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel Dışa Aktar
          </button>
        </div>
      </div>
      {/* Başlık satırı */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 hidden md:flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
        <div className="w-44">KATEGORİ</div>
        <div className="w-16 flex flex-col justify-center items-end pr-1">
          <div>BİRİM</div>
          <div>ADET</div>
        </div>
        <div className="w-20 flex flex-col justify-center items-end pr-1">
          <div>SEFER</div>
          <div>TEKRAR</div>
        </div>
        <div className="w-24 text-right pr-1">BİRİM FİYAT</div>
        <div className="w-28 text-right pr-1">TOPLAM FİYAT</div>
        <div className="w-16">DÖVİZ</div>
        <div className="w-16">KDV</div>
        <div className="w-16 text-right pr-1">KUR</div>
        <div className="w-32 text-right pr-1">TOPLAM TL</div>
        <div className="flex-1 min-w-[10rem]">AÇIKLAMA</div>
        <div className="w-36">OTEL</div>
        <div className="w-24 flex items-center justify-between">
          <span>İŞLEMLER</span>
          <button 
            onClick={() => {
              console.log('Başlık ekleme ikonuna tıklandı - kategori seçim modalı açılmalı');
              setShowCategoryModalSales(true);
            }} 
            className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" 
            title="Kategori Seç ve Ekle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6"/></svg>
          </button>
        </div>
      </div>
        
      {/* Yeni satır ekleme (Satış) - En üstte */}
      {showAddRowSales && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2 border border-blue-200 dark:border-blue-800 mt-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-44">
              <select
                value={newItem.main_category || ''}
                onChange={(e) => setNewItem({ ...newItem, main_category: e.target.value, sub_category: '' })}
                onKeyDown={(e) => { 
                  if(e.key==='Enter'){ 
                    e.preventDefault();
                    if (newItem.main_category) {
                      addItem('sales'); 
                      setShowAddRowSales(false);
                    }
                  } 
                  if(e.key==='Escape'){ 
                    e.preventDefault();
                    setNewItem({ main_category: '', sub_category: '', description: '', qty: 1, repeat: 1, unit_price: 0, currency: 'EUR', vat: 0, fx: 1, supplier: '' }); 
                    setShowAddRowSales(false);
                  } 
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="">Ana Kategori Seç</option>
                {categories.filter((c: any) => c.parent_id === null).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1"></div>
            <div className="w-24 flex items-center justify-end gap-1">
              <button
                onClick={() => { 
                  if (newItem.main_category) {
                    addItem('sales'); 
                    setShowAddRowSales(false); 
                  }
                }}
                onKeyDown={(e) => { 
                  if(e.key==='Enter'){ 
                    if (newItem.main_category) {
                      addItem('sales'); 
                      setShowAddRowSales(false);
                    }
                  } 
                  if(e.key==='Escape'){ 
                    setNewItem({}); 
                    setShowAddRowSales(false);
                  } 
                }}
                disabled={!newItem.main_category}
                className={`p-1 transition-colors ${
                  newItem.main_category 
                    ? 'text-green-600 hover:text-green-800' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                title="Kaydet"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => { setNewItem({}); setShowAddRowSales(false); }}
                onKeyDown={(e) => { 
                  if(e.key==='Escape'){ 
                    setNewItem({}); 
                    setShowAddRowSales(false);
                  } 
                }}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                title="İptal"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Seçim Modal - Satış */}
      {showCategoryModalSales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={categoryModalRefSales} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kategori Seçin (Satış)
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModalSales(false);
                  setSelectedCategoriesSales(new Set());
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tümünü Seç/Kaldır Butonları */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => toggleAllCategories(true, 'sales')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={() => toggleAllCategories(false, 'sales')}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Tümünü Kaldır
                </button>
              </div>

              {/* Kategoriler Listesi */}
              <div className="space-y-4">
                {mainCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Kategoriler yükleniyor...
                  </div>
                ) : (
                  mainCategories.map((mainCat: any) => {
                    const subCats = subCategoriesByMain[mainCat.id] || [];
                    const allSelected = isAllSubCategoriesSelected(mainCat.id, 'sales');
                    const someSelected = isSomeSubCategoriesSelected(mainCat.id, 'sales');
                    const isExpanded = expandedCategoriesSales.has(mainCat.id);

                    return (
                      <div key={mainCat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Ana Kategori Header */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => toggleCategoryExpansion(mainCat.id, 'sales')}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title={isExpanded ? "Daralt" : "Genişlet"}
                            >
                              <svg
                                className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <label className="flex items-center gap-2 cursor-pointer flex-1" onClick={(e) => e.stopPropagation()}>
                              <CheckboxWithIndeterminate
                                checked={allSelected}
                                indeterminate={someSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleAllSubCategories(mainCat.id, e.target.checked, 'sales');
                                }}
                              />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {mainCat.name}
                              </span>
                              {subCats.length > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({subCats.length} alt kategori)
                                </span>
                              )}
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllSubCategories(mainCat.id, true, 'sales');
                              }}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Tümünü Seç
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllSubCategories(mainCat.id, false, 'sales');
                              }}
                              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Tümünü Kaldır
                            </button>
                          </div>
                        </div>

                        {/* Alt Kategoriler - Sadece açıkken göster */}
                        {isExpanded && subCats.length > 0 && (
                          <div className="p-3 bg-white dark:bg-gray-800 space-y-1 border-t border-gray-200 dark:border-gray-700">
                            {subCats.map((subCat: any) => (
                              <label
                                key={subCat.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategoriesSales.has(subCat.id)}
                                  onChange={(e) => {
                                    setSelectedCategoriesSales(prev => {
                                      const newSet = new Set(prev);
                                      if (e.target.checked) {
                                        newSet.add(subCat.id);
                                      } else {
                                        newSet.delete(subCat.id);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {subCat.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCategoriesSales.size} kategori seçildi
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCategoryModalSales(false);
                    setSelectedCategoriesSales(new Set());
                  }}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleAddSelectedCategories('sales')}
                  disabled={selectedCategoriesSales.size === 0}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Seçili Kategorileri Ekle ({selectedCategoriesSales.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Satış kalemleri - Ana kategorilere göre gruplu */}
      <div className="space-y-1">
        {groupedSalesItems.map((row: any, idx: number) => {
          if (row.type === 'header') {
            // İlk ana kategori başlığı hariç, diğerlerine üst boşluk ekle
            const isFirstHeader = idx === 0;
            return (
              <div key={`header-${row.category}`} className={`bg-gray-200 dark:bg-gray-600 rounded-md p-2 ${!isFirstHeader ? 'mt-4' : ''}`}>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{row.category}</h3>
              </div>
            );
          }

          if (row.type === 'subtotal') {
            const curMap = totalsByCurrency(row.items || []);
            return (
              <div key={`subtotal-${row.category}`} className="mt-1 bg-gray-100 dark:bg-gray-700 rounded-md p-2">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <div className="w-44">ARA TOPLAM</div>
                  <div className="w-16 flex flex-col justify-center items-end pr-1"></div>
                  <div className="w-20 flex flex-col justify-center items-end pr-1"></div>
                  <div className="w-24 text-right pr-1"></div>
                  <div className="w-28 text-right pr-1 whitespace-nowrap">{Object.entries(curMap).map(([cur, val]: any) => `${formatNumber(Number(val || 0))} ${cur}`).join(' + ')}</div>
                  <div className="w-16 text-right pr-1"></div>
                  <div className="w-16"></div>
                  <div className="w-16"></div>
                  <div className="w-32 text-right pr-1 whitespace-nowrap">{formatNumber(row.totalTRY || 0)} TL</div>
                  <div className="flex-1 min-w-[10rem]"></div>
                  <div className="w-36"></div>
                  <div className="w-24"></div>
                </div>
              </div>
            );
          }

          // Normal item
          const it = row.item;
          return (
            <div
              key={it.id}
              className={`rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2 group ${it.isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'}`}
            >
              {it.isEditing ? (
                // Düzenleme modu
                <>
                  <select 
                    value={it.sub_category} 
                    onChange={(e)=>{ 
                      const updated = {...it, sub_category: e.target.value}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }} 
                    className="w-44 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Alt Kategori</option>
                    {categories.filter((c:any)=>c.parent_id===it.main_category).map((c:any)=> (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    value={it.qty ?? 0}
                    onChange={(e)=>{ 
                      const qty = e.target.value === '' ? '' : Number(e.target.value);
                      const updated = {...it, qty, total: Number(qty || 0) * Number(it.repeat || 0) * Number(it.unit_price || 0), total_try: Number(qty || 0) * Number(it.repeat || 0) * Number(it.unit_price || 0) * Number(it.fx || 1)}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]); 
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    type="number"
                    step="1"
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <input
                    value={it.repeat ?? 0}
                    onChange={(e)=>{ 
                      const repeat = e.target.value === '' ? '' : Number(e.target.value);
                      const updated = {...it, repeat, total: Number(it.qty || 0) * Number(repeat || 0) * Number(it.unit_price || 0), total_try: Number(it.qty || 0) * Number(repeat || 0) * Number(it.unit_price || 0) * Number(it.fx || 1)}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    type="number"
                    step="1"
                    className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    value={it.unit_price ?? 0}
                    onChange={(e)=>{ 
                      const unit_price = e.target.value === '' ? '' : Number(e.target.value);
                      const updated = {...it, unit_price, total: Number(it.qty || 0) * Number(it.repeat || 0) * Number(unit_price || 0), total_try: Number(it.qty || 0) * Number(it.repeat || 0) * Number(unit_price || 0) * Number(it.fx || 1)}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    type="number"
                    step="0.01"
                    className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="w-28 px-2 py-1 text-xs text-right text-gray-700 dark:text-gray-200">{formatNumber(it.total)}</div>
                  <select 
                    value={it.currency} 
                    onChange={(e)=>{ 
                      const updated = {...it, currency: e.target.value}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }} 
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option>EUR</option>
                    <option>USD</option>
                    <option>TL</option>
                  </select>
                  <input
                    value={it.vat ?? 0}
                    onChange={(e)=>{ 
                      const updated = {...it, vat: e.target.value === '' ? '' : Number(e.target.value)}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="5"
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    value={it.fx ?? 0}
                    onChange={(e)=>{ 
                      const fx = e.target.value === '' ? '' : Number(e.target.value);
                      const updated = {...it, fx, total_try: Number(it.qty || 0) * Number(it.repeat || 0) * Number(it.unit_price || 0) * Number(fx || 0)}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    type="number"
                    step="0.0001"
                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    value={it.total_try ?? 0}
                    onChange={(e)=>{ 
                      const newTotalTRY = e.target.value === '' ? '' : Number(e.target.value); 
                      const qtyTimesRepeat = (Number(it.qty)||0) * (Number(it.repeat)||0); 
                      const fxVal = Number(it.fx)||0; 
                      let newUnitPrice = Number(it.unit_price)||0; 
                      if (fxVal > 0 && qtyTimesRepeat > 0) { 
                        newUnitPrice = Number(newTotalTRY || 0) / fxVal / qtyTimesRepeat; 
                      } 
                      const newTotal = qtyTimesRepeat * newUnitPrice; 
                      const updated = { ...it, unit_price: newUnitPrice, total: newTotal, total_try: newTotalTRY }; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    type="number"
                    step="0.01"
                    className="w-32 px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    value={it.description ?? ''}
                    onChange={(e)=>{ 
                      const updated = {...it, description: e.target.value}; 
                      setItemsSales(prev => prev.map(p => p.id === it.id ? updated : p));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const updated = {...it, isEditing: false};
                        saveItems('sales', [updated]);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setItemsSales(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                      }
                    }}
                    className="flex-1 min-w-[10rem] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Açıklama"
                  />
                  <div className="w-24 flex items-center gap-1 justify-end pr-1">
                    <button 
                      onClick={()=>{ 
                        const updated = {...it, isEditing: false}; 
                        saveItems('sales', [updated]); 
                      }} 
                      className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" 
                      title="Kaydet"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    </button>
                    <button onClick={()=>removeItem('sales', it.id)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </>
              ) : (
                // Görüntüleme modu
                <>
                  <div className="w-44 text-xs text-gray-900 dark:text-white">{getCategoryName(it.sub_category) || '-'}</div>
                  <div className="w-16 text-right pr-1 text-xs text-gray-900 dark:text-white">{Math.round(it.qty)}</div>
                  <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">{Math.round(it.repeat)}</div>
                  <div className="w-24 text-right pr-1 text-xs text-gray-900 dark:text-white">{formatNumber(it.unit_price)}</div>
                  <div className="w-28 text-right pr-1 text-xs font-semibold text-gray-900 dark:text-white">{formatNumber(it.total)}</div>
                  <div className="w-16 text-xs text-gray-900 dark:text-white">{it.currency}</div>
                  <div className="w-16 text-xs text-gray-900 dark:text-white">%{it.vat}</div>
                  <div className="w-16 text-right pr-1 text-xs text-gray-900 dark:text-white">{formatTRY(it.fx)}</div>
                  <div className="w-32 text-right pr-1 text-xs font-semibold text-gray-900 dark:text-white">{formatTRY(it.total_try)}</div>
                  <div className="flex-1 min-w-[10rem] text-xs text-gray-900 dark:text-white truncate">{it.description || '-'}</div>
                  <div className="w-36 text-xs text-gray-900 dark:text-white truncate">{getHotelNameFromData(it.hotel_id)}</div>
                  <div className="w-24 flex items-center gap-1 justify-end pr-1 group-hover:opacity-100 transition-opacity">
                    {canCreate && !isLocked && (
                      <button onClick={()=>addBelow('sales', it.id)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Satır Ekle">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                      </button>
                    )}
                    {canEdit && !isLocked && (
                      <button onClick={()=>editRow('sales', it.id)} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Düzenle">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    )}
                    {canDelete && !isLocked && (
                      <button onClick={()=>removeItem('sales', it.id)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Genel Toplamlar */}
        {itemsSales.length > 0 && (
          <div className="mt-4 bg-blue-600 dark:bg-blue-700 rounded-md p-3">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              <div className="w-44 text-sm font-bold text-white">GENEL TOPLAM</div>
              <div className="w-16"></div>
              <div className="w-20"></div>
              <div className="w-24"></div>
              <div className="w-28 text-right pr-1 text-sm font-bold text-white whitespace-nowrap">
                {Object.entries(totalsByCurrency(itemsSales)).map(([cur, val]: any) => `${formatNumber(Number(val || 0))} ${cur}`).join(' + ')}
              </div>
              <div className="w-16"></div>
              <div className="w-16"></div>
              <div className="w-16"></div>
              <div className="w-32 text-right pr-1 text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                {formatNumber(itemsSales.reduce((sum: number, item: any) => sum + (item.total_try || 0), 0))} TL
              </div>
              <div className="flex-1 min-w-0"></div>
              <div className="w-36"></div>
              <div className="w-24"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

