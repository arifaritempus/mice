"use client";
import { usePermissions, Module } from "@/lib/permissions";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { projectTransfersService } from "@/lib/supabaseService";
import { getDayNameShort } from "@/utils/formatters";
import ConfirmModal from "@/components/ConfirmModal";
interface TransferTurTabProps {
  transfers: any[];
  setTransfers: (transfers: any[]) => void;
  selectedTransfers: string[];
  setSelectedTransfers: (transfers: string[] | ((prev: string[]) => string[])) => void;
  transferSearch: string;
  setTransferSearch: (search: string) => void;
  projectId: string;
  project?: any;
  accommodationItems: any[];
  createTransfersFromAccommodation: () => void;
  exportTransfersToExcel: () => void;
  groupSelectedTransfers: () => void;
  addFlightCodeToAllTransfers: () => void;
  openBulkVehicleAssignmentModal: () => void;
  filteredTransfers: any[];
  sortTransfers: (transfers: any[]) => any[];
  editingTransferIndex: number | null;
  setEditingTransferIndex: (index: number | null) => void;
  tempTransferItem: any;
  setTempTransferItem: (item: any) => void;
  handleTransferSave: (id: string) => void;
  handleTransferCancel: (id: string) => void;
  handleTransferEdit: (id: string) => void;
  handleTransferDelete: (id: string) => void;
  formatDateForDisplay: (dateValue: any) => string;
  formatTimeForDisplay: (timeValue: any) => string;
  formatIntegerForDisplay: (value: number | string) => string;
  formatIntegerForInput: (value: string) => string;
  showVehicleAssignmentModal: boolean;
  setShowVehicleAssignmentModal: (show: boolean) => void;
  showTransferTimingModal: boolean;
  setShowTransferTimingModal: (show: boolean) => void;
  departureHours: number;
  setDepartureHours: (hours: number) => void;
  departureMinutes: number;
  setDepartureMinutes: (minutes: number) => void;
  handleCreateTransfersWithTiming: () => void;
  showAddTransferMenu: boolean;
  setShowAddTransferMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
  addManualTransfer: (kind: "arrival" | "departure" | "intermediate") => void;
  stats: any;
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
  toggleSupplierDropdown: (transferId: string) => void;
  updateSupplierSearch: (transferId: string, searchTerm: string) => void;
  selectSupplier: (transferId: string, supplierId: string, supplierName: string) => void;
  handleSupplierKeyDown: (e: React.KeyboardEvent, transferId: string) => void;
  transferCostInput: {
    [key: string]: string;
  };
  setTransferCostInput: (value: {
    [key: string]: string;
  } | ((prev: {
    [key: string]: string;
  }) => {
    [key: string]: string;
  })) => void;
  updateTransfer: (id: string, field: string | Record<string, any>, value?: any) => void;
  formatNumberForDisplay: (value: number | string) => string;
  cleanInputValue: (value: string) => number;
  transferTotals: {
    [key: string]: {
      kisiSayisi: number;
      toplamMaliyet: number;
    };
  };
  getVehicleTypeName: (vehicleTypeCode: string) => string;
  editTransfer: (id: string) => void;
  deleteTransfer: (id: string) => void;
  saveTransfer: (id: string) => void;
  cancelTransferEdit: (id: string) => void;
  ungroupTransfer: (id: string) => void;
  openVehicleAssignmentModal: (id: string) => void;
  addTransferBelow: (id: string) => void;
  copyTransfer: (id: string) => void;
  handleTransferRowKeyDown: (e: React.KeyboardEvent, id: string) => void;
  isLocked?: boolean;
  [key: string]: any;
}
export default function TransferTurTab(props: TransferTurTabProps) {
  const {
    canEdit,
    isSuperAdmin
  } = usePermissions();
  const permEdit = canEdit(Module.PROJECTS);
  const compIsLocked = (props as any)?.isLocked || (props as any)?.project?.locked || false;
  const {
    transfers,
    setTransfers,
    selectedTransfers,
    setSelectedTransfers,
    transferSearch,
    setTransferSearch,
    projectId,
    accommodationItems,
    createTransfersFromAccommodation,
    exportTransfersToExcel,
    groupSelectedTransfers,
    addFlightCodeToAllTransfers,
    openBulkVehicleAssignmentModal,
    filteredTransfers,
    sortTransfers,
    editingTransferIndex,
    setEditingTransferIndex,
    tempTransferItem,
    setTempTransferItem,
    handleTransferSave,
    handleTransferCancel,
    handleTransferEdit,
    handleTransferDelete,
    formatDateForDisplay,
    formatTimeForDisplay,
    formatIntegerForDisplay,
    formatIntegerForInput,
    showVehicleAssignmentModal,
    setShowVehicleAssignmentModal,
    showTransferTimingModal,
    setShowTransferTimingModal,
    departureHours,
    setDepartureHours,
    departureMinutes,
    setDepartureMinutes,
    handleCreateTransfersWithTiming,
    showAddTransferMenu,
    setShowAddTransferMenu,
    addManualTransfer,
    project,
    stats,
    suppliers,
    hotels,
    allSuppliers,
    filteredHotelSuppliers,
    supplierDropdowns,
    setSupplierDropdowns,
    toggleSupplierDropdown,
    updateSupplierSearch,
    selectSupplier,
    handleSupplierKeyDown,
    transferCostInput,
    setTransferCostInput,
    updateTransfer,
    formatNumberForDisplay,
    cleanInputValue,
    transferTotals,
    getVehicleTypeName,
    editTransfer,
    deleteTransfer,
    saveTransfer,
    cancelTransferEdit,
    ungroupTransfer,
    openVehicleAssignmentModal,
    addTransferBelow,
    copyTransfer,
    handleTransferRowKeyDown,
    isLocked = false
  } = props;

  // Tedarikçi bazlı toplamları hesapla
  const supplierTotalsCalc = useMemo(() => {
    const totals: {
      [supplierName: string]: {
        [currency: string]: number;
      };
    } = {};
    props.transfers.forEach(t => {
      // costAmount varsa ve sıfırdan büyükse, tedarikçisi de varsa hesapla
      if (t.supplierName && t.costAmount && Number(t.costAmount) > 0) {
        if (!totals[t.supplierName]) {
          totals[t.supplierName] = {};
        }
        const currency = t.currency || "TRY";
        if (!totals[t.supplierName][currency]) {
          totals[t.supplierName][currency] = 0;
        }
        totals[t.supplierName][currency] += Number(t.costAmount) || 0;
      }
    });
    return totals;
  }, [props.transfers]);

  // Grup detaylarını açık/kapalı tutmak için state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Dropdown pozisyonu state'i
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [addMenuPosition, setAddMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Refler
  const addMenuButtonRef = useRef<HTMLButtonElement>(null);
  const supplierInputRefs = useRef<{
    [key: string]: HTMLInputElement | null;
  }>({});

  // Dropdown pozisyonunu güncelleme fonksiyonu
  const updateDropdownPosition = (transferId: string) => {
    const input = supplierInputRefs.current[transferId];
    if (input) {
      const rect = input.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        // fixed için scroll eklenmemeli
        left: rect.left,
        width: Math.max(rect.width, 300) // Minimum 300px genişlik
      });
    }
  };

  // Manuel ekleme menüsü pozisyonunu güncelleme
  const updateAddMenuPosition = () => {
    if (addMenuButtonRef.current) {
      const rect = addMenuButtonRef.current.getBoundingClientRect();
      setAddMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right + window.scrollX - 176 // 176px (w-44) genişliğe göre hizala
      });
    }
  };

  // Dışarı tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Manuel ekleme menüsü için
      if (showAddTransferMenu && addMenuButtonRef.current && !addMenuButtonRef.current.contains(event.target as Node)) {
        const menuElement = document.getElementById("manual-transfer-menu");
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setShowAddTransferMenu(false);
        }
      }

      // Tedarikçi dropdown'ları için
      Object.keys(supplierDropdowns).forEach(id => {
        if (supplierDropdowns[id]?.isOpen) {
          const input = supplierInputRefs.current[id];
          const dropdown = document.getElementById(`supplier-dropdown-${id}`);
          if (input && !input.contains(event.target as Node) && dropdown && !dropdown.contains(event.target as Node)) {
            setSupplierDropdowns(prev => ({
              ...prev,
              [id]: {
                ...prev[id],
                isOpen: false
              }
            }));
          }
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddTransferMenu, supplierDropdowns, setShowAddTransferMenu, setSupplierDropdowns]);

  // Sayfa kaydırıldığında pozisyonları güncelle
  useEffect(() => {
    const handleScroll = () => {
      if (showAddTransferMenu) updateAddMenuPosition();
      Object.keys(supplierDropdowns).forEach(id => {
        if (supplierDropdowns[id]?.isOpen) updateDropdownPosition(id);
      });
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showAddTransferMenu, supplierDropdowns]);

  // Onay modalı state'i (callback tabanlı — her işlem için kullanılabilir)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });
  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm
    });
  };
  const openDeleteConfirm = (id: string) => {
    openConfirm("Transferi Sil", "Bu transferi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.", () => deleteTransfer(id));
  };
  const handleConfirmAction = () => {
    confirmModal.onConfirm();
    setConfirmModal(prev => ({
      ...prev,
      open: false
    }));
  };
  const handleCancelAction = () => {
    setConfirmModal(prev => ({
      ...prev,
      open: false
    }));
  };

  // Grup detaylarını aç/kapa
  const toggleGroupDetails = (id: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Transfer seçimi için handler
  const handleTransferSelect = (transferId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransfers(prev => [...prev, transferId]);
    } else {
      setSelectedTransfers(prev => prev.filter(id => id !== transferId));
    }
  };
  return <div className="space-y-3">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 mb-2 bg-gray-100 dark:bg-[#0f172a]/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-sm shrink-0">
        <div className="flex-1 mr-4">
          <input type="text" placeholder="Transfer ara..." value={transferSearch} onChange={e => setTransferSearch(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
        </div>
        <div className="flex gap-2">
          <button onClick={createTransfersFromAccommodation} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
            Konaklamadan Transfer Oluştur
          </button>
          <button onClick={() => exportTransfersToExcel()} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-500/90 transition-colors">
            Excel Dışa Aktar
          </button>
          <button onClick={() => {
          if (transfers.length === 0) return;
          openConfirm("Tüm Transferleri Temizle", `Tüm transferleri (${transfers.length} adet) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`, async () => {
            try {
              await projectTransfersService.deleteByProjectId(projectId);
              setTransfers([]);
              setSelectedTransfers([]);
            } catch (error) {
              console.error("Transfer temizleme hatası:", error);
            }
          });
        }} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
            Temizle
          </button>
        </div>
      </div>

      {/* Transfer Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  <div className="flex items-center gap-1">
                    <input type="checkbox" checked={filteredTransfers.length > 0 && filteredTransfers.every(t => selectedTransfers.includes(t.id))} onChange={() => {
                    const filteredIds = filteredTransfers.map(t => t.id);
                    const allFilteredSelected = filteredIds.every(id => selectedTransfers.includes(id));
                    if (allFilteredSelected) {
                      // Filtrelenmiş olanları seçimden çıkar
                      setSelectedTransfers(selectedTransfers.filter(id => !filteredIds.includes(id)));
                    } else {
                      // Filtrelenmiş olanları seçime ekle (mevcut seçimleri koru)
                      const newSelections = [...new Set([...selectedTransfers, ...filteredIds])];
                      setSelectedTransfers(newSelections);
                    }
                  }} className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    Seç
                  </div>
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Transfer Tipi
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Otel
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Tarih
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Saat
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Uçuş Kodu
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Güzergah
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Yolcu Sayısı
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Transfer Tipi
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Araç Tipi
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Tedarikçi
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Maliyet Tutarı
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Döviz
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  Misafirler
                </th>
                <th className="px-2.5 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between relative">
                    <span>İşlemler</span>
                    <div className="relative">
                      <button ref={addMenuButtonRef} onClick={() => {
                      updateAddMenuPosition();
                      setShowAddTransferMenu(prev => !prev);
                    }} className="p-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500" title="Manuel Transfer Ekle">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      {showAddTransferMenu && addMenuPosition && createPortal(<div id="manual-transfer-menu" className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[9999] py-1 w-44" style={{
                      top: addMenuPosition.top,
                      left: addMenuPosition.left
                    }}>
                            <button onClick={() => {
                        addManualTransfer("arrival");
                        setShowAddTransferMenu(false);
                      }} className="w-full text-left px-2.5 py-2.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors duration-150">
                              Giriş Transferi Ekle
                            </button>
                            <button onClick={() => {
                        addManualTransfer("departure");
                        setShowAddTransferMenu(false);
                      }} className="w-full text-left px-2.5 py-2.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors duration-150">
                              Çıkış Transferi Ekle
                            </button>
                            <button onClick={() => {
                        addManualTransfer("intermediate");
                        setShowAddTransferMenu(false);
                      }} className="w-full text-left px-2.5 py-2.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors duration-150">
                              Ara Transfer Ekle
                            </button>
                          </div>, document.body)}
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.flatMap(transfer => {
              const elements: any[] = [<tr key={transfer.id} id={`transfer-row-${transfer.id}`} tabIndex={transfer.isEditing ? 0 : -1} onKeyDown={e => handleTransferRowKeyDown(e, transfer.id)} className={`hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0 ${transfer.isEditing ? "bg-blue-500/10 dark:bg-blue-900/20" : ""}`} onDoubleClick={() => {
                if (!transfer.isEditing) handleTransferEdit(transfer.id);
              }}>
                    <td className="px-2.5 py-2.5">
                      {!transfer.vehicleAssigned && !transfer.isGroup && <input type="checkbox" checked={selectedTransfers.includes(transfer.id)} onChange={e => handleTransferSelect(transfer.id, e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500" disabled={!permEdit || compIsLocked && !isSuperAdmin} />}
                    </td>
                    <td className="px-2.5 py-2.5">
                      {transfer.typeLabel === "Ara Transfer" ? <span className={`px-2 py-1 rounded-md text-xs font-medium inline-block bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700`}>
                          Ara Transfer
                        </span> : transfer.isGroup ? <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium inline-block ${transfer.typeLabel === "Grup Ara" ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700" : transfer.direction === "arrival" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700" : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"}`}>
                            {transfer.typeLabel || (transfer.direction === "arrival" ? "Grup Giriş" : "Grup Çıkış")}
                          </span>
                          <button onClick={() => toggleGroupDetails(transfer.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={expandedGroups.has(transfer.id) ? "Detayları Gizle" : "Detayları Göster"}>
                            <svg className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${expandedGroups.has(transfer.id) ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div> : <span className={`px-2 py-1 rounded-md text-xs font-medium inline-block ${transfer.direction === "arrival" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700" : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-gray-700"}`}>
                          {transfer.direction === "arrival" ? "Giriş" : "Çıkış"}
                        </span>}
                    </td>
                    <td className="px-2.5 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      {(() => {
                    if (!transfer.hotel_id) return "Genel";
                    // 1. Proje otel sekmelerinde ara
                    const tabHotel = project?.hotels_data?.find((h: any) => h.id === transfer.hotel_id);
                    if (tabHotel) {
                      if (tabHotel.hotel_name) return tabHotel.hotel_name;
                      const masterHotel = hotels?.find((h: any) => h.id === tabHotel.hotel_id);
                      if (masterHotel) return masterHotel.name;
                    }
                    // 2. Doğrudan master listede ara (Eski veriler veya doğrudan ID verilmişse)
                    const masterHotel = hotels?.find((h: any) => h.id === transfer.hotel_id);
                    return masterHotel?.name || "Otel";
                  })()}
                    </td>
                    <td className="px-2.5 py-2.5 text-gray-900 dark:text-white">
                      {transfer.isEditing ? <input type="text" id={`transfer-date-${transfer.id}`} value={transfer.date || ""} onChange={e => updateTransfer(transfer.id, "date", e.target.value)} onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTransfer(transfer.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelTransferEdit(transfer.id);
                    }
                  }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700" placeholder="DD.MM.YYYY" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : transfer.date}
                    </td>
                    <td className="px-2.5 py-2.5 text-gray-900 dark:text-white">
                      {transfer.isEditing ? <input type="text" value={transfer.time || ""} onChange={e => updateTransfer(transfer.id, "time", e.target.value)} onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTransfer(transfer.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelTransferEdit(transfer.id);
                    }
                  }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700" placeholder="HH:MM" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : transfer.time}
                    </td>
                    <td className="px-2.5 py-2.5 text-gray-900 dark:text-white">
                      {transfer.isEditing ? <input type="text" value={transfer.flightCode || ""} onChange={e => updateTransfer(transfer.id, "flightCode", e.target.value)} onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTransfer(transfer.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelTransferEdit(transfer.id);
                    }
                  }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 font-mono" placeholder="TK1234" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                          {transfer.flightCode || "-"}
                        </span>}
                    </td>
                    <td className="px-2.5 py-2.5 text-gray-900 dark:text-white">
                      {transfer.route}
                    </td>
                    <td className="px-2.5 py-2.5 text-gray-900 dark:text-white">
                      {transfer.isEditing ? <input type="text" value={formatIntegerForDisplay(transfer.passengerCount)} onChange={e => updateTransfer(transfer.id, "passengerCount", parseInt(formatIntegerForInput(e.target.value)) || 1)} onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveTransfer(transfer.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelTransferEdit(transfer.id);
                    }
                  }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700" placeholder="1" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : formatIntegerForDisplay(transfer.passengerCount)}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <select value={transfer.transferType || ""} onChange={e => updateTransfer(transfer.id, "transferType", e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="private">Özel</option>
                        <option value="economic">Ekonomik</option>
                      </select>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <select value={transfer.vehicleType || ""} onChange={e => updateTransfer(transfer.id, "vehicleType", e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="">Seçiniz</option>
                        <option value="vito">Vito</option>
                        <option value="sprinter">Sprinter</option>
                        <option value="otobus">Otobüs</option>
                        <option value="binek">Binek</option>
                        <option value="s-class">S Class</option>
                      </select>
                    </td>
                    <td className="px-2.5 py-2.5 relative">
                      <div className="relative">
                        <input ref={el => {
                      supplierInputRefs.current[transfer.id] = el;
                    }} type="text" value={supplierDropdowns[transfer.id]?.isOpen ? supplierDropdowns[transfer.id]?.searchTerm ?? "" : transfer.supplierName || ""} placeholder="Tedarikçi Seçiniz" onChange={e => {
                      if (!supplierDropdowns[transfer.id]?.isOpen) {
                        toggleSupplierDropdown(transfer.id);
                      }
                      updateSupplierSearch(transfer.id, e.target.value);
                      updateDropdownPosition(transfer.id);
                      if (e.target.value.trim() === "") {
                        updateTransfer(transfer.id, "supplierId", "");
                        updateTransfer(transfer.id, "supplierName", "");
                        updateTransfer(transfer.id, "vehicleAssigned", false);
                      }
                    }} onClick={() => {
                      if (!supplierDropdowns[transfer.id]?.isOpen) {
                        toggleSupplierDropdown(transfer.id);
                        updateDropdownPosition(transfer.id);
                      }
                    }} onKeyDown={e => {
                      if (supplierDropdowns[transfer.id]?.isOpen) {
                        handleSupplierKeyDown(e, transfer.id);
                        if (e.key === "Enter" || e.key === "Escape") {
                          e.stopPropagation();
                        }
                      }
                    }} onBlur={e => {
                      // Temizleme mantığı onChange içine taşındı.
                    }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 cursor-pointer" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                          <span className="pointer-events-none">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>

                        {supplierDropdowns[transfer.id]?.isOpen && dropdownPosition && createPortal(<div id={`supplier-dropdown-${transfer.id}`} className="transfer-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xl max-h-80 overflow-y-auto" style={{
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                      minWidth: "300px"
                    }}>
                              {allSuppliers.filter((item: any) => (item.displayName || item.name || item.title || "").toLowerCase().includes((supplierDropdowns[transfer.id]?.searchTerm || "").toLowerCase())).map((item: any, itemIndex: number) => <div key={`${item.type}-${item.id}`} onClick={() => selectSupplier(transfer.id, item.id, item.displayName || item.name || item.title)} className={`px-2.5 py-2.5 text-xs cursor-pointer transition-colors duration-150 flex items-center justify-between ${itemIndex === supplierDropdowns[transfer.id]?.selectedIndex ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                                    <span>
                                      {item.displayName || item.name || item.title}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                                      {item.type === "hotel" ? "Otel" : "Tedarikçi"}
                                    </span>
                                  </div>)}
                            </div>, document.body)}
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <input type="text" inputMode="decimal" value={transferCostInput[transfer.id] ?? (transfer.costAmount ? formatNumberForDisplay(transfer.costAmount) : "")} onChange={e => {
                    let v = e.target.value.replace(/[^0-9.,]/g, "");
                    v = v.replace(/\./g, ",");
                    const parts = v.split(",");
                    if (parts.length > 2) {
                      v = parts[0] + "," + parts.slice(1).join("").replace(/,/g, "");
                    }
                    setTransferCostInput(prev => ({
                      ...prev,
                      [transfer.id]: v
                    }));
                  }} onFocus={e => {
                    e.currentTarget.select();
                  }} onBlur={e => {
                    const parsed = cleanInputValue(e.target.value);
                    const safe = isNaN(parsed) ? 0 : parsed;
                    updateTransfer(transfer.id, "costAmount", safe);
                    setTransferCostInput(prev => ({
                      ...prev,
                      [transfer.id]: formatNumberForDisplay(safe)
                    }));
                  }} onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const parsed = cleanInputValue((e.target as HTMLInputElement).value);
                      const safe = isNaN(parsed) ? 0 : parsed;
                      updateTransfer(transfer.id, "costAmount", safe);
                      setTransferCostInput(prev => ({
                        ...prev,
                        [transfer.id]: formatNumberForDisplay(safe)
                      }));
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setTransferCostInput(prev => ({
                        ...prev,
                        [transfer.id]: transfer.costAmount ? formatNumberForDisplay(transfer.costAmount) : ""
                      }));
                    }
                  }} placeholder="0,00" className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-right" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2.5 py-2.5">
                      <select value={transfer.currency || "TRY"} onChange={e => updateTransfer(transfer.id, "currency", e.target.value)} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="TRY">TRY</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </td>
                    <td className="px-2.5 py-2.5 w-48 max-w-[12rem] overflow-hidden text-gray-900 dark:text-white">
                      {transfer.isEditing ? <input type="text" value={(transfer as any).passengersInput ?? transfer.passengers.join(", ")} onChange={e => updateTransfer(transfer.id, "passengersInput", e.target.value)} onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const raw = (transfer as any).passengersInput ?? "";
                      const parsed = raw.split(",").map((p: any) => p.trim()).filter((p: any) => p);
                      updateTransfer(transfer.id, "passengers", parsed);
                      saveTransfer(transfer.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelTransferEdit(transfer.id);
                    }
                  }} className="w-full px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 truncate whitespace-nowrap overflow-hidden" placeholder="Ad Soyad, Ad Soyad" disabled={!permEdit || compIsLocked && !isSuperAdmin} /> : <div className="truncate whitespace-nowrap" title={transfer.passengers.join(", ")}>
                          {transfer.passengers.join(", ")}
                        </div>}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex gap-1">
                        {transfer.isEditing ? <>
                            <button onClick={() => saveTransfer(transfer.id)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Kaydet">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button onClick={() => cancelTransferEdit(transfer.id)} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title="İptal">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </> : transfer.isGroup ? <>
                            {!transfer.vehicleAssigned && <button onClick={() => openVehicleAssignmentModal(transfer.id)} className="p-1 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30" title="Araç Ata">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>}
                            <button onClick={() => editTransfer(transfer.id)} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30" title="Düzenle">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => ungroupTransfer(transfer.id)} className="p-1 rounded text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30" title="Grubu Ayır">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </button>
                          </> : <>
                            {!transfer.vehicleAssigned && <button onClick={() => openVehicleAssignmentModal(transfer.id)} className="p-1 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30" title="Araç Ata">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>}
                            <button onClick={() => editTransfer(transfer.id)} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30" title="Düzenle">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {!transfer.vehicleAssigned && <>
                                <button onClick={() => addTransferBelow(transfer.id)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title="Ekle">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                                <button onClick={() => copyTransfer(transfer.id)} className="p-1 rounded text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30" title="Kopyala">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </>}
                            <button onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteConfirm(transfer.id);
                      }} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>}
                      </div>
                    </td>
                  </tr>];
              if (transfer.isGroup && expandedGroups.has(transfer.id)) {
                elements.push(<tr key={`${transfer.id}-details`} className="bg-gray-50 dark:bg-gray-800/50">
                      <td colSpan={12} className="px-2.5 py-2.5">
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Grup Detayları (
                            {transfer.originalTransfers?.length || 0} transfer)
                          </h4>
                          <div className="space-y-2">
                            {transfer.originalTransfers?.map((originalTransfer: any, detailIndex: number) => {
                          const hotelName = (() => {
                            if (!originalTransfer.hotel_id) return "Genel";
                            const tabHotel = project?.hotels_data?.find((h: any) => h.id === originalTransfer.hotel_id);
                            if (tabHotel) {
                              if (tabHotel.hotel_name) return tabHotel.hotel_name;
                              const masterHotel = hotels?.find((h: any) => h.id === tabHotel.hotel_id);
                              if (masterHotel) return masterHotel.name;
                            }
                            const masterHotel = hotels?.find((h: any) => h.id === originalTransfer.hotel_id);
                            return masterHotel?.name || "Otel";
                          })();
                          return <div key={detailIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-600 rounded border">
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${originalTransfer.direction === "arrival" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"}`}>
                                        {originalTransfer.direction === "arrival" ? "Giriş" : "Çıkış"}
                                      </span>
                                      <span className="font-bold text-gray-500 dark:text-gray-400 border-r pr-4 uppercase tracking-tighter">
                                        {hotelName}
                                      </span>
                                      <span className="font-mono">
                                        {originalTransfer.date}
                                      </span>
                                      <span className="font-mono">
                                        {originalTransfer.time}
                                      </span>
                                      <span className="font-mono text-blue-600 dark:text-blue-400">
                                        {originalTransfer.flightCode || "-"}
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-300">
                                        {originalTransfer.route}
                                      </span>
                                      <span className="text-gray-500 dark:text-gray-400">
                                        {originalTransfer.passengers?.join(", ") || "-"}
                                      </span>
                                    </div>
                                  </div>;
                        })}
                          </div>
                        </div>
                      </td>
                    </tr>);
              }
              return elements;
            })}

              {/* Döviz Cinsine Göre Toplam Satırları */}
              {transfers.length > 0 && Object.keys(transferTotals).sort().map((doviz, index) => <tr key={doviz} className={`font-semibold ${index === 0 ? "bg-gray-100 dark:bg-gray-600" : "bg-gray-50 dark:bg-gray-700"}`}>
                      <td className="px-2.5 py-2.5 text-gray-900 dark:text-white" colSpan={8}>
                        TOPLAM ({doviz})
                      </td>
                      <td className="px-2.5 py-2.5 text-gray-900 dark:text-white text-center">
                        {formatIntegerForDisplay(transferTotals[doviz].kisiSayisi)}
                      </td>
                      <td className="px-2.5 py-2.5 text-gray-900 dark:text-white text-center">
                        {formatNumberForDisplay(transferTotals[doviz].toplamMaliyet)}
                      </td>
                      <td className="px-2.5 py-2.5 text-gray-900 dark:text-white text-center font-bold">
                        {doviz}
                      </td>
                      <td className="px-2.5 py-2.5 text-gray-900 dark:text-white" colSpan={2}>
                        {/* Boş sütunlar */}
                      </td>
                    </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modern İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Giriş */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700/50 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 dark:bg-green-800/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Giriş Transferleri
                </h3>
              </div>
              <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stats.arrival.count}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
              {stats.arrival.passengers}
            </div>
            <div className="text-xs text-green-600 dark:text-green-300 mb-3">
              Toplam Kişi
            </div>
            <div className="space-y-1.5">
              {Object.entries(stats?.arrival?.byVehicle || {}).sort(([a], [b]) => a.localeCompare(b)).map(([veh, v]: any) => <div key={veh} className="flex items-center justify-between text-xs bg-white/50 dark:bg-green-900/20 rounded-lg px-2 py-1">
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      {getVehicleTypeName(veh)}
                    </span>
                    <span className="text-green-900 dark:text-green-100 font-semibold">
                      {v.transfers} • {v.passengers}
                    </span>
                  </div>)}
            </div>
          </div>
        </div>

        {/* Ara Transfer */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700/50 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200 dark:bg-amber-800/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Ara Transferler
                </h3>
              </div>
              <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stats.intermediate.count}
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1">
              {stats.intermediate.passengers}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-300 mb-3">
              Toplam Kişi
            </div>
            <div className="space-y-1.5">
              {Object.entries(stats?.intermediate?.byVehicle || {}).sort(([a], [b]) => a.localeCompare(b)).map(([veh, v]: any) => <div key={veh} className="flex items-center justify-between text-xs bg-white/50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      {getVehicleTypeName(veh)}
                    </span>
                    <span className="text-amber-900 dark:text-amber-100 font-semibold">
                      {v.transfers} • {v.passengers}
                    </span>
                  </div>)}
            </div>
          </div>
        </div>{/* Çıkış */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 dark:bg-blue-800/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Çıkış Transferleri
                </h3>
              </div>
              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stats.departure.count}
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              {stats.departure.passengers}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300 mb-3">
              Toplam Kişi
            </div>
            <div className="space-y-1.5">
              {Object.entries(stats?.departure?.byVehicle || {}).sort(([a], [b]) => a.localeCompare(b)).map(([veh, v]: any) => <div key={veh} className="flex items-center justify-between text-xs bg-white/50 dark:bg-blue-900/20 rounded-lg px-2 py-1">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      {getVehicleTypeName(veh)}
                    </span>
                    <span className="text-blue-900 dark:text-blue-100 font-semibold">
                      {v.transfers} • {v.passengers}
                    </span>
                  </div>)}
            </div>
          </div>
        </div>

        
        {/* Tedarikçi Toplam Tutarları */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 dark:bg-purple-800/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  Tedarikçi Toplam Tutarları
                </h3>
              </div>
              <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {Object.keys(supplierTotalsCalc).length}
              </div>
            </div>
            
            <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto pr-1">
              {Object.keys(supplierTotalsCalc).length > 0 ? Object.entries(supplierTotalsCalc).sort(([a], [b]) => a.localeCompare(b)).map(([supplierName, currencies]) => <div key={supplierName} className="flex flex-col text-xs bg-white/50 dark:bg-purple-900/20 rounded-lg px-2 py-1.5">
                      <span className="text-purple-800 dark:text-purple-200 font-semibold mb-1">
                        {supplierName}
                      </span>
                      {Object.entries(currencies).map(([curr, amount]) => <div key={curr} className="flex justify-between items-center ml-2 border-t border-purple-200/30 dark:border-purple-700/30 pt-0.5 mt-0.5 first:border-0 first:pt-0 first:mt-0">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">{curr}</span>
                          <span className="text-purple-900 dark:text-purple-100 font-bold">
                            {formatNumberForDisplay(amount)}
                          </span>
                        </div>)}
                    </div>) : <div className="text-xs text-purple-600 dark:text-purple-400 text-center py-2">
                  Kayıtlı tedarikçi maliyeti yok
                </div>}
            </div>
          </div>
        </div>

      </div>

      {/* Modern Genel Toplam */}
      <div className="mt-4 group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 p-4 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-200 dark:bg-gray-600/30 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Genel Toplam
              </h3>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totals.count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Transfer
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totals.passengers}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Kişi
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 responsive-filter-grid">
            {Object.entries(stats?.totals?.byVehicle || {}).sort(([a], [b]) => a.localeCompare(b)).map(([veh, v]: any) => <div key={veh} className="bg-white/60 dark:bg-gray-800/60 rounded-lg px-2.5 py-2.5 text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {getVehicleTypeName(veh)}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {v.transfers}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {v.passengers} kişi
                  </div>
                </div>)}
          </div>
        </div>
      </div>

      {/* Seçili Transferler için Gruplama ve Araç Atama */}
      {selectedTransfers.length > 0 && <div className="bg-blue-500/10 dark:bg-blue-900/20 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Seçili Transferler ({selectedTransfers.length})
          </h3>
          <div className="flex gap-2">
            {!isLocked && <button onClick={() => groupSelectedTransfers()} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Seçili Transferleri Grupla
              </button>}
            <button onClick={() => setSelectedTransfers([])} className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Seçimi Temizle
            </button>
          </div>
        </div>}
      {/* Modern Onay Modalı */}
      <ConfirmModal isOpen={confirmModal.open} title={confirmModal.title} message={confirmModal.message} onConfirm={handleConfirmAction} onCancel={handleCancelAction} />
    </div>;
}