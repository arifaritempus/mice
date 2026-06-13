'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { projectEventsActivitiesService } from '@/lib/supabaseService';

interface EtkinlikAktiviteTabProps {
  eventsActivities: any[];
  setEventsActivities: (events: any[]) => void;
  editingEventIndex: number | null;
  setEditingEventIndex: (index: number | null) => void;
  tempEventItem: any;
  setTempEventItem: (item: any) => void;
  isNewEventItem: boolean;
  setIsNewEventItem: (isNew: boolean) => void;
  eventSearch: string;
  setEventSearch: (search: string) => void;
  eventSortField: string;
  eventSortDirection: 'asc' | 'desc';
  eventSubCategories: any[];
  selectedEventMainCategory: string;
  setSelectedEventMainCategory: (category: string) => void;
  eventSupplierSearch: string;
  setEventSupplierSearch: (search: string) => void;
  showEventSupplierDropdown: boolean;
  setShowEventSupplierDropdown: (show: boolean) => void;
  selectedEventSupplierIndex: number;
  setSelectedEventSupplierIndex: (index: number) => void;
  filteredEventSuppliers: any[];
  projectId: string;
  handleEventAdd: () => void;
  handleEventEdit: (index: number) => void;
  handleEventSave: () => void;
  handleEventCancel: () => void;
  handleEventDelete: (index: number) => void;
  filteredEvents: any[];
  sortedEvents: any[];
  formatNumberForDisplay: (value: number | string) => string;
  formatDateForDisplay: (dateValue: any) => string;
  handleEventSort: (field: string) => void;
  handleEventSupplierKeyDown: (e: React.KeyboardEvent, itemId: string) => void;
  handleEventSupplierSelect: (supplier: any, itemId: string) => void;
  handleEventActivityClear?: () => void;
  handleEventActivityExport?: () => void;
  hotels: any[];
  suppliers: any[];
  eventTotals: any;
  formatNumber: (value: number | string) => string;
  allSuppliers: any[];
  [key: string]: any;
}

export default function EtkinlikAktiviteTab(props: EtkinlikAktiviteTabProps) {
  const {
    eventsActivities,
    setEventsActivities,
    editingEventIndex,
    setEditingEventIndex,
    tempEventItem,
    setTempEventItem,
    isNewEventItem,
    setIsNewEventItem,
    eventSearch,
    setEventSearch,
    eventSortField,
    eventSortDirection,
    eventSubCategories,
    selectedEventMainCategory,
    setSelectedEventMainCategory,
    eventSupplierSearch,
    setEventSupplierSearch,
    showEventSupplierDropdown,
    setShowEventSupplierDropdown,
    selectedEventSupplierIndex,
    setSelectedEventSupplierIndex,
    filteredEventSuppliers,
    projectId,
    handleEventAdd,
    handleEventEdit,
    handleEventSave,
    handleEventCancel,
    handleEventDelete,
    filteredEvents,
    sortedEvents,
    formatNumberForDisplay,
    formatDateForDisplay,
    handleEventSort,
    handleEventSupplierKeyDown,
    handleEventSupplierSelect,
    handleEventActivityClear,
    handleEventActivityExport,
    hotels,
    suppliers,
    eventTotals,
    formatNumber,
    allSuppliers,
  } = props;

  const eventSupplierInputRef = useRef<HTMLInputElement | null>(null);
  const [eventSupplierDropdownPosition, setEventSupplierDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateEventSupplierDropdownPosition = () => {
    if (eventSupplierInputRef.current) {
      const rect = eventSupplierInputRef.current.getBoundingClientRect();
      setEventSupplierDropdownPosition({
        top: rect.bottom, // fixed için scroll eklenmemeli
        left: rect.left,
        width: Math.max(rect.width, 300) // Minimum 300px genişlik
      });
    }
  };

  const setEventSupplierInputRef = (el: HTMLInputElement | null) => {
    eventSupplierInputRef.current = el;
  };

  useEffect(() => {
    if (showEventSupplierDropdown) {
      updateEventSupplierDropdownPosition();
      const handleScroll = () => updateEventSupplierDropdownPosition();
      const handleResize = () => updateEventSupplierDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setEventSupplierDropdownPosition(null);
    }
  }, [showEventSupplierDropdown]);

  return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        placeholder="Etkinlik & Aktivite ara..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newEvent = {
                            id: `temp-${Date.now()}`,
                            project_id: projectId,
                            event_date: new Date().toISOString().split('T')[0],
                            supplier_id: null,
                            supplier_type: 'supplier',
                            sub_category_id: null,
                            description: '',
                            amount: 0,
                            currency: 'EUR',
                            exchange_rate: 1.0000,
                            total_tl: 0
                          };
                          setTempEventItem(newEvent);
                          setIsNewEventItem(true);
                          setEditingEventIndex(eventsActivities.length); // Yeni satır için mevcut liste uzunluğunu kullan
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Yeni Ekle
                      </button>
                      {handleEventActivityExport && (
                        <button
                          onClick={handleEventActivityExport}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Excel Dışa Aktar
                        </button>
                      )}
                      {handleEventActivityClear && (
                        <button
                          onClick={handleEventActivityClear}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Etkinlik & Aktivite Tablosu */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                              onClick={() => {
                                handleEventSort('event_date');
                              }}
                            >
                              TARİH {eventSortField === 'event_date' && (eventSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                            >
                              OTEL/TEDARİKÇİ
                            </th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white hidden">ANA KATEGORİ</th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                            >
                              ALT KATEGORİ
                            </th>
                            <th 
                              className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                            >
                              AÇIKLAMA
                            </th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TUTAR</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">DÖVİZ</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">KUR</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">TOPLAM TL</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white w-20">İŞLEMLER</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Yeni ekleme modu */}
                          {editingEventIndex !== null && isNewEventItem && (
                            <tr 
                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleEventCancel();
                                } else if (e.key === 'Enter' && !showEventSupplierDropdown) {
                                  e.preventDefault();
                                  handleEventSave();
                                }
                              }}
                              tabIndex={0}
                            >
                              <td className="px-2 py-2">
                                <input
                                  type="date"
                                  value={tempEventItem?.event_date || ''}
                                  onChange={(e) => setTempEventItem({ ...tempEventItem, event_date: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <div className="relative">
                                  <input
                                    ref={setEventSupplierInputRef}
                                    type="text"
                                    value={eventSupplierSearch}
                                    onChange={(e) => {
                                      setEventSupplierSearch(e.target.value);
                                      setShowEventSupplierDropdown(true);
                                      setTimeout(() => updateEventSupplierDropdownPosition(), 0);
                                    }}
                                    onClick={() => {
                                      setShowEventSupplierDropdown(true);
                                      setTimeout(() => updateEventSupplierDropdownPosition(), 0);
                                    }}
                                    placeholder="Otel/Tedarikçi seç..."
                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  />
                                        {showEventSupplierDropdown && eventSupplierDropdownPosition && createPortal(
                                          <div 
                                            data-event-supplier-dropdown
                                            className="event-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl max-h-80 overflow-y-auto"
                                            style={{
                                              top: eventSupplierDropdownPosition.top,
                                              left: eventSupplierDropdownPosition.left,
                                              width: eventSupplierDropdownPosition.width,
                                              minWidth: '300px'
                                            }}
                                          >
                                            <div className="py-1">
                                            {allSuppliers
                                                 .filter(s => (s.displayName || s.name || '').toLowerCase().includes(eventSupplierSearch?.toLowerCase() || ''))
                                                 .map((s, idx) => (
                                                   <div
                                                     key={`${s.type || 'supplier'}-${s.id}`}
                                                     onMouseEnter={() => setSelectedEventSupplierIndex(idx)}
                                                     className={`px-3 py-2 cursor-pointer transition-colors duration-150 text-xs flex items-center justify-between ${
                                                       selectedEventSupplierIndex === idx 
                                                         ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                                                         : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                     }`}
                                                     onClick={() => {
                                                       setTempEventItem({
                                                         ...tempEventItem,
                                                         supplier_id: s.type === 'supplier' || !s.type ? s.id : null,
                                                         hotel_id: s.type === 'hotel' ? s.id : null,
                                                         supplier_type: s.type || 'supplier'
                                                       });
                                                       setEventSupplierSearch(s.displayName || s.name);
                                                       setShowEventSupplierDropdown(false);
                                                     }}
                                                   >
                                                     <span>{s.displayName || s.name}</span>
                                                     <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                                                       {s.type === 'hotel' ? 'Otel' : 'Tedarikçi'}
                                                     </span>
                                                   </div>
                                                 ))}
                                      </div>
                                    </div>,
                                    document.body
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white hidden">Etkinlik & Aktivite</td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <select
                                  value={tempEventItem?.sub_category_id || ''}
                                  onChange={(e) => setTempEventItem({ ...tempEventItem, sub_category_id: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">Alt kategori seç...</option>
                                  {eventSubCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <input
                                  type="text"
                                  value={tempEventItem?.description || ''}
                                  onChange={(e) => setTempEventItem({ ...tempEventItem, description: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tempEventItem?.amount || 0}
                                  onChange={(e) => {
                                    const amount = parseFloat(e.target.value) || 0;
                                    setTempEventItem({
                                      ...tempEventItem,
                                      amount,
                                      total_tl: amount * (tempEventItem.exchange_rate || 1.0000)
                                    });
                                  }}
                                  className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                                />
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <select
                                  value={tempEventItem?.currency || 'EUR'}
                                  onChange={(e) => setTempEventItem({ ...tempEventItem, currency: e.target.value })}
                                  className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                                  <option value="GBP">GBP</option>
                                  <option value="TRY">TRY</option>
                                </select>
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={tempEventItem?.exchange_rate || 1.0000}
                                  onChange={(e) => {
                                    const rate = parseFloat(e.target.value) || 1.0000;
                                    setTempEventItem({
                                      ...tempEventItem,
                                      exchange_rate: rate,
                                      total_tl: (tempEventItem.amount || 0) * rate
                                    });
                                  }}
                                  className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                                />
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={tempEventItem?.total_tl || (tempEventItem.amount * tempEventItem.exchange_rate) || 0}
                                  onChange={(e) => {
                                    const totalTL = parseFloat(e.target.value) || 0;
                                    const rate = tempEventItem.exchange_rate || 1.0000;
                                    setTempEventItem({
                                      ...tempEventItem,
                                      total_tl: totalTL,
                                      amount: totalTL / rate
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                                />
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={handleEventSave}
                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                    title="Kaydet (Ctrl+Enter)"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleEventCancel}
                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="İptal (Esc)"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                          {sortedEvents
                            .map((event, index) => {
                              const originalIndex = eventsActivities.findIndex((x: any) => x.id === event.id);
                              const isEditing = editingEventIndex === originalIndex;
                              const displayEvent = isEditing ? tempEventItem : event;
                              
                              return (
                                <tr 
                                  key={event.id || index} 
                                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  onKeyDown={(e) => {
                                    if (!isEditing) return;
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      handleEventCancel();
                                    } else if (e.key === 'Enter' && !showEventSupplierDropdown) {
                                      // Only save on Enter if the supplier dropdown is NOT open
                                      // If it is open, Enter is used for selection
                                      e.preventDefault();
                                      handleEventSave();
                                    }
                                  }}
                                  tabIndex={isEditing ? 0 : -1}
                                >
                                  <td className="px-2 py-2 text-gray-900 dark:text-white">
                                    {isEditing ? (
                                      <input
                                        type="date"
                                        value={displayEvent.event_date || ''}
                                        onChange={(e) => setTempEventItem({ ...tempEventItem, event_date: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      />
                                    ) : (
                                      <span>{displayEvent.event_date ? new Date(displayEvent.event_date).toLocaleDateString('tr-TR') : '-'}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white">
                                    {isEditing ? (
                                      <div className="relative">
                                        <input
                                          ref={setEventSupplierInputRef}
                                          type="text"
                                          value={eventSupplierSearch}
                                          onChange={(e) => {
                                            setEventSupplierSearch(e.target.value);
                                            setShowEventSupplierDropdown(true);
                                            setTimeout(() => updateEventSupplierDropdownPosition(), 0);
                                          }}
                                          onFocus={() => {
                                            setShowEventSupplierDropdown(true);
                                            setTimeout(() => updateEventSupplierDropdownPosition(), 0);
                                          }}
                                          onKeyDown={(e) => handleEventSupplierKeyDown(e, displayEvent.id)}
                                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        {showEventSupplierDropdown && eventSupplierDropdownPosition && createPortal(
                                          <div 
                                            data-event-supplier-dropdown
                                            className="event-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl max-h-80 overflow-y-auto"
                                            style={{
                                              top: eventSupplierDropdownPosition.top,
                                              left: eventSupplierDropdownPosition.left,
                                              width: eventSupplierDropdownPosition.width,
                                              minWidth: '300px'
                                            }}
                                          >
                                            <div className="py-1">
                                              {(() => {
                                                const allItems = [...hotels.map(h => ({ id: h.id, name: h.name, type: 'hotel' })), ...suppliers.map(s => ({ id: s.id, name: s.name, type: 'supplier' }))];
                                                return allItems;
                                              })()
                                                .filter(s => s.name?.toLowerCase().includes(eventSupplierSearch?.toLowerCase() || ''))
                                                .map((s, idx) => (
                                                  <div
                                                    key={`${s.type}-${s.id}`}
                                                    onMouseEnter={() => setSelectedEventSupplierIndex(idx)}
                                                    className={`px-3 py-2 cursor-pointer transition-colors duration-150 text-xs flex items-center justify-between ${
                                                      selectedEventSupplierIndex === idx 
                                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                                                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                    onClick={() => {
                                                      setTempEventItem({
                                                        ...tempEventItem,
                                                        supplier_id: s.type === 'supplier' ? s.id : null,
                                                        hotel_id: s.type === 'hotel' ? s.id : null,
                                                        supplier_type: s.type
                                                      });
                                                      setEventSupplierSearch(s.name);
                                                      setShowEventSupplierDropdown(false);
                                                    }}
                                                  >
                                                    <span>{s.name}</span>
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                                                      {s.type === 'hotel' ? 'Otel' : 'Tedarikçi'}
                                                    </span>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>,
                                          document.body
                                        )}
                                      </div>
                                    ) : (
                                      <span>
                                        {displayEvent.supplier?.name || 
                                         displayEvent.hotel?.name || 
                                         (displayEvent.hotel_id && hotels.find((h: any) => h.id === displayEvent.hotel_id)?.name) || 
                                         (displayEvent.supplier_id && suppliers.find((s: any) => s.id === displayEvent.supplier_id)?.name) ||
                                         '-'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white hidden">Etkinlik & Aktivite</td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white">
                                    {isEditing ? (
                                      <select
                                        value={displayEvent.sub_category_id || ''}
                                        onChange={(e) => setTempEventItem({ ...tempEventItem, sub_category_id: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      >
                                        <option value="">Alt kategori seç...</option>
                                        {eventSubCategories.map(cat => (
                                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span>
                                        {displayEvent.sub_category?.name || 
                                         (displayEvent.sub_category_id && eventSubCategories.find((cat: any) => cat.id === displayEvent.sub_category_id)?.name) || 
                                         '-'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={displayEvent.description || ''}
                                        onChange={(e) => setTempEventItem({ ...tempEventItem, description: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      />
                                    ) : (
                                      <span>{displayEvent.description || '-'}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={displayEvent.amount || 0}
                                        onChange={(e) => {
                                          const amount = parseFloat(e.target.value) || 0;
                                          setTempEventItem({
                                            ...tempEventItem,
                                            amount,
                                            total_tl: amount * (tempEventItem.exchange_rate || 1.0000)
                                          });
                                        }}
                                        className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                                      />
                                    ) : (
                                      <span>{formatNumberForDisplay(displayEvent.amount || 0)}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white">
                                    {isEditing ? (
                                      <select
                                        value={displayEvent.currency || 'EUR'}
                                        onChange={(e) => setTempEventItem({ ...tempEventItem, currency: e.target.value })}
                                        className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      >
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                        <option value="TRY">TRY</option>
                                      </select>
                                    ) : (
                                      <span>{displayEvent.currency || 'EUR'}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        step="0.0001"
                                        value={displayEvent.exchange_rate || 1.0000}
                                        onChange={(e) => {
                                          const rate = parseFloat(e.target.value) || 1.0000;
                                          setTempEventItem({
                                            ...tempEventItem,
                                            exchange_rate: rate,
                                            total_tl: (tempEventItem.amount || 0) * rate
                                          });
                                        }}
                                        className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                                      />
                                    ) : (
                                      <span>{formatNumberForDisplay(displayEvent.exchange_rate || 1.0000)}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={displayEvent.total_tl || (displayEvent.amount * (displayEvent.exchange_rate || 1.0000)) || 0}
                                        onChange={(e) => {
                                          const totalTL = parseFloat(e.target.value) || 0;
                                          const rate = tempEventItem.exchange_rate || 1.0000;
                                          setTempEventItem({
                                            ...tempEventItem,
                                            total_tl: totalTL,
                                            amount: totalTL / rate
                                          });
                                        }}
                                        className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                                      />
                                    ) : (
                                      <span>{formatNumberForDisplay(displayEvent.total_tl || (displayEvent.amount * (displayEvent.exchange_rate || 1.0000)) || 0)}</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex items-center justify-center gap-1">
                                      {isEditing ? (
                                        <>
                                          <button
                                            onClick={handleEventSave}
                                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                            title="Kaydet (Ctrl+Enter)"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingEventIndex(null);
                                              setTempEventItem(null);
                                              setIsNewEventItem(false);
                                            }}
                                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            title="İptal (Esc)"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => {
                                              setTempEventItem(event);
                                              setIsNewEventItem(false);
                                              setEditingEventIndex(originalIndex);
                                              setEventSupplierSearch(event.supplier?.name || '');
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Düzenle"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleEventDelete(originalIndex)}
                                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Sil"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {eventsActivities.length === 0 && (
                            <tr>
                              <td colSpan={10} className="px-2 py-8 text-center text-gray-500 dark:text-gray-400">
                                Henüz etkinlik eklenmemiş. "Yeni Ekle" butonunu kullanarak etkinlik ekleyebilirsiniz.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Genel Toplam */}
                  {eventsActivities.length > 0 && (
                    <div className="bg-blue-600 dark:bg-blue-700 rounded-md p-3">
                      <div className="grid grid-cols-12 gap-2 text-white text-sm responsive-filter-grid">
                        <div className="col-span-2 font-bold">GENEL TOPLAM</div>
                        <div className="col-span-6 text-right font-bold">
                          {Object.entries(eventTotals).map(([cur, val]: any) => `${formatNumber(Number(val.toplamMaliyet || 0))} ${cur}`).join(' + ')}
                        </div>
                        <div className="col-span-3 text-right font-bold">
                          {formatNumber(eventsActivities.reduce((sum: number, item: any) => sum + (parseFloat(item.total_tl || 0) || 0), 0))} TL
                        </div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                  )}
                </div>
  );
}
