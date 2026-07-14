"use client";
import { usePermissions, Module } from "@/lib/permissions";
import React from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
interface FlightTicket {
  id: string;
  biletlemeTarihi: string;
  tedarikci: string;
  havayolu: string;
  pnr: string;
  ucusTipi: string;
  gidisTarihi: string;
  gidisSaati: string;
  gidisUcusKodu: string;
  donusTarihi: string;
  donusSaati: string;
  donusUcusKodu: string;
  guzergah: string;
  kisiSayisi: number;
  ppMaliyet: number;
  toplamMaliyet: number;
  doviz: string;
  kur: number;
  toplamTl: number;
  satisPax?: number | any;
  ppSatis?: number | any;
  toplamSatis?: number | any;
  satisDoviz?: string;
  satisKur?: number | any;
  toplamSatisTl?: number | any;
  misafirler: string;
  durum: "aktif" | "iptal" | "iade" | "degistirildi";
  islemler?: string;
}
interface UcakBiletiTabProps {
  isLocked?: boolean;
  flightTickets: FlightTicket[];
  setFlightTickets: (tickets: FlightTicket[]) => void;
  flightTicketSearch: string;
  setFlightTicketSearch: (search: string) => void;
  flightSortField: string;
  flightSortDirection: "asc" | "desc";
  handleFlightSort: (field: string) => void;
  editingFlightIndex: number | null;
  setEditingFlightIndex: (index: number | null) => void;
  tempFlightItem: FlightTicket | null;
  setTempFlightItem: (item: FlightTicket | null) => void;
  isNewFlightItem: boolean;
  setIsNewFlightItem: (isNew: boolean) => void;
  handleFlightAdd: () => void;
  handleFlightEdit: (index: number) => void;
  handleFlightSave: () => void;
  handleFlightCancel: () => void;
  handleFlightDelete: (index: number) => void;
  handleFlightImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFlightExport: () => void;
  handleFlightClear: () => void;
  filteredFlightTickets: FlightTicket[];
  sortedFlightTickets: FlightTicket[];
  formatNumberForDisplay: (value: number | string) => string;
  formatDateForDisplay: (dateValue: any) => string;
  flightTotals: Record<string, {
    kisiSayisi: number;
    ppMaliyet: number;
    toplamMaliyet: number;
    toplamTl: number;
  }>;
  suppliers: any[];
  hotels: any[];
  allSuppliers: any[];
  filteredHotelSuppliers: any[];
  supplierDropdowns: {
    [key: string]: {
      isOpen: boolean;
      searchTerm: string;
      selectedIndex: number;
    };
  };
  setSupplierDropdowns: (value: {
    [key: string]: {
      isOpen: boolean;
      searchTerm: string;
      selectedIndex: number;
    };
  } | ((prev: {
    [key: string]: {
      isOpen: boolean;
      searchTerm: string;
      selectedIndex: number;
    };
  }) => {
    [key: string]: {
      isOpen: boolean;
      searchTerm: string;
      selectedIndex: number;
    };
  })) => void;
  toggleSupplierDropdown: (flightTicketId: string) => void;
  updateSupplierSearch: (flightTicketId: string, searchTerm: string) => void;
  selectFlightSupplier: (flightTicketId: string, supplierId: string, supplierName: string) => void;
  handleSupplierKeyDown: (e: React.KeyboardEvent, flightTicketId: string) => void;
}

// DigerTab'dan kopyalanan AutocompleteInput componenti
function AutocompleteInput({
  value,
  options,
  placeholder,
  onSelect,
  onKeyDownOuter,
  disabled
}: {
  value: string;
  options: {
    id: string;
    label: string;
  }[];
  placeholder: string;
  onSelect: (id: string | null, label: string) => void;
  onKeyDownOuter?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    const lower = inputValue.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(lower));
  }, [options, inputValue]);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);else setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);else setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation(); // Prevents outer form save on select
        if (filteredOptions[highlightedIndex]) {
          const selected = filteredOptions[highlightedIndex];
          setInputValue(selected.label);
          onSelect(selected.id, selected.label);
        } else if (inputValue) {
          onSelect(null, inputValue);
        }
        setIsOpen(false);
      } else {
        if (onKeyDownOuter) onKeyDownOuter(e);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      } else {
        if (onKeyDownOuter) onKeyDownOuter(e);
      }
    } else {
      if (onKeyDownOuter) onKeyDownOuter(e);
    }
  };
  return <div className="relative w-full" ref={wrapperRef}>
      <input ref={inputRef} type="text" value={inputValue} onChange={e => {
      setInputValue(e.target.value);
      setIsOpen(true);
      setHighlightedIndex(0);
      onSelect(null, e.target.value);
    }} onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown} placeholder={placeholder} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 truncate" disabled={disabled} />
      {isOpen && filteredOptions.length > 0 && <ul className="absolute z-50 mt-1 max-h-48 w-full min-w-[200px] overflow-auto rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1 text-xs">
          {filteredOptions.map((opt, index) => <li key={opt.id} className={`cursor-pointer px-3 py-1.5 ${index === highlightedIndex ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'}`} onClick={() => {
        setInputValue(opt.label);
        onSelect(opt.id, opt.label);
        setIsOpen(false);
      }} onMouseEnter={() => setHighlightedIndex(index)}>
              {opt.label}
            </li>)}
        </ul>}
    </div>;
}
export default function UcakBiletiTab({
  flightTickets,
  setFlightTickets,
  flightTicketSearch,
  setFlightTicketSearch,
  flightSortField,
  flightSortDirection,
  handleFlightSort,
  editingFlightIndex,
  setEditingFlightIndex,
  tempFlightItem,
  setTempFlightItem,
  isNewFlightItem,
  setIsNewFlightItem,
  handleFlightAdd,
  handleFlightEdit,
  handleFlightSave,
  handleFlightCancel,
  handleFlightDelete,
  handleFlightImport,
  handleFlightExport,
  handleFlightClear,
  filteredFlightTickets,
  sortedFlightTickets,
  formatNumberForDisplay,
  formatDateForDisplay,
  flightTotals,
  suppliers,
  hotels,
  allSuppliers,
  filteredHotelSuppliers,
  supplierDropdowns,
  setSupplierDropdowns,
  toggleSupplierDropdown,
  updateSupplierSearch,
  selectFlightSupplier,
  handleSupplierKeyDown
}: UcakBiletiTabProps) {
  const {
    canEdit,
    isSuperAdmin
  } = usePermissions();
  const permEdit = canEdit(Module.PROJECTS);
  const compIsLocked = (arguments[0] as any)?.isLocked || (arguments[0] as any)?.project?.locked || false;
  const [searchTags, setSearchTags] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState("");

  // Sync initial flightTicketSearch with searchTags
  React.useEffect(() => {
    if (flightTicketSearch && searchTags.length === 0) {
      setSearchTags(flightTicketSearch.split(" ").filter((t: string) => t.trim() !== ""));
    }
  }, [flightTicketSearch]);
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      const newTags = [...searchTags, searchInput.trim()];
      setSearchTags(newTags);
      setSearchInput("");
      setFlightTicketSearch(newTags.join(" "));
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      setFlightTicketSearch(newTags.join(" "));
    }
  };
  const removeSearchTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    setFlightTicketSearch(newTags.join(" "));
  };
  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFlightSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleFlightCancel();
    }
  };
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const supplierInputRefs = useRef<{
    [key: string]: HTMLInputElement | null;
  }>({});
  const [expandedMisafirler, setExpandedMisafirler] = useState<{
    [key: string]: boolean;
  }>({});

  // Dropdown pozisyonunu güncelle
  const updateDropdownPosition = (flightTicketId: string) => {
    const input = supplierInputRefs.current[flightTicketId];
    if (input) {
      const rect = input.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: Math.max(rect.width, 300) // Minimum 300px genişlik
      });
    }
  };

  // Dropdown açıldığında pozisyonu güncelle
  useEffect(() => {
    if (tempFlightItem?.id && supplierDropdowns[tempFlightItem.id]?.isOpen) {
      updateDropdownPosition(tempFlightItem.id);
    }
  }, [supplierDropdowns, tempFlightItem?.id]);

  // Scroll ve resize event'lerinde pozisyonu güncelle
  useEffect(() => {
    const handleScroll = () => {
      if (tempFlightItem?.id && supplierDropdowns[tempFlightItem.id]?.isOpen) {
        updateDropdownPosition(tempFlightItem.id);
      }
    };
    const handleResize = () => {
      if (tempFlightItem?.id && supplierDropdowns[tempFlightItem.id]?.isOpen) {
        updateDropdownPosition(tempFlightItem.id);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [tempFlightItem?.id, supplierDropdowns]);
  const totalsBySupplierAndCurrency = React.useMemo(() => {
    const totals: Record<string, any> = {};
    filteredFlightTickets.forEach(item => {
      const supplier = item.tedarikci || "Diğer/Bilinmeyen";
      if (!totals[supplier]) {
        totals[supplier] = {
          costs: {},
          sales: {},
          totalCostTry: 0,
          totalSaleTry: 0
        };
      }
      const cCur = item.doviz || "EUR";
      const sCur = item.satisDoviz || "TRY";
      totals[supplier].costs[cCur] = (totals[supplier].costs[cCur] || 0) + (Number(item.toplamMaliyet) || 0);
      totals[supplier].sales[sCur] = (totals[supplier].sales[sCur] || 0) + (Number(item.toplamSatis) || 0);
      totals[supplier].totalCostTry += Number(item.toplamTl) || 0;
      totals[supplier].totalSaleTry += Number(item.toplamSatisTl) || 0;
    });
    return totals;
  }, [filteredFlightTickets]);
  return <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative w-full sm:w-96 group">
          <div className="flex flex-wrap items-center gap-1.5 w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-inner">
            {searchTags.map((tag, idx) => <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {tag}
                <button onClick={() => removeSearchTag(tag)} className="hover:text-blue-600 dark:hover:text-blue-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>)}
            <input type="text" className="flex-1 min-w-[100px] bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none" placeholder={searchTags.length === 0 ? "Arama yap... (Enter ile çoğalt)" : "Yeni arama..."} value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
          </div>
        </div>
        
      </div>

      {/* Uçak Bileti Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[9rem] w-36 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("biletlemeTarihi")}>
                  <div className="flex items-center">
                    BİLETLEME
                    <br />
                    TARİHİ
                    {flightSortField === "biletlemeTarihi" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("tedarikci")}>
                  <div className="flex items-center">
                    OTEL/TEDARİKÇİ
                    {flightSortField === "tedarikci" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[90px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("havayolu")}>
                  <div className="flex items-center">
                    HAVAYOLU
                    {flightSortField === "havayolu" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[90px] whitespace-nowrap">
                  PNR
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[100px] whitespace-nowrap">
                    <div className="leading-tight">UÇUŞ<br />TİPİ</div>
                    </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[5rem] w-20 whitespace-nowrap">
                    <div className="leading-tight">GİDİŞ<br />TARİHİ</div>
                    </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[5rem] w-20 whitespace-nowrap">
                    <div className="leading-tight">GİDİŞ<br />SAATİ</div>
                    </th>
                <th className="px-1 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[6rem] w-24">
                  <div className="leading-tight whitespace-nowrap">
                    GİDİŞ<br />UÇUŞ KODU
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[5rem] w-20 whitespace-nowrap">
                    <div className="leading-tight">DÖNÜŞ<br />TARİHİ</div>
                    </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[5rem] w-20 whitespace-nowrap">
                    <div className="leading-tight">DÖNÜŞ<br />SAATİ</div>
                    </th>
                <th className="px-1 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[6rem] w-24">
                  <div className="leading-tight whitespace-nowrap">
                    DÖNÜŞ<br />UÇUŞ KODU
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[180px] whitespace-nowrap">
                  GÜZERGAH
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white min-w-[4rem] w-16 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("kisiSayisi")}>
                  <div className="flex items-center justify-center">
                    <div className="leading-tight">Maliyet<br />Pax</div>
                    {flightSortField === "kisiSayisi" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th style={{
                minWidth: "70px",
                width: "70px"
              }} className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("ppMaliyet")}>
                  <div className="flex items-center justify-end">
                    <div className="leading-tight">PP<br />Maliyet</div>
                    {flightSortField === "ppMaliyet" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white min-w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("toplamMaliyet")}>
                  <div className="flex items-center justify-end">
                    <div className="leading-tight">Toplam<br />Maliyet</div>
                    {flightSortField === "toplamMaliyet" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th style={{
                minWidth: "70px",
                width: "70px"
              }} className="px-1 py-2 text-center font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  Döviz
                </th>
                <th style={{
                minWidth: "70px",
                width: "70px"
              }} className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  KUR
                </th>
                <th style={{
                minWidth: "90px"
              }} className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  <div className="leading-tight">Toplam<br />Maliyet TL</div>
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white min-w-[4rem] w-16 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap border-l border-gray-200 dark:border-gray-700" onClick={() => handleFlightSort("satisPax")}>
                  <div className="flex items-center justify-center">
                    <div className="leading-tight">Satış<br />Pax</div>
                    {flightSortField === "satisPax" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th style={{
                minWidth: "70px",
                width: "70px"
              }} className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("ppSatis")}>
                  <div className="flex items-center justify-end">
                    <div className="leading-tight">PP<br />Satış</div>
                    {flightSortField === "ppSatis" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white min-w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap" onClick={() => handleFlightSort("toplamSatis")}>
                  <div className="flex items-center justify-end">
                    <div className="leading-tight">Toplam<br />Satış</div>
                    {flightSortField === "toplamSatis" && <span className="ml-1">
                        {flightSortDirection === "asc" ? "↑" : "↓"}
                      </span>}
                  </div>
                </th>
                <th style={{
                minWidth: "70px",
                width: "70px"
              }} className="px-1 py-2 text-center font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  Döviz
                </th>
                <th style={{
                minWidth: "70px",
                width: "70px"
              }} className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  KUR
                </th>
                <th style={{
                minWidth: "90px"
              }} className="px-1 py-2 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  <div className="leading-tight">Toplam<br />Satış TL</div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[200px] whitespace-nowrap">
                  MİSAFİRLER
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white min-w-[5rem] w-20 whitespace-nowrap">
                  DURUM
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white min-w-[7rem] w-28 whitespace-nowrap">
                  İŞLEMLER
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedFlightTickets.length === 0 && !(editingFlightIndex === flightTickets.length && tempFlightItem && isNewFlightItem) ? <tr>
                  <td colSpan={27} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Uçak bileti bulunamadı
                  </td>
                </tr> : sortedFlightTickets.map((ticket, index) => <tr key={ticket.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0" onDoubleClick={() => {
              if (editingFlightIndex !== index) {
                handleFlightEdit(index);
              }
            }}>
                    {editingFlightIndex === index ? <>
                        <td className="px-2 py-2">
                          <input type="date" value={tempFlightItem?.biletlemeTarihi || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    biletlemeTarihi: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 relative">
                          <AutocompleteInput value={tempFlightItem?.tedarikci || ""} options={allSuppliers.map(s => ({
                    id: s.id,
                    label: s.displayName || s.name || s.title || ""
                  }))} placeholder="Tedarikçi Seçiniz" onSelect={(id, label) => setTempFlightItem({
                    ...tempFlightItem!,
                    tedarikci: label
                  })} disabled={!permEdit || compIsLocked && !isSuperAdmin} /></td>
                        <td className="px-2 py-2">
                          <input type="text" value={tempFlightItem?.havayolu || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    havayolu: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={tempFlightItem?.pnr || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    pnr: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <select style={{
                    minWidth: "130px"
                  }} value={tempFlightItem?.ucusTipi || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    ucusTipi: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                            <option value="GRUP">GRUP</option>
                            <option value="MÜNFERİT">MÜNFERİT</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input type="date" value={tempFlightItem?.gidisTarihi || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    gidisTarihi: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="time" value={tempFlightItem?.gidisSaati || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    gidisSaati: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={tempFlightItem?.gidisUcusKodu || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    gidisUcusKodu: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="date" value={tempFlightItem?.donusTarihi || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    donusTarihi: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="time" value={tempFlightItem?.donusSaati || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    donusSaati: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={tempFlightItem?.donusUcusKodu || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    donusUcusKodu: e.target.value
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="text" value={tempFlightItem?.guzergah || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    guzergah: e.target.value
                  })} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" value={tempFlightItem?.kisiSayisi || 0} onChange={e => {
                    const kisiSayisi = Number(e.target.value);
                    const ppMaliyet = tempFlightItem?.ppMaliyet || 0;
                    const toplamMaliyet = kisiSayisi * ppMaliyet;
                    const kur = tempFlightItem?.kur || 1;
                    const doviz = tempFlightItem?.doviz || "TL";
                    const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      kisiSayisi,
                      toplamMaliyet,
                      toplamTl
                    });
                  }} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" step="0.01" value={tempFlightItem?.ppMaliyet || 0} onChange={e => {
                    const ppMaliyet = Number(e.target.value);
                    const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                    const toplamMaliyet = kisiSayisi * ppMaliyet;
                    const kur = tempFlightItem?.kur || 1;
                    const doviz = tempFlightItem?.doviz || "TL";
                    const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      ppMaliyet,
                      toplamMaliyet,
                      toplamTl
                    });
                  }} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" step="0.01" value={tempFlightItem?.toplamMaliyet || 0} onChange={e => {
                    const toplamMaliyet = Number(e.target.value);
                    const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                    const ppMaliyet = kisiSayisi > 0 ? toplamMaliyet / kisiSayisi : 0;
                    const kur = tempFlightItem?.kur || 1;
                    const doviz = tempFlightItem?.doviz || "TL";
                    const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      toplamMaliyet,
                      ppMaliyet,
                      toplamTl
                    });
                  }} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <select style={{
                    minWidth: "100%"
                  }} value={tempFlightItem?.doviz || ""} onChange={e => {
                    const doviz = e.target.value;
                    const kur = tempFlightItem?.kur || 1;
                    const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                    const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      doviz,
                      toplamTl
                    });
                  }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="TL">TL</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input style={{
                    minWidth: "100%"
                  }} type="number" step="0.0001" value={tempFlightItem?.kur || 1} onChange={e => {
                    const kur = Number(e.target.value);
                    const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                    const doviz = tempFlightItem?.doviz || "TL";
                    const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      kur,
                      toplamTl
                    });
                  }} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input style={{
                    minWidth: "90px"
                  }} type="number" step="0.01" value={tempFlightItem?.toplamTl || 0} onChange={e => {
                    const toplamTl = Number(e.target.value);
                    const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                    const doviz = tempFlightItem?.doviz || "TL";
                    const kur = doviz === "TL" ? 1 : toplamMaliyet > 0 ? toplamTl / toplamMaliyet : 1;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      toplamTl,
                      kur
                    });
                  }} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" value={tempFlightItem?.satisPax || 0} onChange={e => {
                    const satisPax = Number(e.target.value);
                    const ppSatis = tempFlightItem?.ppSatis || 0;
                    const toplamSatis = satisPax * ppSatis;
                    const satisKur = tempFlightItem?.satisKur || 1;
                    const satisDoviz = tempFlightItem?.satisDoviz || "TL";
                    const toplamSatisTl = satisDoviz === "TL" ? toplamSatis : toplamSatis * satisKur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      satisPax,
                      toplamSatis,
                      toplamSatisTl
                    });
                  }} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" step="0.01" value={tempFlightItem?.ppSatis || 0} onChange={e => {
                    const ppSatis = Number(e.target.value);
                    const satisPax = tempFlightItem?.satisPax || 0;
                    const toplamSatis = satisPax * ppSatis;
                    const satisKur = tempFlightItem?.satisKur || 1;
                    const satisDoviz = tempFlightItem?.satisDoviz || "TL";
                    const toplamSatisTl = satisDoviz === "TL" ? toplamSatis : toplamSatis * satisKur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      ppSatis,
                      toplamSatis,
                      toplamSatisTl
                    });
                  }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 text-right" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" step="0.01" value={tempFlightItem?.toplamSatis || 0} onChange={e => {
                    const toplamSatis = Number(e.target.value);
                    const satisPax = tempFlightItem?.satisPax || 1;
                    const ppSatis = satisPax > 0 ? toplamSatis / satisPax : 0;
                    const satisKur = tempFlightItem?.satisKur || 1;
                    const satisDoviz = tempFlightItem?.satisDoviz || "TL";
                    const toplamSatisTl = satisDoviz === "TL" ? toplamSatis : toplamSatis * satisKur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      toplamSatis,
                      ppSatis,
                      toplamSatisTl
                    });
                  }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 text-right" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <select value={tempFlightItem?.satisDoviz || "TL"} onChange={e => {
                    const satisDoviz = e.target.value;
                    const toplamSatis = tempFlightItem?.toplamSatis || 0;
                    const satisKur = satisDoviz === "TL" ? 1 : tempFlightItem?.satisKur || 1;
                    const toplamSatisTl = satisDoviz === "TL" ? toplamSatis : toplamSatis * satisKur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      satisDoviz,
                      satisKur,
                      toplamSatisTl
                    });
                  }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                            <option value="TL">TL</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" step="0.0001" value={tempFlightItem?.satisKur || 1} onChange={e => {
                    const satisKur = Number(e.target.value);
                    const toplamSatis = tempFlightItem?.toplamSatis || 0;
                    const satisDoviz = tempFlightItem?.satisDoviz || "TL";
                    const toplamSatisTl = satisDoviz === "TL" ? toplamSatis : toplamSatis * satisKur;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      satisKur,
                      toplamSatisTl
                    });
                  }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 text-right" disabled={tempFlightItem?.satisDoviz === "TL"} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input type="number" step="0.01" value={tempFlightItem?.toplamSatisTl || 0} onChange={e => {
                    const toplamSatisTl = Number(e.target.value);
                    const toplamSatis = tempFlightItem?.toplamSatis || 0;
                    const satisKur = tempFlightItem?.satisDoviz === "TL" ? 1 : toplamSatis > 0 ? toplamSatisTl / toplamSatis : 1;
                    setTempFlightItem({
                      ...tempFlightItem!,
                      toplamSatisTl,
                      satisKur
                    });
                  }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 text-right" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2 min-w-[200px]">
                          <input type="text" value={tempFlightItem?.misafirler || ""} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    misafirler: e.target.value
                  })} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        </td>
                        <td className="px-2 py-2">
                          <select value={tempFlightItem?.durum || "aktif"} onChange={e => setTempFlightItem({
                    ...tempFlightItem!,
                    durum: e.target.value as any
                  })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                            <option value="aktif">Aktif</option>
                            <option value="iptal">İptal</option>
                            <option value="iade">İade</option>
                            <option value="degistirildi">Değiştirildi</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={handleFlightSave} className="p-1.5 rounded-md transition-colors text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button onClick={handleFlightCancel} className="p-1.5 rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="İptal">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </> : <>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {formatDateForDisplay(ticket.biletlemeTarihi)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.tedarikci || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.havayolu || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.pnr || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.ucusTipi || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {formatDateForDisplay(ticket.gidisTarihi)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.gidisSaati || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.gidisUcusKodu || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {formatDateForDisplay(ticket.donusTarihi)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.donusSaati || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {ticket.donusUcusKodu || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                          {ticket.guzergah || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center whitespace-nowrap">
                          {ticket.kisiSayisi || 0}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right whitespace-nowrap">
                          {formatNumberForDisplay(ticket.ppMaliyet)}
                        </td>
                        <td className="px-2 py-2 text-red-600 dark:text-red-400 text-right font-semibold whitespace-nowrap">
                          {formatNumberForDisplay(ticket.toplamMaliyet)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center">
                          {ticket.doviz || "-"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right whitespace-nowrap">
                          {formatNumberForDisplay(ticket.kur)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-right font-bold whitespace-nowrap">
                          {formatNumberForDisplay(ticket.toplamTl)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center whitespace-nowrap">
                          {ticket.satisPax || 0}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right whitespace-nowrap">
                          {formatNumberForDisplay(ticket.ppSatis || 0)}
                        </td>
                        <td className="px-2 py-2 text-green-600 dark:text-green-400 text-right font-semibold whitespace-nowrap">
                          {formatNumberForDisplay(ticket.toplamSatis || 0)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center font-bold whitespace-nowrap">
                          {ticket.satisDoviz || "TL"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right whitespace-nowrap">
                          {formatNumberForDisplay(ticket.satisKur || 1)}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-gray-100 text-right font-bold whitespace-nowrap">
                          {formatNumberForDisplay(ticket.toplamSatisTl || 0)}
                        </td>
                        <td className="px-2 py-2 min-w-[120px]">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 min-w-0 max-w-full">
                              {expandedMisafirler[ticket.id] ? <div className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                  {ticket.misafirler || "-"}
                                </div> : <div className="text-xs text-gray-900 dark:text-white truncate">
                                  {ticket.misafirler || "-"}
                                </div>}
                            </div>
                            {ticket.misafirler && <button onClick={() => setExpandedMisafirler(prev => ({
                      ...prev,
                      [ticket.id]: !prev[ticket.id]
                    }))} className="flex-shrink-0 p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title={expandedMisafirler[ticket.id] ? "Kapat" : "Genişlet"}>
                                {expandedMisafirler[ticket.id] ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>}
                              </button>}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center">
                          <span className={`px-2 py-1 text-xs rounded ${ticket.durum === "aktif" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ticket.durum === "iptal" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : ticket.durum === "iade" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                            {ticket.durum === "aktif" ? "Aktif" : ticket.durum === "iptal" ? "İptal" : ticket.durum === "iade" ? "İade" : "Değiştirildi"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleFlightEdit(index)} className="p-1.5 rounded-md transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30" title="Düzenle">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleFlightDelete(index)} className="p-1.5 rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>}
                  </tr>)}
              {/* Yeni Bilet Ekleme Satırı */}
              {editingFlightIndex === flightTickets.length && tempFlightItem && isNewFlightItem && <tr key="new-flight-ticket" className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="px-2 py-2">
                      <input type="date" value={tempFlightItem?.biletlemeTarihi || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  biletlemeTarihi: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 relative">
                      <AutocompleteInput value={tempFlightItem?.tedarikci || ""} options={allSuppliers.map(s => ({
                  id: s.id,
                  label: s.displayName || s.name || s.title || ""
                }))} placeholder="Tedarikçi Seçiniz" onSelect={(id, label) => setTempFlightItem({
                  ...tempFlightItem!,
                  tedarikci: label
                })} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempFlightItem?.havayolu || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  havayolu: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempFlightItem?.pnr || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  pnr: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select style={{
                  minWidth: "130px"
                }} value={tempFlightItem?.ucusTipi || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  ucusTipi: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="GRUP">GRUP</option>
                        <option value="MÜNFERİT">MÜNFERİT</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="date" value={tempFlightItem?.gidisTarihi || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  gidisTarihi: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" value={tempFlightItem?.gidisSaati || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  gidisSaati: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempFlightItem?.gidisUcusKodu || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  gidisUcusKodu: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="date" value={tempFlightItem?.donusTarihi || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  donusTarihi: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" value={tempFlightItem?.donusSaati || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  donusSaati: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempFlightItem?.donusUcusKodu || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  donusUcusKodu: e.target.value
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input type="text" value={tempFlightItem?.guzergah || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  guzergah: e.target.value
                })} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input type="number" value={tempFlightItem?.kisiSayisi || 0} onChange={e => {
                  const kisiSayisi = Number(e.target.value);
                  const ppMaliyet = tempFlightItem?.ppMaliyet || 0;
                  const toplamMaliyet = kisiSayisi * ppMaliyet;
                  const kur = tempFlightItem?.kur || 1;
                  const doviz = tempFlightItem?.doviz || "TL";
                  const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                  setTempFlightItem({
                    ...tempFlightItem!,
                    kisiSayisi,
                    toplamMaliyet,
                    toplamTl
                  });
                }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input type="number" step="0.01" value={tempFlightItem?.ppMaliyet || 0} onChange={e => {
                  const ppMaliyet = Number(e.target.value);
                  const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                  const toplamMaliyet = kisiSayisi * ppMaliyet;
                  const kur = tempFlightItem?.kur || 1;
                  const doviz = tempFlightItem?.doviz || "TL";
                  const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                  setTempFlightItem({
                    ...tempFlightItem!,
                    ppMaliyet,
                    toplamMaliyet,
                    toplamTl
                  });
                }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input type="number" step="0.01" value={tempFlightItem?.toplamMaliyet || 0} onChange={e => {
                  const toplamMaliyet = Number(e.target.value);
                  const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                  const ppMaliyet = kisiSayisi > 0 ? toplamMaliyet / kisiSayisi : 0;
                  const kur = tempFlightItem?.kur || 1;
                  const doviz = tempFlightItem?.doviz || "TL";
                  const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                  setTempFlightItem({
                    ...tempFlightItem!,
                    toplamMaliyet,
                    ppMaliyet,
                    toplamTl
                  });
                }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select style={{
                  minWidth: "100%"
                }} value={tempFlightItem?.doviz || ""} onChange={e => {
                  const doviz = e.target.value;
                  const kur = tempFlightItem?.kur || 1;
                  const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                  const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                  setTempFlightItem({
                    ...tempFlightItem!,
                    doviz,
                    toplamTl
                  });
                }} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="TL">TL</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input style={{
                  minWidth: "100%"
                }} type="number" step="0.0001" value={tempFlightItem?.kur || 1} onChange={e => {
                  const kur = Number(e.target.value);
                  const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                  const doviz = tempFlightItem?.doviz || "TL";
                  const toplamTl = doviz === "TL" ? toplamMaliyet : toplamMaliyet * kur;
                  setTempFlightItem({
                    ...tempFlightItem!,
                    kur,
                    toplamTl
                  });
                }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <input style={{
                  minWidth: "90px"
                }} type="number" step="0.01" value={tempFlightItem?.toplamTl || 0} onChange={e => {
                  const toplamTl = Number(e.target.value);
                  const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                  const doviz = tempFlightItem?.doviz || "TL";
                  const kur = doviz === "TL" ? 1 : toplamMaliyet > 0 ? toplamTl / toplamMaliyet : 1;
                  setTempFlightItem({
                    ...tempFlightItem!,
                    toplamTl,
                    kur
                  });
                }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2 min-w-[200px]">
                      <input type="text" value={tempFlightItem?.misafirler || ""} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  misafirler: e.target.value
                })} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempFlightItem?.durum || "aktif"} onChange={e => setTempFlightItem({
                  ...tempFlightItem!,
                  durum: e.target.value as any
                })} className="w-full px-1.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="aktif">Aktif</option>
                        <option value="iptal">İptal</option>
                        <option value="iade">İade</option>
                        <option value="degistirildi">Değiştirildi</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={handleFlightSave} className="p-1.5 rounded-md transition-colors text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button onClick={handleFlightCancel} className="p-1.5 rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="İptal">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>}
              {/* Döviz bazlı toplamlar */}
              </tbody>
          </table>
        </div>
        {/* --- YENİ EKLENEN ÖZET KARTLARI (DİĞER TABIYLA UYUMLU) --- */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Uçak Bileti Maliyet & Satış Özeti
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(flightTotals).map(doviz => {
            const dovizT = flightTickets.filter(t => t.doviz === doviz || t.satisDoviz === doviz && t.doviz !== doviz);
            const mToplam = flightTickets.filter(t => t.doviz === doviz).reduce((s, t) => s + (t.toplamMaliyet || 0), 0);
            const sToplam = flightTickets.filter(t => t.satisDoviz === doviz).reduce((s, t) => s + (t.toplamSatis || 0), 0);
            if (mToplam === 0 && sToplam === 0) return null;
            return <div key={doviz} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {doviz} BAZINDA
                    </span>
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-md">
                      {doviz}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-750">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Maliyet:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatNumberForDisplay(mToplam)} {doviz}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-750">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Satış:</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatNumberForDisplay(sToplam)} {doviz}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahmini Kâr:</span>
                      <span className={`text-sm font-bold ${sToplam - mToplam >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatNumberForDisplay(sToplam - mToplam)} {doviz}
                      </span>
                    </div>
                  </div>
                </div>;
          })}
            
            {/* Toplam TL Kartı */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                  GENEL TOPLAM (TL)
                </span>
                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs font-bold rounded-md">
                  TRY
                </span>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100 dark:border-indigo-800/50">
                  <span className="text-sm text-indigo-900/70 dark:text-indigo-200/70">Maliyet TL Karşılığı:</span>
                  <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                    {formatNumberForDisplay(flightTickets.reduce((acc, curr) => acc + (curr.toplamTl || 0), 0))} ₺
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100 dark:border-indigo-800/50">
                  <span className="text-sm text-indigo-900/70 dark:text-indigo-200/70">Satış TL Karşılığı:</span>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatNumberForDisplay(flightTickets.reduce((acc, curr) => acc + (curr.toplamSatisTl || 0), 0))} ₺
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Net Kâr (TL):</span>
                  <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                    {formatNumberForDisplay(flightTickets.reduce((acc, curr) => acc + (curr.toplamSatisTl || 0), 0) - flightTickets.reduce((acc, curr) => acc + (curr.toplamTl || 0), 0))} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Portal ile render edilen supplier dropdown */}
      {tempFlightItem?.id && supplierDropdowns[tempFlightItem.id]?.isOpen && dropdownPosition && createPortal(<div className="flight-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl max-h-80 overflow-y-auto" style={{
      top: dropdownPosition.top,
      left: dropdownPosition.left,
      width: dropdownPosition.width,
      minWidth: "300px"
    }}>
            {allSuppliers.filter((item: any) => (item.displayName || item.name || item.title || "").toLowerCase().includes((supplierDropdowns[tempFlightItem.id]?.searchTerm || "").toLowerCase())).map((item: any, itemIndex: number) => <div key={`${item.type}-${item.id}`} onClick={() => selectFlightSupplier(tempFlightItem.id, item.id, item.displayName || item.name || item.title)} className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 flex items-center justify-between ${itemIndex === supplierDropdowns[tempFlightItem.id]?.selectedIndex ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  <span>{item.displayName || item.name || item.title}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                    {item.type === "hotel" ? "Otel" : "Tedarikçi"}
                  </span>
                </div>)}
          </div>, document.body)}
    </div>;
}