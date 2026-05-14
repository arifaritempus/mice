'use client';

import { useRef } from 'react';

interface PurchaseTabProps {
  itemsPurchase: any[];
  setItemsPurchase: (items: any[]) => void;
  showAddRowPurchase: boolean;
  setShowAddRowPurchase: (show: boolean) => void;
  showCategoryModalPurchase: boolean;
  setShowCategoryModalPurchase: (show: boolean) => void;
  selectedCategoriesPurchase: Set<string>;
  setSelectedCategoriesPurchase: (selected: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  expandedCategoriesPurchase: Set<string>;
  setExpandedCategoriesPurchase: (expanded: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  newItem: any;
  setNewItem: (item: any) => void;
  categories: any[];
  mainCategories: any[];
  subCategoriesByMain: Record<string, any[]>;
  groupedPurchaseItems: any[];
  exportPurchaseToExcel: () => void;
  exportPurchaseToPDF: () => void;
  handleCreateLink: (itemId: string) => void;
  importQuoteItemsToPurchase: (forceReplace: boolean) => void;
  importSalesItemsToPurchase: (forceReplace: boolean) => void;
  isImportingSalesToPurchase?: boolean;
  saveItems: (side: 'sales' | 'purchase', items: any[]) => void;
  addItem: (side: 'sales' | 'purchase') => void;
  removeItem: (side: 'sales' | 'purchase', id: string) => void;
  editRow: (side: 'sales' | 'purchase', id: string) => void;
  addBelow: (side: 'sales' | 'purchase', itemId: string) => void;
  totalsByCurrency: (items: any[]) => Record<string, number>;
  formatNumber: (value: number) => string;
  formatTRY: (value: number) => string;
  getCategoryName: (id: string) => string;
  getVendorName: (id: string) => string;
  toggleAllCategories: (checked: boolean, side: 'sales' | 'purchase') => void;
  toggleCategoryExpansion: (mainCategoryId: string, side: 'sales' | 'purchase') => void;
  isCategoryExpanded: (mainCategoryId: string, side: 'sales' | 'purchase') => boolean;
  isAllSubCategoriesSelected: (mainCategoryId: string, side: 'sales' | 'purchase') => boolean;
  isSomeSubCategoriesSelected: (mainCategoryId: string, side: 'sales' | 'purchase') => boolean;
  handleAddSelectedCategories: (side: 'sales' | 'purchase') => void;
  toggleAllSubCategories: (mainCategoryId: string, checked: boolean, side: 'sales' | 'purchase') => void;
  CheckboxWithIndeterminate: React.ComponentType<{ checked: boolean; indeterminate: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }>;
  purchaseSupplierSearch: string;
  setPurchaseSupplierSearch: (search: string) => void;
  showPurchaseSupplierDropdown: boolean;
  setShowPurchaseSupplierDropdown: (show: boolean) => void;
  selectedPurchaseSupplierIndex: number;
  setSelectedPurchaseSupplierIndex: (index: number) => void;
  filteredPurchaseSuppliers: any[];
  handlePurchaseSupplierKeyDown: (e: React.KeyboardEvent, itemId: string) => void;
  handlePurchaseSupplierSelect: (supplier: any, itemId: string) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isLocked?: boolean;
  hotelsData: any[];
  hotels: any[];
}

export default function PurchaseTab({
  itemsPurchase,
  setItemsPurchase,
  showAddRowPurchase,
  setShowAddRowPurchase,
  showCategoryModalPurchase,
  setShowCategoryModalPurchase,
  selectedCategoriesPurchase,
  setSelectedCategoriesPurchase,
  expandedCategoriesPurchase,
  setExpandedCategoriesPurchase,
  newItem,
  setNewItem,
  categories,
  mainCategories,
  subCategoriesByMain,
  groupedPurchaseItems,
  exportPurchaseToExcel,
  exportPurchaseToPDF,
  handleCreateLink,
  importQuoteItemsToPurchase,
  importSalesItemsToPurchase,
  isImportingSalesToPurchase = false,
  saveItems,
  addItem,
  removeItem,
  editRow,
  addBelow,
  totalsByCurrency,
  formatNumber,
  formatTRY,
  getCategoryName,
  getVendorName,
  toggleAllCategories,
  toggleCategoryExpansion,
  isCategoryExpanded,
  isAllSubCategoriesSelected,
  isSomeSubCategoriesSelected,
  handleAddSelectedCategories,
  toggleAllSubCategories,
  CheckboxWithIndeterminate,
  purchaseSupplierSearch,
  setPurchaseSupplierSearch,
  showPurchaseSupplierDropdown,
  setShowPurchaseSupplierDropdown,
  selectedPurchaseSupplierIndex,
  setSelectedPurchaseSupplierIndex,
  filteredPurchaseSuppliers,
  handlePurchaseSupplierKeyDown,
  handlePurchaseSupplierSelect,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  isLocked = false,
  hotelsData,
  hotels,
}: PurchaseTabProps) {
  const categoryModalRefPurchase = useRef<HTMLDivElement>(null);

  // Gelişmiş isim çözücü: Önce hotelsData (Tab UUID) kontrolü yapar
  const getExtendedVendorName = (id?: string) => {
    if (!id) return '';
    if (id === 'general') return 'GENEL HİZMETLER';

    // 1. Önce hotelsData (Tab Verileri) içinden eşleştir
    const hData = (hotelsData || []).find(h => h && h.id === id);
    if (hData) {
      if (hData.hotel_name) return hData.hotel_name;
      // Master hotel listesinden isme bak
      const masterHotel = (hotels || []).find(ht => ht && ht.id === hData.hotel_id);
      return masterHotel?.name || hData.name || hData.hotel_name || id;
    }

    // 2. Prefix kontrolü (Tedarikçi veya Master Otel)
    if (id.startsWith('sup:')) {
      return getVendorName(id);
    }
    if (id.startsWith('hotel:')) {
      return getVendorName(id);
    }

    // 3. Doğrudan master hotel veya tedarikçi UUID'si ise
    const masterDirect = (hotels || []).find(ht => ht && ht.id === id);
    if (masterDirect) return masterDirect.name;
    
    return getVendorName(id) || id;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alış</h2>
        <div className="flex items-center gap-2">
          {!isLocked && (
            <button 
              onClick={() => {
                if (isLocked) {
                  alert('Bu proje kilitli olduğu için satış kalemleri içe aktarılamaz. Önce Projeler listesinden kilidi kaldırmanız gerekir.');
                  return;
                }
                importSalesItemsToPurchase(true);
              }} 
              className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLocked || isImportingSalesToPurchase}
            >
              {isImportingSalesToPurchase ? 'Aktarılıyor...' : 'Satış Kalemlerini İçe Aktar'}
            </button>
          )}
          <button onClick={exportPurchaseToExcel} className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600">
            Excel'e Aktar
          </button>
        </div>
      </div>
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
        <div className="w-36">OTEL / TEDARİKÇİ</div>
        <div className="w-24 flex items-center justify-between">
          <span>İŞLEMLER</span>
          {canCreate && !isLocked && (
            <button 
              onClick={() => {
                if (isLocked) {
                  alert('Bu proje kilitli olduğu için alış kaydı eklenemez. Önce Projeler listesinden kilidi kaldırmanız gerekir.');
                  return;
                }
                console.log('Başlık ekleme ikonuna tıklandı - kategori seçim modalı açılmalı (Alış)');
                setShowCategoryModalPurchase(true);
              }} 
              className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed" 
              title="Kategori Seç ve Ekle"
              disabled={isLocked}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6"/></svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Yeni satır ekleme (Alış) - En üstte */}
      {showAddRowPurchase && (
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
                      addItem('purchase'); 
                      setShowAddRowPurchase(false);
                    }
                  } 
                  if(e.key==='Escape'){ 
                    e.preventDefault();
                    setNewItem({ main_category: '', sub_category: '', description: '', qty: 1, repeat: 1, unit_price: 0, currency: 'EUR', vat: 0, fx: 1, supplier: '' }); 
                    setShowAddRowPurchase(false);
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
                    addItem('purchase'); 
                    setShowAddRowPurchase(false); 
                  }
                }}
                onKeyDown={(e) => { 
                  if(e.key==='Enter'){ 
                    if (newItem.main_category) {
                      addItem('purchase'); 
                      setShowAddRowPurchase(false);
                    }
                  } 
                  if(e.key==='Escape'){ 
                    setNewItem({}); 
                    setShowAddRowPurchase(false);
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
                onClick={() => { setNewItem({}); setShowAddRowPurchase(false); }}
                onKeyDown={(e) => { 
                  if(e.key==='Escape'){ 
                    setNewItem({}); 
                    setShowAddRowPurchase(false);
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

      {/* Kategori Seçim Modal - Alış */}
      {showCategoryModalPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={categoryModalRefPurchase} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kategori Seçin (Alış)
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModalPurchase(false);
                  setSelectedCategoriesPurchase(new Set());
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
                  onClick={() => toggleAllCategories(true, 'purchase')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={() => toggleAllCategories(false, 'purchase')}
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
                    const allSelected = isAllSubCategoriesSelected(mainCat.id, 'purchase');
                    const someSelected = isSomeSubCategoriesSelected(mainCat.id, 'purchase');
                    const isExpanded = isCategoryExpanded(mainCat.id, 'purchase');

                  return (
                    <div key={mainCat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Ana Kategori Header */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => toggleCategoryExpansion(mainCat.id, 'purchase')}
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
                                  toggleAllSubCategories(mainCat.id, e.target.checked, 'purchase');
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
                                toggleAllSubCategories(mainCat.id, true, 'purchase');
                            }}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Tümünü Seç
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                                toggleAllSubCategories(mainCat.id, false, 'purchase');
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
                                checked={selectedCategoriesPurchase.has(subCat.id)}
                                onChange={(e) => {
                                  setSelectedCategoriesPurchase(prev => {
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
                {selectedCategoriesPurchase.size} kategori seçildi
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCategoryModalPurchase(false);
                    setSelectedCategoriesPurchase(new Set());
                  }}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleAddSelectedCategories('purchase')}
                  disabled={selectedCategoriesPurchase.size === 0}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Seçili Kategorileri Ekle ({selectedCategoriesPurchase.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alış kalemleri - Ana kategorilere göre gruplu */}
      <div className="space-y-1">
        {groupedPurchaseItems.map((row: any, idx: number) => {
          if (row.type === 'header') {
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
                  <div className="w-16"></div>
                  <div className="w-20"></div>
                  <div className="w-24"></div>
                  <div className="w-28 text-right pr-1 whitespace-nowrap">{Object.entries(curMap).map(([cur, val]: any) => `${formatNumber(Number(val || 0))} ${cur}`).join(' + ')}</div>
                  <div className="w-16"></div>
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

          const it = row.item;
          return (
            <div
              key={it.id}
              className={`rounded-md p-2 flex flex-wrap md:flex-nowrap items-center gap-2 ${it.isEditing ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'}`}
            >
              {it.isEditing ? (
                <>
                  <div className="w-44">
                    <select 
                      value={it.sub_category} 
                      onChange={(e)=>{ 
                        const updated = {...it, sub_category: e.target.value}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }} 

                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Alt Kategori</option>
                      {categories.filter((c:any)=>c.parent_id===it.main_category).map((c:any)=> (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-16">
                    <input
                      value={it.qty ?? 0}
                      onChange={(e)=>{ 
                        const qty = Number(e.target.value);
                        const updated = {...it, qty, total: qty * it.repeat * it.unit_price, total_try: qty * it.repeat * it.unit_price * it.fx}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      type="number"
                      step="1"
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div className="w-20">
                    <input
                      value={it.repeat ?? 0}
                      onChange={(e)=>{ 
                        const repeat = Number(e.target.value);
                        const updated = {...it, repeat, total: it.qty * repeat * it.unit_price, total_try: it.qty * repeat * it.unit_price * it.fx}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      type="number"
                      step="1"
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      value={it.unit_price ?? 0}
                      onChange={(e)=>{ 
                        const unit_price = Number(e.target.value);
                        const updated = {...it, unit_price, total: it.qty * it.repeat * unit_price, total_try: it.qty * it.repeat * unit_price * it.fx}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      type="number"
                      step="0.01"
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="w-28 px-2 py-1 text-xs text-right text-gray-700 dark:text-gray-200">{formatNumber(it.total)}</div>
                  <div className="w-16">
                    <select 
                      value={it.currency} 
                      onChange={(e)=>{ 
                        const updated = {...it, currency: e.target.value}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }} 

                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option>EUR</option>
                      <option>USD</option>
                      <option>TL</option>
                    </select>
                  </div>
                  <div className="w-16">
                    <input
                      value={it.vat ?? 0}
                      onChange={(e)=>{ 
                        const updated = {...it, vat: Number(e.target.value)}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="5"
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      value={it.fx ?? 0}
                      onChange={(e)=>{ 
                        const fx = Number(e.target.value);
                        const updated = {...it, fx, total_try: it.qty * it.repeat * it.unit_price * fx}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      type="number"
                      step="0.0001"
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      value={it.total_try ?? 0}
                      onChange={(e)=>{ 
                        const newTotalTRY = Number(e.target.value) || 0; 
                        const qtyTimesRepeat = (Number(it.qty)||0) * (Number(it.repeat)||0); 
                        const fxVal = Number(it.fx)||0; 
                        let newUnitPrice = Number(it.unit_price)||0; 
                        if (fxVal > 0 && qtyTimesRepeat > 0) { 
                          newUnitPrice = newTotalTRY / fxVal / qtyTimesRepeat; 
                        } 
                        const newTotal = qtyTimesRepeat * newUnitPrice; 
                        const updated = { ...it, unit_price: newUnitPrice, total: newTotal, total_try: newTotalTRY }; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      type="number"
                      step="0.01"
                      className="w-full min-w-0 px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[10rem]">
                    <input
                      value={it.description ?? ''}
                      onChange={(e)=>{ 
                        const updated = {...it, description: e.target.value}; 
                        setItemsPurchase(prev => prev.map(p => p.id === it.id ? updated : p));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const updated = {...it, isEditing: false};
                          saveItems('purchase', [updated]);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setItemsPurchase(prev => prev.map(p => p.id === it.id ? { ...p, isEditing: false } : p));
                        }
                      }}
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Açıklama"
                    />
                  </div>
                  <div className="w-36 relative">
                    <input
                      type="text"
                      value={purchaseSupplierSearch || getExtendedVendorName((it as any).supplier || it.vendorId || it.hotel_id) || ''}
                      onChange={(e) => {
                        setPurchaseSupplierSearch(e.target.value);
                        setShowPurchaseSupplierDropdown(true);
                        setSelectedPurchaseSupplierIndex(-1);
                      }}
                      onFocus={() => {
                        setShowPurchaseSupplierDropdown(true);
                        setSelectedPurchaseSupplierIndex(-1);
                      }}
                      onKeyDown={(e) => handlePurchaseSupplierKeyDown(e, it.id)}
                      placeholder="Tedarikçi ara..."
                      className="w-full min-w-0 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {showPurchaseSupplierDropdown && (
                      <div className="purchase-supplier-dropdown absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredPurchaseSuppliers.map((supplier: any, index: number) => (
                          <div
                            key={supplier.id}
                            className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              index === selectedPurchaseSupplierIndex ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                            }`}
                            onClick={() => handlePurchaseSupplierSelect(supplier, it.id)}
                          >
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-[10px]">
                              {supplier.type === 'hotel' ? 'Otel' : 'Tedarikçi'}
                              {supplier.title && ` - ${supplier.title}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-24 flex items-center gap-1 justify-end pr-1">
                    {canEdit && (
                      <button 
                        onClick={()=>{ 
                          const updated = {...it, isEditing: false}; 
                          saveItems('purchase', [updated]); 
                        }} 
                        className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" 
                        title="Kaydet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={()=>removeItem('purchase', it.id)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-44 text-xs text-gray-900 dark:text-white">{getCategoryName(it.sub_category) || '-'}</div>
                  <div className="w-16 text-right pr-1 text-xs text-gray-900 dark:text-white">{Math.round(it.qty)}</div>
                  <div className="w-20 text-right pr-1 text-xs text-gray-900 dark:text-white">{Math.round(it.repeat)}</div>
                  <div className="w-24 text-right pr-1 text-xs text-gray-900 dark:text-white">{formatNumber(it.unit_price)}</div>
                  <div className="w-28 text-right pr-1 text-xs font-semibold text-gray-900 dark:text-white">{formatNumber(it.total)}</div>
                  <div className="w-16 text-xs text-gray-900 dark:text-white">{it.currency}</div>
                  <div className="w-16 text-xs text-gray-900 dark:text-white">%{it.vat}</div>
                  <div className="w-16 text-right pr-1 text-xs text-gray-900 dark:text-white">{formatNumber(it.fx)}</div>
                  <div className="w-32 text-right pr-1 text-xs font-semibold text-gray-900 dark:text-white">{formatTRY(it.total_try)}</div>
                  <div className="flex-1 min-w-[10rem] text-xs text-gray-900 dark:text-white truncate">{it.description || '-'}</div>
                  <div className="w-36 text-xs text-gray-900 dark:text-white truncate">
                    {getExtendedVendorName((it as any).supplier || it.vendorId || it.hotel_id) || '-'}
                  </div>
                  <div className="w-24 flex items-center gap-1 justify-end pr-1">
                    {canCreate && (
                      <button onClick={()=>addBelow('purchase', it.id)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Satır Ekle">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={()=>editRow('purchase', it.id)} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Düzenle">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={()=>removeItem('purchase', it.id)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Genel Toplamlar */}
      {itemsPurchase.length > 0 && (
        <div className="mt-4 bg-blue-600 dark:bg-blue-700 rounded-md p-3">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            <div className="w-44 text-sm font-bold text-white">GENEL TOPLAM</div>
            <div className="w-16"></div>
            <div className="w-20"></div>
            <div className="w-24"></div>
            <div className="w-28 text-right pr-1 text-sm font-bold text-white whitespace-nowrap">
              {Object.entries(totalsByCurrency(itemsPurchase)).map(([cur, val]: any) => `${formatNumber(Number(val || 0))} ${cur}`).join(' + ')}
            </div>
            <div className="w-16"></div>
            <div className="w-16"></div>
            <div className="w-16"></div>
            <div className="w-32 text-right pr-1 text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {formatNumber(itemsPurchase.reduce((sum: number, item: any) => sum + (item.total_try || 0), 0))} TL
            </div>
            <div className="flex-1 min-w-0"></div>
            <div className="w-36"></div>
            <div className="w-24"></div>
          </div>
        </div>
      )}
    </div>
  );
}
