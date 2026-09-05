"use client";
import { Search, X } from "lucide-react";
import { usePermissions, Module } from "@/lib/permissions";
import { useMemo, useCallback, memo, useState, useEffect } from "react";
interface AccommodationTabProps {
  isLocked?: boolean;
  accommodationItems: any[];
  setAccommodationItems: (items: any[]) => void;
  projectId: string;
  activeHotelId?: string;
  accommodationSearch: string;
  setAccommodationSearch: (search: string) => void;
  handleAccommodationImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAccommodationExport: () => void;
  handleAccommodationClear: () => void;
  editingAccommodationIndex: number | null;
  setEditingAccommodationIndex: (index: number | null) => void;
  tempAccommodationItem: any;
  setTempAccommodationItem: (item: any) => void;
  handleAccommodationSave: () => void;
  handleAccommodationCancel: () => void;
  handleAccommodationEdit: (id: string) => void;
  handleAccommodationDelete: (id: string) => void;
  handleAccommodationAdd: (id: string) => void;
  handleAccommodationCopy: (id: string) => void;
  handleAccommodationReorder?: (sourceId: string, targetId: string) => void;
  formatDateAccommodation: (dateValue: any) => string;
  calculateDateColumns: (item: any, allItems?: any[]) => any;
}

// Gizlenebilir sütunlar
const HIDABLE_COLUMNS = ["PAKET", "OTEL", "UÇAK", "TOPLAM", "DÖVİZ"];

// Tarih sütunlarını dinamik olarak oluşturmak için fonksiyon
const getDynamicHeaders = (accommodationItems: any[]) => {
  // En erken giriş tarihini bul
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateStr.split(".");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
    }
    return new Date(dateStr);
  };
  let earliestDate: Date | null = null;
  accommodationItems.forEach(item => {
    const checkIn = parseDate(item.gelis_tarihi || item.giris_tarihi || item.checkin_date);
    if (checkIn && (!earliestDate || checkIn < earliestDate)) {
      earliestDate = checkIn;
    }
  });

  // En geç çıkış tarihini bul
  let latestDate: Date | null = null;
  accommodationItems.forEach(item => {
    const checkOut = parseDate(item.cikis_tarihi || item.cikis_tarihi || item.checkout_date);
    if (checkOut && (!latestDate || checkOut > latestDate)) {
      latestDate = checkOut;
    }
  });

  // Tarih aralığını hesapla (giriş dahil, çıkış hariç)
  const dateHeaders = [];
  if (earliestDate && latestDate) {
    const currentDate = new Date(earliestDate);
    while (currentDate < latestDate) {
      // Kısa tarih formatı (d.mmm)
      const shortDate = currentDate.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short"
      });
      dateHeaders.push(shortDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (earliestDate) {
    // Sadece giriş tarihi varsa 7 günlük varsayılan aralık
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(earliestDate);
      currentDate.setDate(currentDate.getDate() + i);
      const shortDate = currentDate.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short"
      });
      dateHeaders.push(shortDate);
    }
  } else {
    // Eğer tarih bulunamazsa varsayılan başlıkları kullan
    for (let i = 1; i <= 7; i++) {
      dateHeaders.push(`${i}. TARİH`);
    }
  }
  return ["İŞLEMLER", "ODA #", "ODA TİPİ", "YATAK TİPİ", "İSİM", "SOYİSİM", "ODA NO", "ODA NOTU", "GİRİŞ TARİHİ", "GELİŞ UÇUŞ KODU", "GELİŞ UÇAK KALKIŞ", "GELİŞ UÇAK İNİŞ", "ÇIKIŞ TARİHİ", "DÖNÜŞ UÇUŞ KODU", "DÖNÜŞ UÇAK KALKIŞ", "DÖNÜŞ UÇAK İNİŞ", ...dateHeaders, "GECELEME", "PAKET", "OTEL", "UÇAK", "TOPLAM", "DÖVİZ"];
};

// Sütun genişliklerini belirleyen helper fonksiyon
const getColumnWidth = (header: string) => {
  switch (header) {
    case "İŞLEMLER":
      return "w-32";
    // 128px - butonlar için
    case "ODA #":
      return "w-20";
    // 80px - numara girişi için
    case "ODA TİPİ":
      return "w-24";
    // 96px - dropdown için
    case "YATAK TİPİ":
      return "w-24";
    // 96px - yatak tipi girişi için
    case "İSİM":
    case "SOYİSİM":
      return "w-32";
    // 128px - isimler için
    case "ODA NO":
      return "w-20";
    // 80px - oda numarası için
    case "ODA NOTU":
      return "w-32";
    // 128px - notlar için
    case "GİRİŞ TARİHİ":
    case "ÇIKIŞ TARİHİ":
      return "w-28";
    // 112px - tarih girişi için
    case "GELİŞ UÇUŞ KODU":
    case "DÖNÜŞ UÇUŞ KODU":
      return "w-24";
    // 96px - uçuş kodu için
    case "GELİŞ UÇAK KALKIŞ":
    case "GELİŞ UÇAK İNİŞ":
    case "DÖNÜŞ UÇAK KALKIŞ":
    case "DÖNÜŞ UÇAK İNİŞ":
      return "w-28";
    // 112px - saat girişi için
    case "GECELEME":
      return "w-20";
    // 80px - sayı girişi için
    case "PAKET":
    case "OTEL":
    case "UÇAK":
    case "TOPLAM":
    case "DÖVİZ":
      return "w-24";
    // 96px - fiyat girişi için
    default:
      // Tarih sütunları için
      if (header.match(/^\d+\.\w+$/)) {
        return "w-20"; // 80px - tarih sütunları için daha dar
      }
      return "w-24";
    // 96px - varsayılan
  }
};
const AccommodationTabOptimized = memo(({
  isLocked,
  accommodationItems,
  setAccommodationItems,
  projectId,
  activeHotelId,
  accommodationSearch,
  setAccommodationSearch,
  handleAccommodationImport,
  handleAccommodationExport,
  handleAccommodationClear,
  editingAccommodationIndex,
  setEditingAccommodationIndex,
  tempAccommodationItem,
  setTempAccommodationItem,
  handleAccommodationSave,
  handleAccommodationCancel,
  handleAccommodationEdit,
  handleAccommodationDelete,
  handleAccommodationAdd,
  handleAccommodationCopy,
  handleAccommodationReorder,
  formatDateAccommodation,
  calculateDateColumns
}: AccommodationTabProps) => {
  const { canEdit, isSuperAdmin } = usePermissions();
  const permEdit = canEdit(Module.PROJECTS);
  const compIsLocked = isLocked || false;
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(HIDABLE_COLUMNS));
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const HEADER_KEY_MAP: Record<string, string> = {
    "ODA #": "oda_no",
    "ODA TİPİ": "oda_tipi",
    "YATAK TİPİ": "yatak_tipi",
    "İSİM": "isim",
    "SOYİSİM": "soyisim",
    "ODA NO": "oda_no_2",
    "ODA NOTU": "oda_notu",
    "GİRİŞ TARİHİ": "gelis_tarihi",
    "GELİŞ UÇUŞ KODU": "gelis_ucus_kodu",
    "GELİŞ UÇAK KALKIŞ": "gelis_ucak_kalkis",
    "GELİŞ UÇAK İNİŞ": "gelis_ucak_inis",
    "ÇIKIŞ TARİHİ": "cikis_tarihi",
    "DÖNÜŞ UÇUŞ KODU": "donus_ucus_kodu",
    "DÖNÜŞ UÇAK KALKIŞ": "donus_ucak_kalkis",
    "DÖNÜŞ UÇAK İNİŞ": "donus_ucak_inis",
    "GECELEME": "geceleme",
    "PAKET": "paket",
    "OTEL": "otel",
    "UÇAK": "ucak",
    "TOPLAM": "toplam",
    "DÖVİZ": "doviz"
  };
  const [searchInput, setSearchInput] = useState("");

  const allowDrop = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragStart = (e: React.DragEvent, id: string) => { 
      e.dataTransfer.setData("row_id", id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData("row_id");
      if (sourceId && sourceId !== targetId && handleAccommodationReorder) {
          handleAccommodationReorder(sourceId, targetId);
      }
  };

  useEffect(() => {
    if (editingAccommodationIndex !== null && tempAccommodationItem) {
      const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const [day, month, year] = dateStr.split(".");
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
        }
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const checkIn = parseDate(tempAccommodationItem.gelis_tarihi || "");
      const checkOut = parseDate(tempAccommodationItem.cikis_tarihi || "");

      if (checkIn && checkOut && checkOut > checkIn) {
        const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Sadece eğer geceleme değişmesi gerekiyorsa state'i güncelle (Sonsuz döngüyü engellemek için)
        if (String(tempAccommodationItem.geceleme) !== String(diffDays)) {
          setTempAccommodationItem(prev => ({
            ...prev,
            geceleme: String(diffDays)
          }));
        }
      }
    }
  }, [tempAccommodationItem?.gelis_tarihi, tempAccommodationItem?.cikis_tarihi, editingAccommodationIndex]);

  // Click outside handler for editing
  useEffect(() => {
    if (accommodationSearch && searchTags.length === 0) {
      setSearchTags(accommodationSearch.split(" ").filter((t: string) => t.trim() !== ""));
    }
  }, [accommodationSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        const newTags = [...searchTags, searchInput.trim()];
        setSearchTags(newTags);
        setAccommodationSearch(newTags.join(" "));
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      setAccommodationSearch(newTags.join(" "));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    setAccommodationSearch(newTags.join(" "));
  };

    useEffect(() => {
    const toggleCollapse = () => setIsCollapsed(prev => !prev);
    window.addEventListener('action-toggle-collapse-accommodation', toggleCollapse);
    

return () => {
      window.removeEventListener('action-toggle-collapse-accommodation', toggleCollapse);
    };
  }, []);
const toggleColumnVisibility = useCallback((column: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const newCollapsed = !prev;

      // Eğer daraltılıyorsa, gizlenebilir sütunları gizle
      if (newCollapsed) {
        setHiddenColumns(new Set(HIDABLE_COLUMNS));
      } else {
        // Eğer genişletiliyorsa, gizlenebilir sütunları göster
        setHiddenColumns(new Set());
      }
      return newCollapsed;
    });
  }, []);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAccommodationSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleAccommodationCancel();
    }
  }, [handleAccommodationSave, handleAccommodationCancel]);
  const hotelFilteredItems = useMemo(() => {
    if (activeHotelId && activeHotelId !== "all" && activeHotelId !== "general") {
      return accommodationItems.filter(item => item.hotel_id === activeHotelId);
    }
    return accommodationItems;
  }, [accommodationItems, activeHotelId]);

  // Filtrelenmiş veriler

  const filteredItems = useMemo(() => {
    if (!accommodationSearch.trim()) return hotelFilteredItems;
    const searchLower = accommodationSearch.toLowerCase();
    return hotelFilteredItems.filter(item => Object.values(item).some(value => value && value.toString().toLowerCase().includes(searchLower)));
  }, [hotelFilteredItems, accommodationSearch]);
  const sortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems;
    
    return [...filteredItems].sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      
      // Numerik değerleri doğru sıralamak için kontrol
      const numA = Number(valA);
      const numB = Number(valB);
      
      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);

  return <div className="space-y-4">
        {/* Üst Kontroller - Responsive */}
        <div className="w-full mb-4"><div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-300 dark:border-slate-700/50 rounded-lg min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          {searchTags.map((tag, idx) => <span key={`${tag}-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-medium">
              {tag}
              <button onClick={() => removeSearchTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100 ml-1 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>)}
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={searchTags.length === 0 ? "Konaklama ara... (Enter ile çoğalt)" : "Yeni arama..."} className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-200 min-w-[120px] py-0.5 focus:ring-0 placeholder:text-gray-500 dark:placeholder:text-gray-400" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} />
          {searchTags.length > 0 && <button onClick={() => {
            setSearchTags([]);
            setAccommodationSearch("");
          }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-v3-muted pl-1 shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </button>}
        </div></div>

        {/* Tablo */}
        {filteredItems.length > 0 ? <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {getDynamicHeaders(hotelFilteredItems).map((header, index) => {
                const isHidden = hiddenColumns.has(header);
                const isHidable = HIDABLE_COLUMNS.includes(header);
                if (isHidden) return null;
                const isNameColumn = header === "İSİM" || header === "SOYİSİM";
                return (
                  <th 
                    key={index} 
                    onClick={() => {
                      const key = HEADER_KEY_MAP[header];
                      if (key) {
                        let direction: 'asc' | 'desc' = 'asc';
                        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
                          direction = 'desc';
                        }
                        setSortConfig({ key, direction });
                      }
                    }}
                    className={`${getColumnWidth(header)} px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${header === "İŞLEMLER" ? "sticky left-0 bg-gray-50 dark:bg-gray-700 z-10" : ""} ${HEADER_KEY_MAP[header] ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" : ""}`}
                  >
                    <div className={`flex flex-col ${isNameColumn ? "items-start text-left" : "items-center text-center"}`}>
                      <div className="flex items-center gap-1">
                        <span className="leading-tight font-semibold">
                          {header.split(" ")[0]}
                        </span>
                        {sortConfig && sortConfig.key === HEADER_KEY_MAP[header] && (
                          <span className="text-blue-500 text-[10px]">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                      {header.includes(" ") && <span className="leading-tight text-xs opacity-75">
                        {header.split(" ").slice(1).join(" ")}
                      </span>}
                    </div>
                  </th>
                );
              })}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {sortedItems.map((item, index) => {
              const originalIndex = accommodationItems.findIndex((x: any) => x.id === item.id);
              return <tr 
                key={item.id || index} 
                draggable={!compIsLocked && permEdit && editingAccommodationIndex === null}
                onDragStart={(e) => handleDragStart(e, item.id || item.hotel_id)}
                onDragOver={allowDrop}
                onDrop={(e) => handleDrop(e, item.id || item.hotel_id)}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${permEdit && (!compIsLocked || isSuperAdmin) ? 'cursor-pointer' : ''}`}
                onDoubleClick={() => {
                  if (permEdit && (!compIsLocked || isSuperAdmin)) {
                    handleAccommodationEdit(item.id);
                  }
                }}
              >
                        {/* İşlemler Sütunu */}
                        <td className="w-40 px-2 py-1 sticky left-0 bg-white dark:bg-gray-800 z-10">
                          <div className="flex justify-center space-x-1">
                            {editingAccommodationIndex === originalIndex ? <>
                                <button onClick={handleAccommodationSave} className="p-1 bg-green-600 text-white rounded hover:bg-green-700" title="Kaydet">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button onClick={handleAccommodationCancel} className="p-1 bg-gray-600 text-v3-text rounded hover:bg-gray-700" title="İptal">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </> : <>
                                <button onClick={() => {
                        handleAccommodationDelete(item.id);
                      }} className="p-1 bg-red-600 text-white rounded hover:bg-red-700" title="Sil">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                <button onClick={() => handleAccommodationCopy(item.id)} className="p-1 bg-yellow-600 text-white rounded hover:bg-yellow-700" title="Kopyala">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button onClick={() => handleAccommodationAdd(item.id)} className="p-1 bg-green-600 text-white rounded hover:bg-green-700" title="Ekle">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                                <button onClick={() => handleAccommodationEdit(item.id)} className="p-1 bg-blue-500 text-white rounded hover:bg-blue-500/90" title="Düzenle">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </>}
                          </div>
                        </td>

                        {/* Diğer Sütunlar */}
                        <td className="w-20 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.oda_no || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    oda_no: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.oda_no || ""}
                            </span>}
                        </td>

                        <td className="w-24 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <select value={tempAccommodationItem.oda_tipi || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    oda_tipi: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)}>
                              <option value="">Seçiniz</option>
                              <option value="SNG">SNG</option>
                              <option value="DBL">DBL</option>
                              <option value="TRP">TRP</option>
                              <option value="SNG+CHD">SNG+CHD</option>
                              <option value="DBL+CHD">DBL+CHD</option>
                              <option value="TRP+CHD">TRP+CHD</option>
                              <option value="FAM">FAM</option>
                              <option value="FAM+CHD">FAM+CHD</option>
                              <option value="TWN">TWN</option>
                              <option value="TWIN+CHD">TWIN+CHD</option>
                              <option value="QUAD">QUAD</option>
                              <option value="QUAD+CHD">QUAD+CHD</option>
                              <option value="JRS">JRS</option>
                              <option value="DLXS">DLXS</option>
                              <option value="FAMS">FAMS</option>
                              <option value="KNGS">KNGS</option>
                              <option value="PRSS">PRSS</option>
                              <option value="CONN">CONN</option>
                              <option value="ACC">ACC</option>
                            </select> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.oda_tipi || ""}
                            </span>}
                        </td>

                        <td className="w-24 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.yatak_tipi || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    yatak_tipi: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.yatak_tipi || ""}
                            </span>}
                        </td>

                        <td className="w-32 px-1 py-1 text-left">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.isim || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    isim: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-left" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.isim || ""}
                            </span>}
                        </td>

                        <td className="w-32 px-1 py-1 text-left">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.soyisim || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    soyisim: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-left" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.soyisim || ""}
                            </span>}
                        </td>

                        <td className="w-24 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.oda_no_2 || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    oda_no_2: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.oda_no_2 || ""}
                            </span>}
                        </td>

                        <td className="w-32 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.oda_notu || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    oda_notu: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.oda_notu || ""}
                            </span>}
                        </td>

                        <td className="w-28 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.gelis_tarihi || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    gelis_tarihi: e.target.value
                  })} onKeyDown={handleKeyDown} placeholder="DD.MM.YYYY" className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.gelis_tarihi || ""}
                            </span>}
                        </td>

                        <td className="w-24 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.gelis_ucus_kodu || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    gelis_ucus_kodu: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.gelis_ucus_kodu || ""}
                            </span>}
                        </td>

                        <td className="w-28 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.gelis_ucak_kalkis || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    gelis_ucak_kalkis: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {formatDateAccommodation(item.gelis_ucak_kalkis)}
                            </span>}
                        </td>

                        <td className="w-28 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.gelis_ucak_inis || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    gelis_ucak_inis: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {formatDateAccommodation(item.gelis_ucak_inis)}
                            </span>}
                        </td>

                        <td className="w-28 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.cikis_tarihi || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    cikis_tarihi: e.target.value
                  })} onKeyDown={handleKeyDown} placeholder="DD.MM.YYYY" className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.cikis_tarihi || ""}
                            </span>}
                        </td>

                        <td className="w-24 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.donus_ucus_kodu || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    donus_ucus_kodu: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.donus_ucus_kodu || ""}
                            </span>}
                        </td>

                        <td className="w-28 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.donus_ucak_kalkis || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    donus_ucak_kalkis: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {formatDateAccommodation(item.donus_ucak_kalkis)}
                            </span>}
                        </td>

                        <td className="w-28 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.donus_ucak_inis || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    donus_ucak_inis: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {formatDateAccommodation(item.donus_ucak_inis)}
                            </span>}
                        </td>

                        {/* Dinamik Tarih Sütunları - Otomatik Hesaplanan */}
                        {(() => {
                  // En erken giriş tarihini bul
                  const parseDate = (dateStr: string) => {
                    if (!dateStr) return null;
                    if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                      const [day, month, year] = dateStr.split(".");
                      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
                    }
                    return new Date(dateStr);
                  };
                  let earliestDate: Date | null = null;
                  hotelFilteredItems.forEach(accItem => {
                    const checkIn = parseDate(accItem.gelis_tarihi || accItem.giris_tarihi || accItem.checkin_date);
                    if (checkIn && (!earliestDate || checkIn < earliestDate)) {
                      earliestDate = checkIn;
                    }
                  });

                  // En geç çıkış tarihini bul
                  let latestDate: Date | null = null;
                  hotelFilteredItems.forEach(accItem => {
                    const checkOut = parseDate(accItem.cikis_tarihi || accItem.cikis_tarihi || accItem.checkout_date);
                    if (checkOut && (!latestDate || checkOut > latestDate)) {
                      latestDate = checkOut;
                    }
                  });

                  // Tarih aralığını hesapla
                  const dateRange = [];
                  if (earliestDate && latestDate) {
                    const currentDate = new Date(earliestDate);
                    while (currentDate < latestDate) {
                      dateRange.push(new Date(currentDate));
                      currentDate.setDate(currentDate.getDate() + 1);
                    }
                  } else if (earliestDate) {
                    // Sadece giriş tarihi varsa 7 günlük varsayılan aralık
                    for (let i = 0; i < 7; i++) {
                      const currentDate = new Date(earliestDate);
                      currentDate.setDate(currentDate.getDate() + i);
                      dateRange.push(currentDate);
                    }
                  }
                  return dateRange.map((date, index) => {
                    const dayNum = index + 1;
                    return <td key={dayNum} className="w-20 px-1 py-1 text-center">
                                <span className="text-gray-900 dark:text-gray-100 font-medium text-xs">
                                  {item[`tarih${dayNum}`] || ""}
                                </span>
                              </td>;
                  });
                })()}

                        <td className="w-24 px-1 py-1 text-center">
                          {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.geceleme || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    geceleme: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                              {item.geceleme || ""}
                            </span>}
                        </td>

                        {/* Gizlenebilir Sütunlar */}
                        {!hiddenColumns.has("PAKET") && <td className="w-24 px-1 py-1 text-center">
                            {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.paket || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    paket: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                                {item.paket || ""}
                              </span>}
                          </td>}

                        {!hiddenColumns.has("OTEL") && <td className="w-24 px-1 py-1 text-center">
                            {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.otel || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    otel: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                                {item.otel || ""}
                              </span>}
                          </td>}

                        {!hiddenColumns.has("UÇAK") && <td className="w-24 px-1 py-1 text-center">
                            {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.ucak || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    ucak: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                                {item.ucak || ""}
                              </span>}
                          </td>}

                        {!hiddenColumns.has("TOPLAM") && <td className="w-24 px-1 py-1 text-center">
                            {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.toplam || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    toplam: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                                {item.toplam || ""}
                              </span>}
                          </td>}

                        {!hiddenColumns.has("DÖVİZ") && <td className="w-24 px-1 py-1 text-center">
                            {editingAccommodationIndex === originalIndex ? <input type="text" value={tempAccommodationItem.doviz || ""} onChange={e => setTempAccommodationItem({
                    ...tempAccommodationItem,
                    doviz: e.target.value
                  })} onKeyDown={handleKeyDown} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} /> : <span className="text-gray-900 dark:text-gray-100 text-xs">
                                {item.doviz || ""}
                              </span>}
                          </td>}
                      </tr>;
            })}
                </tbody>
              </table>
            </div>
          </div> : <div className="text-center py-8">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Henüz konaklama verisi yok. Excel dosyasından içe
              aktarabilirsiniz.
            </p>
          </div>}

        {/* Forecast Tablosu - ODA # Bazında Hesaplama */}
        {hotelFilteredItems.length > 0 && (() => {
      // Tarih parse fonksiyonu
      const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          const [day, month, year] = dateStr.split(".");
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
        }
        return new Date(dateStr);
      };

      // Kişi sayısı hesaplama fonksiyonu
      const getPaxCount = (roomType: string) => {
        const paxMap: {
          [key: string]: number;
        } = {
          SNG: 1,
          DBL: 2,
          TRP: 3,
          QUAD: 4,
          "SNG+CHD": 2,
          "DBL+CHD": 3,
          "TRP+CHD": 4,
          "QUAD+CHD": 5,
          FAM: 4,
          "FAM+CHD": 5,
          TWN: 2,
          "TWIN+CHD": 3,
          JRS: 1,
          DLXS: 2,
          FAMS: 6,
          KNGS: 2,
          PRSS: 1,
          CONN: 2,
          ACC: 1
        };
        return paxMap[roomType] || 1;
      };

      // ODA #'ya göre grupla
      const groupedByRoomNumber: {
        [key: string]: any[];
      } = {};
      hotelFilteredItems.forEach(item => {
        const roomNo = item.oda_no || "";
        if (roomNo) {
          if (!groupedByRoomNumber[roomNo]) {
            groupedByRoomNumber[roomNo] = [];
          }
          groupedByRoomNumber[roomNo].push(item);
        }
      });

      // En erken giriş ve en geç çıkış tarihlerini bul
      let minCheckIn: Date | null = null;
      let maxCheckOut: Date | null = null;
      Object.values(groupedByRoomNumber).forEach(roomGroup => {
        roomGroup.forEach(item => {
          const checkInDate = item.gelis_tarihi || item.giris_tarihi || item.checkin_date;
          const checkOutDate = item.cikis_tarihi || item.cikis_tarihi || item.checkout_date;
          if (checkInDate && checkOutDate) {
            const checkIn = parseDate(checkInDate);
            const checkOut = parseDate(checkOutDate);
            if (checkIn && checkOut && !isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
              if (!minCheckIn || checkIn < minCheckIn) {
                minCheckIn = checkIn;
              }
              if (!maxCheckOut || checkOut > maxCheckOut) {
                maxCheckOut = checkOut;
              }
            }
          }
        });
      });
      if (!minCheckIn || !maxCheckOut) {
        return null;
      }

      // Tarih aralığını oluştur (giriş dahil, çıkış hariç)
      const allDates: Date[] = [];
      const currentDate = new Date(minCheckIn);
      while (currentDate < maxCheckOut) {
        allDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Oda tiplerini topla - belirlenen sıralamaya göre
      const allRoomTypes = new Set<string>();
      Object.values(groupedByRoomNumber).forEach(roomGroup => {
        roomGroup.forEach(item => {
          const roomType = item.oda_tipi || item.room_type;
          if (roomType) {
            allRoomTypes.add(roomType);
          }
        });
      });

      // Belirlenen oda tipi sıralaması
      const roomTypeOrder = ["SNG", "DBL", "TRP", "SNG+CHD", "DBL+CHD", "TRP+CHD", "FAM", "FAM+CHD", "TWN", "TWIN+CHD", "QUAD", "QUAD+CHD", "JRS", "DLXS", "FAMS", "KNGS", "PRSS", "CONN", "ACC"];

      // Sıralamaya göre oda tiplerini düzenle
      const sortedRoomTypes = roomTypeOrder.filter(roomType => allRoomTypes.has(roomType));
      return <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-v3-border">
                  <h3 className="text-sm font-semibold text-v3-text flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Forecast - ODA # Bazında Analiz
                  </h3>
                </div>

                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Tarih
                          </th>
                          {sortedRoomTypes.map(roomType => <th key={roomType} className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {roomType}
                            </th>)}
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Toplam Oda
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Toplam Kişi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {allDates.map((date, index) => {
                  // Bu tarihte aktif olan ODA #'ları bul
                  const activeRoomNumbers = new Set<string>();
                  const roomTypeCounts: {
                    [key: string]: number;
                  } = {};
                  let totalPax = 0;
                  Object.entries(groupedByRoomNumber).forEach(([roomNo, roomGroup]) => {
                    // Bu ODA #'nın bu tarihte aktif olup olmadığını kontrol et
                    const isActive = roomGroup.some(item => {
                      const checkInDate = item.gelis_tarihi || item.giris_tarihi || item.checkin_date;
                      const checkOutDate = item.cikis_tarihi || item.cikis_tarihi || item.checkout_date;
                      if (!checkInDate || !checkOutDate) return false;
                      const checkIn = parseDate(checkInDate);
                      const checkOut = parseDate(checkOutDate);
                      if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                        return false;
                      }

                      // Giriş dahil, çıkış hariç
                      return date >= checkIn && date < checkOut;
                    });
                    if (isActive) {
                      activeRoomNumbers.add(roomNo);

                      // Bu ODA # için oda tipini belirle (ilk geçerli oda tipini al)
                      let roomType = "";
                      for (const item of roomGroup) {
                        const itemRoomType = item.oda_tipi || item.room_type;
                        if (itemRoomType) {
                          roomType = itemRoomType;
                          break;
                        }
                      }
                      if (roomType) {
                        roomTypeCounts[roomType] = (roomTypeCounts[roomType] || 0) + 1;
                      }

                      // Bu ODA #'daki toplam kişi sayısını hesapla (satır sayısı = kişi sayısı)
                      totalPax += roomGroup.length;
                    }
                  });
                  const totalRooms = activeRoomNumbers.size;
                  return <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-2 py-2 text-left text-xs text-v3-text font-medium">
                                {date.toLocaleDateString("tr-TR")}
                              </td>
                              {sortedRoomTypes.map(roomType => <td key={roomType} className="px-2 py-2 text-center text-xs text-v3-text">
                                  {roomTypeCounts[roomType] || 0}
                                </td>)}
                              <td className="px-2 py-2 text-center text-xs text-v3-text font-semibold bg-blue-500/10 dark:bg-blue-900/20">
                                {totalRooms}
                              </td>
                              <td className="px-2 py-2 text-center text-xs text-v3-text font-semibold bg-green-50 dark:bg-green-900/20">
                                {totalPax}
                              </td>
                            </tr>;
                })}
                      </tbody>
                      <tfoot className="bg-gray-100 dark:bg-gray-700">
                        <tr className="font-semibold">
                          <td className="px-2 py-2 text-left text-xs text-v3-text">
                            GENEL TOPLAM
                          </td>
                          {(() => {
                    // Genel toplamları hesapla
                    const totalRoomTypeCounts: {
                      [key: string]: number;
                    } = {};
                    let totalAllRooms = 0;
                    let totalAllPax = 0;

                    // Tüm günlerin toplamını hesapla
                    allDates.forEach(date => {
                      Object.entries(groupedByRoomNumber).forEach(([roomNo, roomGroup]) => {
                        const isActive = roomGroup.some(item => {
                          const checkInDate = item.gelis_tarihi || item.giris_tarihi || item.checkin_date;
                          const checkOutDate = item.cikis_tarihi || item.cikis_tarihi || item.checkout_date;
                          if (!checkInDate || !checkOutDate) return false;
                          const checkIn = parseDate(checkInDate);
                          const checkOut = parseDate(checkOutDate);
                          if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                            return false;
                          }
                          return date >= checkIn && date < checkOut;
                        });
                        if (isActive) {
                          totalAllRooms += 1;
                          totalAllPax += roomGroup.length;

                          // Oda tipini belirle
                          let roomType = "";
                          for (const item of roomGroup) {
                            const itemRoomType = item.oda_tipi || item.room_type;
                            if (itemRoomType) {
                              roomType = itemRoomType;
                              break;
                            }
                          }
                          if (roomType) {
                            totalRoomTypeCounts[roomType] = (totalRoomTypeCounts[roomType] || 0) + 1;
                          }
                        }
                      });
                    });
                    return sortedRoomTypes.map(roomType => <td key={roomType} className="px-2 py-2 text-center text-xs text-v3-text bg-blue-500/10 dark:bg-blue-900/20">
                                {totalRoomTypeCounts[roomType] || 0}
                              </td>);
                  })()}
                          <td className="px-2 py-2 text-center text-xs text-v3-text bg-blue-100 dark:bg-blue-800/30">
                            {(() => {
                      // Benzersiz ODA # sayısını hesapla
                      const uniqueRoomNumbers = new Set<string>();
                      allDates.forEach(date => {
                        Object.entries(groupedByRoomNumber).forEach(([roomNo, roomGroup]) => {
                          const isActive = roomGroup.some(item => {
                            const checkInDate = item.gelis_tarihi || item.giris_tarihi || item.checkin_date;
                            const checkOutDate = item.cikis_tarihi || item.cikis_tarihi || item.checkout_date;
                            if (!checkInDate || !checkOutDate) return false;
                            const checkIn = parseDate(checkInDate);
                            const checkOut = parseDate(checkOutDate);
                            if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                              return false;
                            }
                            return date >= checkIn && date < checkOut;
                          });
                          if (isActive) {
                            uniqueRoomNumbers.add(roomNo);
                          }
                        });
                      });
                      return uniqueRoomNumbers.size;
                    })()}
                          </td>
                          <td className="px-2 py-2 text-center text-xs text-v3-text bg-green-100 dark:bg-green-800/30">
                            {(() => {
                      // Toplam kişi sayısını hesapla
                      let totalPax = 0;
                      allDates.forEach(date => {
                        Object.entries(groupedByRoomNumber).forEach(([roomNo, roomGroup]) => {
                          const isActive = roomGroup.some(item => {
                            const checkInDate = item.gelis_tarihi || item.giris_tarihi || item.checkin_date;
                            const checkOutDate = item.cikis_tarihi || item.cikis_tarihi || item.checkout_date;
                            if (!checkInDate || !checkOutDate) return false;
                            const checkIn = parseDate(checkInDate);
                            const checkOut = parseDate(checkOutDate);
                            if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                              return false;
                            }
                            return date >= checkIn && date < checkOut;
                          });
                          if (isActive) {
                            totalPax += roomGroup.length;
                          }
                        });
                      });
                      return totalPax;
                    })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>;
    })()}
      </div>;
});
AccommodationTabOptimized.displayName = "AccommodationTabOptimized";
export default AccommodationTabOptimized;