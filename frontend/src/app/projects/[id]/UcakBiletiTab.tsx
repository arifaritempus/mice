'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

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
  misafirler: string;
  durum: 'aktif' | 'iptal' | 'iade' | 'degistirildi';
  islemler?: string;
}

interface UcakBiletiTabProps {
  flightTickets: FlightTicket[];
  setFlightTickets: (tickets: FlightTicket[]) => void;
  flightTicketSearch: string;
  setFlightTicketSearch: (search: string) => void;
  flightSortField: string;
  flightSortDirection: 'asc' | 'desc';
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
  supplierDropdowns: { [key: string]: { isOpen: boolean; searchTerm: string; selectedIndex: number } };
  setSupplierDropdowns: (value: { [key: string]: { isOpen: boolean; searchTerm: string; selectedIndex: number } } | ((prev: { [key: string]: { isOpen: boolean; searchTerm: string; selectedIndex: number } }) => { [key: string]: { isOpen: boolean; searchTerm: string; selectedIndex: number } })) => void;
  toggleSupplierDropdown: (flightTicketId: string) => void;
  updateSupplierSearch: (flightTicketId: string, searchTerm: string) => void;
  selectFlightSupplier: (flightTicketId: string, supplierId: string, supplierName: string) => void;
  handleSupplierKeyDown: (e: React.KeyboardEvent, flightTicketId: string) => void;
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
  handleSupplierKeyDown,
}: UcakBiletiTabProps) {
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const supplierInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [expandedMisafirler, setExpandedMisafirler] = useState<{ [key: string]: boolean }>({});

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

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [tempFlightItem?.id, supplierDropdowns]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="Uçak bileti ara (tedarikçi, havayolu, güzergah, PNR, misafirler)..."
            value={flightTicketSearch}
            onChange={(e) => setFlightTicketSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Yeni Bilet Ekle butonu tıklandı', { handleFlightAdd });
              if (handleFlightAdd) {
                handleFlightAdd();
              } else {
                console.error('handleFlightAdd is undefined');
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer"
            type="button"
          >
            Yeni Bilet Ekle
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFlightImport}
            className="hidden"
            id="flight-import"
          />
          <label
            htmlFor="flight-import"
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 cursor-pointer transition-colors"
          >
            Excel İçe Aktar
          </label>
          <button
            onClick={handleFlightExport}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Excel Dışa Aktar
          </button>
          <button
            onClick={handleFlightClear}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Uçak Bileti Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white w-24 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleFlightSort('biletlemeTarihi')}
                >
                  <div className="flex items-center">
                    BİLETLEME<br/>TARİHİ
                    {flightSortField === 'biletlemeTarihi' && (
                      <span className="ml-1">
                        {flightSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[180px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleFlightSort('tedarikci')}
                >
                  <div className="flex items-center">
                    OTEL/TEDARİKÇİ
                    {flightSortField === 'tedarikci' && (
                      <span className="ml-1">
                        {flightSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[140px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                  onClick={() => handleFlightSort('havayolu')}
                >
                  <div className="flex items-center">
                    HAVAYOLU
                    {flightSortField === 'havayolu' && (
                      <span className="ml-1">
                        {flightSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[120px]">PNR</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[100px]">UÇUŞ TİPİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white w-24">GİDİŞ TARİHİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white w-20">GİDİŞ SAATİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[120px]">GİDİŞ UÇUŞ KODU</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white w-24">DÖNÜŞ TARİHİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white w-20">DÖNÜŞ SAATİ</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[120px]">DÖNÜŞ UÇUŞ KODU</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[200px] whitespace-nowrap">GÜZERGAH</th>
                <th
                  className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white w-16 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                  onClick={() => handleFlightSort('kisiSayisi')}
                >
                  <div className="flex items-center justify-center">
                    KİŞİ SAYISI
                    {flightSortField === 'kisiSayisi' && (
                      <span className="ml-1">
                        {flightSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white w-24 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                  onClick={() => handleFlightSort('ppMaliyet')}
                >
                  <div className="flex items-center justify-end">
                    PP MALİYET
                    {flightSortField === 'ppMaliyet' && (
                      <span className="ml-1">
                        {flightSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white w-28 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                  onClick={() => handleFlightSort('toplamMaliyet')}
                >
                  <div className="flex items-center justify-end">
                    TOPLAM MALİYET
                    {flightSortField === 'toplamMaliyet' && (
                      <span className="ml-1">
                        {flightSortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white w-12 whitespace-nowrap">DÖVİZ</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white w-16 whitespace-nowrap">KUR</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white w-28 whitespace-nowrap">TOPLAM TL</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white min-w-[300px]">MİSAFİRLER</th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white w-20">DURUM</th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white w-24">İŞLEMLER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedFlightTickets.length === 0 && !(editingFlightIndex === flightTickets.length && tempFlightItem && isNewFlightItem) ? (
                <tr>
                  <td colSpan={21} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Uçak bileti bulunamadı
                  </td>
                </tr>
              ) : (
                sortedFlightTickets.map((ticket, index) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {editingFlightIndex === index ? (
                      <>
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={tempFlightItem?.biletlemeTarihi || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, biletlemeTarihi: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2 relative">
                          <div className="relative">
                            <input
                              ref={(el) => {
                                if (tempFlightItem?.id) {
                                  supplierInputRefs.current[tempFlightItem.id] = el;
                                }
                              }}
                              type="text"
                              value={tempFlightItem?.tedarikci || ''}
                              placeholder="Tedarikçi Seçiniz"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (!supplierDropdowns[tempFlightItem?.id || '']?.isOpen) {
                                  toggleSupplierDropdown(tempFlightItem?.id || '');
                                  if (tempFlightItem?.id) {
                                    updateDropdownPosition(tempFlightItem.id);
                                  }
                                }
                              }}
                              onFocus={() => {
                                if (!supplierDropdowns[tempFlightItem?.id || '']?.isOpen) {
                                  toggleSupplierDropdown(tempFlightItem?.id || '');
                                  if (tempFlightItem?.id) {
                                    updateDropdownPosition(tempFlightItem.id);
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (supplierDropdowns[tempFlightItem?.id || '']?.isOpen) {
                                  handleSupplierKeyDown(e, tempFlightItem?.id || '');
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                    e.stopPropagation();
                                  }
                                }
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
                              readOnly
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                              {tempFlightItem?.tedarikci && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempFlightItem({ ...tempFlightItem!, tedarikci: '' });
                                  }}
                                  className="p-0.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  title="Tedarikçiyi Temizle"
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              <span className="pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </span>
                            </div>

                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={tempFlightItem?.havayolu || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, havayolu: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={tempFlightItem?.pnr || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, pnr: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={tempFlightItem?.ucusTipi || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, ucusTipi: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="GRUP">GRUP</option>
                            <option value="MÜNFERİT">MÜNFERİT</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={tempFlightItem?.gidisTarihi || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, gidisTarihi: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="time"
                            value={tempFlightItem?.gidisSaati || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, gidisSaati: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={tempFlightItem?.gidisUcusKodu || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, gidisUcusKodu: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={tempFlightItem?.donusTarihi || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, donusTarihi: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="time"
                            value={tempFlightItem?.donusSaati || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, donusSaati: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={tempFlightItem?.donusUcusKodu || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, donusUcusKodu: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={tempFlightItem?.guzergah || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, guzergah: e.target.value })}
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            value={tempFlightItem?.kisiSayisi || 0}
                            onChange={(e) => {
                              const kisiSayisi = Number(e.target.value);
                              const ppMaliyet = tempFlightItem?.ppMaliyet || 0;
                              const toplamMaliyet = kisiSayisi * ppMaliyet;
                              const kur = tempFlightItem?.kur || 1;
                              const doviz = tempFlightItem?.doviz || 'TL';
                              const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                              setTempFlightItem({ ...tempFlightItem!, kisiSayisi, toplamMaliyet, toplamTl });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center resize-none"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={tempFlightItem?.ppMaliyet || 0}
                            onChange={(e) => {
                              const ppMaliyet = Number(e.target.value);
                              const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                              const toplamMaliyet = kisiSayisi * ppMaliyet;
                              const kur = tempFlightItem?.kur || 1;
                              const doviz = tempFlightItem?.doviz || 'TL';
                              const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                              setTempFlightItem({ ...tempFlightItem!, ppMaliyet, toplamMaliyet, toplamTl });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={tempFlightItem?.toplamMaliyet || 0}
                            onChange={(e) => {
                              const toplamMaliyet = Number(e.target.value);
                              const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                              const ppMaliyet = kisiSayisi > 0 ? toplamMaliyet / kisiSayisi : 0;
                              const kur = tempFlightItem?.kur || 1;
                              const doviz = tempFlightItem?.doviz || 'TL';
                              const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                              setTempFlightItem({ ...tempFlightItem!, toplamMaliyet, ppMaliyet, toplamTl });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={tempFlightItem?.doviz || ''}
                            onChange={(e) => {
                              const doviz = e.target.value;
                              const kur = tempFlightItem?.kur || 1;
                              const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                              const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                              setTempFlightItem({ ...tempFlightItem!, doviz, toplamTl });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="TL">TL</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.0001"
                            value={tempFlightItem?.kur || 1}
                            onChange={(e) => {
                              const kur = Number(e.target.value);
                              const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                              const doviz = tempFlightItem?.doviz || 'TL';
                              const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                              setTempFlightItem({ ...tempFlightItem!, kur, toplamTl });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={tempFlightItem?.toplamTl || 0}
                            onChange={(e) => {
                              const toplamTl = Number(e.target.value);
                              const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                              const doviz = tempFlightItem?.doviz || 'TL';
                              const kur = doviz === 'TL' ? 1 : (toplamMaliyet > 0 ? toplamTl / toplamMaliyet : 1);
                              setTempFlightItem({ ...tempFlightItem!, toplamTl, kur });
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                          />
                        </td>
                        <td className="px-2 py-2 w-48 max-w-48">
                          <input
                            type="text"
                            value={tempFlightItem?.misafirler || ''}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, misafirler: e.target.value })}
                            className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={tempFlightItem?.durum || 'aktif'}
                            onChange={(e) => setTempFlightItem({ ...tempFlightItem!, durum: e.target.value as any })}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="aktif">Aktif</option>
                            <option value="iptal">İptal</option>
                            <option value="iade">İade</option>
                            <option value="degistirildi">Değiştirildi</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleFlightSave}
                              className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                              title="Kaydet"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleFlightCancel}
                              className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="İptal"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{formatDateForDisplay(ticket.biletlemeTarihi)}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.tedarikci || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.havayolu || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.pnr || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.ucusTipi || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{formatDateForDisplay(ticket.gidisTarihi)}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.gidisSaati || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.gidisUcusKodu || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{formatDateForDisplay(ticket.donusTarihi)}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.donusSaati || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{ticket.donusUcusKodu || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white whitespace-nowrap">{ticket.guzergah || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center whitespace-nowrap">{ticket.kisiSayisi || 0}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right whitespace-nowrap">{formatNumberForDisplay(ticket.ppMaliyet)}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right font-semibold whitespace-nowrap">{formatNumberForDisplay(ticket.toplamMaliyet)}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center">{ticket.doviz || '-'}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right whitespace-nowrap">{formatNumberForDisplay(ticket.kur)}</td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-right font-semibold whitespace-nowrap">{formatNumberForDisplay(ticket.toplamTl)} TL</td>
                        <td className="px-2 py-2 min-w-[300px]">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 min-w-0 max-w-full">
                              {expandedMisafirler[ticket.id] ? (
                                <div className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                  {ticket.misafirler || '-'}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-900 dark:text-white truncate">
                                  {ticket.misafirler || '-'}
                                </div>
                              )}
                            </div>
                            {ticket.misafirler && (
                              <button
                                onClick={() => setExpandedMisafirler(prev => ({
                                  ...prev,
                                  [ticket.id]: !prev[ticket.id]
                                }))}
                                className="flex-shrink-0 p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                title={expandedMisafirler[ticket.id] ? "Kapat" : "Genişlet"}
                              >
                                {expandedMisafirler[ticket.id] ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white text-center">
                          <span className={`px-2 py-1 text-xs rounded ${
                            ticket.durum === 'aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            ticket.durum === 'iptal' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            ticket.durum === 'iade' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {ticket.durum === 'aktif' ? 'Aktif' :
                             ticket.durum === 'iptal' ? 'İptal' :
                             ticket.durum === 'iade' ? 'İade' :
                             'Değiştirildi'}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleFlightEdit(index)}
                              className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="Düzenle"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleFlightDelete(index)}
                              className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Sil"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
              {/* Yeni Bilet Ekleme Satırı */}
              {editingFlightIndex === flightTickets.length && tempFlightItem && isNewFlightItem && (
                <tr key="new-flight-ticket" className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={tempFlightItem?.biletlemeTarihi || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, biletlemeTarihi: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 relative">
                    <div className="relative">
                      <input
                        ref={(el) => {
                          if (tempFlightItem?.id) {
                            supplierInputRefs.current[tempFlightItem.id] = el;
                          }
                        }}
                        type="text"
                        value={tempFlightItem?.tedarikci || ''}
                        placeholder="Tedarikçi Seçiniz"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!supplierDropdowns[tempFlightItem?.id || '']?.isOpen) {
                            toggleSupplierDropdown(tempFlightItem?.id || '');
                            if (tempFlightItem?.id) {
                              updateDropdownPosition(tempFlightItem.id);
                            }
                          }
                        }}
                        onFocus={() => {
                          if (!supplierDropdowns[tempFlightItem?.id || '']?.isOpen) {
                            toggleSupplierDropdown(tempFlightItem?.id || '');
                            if (tempFlightItem?.id) {
                              updateDropdownPosition(tempFlightItem.id);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (supplierDropdowns[tempFlightItem?.id || '']?.isOpen) {
                            handleSupplierKeyDown(e, tempFlightItem?.id || '');
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              e.stopPropagation();
                            }
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
                        readOnly
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                        {tempFlightItem?.tedarikci && (
                          <button
                            type="button"
                            onClick={() => {
                              setTempFlightItem({ ...tempFlightItem!, tedarikci: '' });
                            }}
                            className="p-0.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Tedarikçiyi Temizle"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <span className="pointer-events-none">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>

                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={tempFlightItem?.havayolu || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, havayolu: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={tempFlightItem?.pnr || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, pnr: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={tempFlightItem?.ucusTipi || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, ucusTipi: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="GRUP">GRUP</option>
                      <option value="MÜNFERİT">MÜNFERİT</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={tempFlightItem?.gidisTarihi || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, gidisTarihi: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      value={tempFlightItem?.gidisSaati || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, gidisSaati: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={tempFlightItem?.gidisUcusKodu || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, gidisUcusKodu: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={tempFlightItem?.donusTarihi || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, donusTarihi: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="time"
                      value={tempFlightItem?.donusSaati || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, donusSaati: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={tempFlightItem?.donusUcusKodu || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, donusUcusKodu: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="text"
                      value={tempFlightItem?.guzergah || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, guzergah: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      value={tempFlightItem?.kisiSayisi || 0}
                      onChange={(e) => {
                        const kisiSayisi = Number(e.target.value);
                        const ppMaliyet = tempFlightItem?.ppMaliyet || 0;
                        const toplamMaliyet = kisiSayisi * ppMaliyet;
                        const kur = tempFlightItem?.kur || 1;
                        const doviz = tempFlightItem?.doviz || 'TL';
                        const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                        setTempFlightItem({ ...tempFlightItem!, kisiSayisi, toplamMaliyet, toplamTl });
                      }}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center resize-none"
                    />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={tempFlightItem?.ppMaliyet || 0}
                      onChange={(e) => {
                        const ppMaliyet = Number(e.target.value);
                        const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                        const toplamMaliyet = kisiSayisi * ppMaliyet;
                        const kur = tempFlightItem?.kur || 1;
                        const doviz = tempFlightItem?.doviz || 'TL';
                        const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                        setTempFlightItem({ ...tempFlightItem!, ppMaliyet, toplamMaliyet, toplamTl });
                      }}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                    />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={tempFlightItem?.toplamMaliyet || 0}
                      onChange={(e) => {
                        const toplamMaliyet = Number(e.target.value);
                        const kisiSayisi = tempFlightItem?.kisiSayisi || 0;
                        const ppMaliyet = kisiSayisi > 0 ? toplamMaliyet / kisiSayisi : 0;
                        const kur = tempFlightItem?.kur || 1;
                        const doviz = tempFlightItem?.doviz || 'TL';
                        const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                        setTempFlightItem({ ...tempFlightItem!, toplamMaliyet, ppMaliyet, toplamTl });
                      }}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={tempFlightItem?.doviz || ''}
                      onChange={(e) => {
                        const doviz = e.target.value;
                        const kur = tempFlightItem?.kur || 1;
                        const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                        const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                        setTempFlightItem({ ...tempFlightItem!, doviz, toplamTl });
                      }}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="TL">TL</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.0001"
                      value={tempFlightItem?.kur || 1}
                      onChange={(e) => {
                        const kur = Number(e.target.value);
                        const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                        const doviz = tempFlightItem?.doviz || 'TL';
                        const toplamTl = doviz === 'TL' ? toplamMaliyet : toplamMaliyet * kur;
                        setTempFlightItem({ ...tempFlightItem!, kur, toplamTl });
                      }}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                    />
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={tempFlightItem?.toplamTl || 0}
                      onChange={(e) => {
                        const toplamTl = Number(e.target.value);
                        const toplamMaliyet = tempFlightItem?.toplamMaliyet || 0;
                        const doviz = tempFlightItem?.doviz || 'TL';
                        const kur = doviz === 'TL' ? 1 : (toplamMaliyet > 0 ? toplamTl / toplamMaliyet : 1);
                        setTempFlightItem({ ...tempFlightItem!, toplamTl, kur });
                      }}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right resize-none"
                    />
                  </td>
                  <td className="px-2 py-2 w-48 max-w-48">
                    <input
                      type="text"
                      value={tempFlightItem?.misafirler || ''}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, misafirler: e.target.value })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={tempFlightItem?.durum || 'aktif'}
                      onChange={(e) => setTempFlightItem({ ...tempFlightItem!, durum: e.target.value as any })}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="iptal">İptal</option>
                      <option value="iade">İade</option>
                      <option value="degistirildi">Değiştirildi</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={handleFlightSave}
                        className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                        title="Kaydet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleFlightCancel}
                        className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
              {/* Döviz bazlı toplamlar */}
              {Object.keys(flightTotals).map((doviz) => (
                <tr key={doviz} className="bg-blue-50 dark:bg-blue-900/20">
                  <td colSpan={12} className="px-2 py-2 text-gray-900 dark:text-white text-right font-semibold">
                    TOPLAM ({doviz})
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white text-center">
                    {flightTotals[doviz].kisiSayisi}
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                    {formatNumberForDisplay(flightTotals[doviz].ppMaliyet)}
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                    {formatNumberForDisplay(flightTotals[doviz].toplamMaliyet)}
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white text-center font-bold">
                    {doviz}
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                    {/* KUR sütunu - boş */}
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white text-right font-semibold">
                    {formatNumberForDisplay(flightTotals[doviz].toplamTl)} TL
                  </td>
                  <td className="px-2 py-2 text-gray-900 dark:text-white" colSpan={3}>
                    {/* Boş sütunlar */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portal ile render edilen supplier dropdown */}
      {tempFlightItem?.id && supplierDropdowns[tempFlightItem.id]?.isOpen && dropdownPosition && createPortal(
        <div
          className="flight-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl max-h-80 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            minWidth: '300px'
          }}
        >
          <input
            type="text"
            data-supplier-search={tempFlightItem.id}
            value={supplierDropdowns[tempFlightItem.id]?.searchTerm || ''}
            onChange={(e) => updateSupplierSearch(tempFlightItem.id, e.target.value)}
            onKeyDown={(e) => {
              handleSupplierKeyDown(e, tempFlightItem.id);
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.stopPropagation();
              }
            }}
            placeholder="Tedarikçi ara..."
            className="w-full px-2 py-1 text-xs border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none"
            autoFocus
          />
          {filteredHotelSuppliers
            .filter((item: any) =>
              (item.displayName || item.name || item.title || '').toLowerCase().includes(
                (supplierDropdowns[tempFlightItem.id]?.searchTerm || '').toLowerCase()
              )
            )
            .map((item: any, itemIndex: number) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => selectFlightSupplier(tempFlightItem.id, item.id, item.displayName || item.name || item.title)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                  itemIndex === supplierDropdowns[tempFlightItem.id]?.selectedIndex
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{item.displayName || item.name || item.title}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                  {item.type === 'hotel' ? 'Otel' : 'Tedarikçi'}
                </span>
              </div>
            ))}
        </div>,
        document.body
      )}
    </div>
  );
}
