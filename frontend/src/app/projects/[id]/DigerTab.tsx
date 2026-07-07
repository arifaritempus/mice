import { usePermissions, Module } from "@/lib/permissions";
"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { projectOthersService } from "@/lib/supabaseService";
import ConfirmModal from "@/components/ConfirmModal";
interface DigerTabProps {
  others: any[];
  categories: any[];
  suppliers: any[];
  hotels: any[];
  projectId: string;
  onUpdate: (updatedList: any[]) => void;
  isLocked?: boolean;
}

// Custom Dropdown bileşeni (Klavye navigasyonu destekli)
function AutocompleteInput({
  value,
  options,
  onSelect,
  placeholder,
  onKeyDownOuter,
  autoFocus = false,
  disabled
}: {
  value: string;
  options: {
    id: string;
    label: string;
    subLabel?: string;
  }[];
  onSelect: (id: string | null, label: string) => void;
  placeholder: string;
  onKeyDownOuter?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const selected = filteredOptions[highlightedIndex];
        onSelect(selected.id, selected.label);
        setSearchTerm(selected.label);
        setIsOpen(false);
      } else {
        if (onKeyDownOuter) onKeyDownOuter(e);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        setIsOpen(false);
        e.stopPropagation();
      } else {
        if (onKeyDownOuter) onKeyDownOuter(e);
      }
    } else {
      if (onKeyDownOuter) onKeyDownOuter(e);
    }
  };
  return <div className="relative" ref={wrapperRef}>
      <input type="text" title={searchTerm} placeholder={placeholder} value={searchTerm} onChange={e => {
      setSearchTerm(e.target.value);
      setIsOpen(true);
      setHighlightedIndex(-1);
      if (e.target.value.trim() === "") {
        onSelect(null, "");
      }
    }} onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown} autoFocus={autoFocus} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 truncate" disabled={disabled} />
      {isOpen && filteredOptions.length > 0 && <div className="absolute z-50 mt-1 w-full min-w-[200px] max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          {filteredOptions.map((opt, idx) => <div key={opt.id || opt.label} className={`px-2 py-1.5 text-xs cursor-pointer flex justify-between items-center ${highlightedIndex === idx ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} onMouseEnter={() => setHighlightedIndex(idx)} onClick={() => {
        onSelect(opt.id, opt.label);
        setSearchTerm(opt.label);
        setIsOpen(false);
      }}>
              <span className="truncate" title={opt.label}>{opt.label}</span>
              {opt.subLabel && <span className="text-[9px] text-gray-400 uppercase ml-2">{opt.subLabel}</span>}
            </div>)}
        </div>}
    </div>;
}
export default function DigerTab(props: DigerTabProps) {
  const {
    canEdit,
    isSuperAdmin
  } = usePermissions();
  const permEdit = canEdit(Module.PROJECTS);
  const compIsLocked = (props as any)?.isLocked || (props as any)?.project?.locked || false;
  const {
    others,
    categories,
    suppliers,
    hotels,
    projectId,
    onUpdate,
    isLocked = false
  } = props;
  const contactOptions = useMemo(() => {
    const s = (suppliers || []).map(sup => ({
      id: sup.id,
      label: sup.name,
      subLabel: 'Ted'
    }));
    const h = (hotels || []).map(hot => ({
      id: hot.id,
      label: hot.name,
      subLabel: 'Otel'
    }));
    return [...s, ...h].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [suppliers, hotels]);
  const mainCategoryOptions = useMemo(() => {
    return (categories || []).filter(c => !c.parent_id).map(c => ({
      id: c.id,
      label: c.name,
      order: c.sort_order || 9999
    })).sort((a, b) => a.order - b.order || (a.label || '').localeCompare(b.label || ''));
  }, [categories]);
  const getSubCategoryOptions = (mainCatName: string) => {
    if (!mainCatName) return [];
    const mainCat = categories?.find(c => c.name === mainCatName && !c.parent_id);
    if (!mainCat) return [];
    return (categories || []).filter(c => c.parent_id === mainCat.id).map(c => ({
      id: c.id,
      label: c.name,
      order: c.sort_order || 9999
    })).sort((a, b) => a.order - b.order || (a.label || '').localeCompare(b.label || ''));
  };
  const [localOthers, setLocalOthers] = useState<any[]>(others || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftItem, setDraftItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Search & Sort states
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  useEffect(() => {
    setLocalOthers(others || []);
  }, [others]);
  const formatNumberForDisplay = (val: any) => {
    if (val === null || val === undefined || val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };
  const cleanInputValue = (val: string) => {
    if (val.trim() === "") return null;
    return val.replace(/\./g, "").replace(",", ".");
  };
  const startEditing = (item: any) => {
    if (isLocked) return;
    setEditingId(item.id);
    setDraftItem({
      ...item
    });
  };
  const cancelEditing = () => {
    if (draftItem && draftItem.isNew) {
      const newList = localOthers.filter(i => i.id !== draftItem.id);
      setLocalOthers(newList);
    }
    setEditingId(null);
    setDraftItem(null);
  };
  const saveEditing = async () => {
    if (!draftItem || isLocked) return;
    const id = draftItem.id;
    const isNew = draftItem.isNew;
    const itemToSave = {
      ...draftItem
    };
    delete itemToSave.isNew;
    if (isNew) delete itemToSave.id;
    ['cost_amount', 'cost_exchange_rate', 'sale_amount', 'sale_exchange_rate'].forEach(field => {
      if (itemToSave[field] !== null && itemToSave[field] !== undefined) {
        const num = Number(itemToSave[field]);
        itemToSave[field] = isNaN(num) ? 0 : num;
      } else {
        itemToSave[field] = field.includes('rate') ? 1 : 0;
      }
    });

    // Hesaplanan alanları veritabanına göndermeden önce uçuralım (Supabase 400 hatası vermesin)
    delete itemToSave.cost_amount_try;
    delete itemToSave.sale_amount_try;
    try {
      let savedRecord;
      if (isNew) {
        savedRecord = await projectOthersService.create(itemToSave);
      } else {
        savedRecord = await projectOthersService.update(id, itemToSave);
      }
      savedRecord.cost_amount_try = (Number(savedRecord.cost_amount) || 0) * (Number(savedRecord.cost_exchange_rate) || 1);
      savedRecord.sale_amount_try = (Number(savedRecord.sale_amount) || 0) * (Number(savedRecord.sale_exchange_rate) || 1);
      const updatedList = localOthers.map(i => i.id === id ? savedRecord : i);
      setLocalOthers(updatedList);
      onUpdate(updatedList);
      setEditingId(null);
      setDraftItem(null);
    } catch (e) {
      console.error("Error saving record:", e);
      alert("Kayıt sırasında bir hata oluştu. Veri tipini kontrol edin (örn: sayılara harf yazmayın).");
    }
  };
  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditing();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchInput.trim() !== "") {
      if (!searchTerms.includes(searchInput.trim())) {
        setSearchTerms([...searchTerms, searchInput.trim()]);
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && searchInput === "" && searchTerms.length > 0) {
      setSearchTerms(searchTerms.slice(0, -1));
    }
  };
  const addManualRecord = () => {
    if (isLocked) return;
    const newId = "temp-" + Date.now();
    const newRecord = {
      id: newId,
      isNew: true,
      project_id: projectId,
      date: new Date().toISOString().split('T')[0],
      contact_id: null,
      contact_name: "",
      category_name: "",
      sub_category_name: "",
      description: "",
      cost_amount: 0,
      cost_currency: "EUR",
      cost_exchange_rate: 1,
      cost_amount_try: 0,
      sale_amount: 0,
      sale_currency: "EUR",
      sale_exchange_rate: 1,
      sale_amount_try: 0
    };
    const newList = [newRecord, ...localOthers];
    setLocalOthers(newList);
    startEditing(newRecord);
  };
  const deleteRecord = async (id: string) => {
    if (isLocked) return;
    try {
      if (!id.startsWith("temp-")) {
        await projectOthersService.delete(id);
      }
      const newList = localOthers.filter(item => item.id !== id);
      setLocalOthers(newList);
      onUpdate(newList);
    } catch (e) {
      console.error("Error deleting record:", e);
    }
    setDeleteConfirm(null);
  };
  const exportToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Diğer Kayıtlar');
      sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.3,
          bottom: 0.3,
          header: 0.1,
          footer: 0.1
        }
      } as any;
      const topBandRow = sheet.addRow([]);
      topBandRow.height = 70;
      sheet.mergeCells('A1:K1');
      for (let c = 1; c <= 11; c++) {
        sheet.getRow(1).getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'FF232F38'
          }
        } as any;
      }
      try {
        const {
          getLogosForExcel
        } = await import('@/utils/logoUtils');
        const {
          iconLogoBase64,
          wordmarkLogoBase64
        } = await getLogosForExcel(true);
        const inchToPx = (inch: number) => Math.round(inch * 96);
        const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
        if (iconLogoBase64) {
          const iconId = workbook.addImage({
            base64: iconLogoBase64,
            extension: guessExt(iconLogoBase64)
          });
          sheet.addImage(iconId, {
            tl: {
              col: 0.15,
              row: 0.15
            },
            ext: {
              width: inchToPx(1.25),
              height: inchToPx(0.70)
            } as any
          } as any);
        }
        if (wordmarkLogoBase64) {
          const markId = workbook.addImage({
            base64: wordmarkLogoBase64,
            extension: guessExt(wordmarkLogoBase64)
          });
          sheet.addImage(markId, {
            tl: {
              col: 8.5,
              row: 0.23
            },
            ext: {
              width: inchToPx(2.4),
              height: inchToPx(0.55)
            } as any
          } as any);
        }
      } catch (e) {
        console.warn("Logo eklenemedi:", e);
      }
      sheet.columns = [{
        header: 'Tarih',
        key: 'date',
        width: 14
      }, {
        header: 'Otel/Tedarikçi',
        key: 'contact',
        width: 25
      }, {
        header: 'Ana Kategori',
        key: 'main_cat',
        width: 20
      }, {
        header: 'Alt Kategori',
        key: 'sub_cat',
        width: 20
      }, {
        header: 'Açıklama',
        key: 'desc',
        width: 35
      }, {
        header: 'Maliyet',
        key: 'cost_amount',
        width: 15
      }, {
        header: 'M.Döviz',
        key: 'cost_cur',
        width: 10
      }, {
        header: 'M.Top (TL)',
        key: 'cost_try',
        width: 15
      }, {
        header: 'Satış',
        key: 'sale_amount',
        width: 15
      }, {
        header: 'S.Döviz',
        key: 'sale_cur',
        width: 10
      }, {
        header: 'S.Top (TL)',
        key: 'sale_try',
        width: 15
      }];
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      headerRow.eachCell(cell => {
        cell.font = {
          bold: true,
          color: {
            argb: 'FFFFFFFF'
          }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'FF2F3B46'
          }
        } as any;
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        } as any;
      });
      for (const item of filteredOthers) {
        if (item.isNew) continue;
        sheet.addRow({
          date: item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '',
          contact: item.contact_name || '',
          main_cat: item.category_name || '',
          sub_cat: item.sub_category_name || '',
          desc: item.description || '',
          cost_amount: Number(item.cost_amount || 0),
          cost_cur: item.cost_currency || '',
          cost_try: Number(item.cost_amount_try || 0),
          sale_amount: Number(item.sale_amount || 0),
          sale_cur: item.sale_currency || '',
          sale_try: Number(item.sale_amount_try || 0)
        });
      }
      ['cost_amount', 'cost_try', 'sale_amount', 'sale_try'].forEach(key => {
        sheet.getColumn(key).numFmt = '#,##0.00';
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diger_kayitlar_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error('Excel export hatası:', e);
      alert('Excel dosyası oluşturulurken bir hata oluştu.');
    }
  };
  const CURRENCIES = ["EUR", "TRY", "USD", "GBP"];
  const filteredOthers = useMemo(() => {
    let result = localOthers;
    if (searchTerms.length > 0) {
      result = result.filter(item => {
        if (item.isNew) return true; // Don't filter out new rows
        const textToSearch = [item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '', item.contact_name, item.category_name, item.sub_category_name, item.description, item.cost_amount, item.sale_amount, item.cost_currency, item.sale_currency].join(" ").toLowerCase();
        return searchTerms.every(term => textToSearch.includes(term.toLowerCase()));
      });
    }
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        if (a.isNew) return -1;
        if (b.isNew) return 1;
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        if (valA === null || valA === undefined) valA = "";
        if (valB === null || valB === undefined) valB = "";
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [localOthers, searchTerms, sortColumn, sortDirection]);
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');else setSortColumn(null); // Clear sort
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  const SortIcon = ({
    column
  }: {
    column: string;
  }) => {
    if (sortColumn !== column) return <span className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 text-[10px]">↕</span>;
    return <span className="ml-1 text-indigo-500 text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };
  const thClass = "px-2 py-2 font-semibold cursor-pointer select-none group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";
  const totalsBySupplierAndCurrency = useMemo(() => {
    const totals: Record<string, any> = {};
    filteredOthers.forEach(item => {
      if (item.isNew) return;
      const supplier = item.contact_name || "Diğer/Bilinmeyen";
      if (!totals[supplier]) {
        totals[supplier] = {
          costs: {},
          sales: {},
          totalCostTry: 0,
          totalSaleTry: 0
        };
      }
      const cCur = item.cost_currency || "EUR";
      const sCur = item.sale_currency || "EUR";
      totals[supplier].costs[cCur] = (totals[supplier].costs[cCur] || 0) + (Number(item.cost_amount) || 0);
      totals[supplier].sales[sCur] = (totals[supplier].sales[sCur] || 0) + (Number(item.sale_amount) || 0);
      totals[supplier].totalCostTry += Number(item.cost_amount_try) || 0;
      totals[supplier].totalSaleTry += Number(item.sale_amount_try) || 0;
    });
    return totals;
  }, [filteredOthers]);
  return <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Diğer Kayıtlar
        </h2>
        
        {/* Search Bar */}
        <div className="flex-1 w-full max-w-2xl px-4">
          <div className="relative flex flex-wrap items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
            <div className="flex flex-wrap gap-1.5 pl-2 flex-1 items-center">
              {searchTerms.map(term => <span key={term} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  {term}
                  <button onClick={() => setSearchTerms(searchTerms.filter(t => t !== term))} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                    &times;
                  </button>
                </span>)}
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={searchTerms.length === 0 ? "Arama yap... (Enter'a basarak ekle)" : "Arama ekle..."} className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 min-w-[120px] py-0.5 focus:ring-0 placeholder:text-gray-400" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
            </div>
            {searchTerms.length > 0 && <button onClick={() => setSearchTerms([])} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pr-1">
                Temizle
              </button>}
          </div>
        </div>

        <div className="flex gap-2 whitespace-nowrap">
          <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel Export
          </button>
          {!isLocked && <button onClick={addManualRecord} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Kayıt Ekle
            </button>}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-900/50 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className={`w-28 ${thClass}`} onClick={() => handleSort('date')}>
                  <div className="flex items-center">Tarih <SortIcon column="date" /></div>
                </th>
                <th className={`min-w-[140px] ${thClass}`} onClick={() => handleSort('contact_name')}>
                  <div className="flex items-center">Otel/Tedarikçi <SortIcon column="contact_name" /></div>
                </th>
                <th className={`w-32 ${thClass}`} onClick={() => handleSort('category_name')}>
                  <div className="flex items-center">Ana Kategori <SortIcon column="category_name" /></div>
                </th>
                <th className={`w-32 ${thClass}`} onClick={() => handleSort('sub_category_name')}>
                  <div className="flex items-center">Alt Kategori <SortIcon column="sub_category_name" /></div>
                </th>
                <th className={`min-w-[120px] ${thClass}`} onClick={() => handleSort('description')}>
                  <div className="flex items-center">Açıklama <SortIcon column="description" /></div>
                </th>
                <th className={`w-24 text-right ${thClass}`} onClick={() => handleSort('cost_amount')}>
                  <div className="flex items-center justify-end">Maliyet <SortIcon column="cost_amount" /></div>
                </th>
                <th className={`w-16 ${thClass}`} onClick={() => handleSort('cost_currency')}>
                  <div className="flex items-center">Döviz <SortIcon column="cost_currency" /></div>
                </th>
                <th className={`w-16 text-right ${thClass}`} onClick={() => handleSort('cost_exchange_rate')}>
                  <div className="flex items-center justify-end">Kur <SortIcon column="cost_exchange_rate" /></div>
                </th>
                <th className={`w-24 text-right ${thClass}`} onClick={() => handleSort('cost_amount_try')}>
                  <div className="flex items-center justify-end">Top. Mlyt(TL) <SortIcon column="cost_amount_try" /></div>
                </th>
                <th className={`w-24 text-right border-l border-gray-200 dark:border-gray-700 ${thClass}`} onClick={() => handleSort('sale_amount')}>
                  <div className="flex items-center justify-end">Satış <SortIcon column="sale_amount" /></div>
                </th>
                <th className={`w-16 ${thClass}`} onClick={() => handleSort('sale_currency')}>
                  <div className="flex items-center">Döviz <SortIcon column="sale_currency" /></div>
                </th>
                <th className={`w-16 text-right ${thClass}`} onClick={() => handleSort('sale_exchange_rate')}>
                  <div className="flex items-center justify-end">Kur <SortIcon column="sale_exchange_rate" /></div>
                </th>
                <th className={`w-24 text-right ${thClass}`} onClick={() => handleSort('sale_amount_try')}>
                  <div className="flex items-center justify-end">Top. Stş(TL) <SortIcon column="sale_amount_try" /></div>
                </th>
                <th className="px-2 py-2 w-12 text-center font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredOthers.length === 0 ? <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Arama kriterlerine uygun kayıt bulunamadı.
                  </td>
                </tr> : filteredOthers.map(item => {
              const isEditing = editingId === item.id;
              const currentItem = isEditing ? draftItem : item;
              return <tr key={item.id} onDoubleClick={() => !isLocked && !isEditing && startEditing(item)} className={`group transition-colors ${isEditing ? "bg-indigo-50/40 dark:bg-indigo-900/10 ring-1 ring-inset ring-indigo-500/20" : "hover:bg-gray-50/80 dark:hover:bg-gray-800/60"}`}>
                      {/* Tarih */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <input type="date" value={currentItem.date || ""} onChange={e => setDraftItem({
                    ...draftItem,
                    date: e.target.value
                  })} onKeyDown={handleGlobalKeyDown} autoFocus className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="font-mono text-gray-700 dark:text-gray-300">
                            {currentItem.date ? new Date(currentItem.date).toLocaleDateString('tr-TR') : '-'}
                          </span>}
                      </td>

                      {/* Otel/Tedarikçi */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <AutocompleteInput value={currentItem.contact_name || ""} options={contactOptions} placeholder="Seç veya yaz..." onKeyDownOuter={handleGlobalKeyDown} onSelect={(id, label) => setDraftItem({
                    ...draftItem,
                    contact_id: id,
                    contact_name: label
                  })} disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="font-medium text-indigo-700 dark:text-indigo-300 truncate block max-w-[180px]" title={currentItem.contact_name || '-'}>
                            {currentItem.contact_name || '-'}
                          </span>}
                      </td>

                      {/* Ana Kategori */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <AutocompleteInput value={currentItem.category_name || ""} options={mainCategoryOptions} placeholder="Ana Kategori" onKeyDownOuter={handleGlobalKeyDown} onSelect={(id, label) => setDraftItem({
                    ...draftItem,
                    category_name: label,
                    sub_category_name: ""
                  })} disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="text-gray-700 dark:text-gray-300 text-xs block truncate max-w-[120px]" title={currentItem.category_name || '-'}>
                            {currentItem.category_name || '-'}
                          </span>}
                      </td>

                      {/* Alt Kategori */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <AutocompleteInput value={currentItem.sub_category_name || ""} options={getSubCategoryOptions(currentItem.category_name)} placeholder="Alt Kategori" onKeyDownOuter={handleGlobalKeyDown} onSelect={(id, label) => setDraftItem({
                    ...draftItem,
                    sub_category_name: label
                  })} disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="text-gray-600 dark:text-gray-400 text-xs block truncate max-w-[120px]" title={currentItem.sub_category_name || '-'}>
                            {currentItem.sub_category_name || '-'}
                          </span>}
                      </td>

                      {/* Açıklama */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <input type="text" value={currentItem.description || ""} onChange={e => setDraftItem({
                    ...draftItem,
                    description: e.target.value
                  })} onKeyDown={handleGlobalKeyDown} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500 truncate" title={currentItem.description || ""} placeholder="Açıklama" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="text-gray-600 dark:text-gray-400 block max-w-[200px] truncate" title={currentItem.description}>
                            {currentItem.description || '-'}
                          </span>}
                      </td>

                      {/* Maliyet Tutarı */}
                      <td className="px-2 py-1.5 align-middle text-right">
                        {isEditing ? <input type="text" value={currentItem.cost_amount ?? ""} onChange={e => setDraftItem({
                    ...draftItem,
                    cost_amount: cleanInputValue(e.target.value)
                  })} onKeyDown={handleGlobalKeyDown} className="w-16 text-right px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="font-semibold text-red-600 dark:text-red-400">
                            {formatNumberForDisplay(currentItem.cost_amount)}
                          </span>}
                      </td>

                      {/* Maliyet Döviz */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <select value={currentItem.cost_currency || "EUR"} onChange={e => setDraftItem({
                    ...draftItem,
                    cost_currency: e.target.value
                  })} onKeyDown={handleGlobalKeyDown} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select> : <span className="text-gray-700 dark:text-gray-300 font-medium">{currentItem.cost_currency || "EUR"}</span>}
                      </td>

                      {/* Maliyet Kur */}
                      <td className="px-2 py-1.5 align-middle text-right">
                        {isEditing ? <input type="text" value={currentItem.cost_exchange_rate ?? "1"} onChange={e => setDraftItem({
                    ...draftItem,
                    cost_exchange_rate: cleanInputValue(e.target.value)
                  })} onKeyDown={handleGlobalKeyDown} className="w-12 text-right px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatNumberForDisplay(currentItem.cost_exchange_rate)}
                          </span>}
                      </td>

                      {/* Toplam Maliyet TL */}
                      <td className="px-2 py-1.5 align-middle text-right">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {formatNumberForDisplay(isEditing ? (Number(currentItem.cost_amount) || 0) * (Number(currentItem.cost_exchange_rate) || 1) : currentItem.cost_amount_try)}
                        </span>
                      </td>

                      {/* Satış Tutarı */}
                      <td className="px-2 py-1.5 align-middle text-right border-l border-gray-200 dark:border-gray-700">
                        {isEditing ? <input type="text" value={currentItem.sale_amount ?? ""} onChange={e => setDraftItem({
                    ...draftItem,
                    sale_amount: cleanInputValue(e.target.value)
                  })} onKeyDown={handleGlobalKeyDown} className="w-16 text-right px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatNumberForDisplay(currentItem.sale_amount)}
                          </span>}
                      </td>

                      {/* Satış Döviz */}
                      <td className="px-2 py-1.5 align-middle">
                        {isEditing ? <select value={currentItem.sale_currency || "EUR"} onChange={e => setDraftItem({
                    ...draftItem,
                    sale_currency: e.target.value
                  })} onKeyDown={handleGlobalKeyDown} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select> : <span className="text-gray-700 dark:text-gray-300 font-medium">{currentItem.sale_currency || "EUR"}</span>}
                      </td>

                      {/* Satış Kur */}
                      <td className="px-2 py-1.5 align-middle text-right">
                        {isEditing ? <input type="text" value={currentItem.sale_exchange_rate ?? "1"} onChange={e => setDraftItem({
                    ...draftItem,
                    sale_exchange_rate: cleanInputValue(e.target.value)
                  })} onKeyDown={handleGlobalKeyDown} className="w-12 text-right px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatNumberForDisplay(currentItem.sale_exchange_rate)}
                          </span>}
                      </td>

                      {/* Toplam Satış TL */}
                      <td className="px-2 py-1.5 align-middle text-right">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {formatNumberForDisplay(isEditing ? (Number(currentItem.sale_amount) || 0) * (Number(currentItem.sale_exchange_rate) || 1) : currentItem.sale_amount_try)}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td className="px-2 py-1.5 align-middle text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? <>
                              <button onClick={saveEditing} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Kaydet (Enter)">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button onClick={cancelEditing} className="p-1 text-gray-500 hover:bg-gray-200 rounded" title="İptal (Esc)">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </> : <button onClick={() => startEditing(item)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Düzenle">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>}
                          {!isLocked && <button onClick={() => setDeleteConfirm(item.id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Sil">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>}
                        </div>
                      </td>
                    </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Supplier Totals Summary at Bottom */}
      {filteredOthers.length > 0 && Object.keys(totalsBySupplierAndCurrency).length > 0 && <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
            Tedarikçi Bazlı Toplamlar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(totalsBySupplierAndCurrency).map(([supplier, data]) => <div key={supplier} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 truncate" title={supplier}>
                  {supplier}
                </div>
                
                {/* Costs */}
                <div className="mb-2">
                  <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1 border-b border-gray-200 dark:border-gray-700 pb-0.5">Maliyetler</div>
                  {Object.entries(data.costs).map(([cur, amount]) => amount ? <div key={cur} className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 dark:text-gray-400">{cur}</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{formatNumberForDisplay(amount)}</span>
                    </div> : null)}
                  <div className="flex justify-between text-xs mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Toplam TL</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumberForDisplay(data.totalCostTry)} ₺</span>
                  </div>
                </div>

                {/* Sales */}
                <div>
                  <div className="text-[10px] uppercase text-gray-500 font-semibold mb-1 border-b border-gray-200 dark:border-gray-700 pb-0.5 mt-2">Satışlar</div>
                  {Object.entries(data.sales).map(([cur, amount]) => amount ? <div key={cur} className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600 dark:text-gray-400">{cur}</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatNumberForDisplay(amount)}</span>
                    </div> : null)}
                  <div className="flex justify-between text-xs mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Toplam TL</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumberForDisplay(data.totalSaleTry)} ₺</span>
                  </div>
                </div>
              </div>)}
          </div>
        </div>}

      {deleteConfirm && <ConfirmModal isOpen={!!deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={() => deleteRecord(deleteConfirm)} title="Kaydı Sil" message="Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz." />}
    </div>;
}