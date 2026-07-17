"use client";
import { usePermissions, Module } from "@/lib/permissions";
import React, { useCallback, useMemo , useEffect} from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface OdemeTabProps {
  projectId: string;
  purchaseTotals: {
    totalByCurrency: Record<string, number>;
    totalTRY: number;
  };
  paymentPlans: any[];
  setPaymentPlans: React.Dispatch<React.SetStateAction<any[]>>;
  editingPaymentPlanIndex: number | null;
  setEditingPaymentPlanIndex: (index: number | null) => void;
  tempPaymentPlanItem: any;
  setTempPaymentPlanItem: (item: any) => void;
  paymentPlanAmountInput: string;
  setPaymentPlanAmountInput: (value: string) => void;
  paymentPlanTotalTRYInput: string;
  setPaymentPlanTotalTRYInput: (value: string) => void;
  payments: any[];
  setPayments: React.Dispatch<React.SetStateAction<any[]>>;
  editingPaymentIndex: number | null;
  setEditingPaymentIndex: (index: number | null) => void;
  tempPaymentItem: any;
  setTempPaymentItem: (item: any) => void;
  paymentAmountInput: string;
  setPaymentAmountInput: (value: string) => void;
  paymentTotalTRYInput: string;
  setPaymentTotalTRYInput: (value: string) => void;
  handlePaymentPlanSave: (item: any) => Promise<any>;
  handlePaymentPlanCancel: () => void;
  handlePaymentPlanDelete: (item: any) => Promise<void>;
  handlePaymentSave: (item: any) => Promise<any>;
  handlePaymentCancel: () => void;
  handlePaymentDelete: (item: any) => Promise<void>;
  formatNumber: (value: number) => string;
  formatNumberForDisplay: (value: number | string) => string;
  formatNumberForInput: (value: number | string) => string;
  cleanInputValue: (value: string) => number;
  formatDateForDisplay: (date: string) => string;
  formatTRY: (value: number) => string;
  paymentPlanByCurrency: Record<string, number>;
  paidByCurrency: Record<string, number>;
  paymentSummary: {
    planTRY: number;
    paidTRY: number;
    balanceTRY: number;
  };
  paymentPlanHotelSupplierSearch: string;
  setPaymentPlanHotelSupplierSearch: (value: string) => void;
  showPaymentPlanHotelSupplierDropdown: boolean;
  setShowPaymentPlanHotelSupplierDropdown: (show: boolean) => void;
  selectedPaymentPlanSupplierIndex: number;
  setSelectedPaymentPlanSupplierIndex: React.Dispatch<React.SetStateAction<number>>;
  paymentHotelSupplierSearch: string;
  setPaymentHotelSupplierSearch: (value: string) => void;
  showPaymentHotelSupplierDropdown: boolean;
  setShowPaymentHotelSupplierDropdown: (show: boolean) => void;
  selectedPaymentSupplierIndex: number;
  setSelectedPaymentSupplierIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredHotelSuppliers: any[];
  allSuppliers: any[];
  suppliers: any[];
  hotels: any[];
  dropdownPosition: {
    top: number;
    left: number;
    width: number;
  } | null;
  updateDropdownPosition: () => void;
  setPaymentPlanSupplierInputRef: (el: HTMLInputElement | null) => void;
  setPaymentSupplierInputRef: (el: HTMLInputElement | null) => void;
  handlePaymentPlanSupplierSelect: (supplier: any) => void;
  handlePaymentPlanKeyDown: (e: React.KeyboardEvent) => void;
  handlePaymentSupplierSelect: (supplier: any) => void;
  handlePaymentKeyDown: (e: React.KeyboardEvent) => void;
  [key: string]: any;
}
export default function OdemeTab(props: OdemeTabProps) {
  const { t } = useLanguage();
  const {
    canEdit,
    isSuperAdmin
  } = usePermissions();
  const permEdit = canEdit(Module.PROJECTS);
  const compIsLocked = (props as any)?.isLocked || (props as any)?.project?.locked || false;
  const {
    projectId,
    purchaseTotals,
    paymentPlans,
    setPaymentPlans,
    editingPaymentPlanIndex,
    setEditingPaymentPlanIndex,
    tempPaymentPlanItem,
    setTempPaymentPlanItem,
    paymentPlanAmountInput,
    setPaymentPlanAmountInput,
    paymentPlanTotalTRYInput,
    setPaymentPlanTotalTRYInput,
    payments,
    setPayments,
    editingPaymentIndex,
    setEditingPaymentIndex,
    tempPaymentItem,
    setTempPaymentItem,
    paymentAmountInput,
    setPaymentAmountInput,
    paymentTotalTRYInput,
    setPaymentTotalTRYInput,
    handlePaymentPlanSave,
    handlePaymentPlanCancel,
    handlePaymentPlanDelete,
    handlePaymentSave,
    handlePaymentCancel,
    handlePaymentDelete,
    formatNumber,
    formatNumberForDisplay,
    formatNumberForInput,
    cleanInputValue,
    formatDateForDisplay,
    formatTRY,
    paymentPlanByCurrency,
    paidByCurrency,
    paymentSummary,
    paymentPlanHotelSupplierSearch,
    setPaymentPlanHotelSupplierSearch,
    showPaymentPlanHotelSupplierDropdown,
    setShowPaymentPlanHotelSupplierDropdown,
    selectedPaymentPlanSupplierIndex,
    setSelectedPaymentPlanSupplierIndex,
    paymentHotelSupplierSearch,
    setPaymentHotelSupplierSearch,
    showPaymentHotelSupplierDropdown,
    setShowPaymentHotelSupplierDropdown,
    selectedPaymentSupplierIndex,
    setSelectedPaymentSupplierIndex,
    filteredHotelSuppliers,
    allSuppliers,
    suppliers,
    hotels,
    dropdownPosition,
    updateDropdownPosition,
    setPaymentPlanSupplierInputRef,
    setPaymentSupplierInputRef,
    handlePaymentPlanSupplierSelect,
    handlePaymentPlanKeyDown,
    handlePaymentSupplierSelect,
    handlePaymentKeyDown
  } = props;

  // Tüm tedarikçiler ve oteller listesi (filtrelenmemiş)
  const allSuppliersList = useMemo(() => {
    return allSuppliers.length > 0 ? allSuppliers : [...(suppliers || []).map((supplier: any) => ({
      ...supplier,
      type: "supplier",
      displayName: supplier.name || supplier.title || ""
    })), ...(hotels || []).map((hotel: any) => ({
      ...hotel,
      type: "hotel",
      displayName: hotel.name || hotel.title || ""
    }))];
  }, [allSuppliers, suppliers, hotels]);

  // Ödeme Planı için filtrelenmiş tedarikçiler
  const filteredPaymentPlanSuppliers = useMemo(() => {
    if (!paymentPlanHotelSupplierSearch || !paymentPlanHotelSupplierSearch.trim()) return allSuppliersList;
    return allSuppliersList.filter((supplier: any) => supplier.displayName?.toLowerCase().includes(paymentPlanHotelSupplierSearch?.toLowerCase() || "") || supplier.title?.toLowerCase().includes(paymentPlanHotelSupplierSearch?.toLowerCase() || "") || supplier.name?.toLowerCase().includes(paymentPlanHotelSupplierSearch?.toLowerCase() || ""));
  }, [allSuppliersList, paymentPlanHotelSupplierSearch]);

  // Ödeme için filtrelenmiş tedarikçiler
  const filteredPaymentSuppliers = useMemo(() => {
    if (!paymentHotelSupplierSearch || !paymentHotelSupplierSearch.trim()) return allSuppliersList;
    return allSuppliersList.filter((supplier: any) => supplier.displayName?.toLowerCase().includes(paymentHotelSupplierSearch?.toLowerCase() || "") || supplier.title?.toLowerCase().includes(paymentHotelSupplierSearch?.toLowerCase() || "") || supplier.name?.toLowerCase().includes(paymentHotelSupplierSearch?.toLowerCase() || ""));
  }, [allSuppliersList, paymentHotelSupplierSearch]);

  // Ödeme Planı klavye navigasyonu (override)
  const handlePaymentPlanKeyDownLocal = useCallback((e: React.KeyboardEvent) => {
    if (!showPaymentPlanHotelSupplierDropdown) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedPaymentPlanSupplierIndex((prev: number) => prev < filteredPaymentPlanSuppliers.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedPaymentPlanSupplierIndex((prev: number) => prev > 0 ? prev - 1 : filteredPaymentPlanSuppliers.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedPaymentPlanSupplierIndex >= 0 && selectedPaymentPlanSupplierIndex < filteredPaymentPlanSuppliers.length) {
          const supplier = filteredPaymentPlanSuppliers[selectedPaymentPlanSupplierIndex];
          handlePaymentPlanSupplierSelect(supplier);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowPaymentPlanHotelSupplierDropdown(false);
        setSelectedPaymentPlanSupplierIndex(-1);
        break;
    }
  }, [showPaymentPlanHotelSupplierDropdown, selectedPaymentPlanSupplierIndex, filteredPaymentPlanSuppliers, handlePaymentPlanSupplierSelect]);

  // Ödeme klavye navigasyonu (override)
  const handlePaymentKeyDownLocal = useCallback((e: React.KeyboardEvent) => {
    if (!showPaymentHotelSupplierDropdown) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedPaymentSupplierIndex((prev: number) => prev < filteredPaymentSuppliers.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedPaymentSupplierIndex((prev: number) => prev > 0 ? prev - 1 : filteredPaymentSuppliers.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedPaymentSupplierIndex >= 0 && selectedPaymentSupplierIndex < filteredPaymentSuppliers.length) {
          const supplier = filteredPaymentSuppliers[selectedPaymentSupplierIndex];
          handlePaymentSupplierSelect(supplier);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowPaymentHotelSupplierDropdown(false);
        setSelectedPaymentSupplierIndex(-1);
        break;
    }
  }, [showPaymentHotelSupplierDropdown, selectedPaymentSupplierIndex, filteredPaymentSuppliers, handlePaymentSupplierSelect]);
  const [searchTags, setSearchTags] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState("");
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim() !== "") {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        setSearchTags([...searchTags, searchInput.trim()]);
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && searchInput === "" && searchTags.length > 0) {
      setSearchTags(searchTags.slice(0, -1));
    }
  };
  const removeSearchTag = (tagToRemove: string) => {
    setSearchTags(searchTags.filter(tag => tag !== tagToRemove));
  };
  const [sortConfigPlan, setSortConfigPlan] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [sortConfigActual, setSortConfigActual] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const handleSortPlan = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfigPlan && sortConfigPlan.key === key && sortConfigPlan.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigPlan({
      key,
      direction
    });
  };
  const handleSortActual = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfigActual && sortConfigActual.key === key && sortConfigActual.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigActual({
      key,
      direction
    });
  };
  const getFilteredAndSortedPlans = useCallback(() => {
    let result = [...paymentPlans];
    if (searchTags.length > 0) {
      result = result.filter(item => {
        return searchTags.every(tag => {
          const s = tag.toLowerCase();
          return item.description && item.description.toLowerCase().includes(s) || item.paymentType && item.paymentType.toLowerCase().includes(s) || item.hotel && item.hotel.toLowerCase().includes(s) || item.currency && item.currency.toLowerCase().includes(s) || item.date && item.date.includes(s);
        });
      });
    }
    if (searchInput.trim() !== "") {
      const s = searchInput.toLowerCase();
      result = result.filter(item => {
        return item.description && item.description.toLowerCase().includes(s) || item.paymentType && item.paymentType.toLowerCase().includes(s) || item.hotel && item.hotel.toLowerCase().includes(s) || item.currency && item.currency.toLowerCase().includes(s) || item.date && item.date.includes(s);
      });
    }
    if (sortConfigPlan !== null) {
      result.sort((a, b) => {
        let aVal = a[sortConfigPlan.key];
        let bVal = b[sortConfigPlan.key];
        if (sortConfigPlan.key === 'totalTRY') {
          aVal = a.totalTRY || a.amount;
          bVal = b.totalTRY || b.amount;
        }
        if (aVal < bVal) return sortConfigPlan.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfigPlan.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [paymentPlans, searchTags, searchInput, sortConfigPlan]);
  const getFilteredAndSortedActuals = useCallback(() => {
    let result = [...payments];
    if (searchTags.length > 0) {
      result = result.filter(item => {
        return searchTags.every(tag => {
          const s = tag.toLowerCase();
          return item.description && item.description.toLowerCase().includes(s) || item.paymentType && item.paymentType.toLowerCase().includes(s) || item.hotel && item.hotel.toLowerCase().includes(s) || item.currency && item.currency.toLowerCase().includes(s) || item.date && item.date.includes(s);
        });
      });
    }
    if (searchInput.trim() !== "") {
      const s = searchInput.toLowerCase();
      result = result.filter(item => {
        return item.description && item.description.toLowerCase().includes(s) || item.paymentType && item.paymentType.toLowerCase().includes(s) || item.hotel && item.hotel.toLowerCase().includes(s) || item.currency && item.currency.toLowerCase().includes(s) || item.date && item.date.includes(s);
      });
    }
    if (sortConfigActual !== null) {
      result.sort((a, b) => {
        let aVal = a[sortConfigActual.key];
        let bVal = b[sortConfigActual.key];
        if (sortConfigActual.key === 'totalTRY') {
          aVal = a.totalTRY || a.amount;
          bVal = b.totalTRY || b.amount;
        }
        if (aVal < bVal) return sortConfigActual.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfigActual.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [payments, searchTags, searchInput, sortConfigActual]);
  
  useEffect(() => {
    const handleAddPlan = () => {
      const item = {
        date: "",
        paymentType: "",
        description: "",
        amount: 0,
        currency: "TRY",
        exchangeRate: 1,
        totalTRY: 0
      };
      setTempPaymentPlanItem(item);
      setEditingPaymentPlanIndex(paymentPlans.length);
      setPaymentPlanAmountInput("");
      setPaymentPlanTotalTRYInput("");
    };

    const handleAddOdeme = () => {
      const item = {
        date: "",
        paymentType: "",
        description: "",
        amount: 0,
        currency: "TRY",
        exchangeRate: 1,
        totalTRY: 0
      };
      setTempPaymentItem(item);
      setEditingPaymentIndex(payments.length);
      setPaymentAmountInput("");
      setPaymentTotalTRYInput("");
    };

    window.addEventListener('action-add-plan-odeme', handleAddPlan);
    window.addEventListener('action-add-odeme', handleAddOdeme);
    window.addEventListener('action-export-odeme', exportToExcel);

    return () => {
      window.removeEventListener('action-add-plan-odeme', handleAddPlan);
      window.removeEventListener('action-add-odeme', handleAddOdeme);
      window.removeEventListener('action-export-odeme', exportToExcel);
    };
  }, [projectId, paymentPlans.length, payments.length]);
const exportToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const createSheet = (name, data) => {
        const sheet = workbook.addWorksheet(name);
        sheet.columns = [{
          header: 'Tarih',
          key: 'date',
          width: 15
        }, {
          header: 'Otel/Tedarikçi',
          key: 'hotel',
          width: 30
        }, {
          header: 'Tip',
          key: 'paymentType',
          width: 20
        }, {
          header: 'Açıklama',
          key: 'description',
          width: 30
        }, {
          header: 'Tutar',
          key: 'amount',
          width: 15
        }, {
          header: 'Döviz',
          key: 'currency',
          width: 10
        }, {
          header: 'Kur',
          key: 'exchangeRate',
          width: 15
        }, {
          header: 'Toplam TL',
          key: 'totalTRY',
          width: 20
        }];
        sheet.getRow(1).font = {
          bold: true,
          color: {
            argb: 'FFFFFFFF'
          }
        };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'FFE11D48'
          }
        };
        data.forEach(item => {
          sheet.addRow({
            date: item.date,
            hotel: item.hotel,
            paymentType: item.paymentType,
            description: item.description,
            amount: Number(item.amount || 0),
            currency: item.currency,
            exchangeRate: Number(item.exchangeRate || 1),
            totalTRY: Number(item.totalTRY || item.amount || 0)
          });
        });
      };
      createSheet('Ödeme Planı', getFilteredAndSortedPlans());
      createSheet('Gerçekleşen Ödemeler', getFilteredAndSortedActuals());
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Odeme_${projectId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Excel export error:", e);
      alert(t('projects.excelExportError') || "Excel çıktısı alınırken bir hata oluştu.");
    }
  };
  const SortIcon = ({
    sortConfig,
    columnKey
  }: {
    sortConfig: any;
    columnKey: string;
  }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-blue-500">↑</span> : <span className="ml-1 text-blue-500">↓</span>;
  };
  const resetPaymentPlanState = useCallback(() => {
    setEditingPaymentPlanIndex(null);
    setTempPaymentPlanItem(null);
    setPaymentPlanAmountInput("");
    setPaymentPlanTotalTRYInput("");
  }, [setEditingPaymentPlanIndex, setTempPaymentPlanItem, setPaymentPlanAmountInput, setPaymentPlanTotalTRYInput]);
  const resetPaymentState = useCallback(() => {
    setEditingPaymentIndex(null);
    setTempPaymentItem(null);
    setPaymentAmountInput("");
    setPaymentTotalTRYInput("");
  }, [setEditingPaymentIndex, setTempPaymentItem, setPaymentAmountInput, setPaymentTotalTRYInput]);
  const saveNewPaymentPlan = useCallback(async () => {
    if (!tempPaymentPlanItem) return;
    try {
      const saved = await handlePaymentPlanSave({
        ...tempPaymentPlanItem,
        project_id: projectId
      });
      setPaymentPlans(prev => [...prev, saved]);
      resetPaymentPlanState();
    } catch (error: any) {
      console.error("Ödeme planı kaydedilirken hata:", error);
      alert("Ödeme planı kaydedilirken hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    }
  }, [handlePaymentPlanSave, projectId, resetPaymentPlanState, setPaymentPlans, tempPaymentPlanItem]);
  const saveExistingPaymentPlan = useCallback(async (index: number, base: any) => {
    const payload = {
      ...base,
      ...(tempPaymentPlanItem || {})
    };
    try {
      const saved = await handlePaymentPlanSave({
        ...payload,
        project_id: projectId
      });
      setPaymentPlans(prev => prev.map((p, i) => i === index ? saved : p));
      resetPaymentPlanState();
    } catch (error: any) {
      console.error("Ödeme planı güncellenirken hata:", error);
      alert("Ödeme planı güncellenirken hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    }
  }, [handlePaymentPlanSave, projectId, resetPaymentPlanState, setPaymentPlans, tempPaymentPlanItem]);
  const deletePaymentPlan = useCallback(async (index: number, plan: any) => {
    try {
      if (plan?.id) {
        await handlePaymentPlanDelete(plan);
      }
      setPaymentPlans(prev => prev.filter((_, i) => i !== index));
      if (editingPaymentPlanIndex === index) {
        resetPaymentPlanState();
      }
    } catch (error: any) {
      console.error("Ödeme planı silinirken hata:", error);
      alert("Ödeme planı silinirken hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    }
  }, [editingPaymentPlanIndex, handlePaymentPlanDelete, resetPaymentPlanState, setPaymentPlans]);
  const saveNewPayment = useCallback(async () => {
    if (!tempPaymentItem) return;
    try {
      const saved = await handlePaymentSave({
        ...tempPaymentItem,
        project_id: projectId
      });
      setPayments(prev => [...prev, saved]);
      resetPaymentState();
    } catch (error: any) {
      console.error("Ödeme kaydedilirken hata:", error);
      alert("Ödeme kaydedilirken hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    }
  }, [handlePaymentSave, projectId, resetPaymentState, setPayments, tempPaymentItem]);
  const saveExistingPayment = useCallback(async (index: number, base: any) => {
    const payload = {
      ...base,
      ...(tempPaymentItem || {})
    };
    try {
      const saved = await handlePaymentSave({
        ...payload,
        project_id: projectId
      });
      setPayments(prev => prev.map((p, i) => i === index ? saved : p));
      resetPaymentState();
    } catch (error: any) {
      console.error("Ödeme güncellenirken hata:", error);
      alert("Ödeme güncellenirken hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    }
  }, [handlePaymentSave, projectId, resetPaymentState, setPayments, tempPaymentItem]);
  const deletePayment = useCallback(async (index: number, payment: any) => {
    try {
      if (payment?.id) {
        await handlePaymentDelete(payment);
      }
      setPayments(prev => prev.filter((_, i) => i !== index));
      if (editingPaymentIndex === index) {
        resetPaymentState();
      }
    } catch (error: any) {
      console.error("Ödeme silinirken hata:", error);
      alert("Ödeme silinirken hata oluştu: " + (error?.message || "Bilinmeyen hata"));
    }
  }, [editingPaymentIndex, handlePaymentDelete, resetPaymentState, setPayments]);
  return <div className="space-y-4">

      {/* Alış Genel Toplamları */}
      <div className="bg-red-600 dark:bg-red-700 rounded-md p-3">
        <div className="grid grid-cols-12 gap-2 text-white text-sm responsive-filter-grid">
          <div className="col-span-3 font-bold">{t('projects.purchaseGrandTotals') || "Alış Genel Toplamları"}</div>
          <div className="col-span-6 text-right font-bold">
            {Object.entries(purchaseTotals.totalByCurrency).map(([cur, val]: any) => `${formatNumber(Number(val || 0))} ${cur}`).join(" + ")}
          </div>
          <div className="col-span-2 text-right font-bold">
            {formatNumber(purchaseTotals.totalTRY)} TL
          </div>
          <div className="col-span-1"></div>
        </div>
      </div>

      
      

      
      {/* Ödeme Planı (Alış) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('projects.paymentPlanTitle') || "Ödeme Planı"}
          </h3>
          
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col className="w-32" />
              <col className="w-40" />
              <col className="w-36" />
              <col />
              <col className="w-32" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-20" />
            </colgroup>
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th onClick={() => handleSortPlan("date")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('common.dateUpper') || "TARİH"} <SortIcon sortConfig={sortConfigPlan} columnKey="date" /></th>
                <th onClick={() => handleSortPlan("hotel")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.hotelSupplierUpper') || "OTEL/TEDARİKÇİ"} <SortIcon sortConfig={sortConfigPlan} columnKey="hotel" /></th>
                <th onClick={() => handleSortPlan("paymentType")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.paymentTypeUpper') || "ÖDEME TİPİ"} <SortIcon sortConfig={sortConfigPlan} columnKey="paymentType" /></th>
                <th onClick={() => handleSortPlan("description")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('common.descriptionUpper') || "AÇIKLAMA"} <SortIcon sortConfig={sortConfigPlan} columnKey="description" /></th>
                <th onClick={() => handleSortPlan("amount")} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.amountUpper') || "TUTAR"} <SortIcon sortConfig={sortConfigPlan} columnKey="amount" /></th>
                <th onClick={() => handleSortPlan("currency")} className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.currencyUpper') || "DÖVİZ"} <SortIcon sortConfig={sortConfigPlan} columnKey="currency" /></th>
                <th onClick={() => handleSortPlan("exchangeRate")} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.exchangeRateUpper') || "KUR"} <SortIcon sortConfig={sortConfigPlan} columnKey="exchangeRate" /></th>
                <th onClick={() => handleSortPlan("totalTRY")} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.totalTRYUpper') || "TOPLAM TL"} <SortIcon sortConfig={sortConfigPlan} columnKey="totalTRY" /></th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">
                  {t('common.actionsUpper') || "İŞLEMLER"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {editingPaymentPlanIndex !== null && editingPaymentPlanIndex === paymentPlans.length && <tr>
                    <td className="px-2 py-2">
                      <input type="date" value={tempPaymentPlanItem?.date || ""} onChange={e => setTempPaymentPlanItem((p: any) => ({
                  ...p,
                  date: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" ref={setPaymentPlanSupplierInputRef} value={paymentPlanHotelSupplierSearch} onChange={e => {
                  const value = e.target.value;
                  setPaymentPlanHotelSupplierSearch(value);
                  setTempPaymentPlanItem((p: any) => ({
                    ...p,
                    hotel: value
                  }));
                  setShowPaymentPlanHotelSupplierDropdown(true);
                  updateDropdownPosition();
                }} onClick={() => {
                  setShowPaymentPlanHotelSupplierDropdown(true);
                  updateDropdownPosition();
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showPaymentPlanHotelSupplierDropdown && selectedPaymentPlanSupplierIndex >= 0 && selectedPaymentPlanSupplierIndex < filteredPaymentPlanSuppliers.length) {
                      const supplier = filteredPaymentPlanSuppliers[selectedPaymentPlanSupplierIndex];
                      handlePaymentPlanSupplierSelect(supplier);
                    } else {
                      saveNewPaymentPlan();
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  } else {
                    handlePaymentPlanKeyDownLocal(e);
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('projects.searchHotelSupplier') || "Otel/Tedarikçi ara..."} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempPaymentPlanItem?.paymentType || ""} onChange={e => setTempPaymentPlanItem((p: any) => ({
                  ...p,
                  paymentType: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="">{t('common.select') || "Seçin"}</option>
                        <option value="banka">{t('projects.bankTransfer') || "Banka Havalesi"}</option>
                        <option value="pos">{t('projects.creditCard') || "Kredi Kartı / Pos"}</option>
                        <option value="cek">{t('projects.checkPromissoryNote') || "Çek / Senet"}</option>
                        <option value="nakit">{t('projects.cash') || "Nakit"}</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempPaymentPlanItem?.description || ""} onChange={e => setTempPaymentPlanItem((p: any) => ({
                  ...p,
                  description: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('common.description') || "Açıklama"} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentPlanAmountInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentPlanAmountInput(raw);
                  const amount = cleanInputValue(raw) || 0;
                  const rate = tempPaymentPlanItem?.exchangeRate || 1;
                  const cur = tempPaymentPlanItem?.currency || "TRY";
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentPlanItem((p: any) => ({
                    ...p,
                    amount,
                    totalTRY: tl
                  }));
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onBlur={e => {
                  const amount = cleanInputValue(e.target.value) || 0;
                  setPaymentPlanAmountInput(formatNumberForDisplay(amount));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempPaymentPlanItem?.currency || "TRY"} onChange={e => {
                  const cur = e.target.value;
                  const amount = tempPaymentPlanItem?.amount || 0;
                  const rate = tempPaymentPlanItem?.exchangeRate || 1;
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentPlanItem((p: any) => ({
                    ...p,
                    currency: cur,
                    totalTRY: tl
                  }));
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="EUR">EUR</option>
<option value="TRY">TRY</option>
<option value="USD">USD</option>
<option value="GBP">GBP</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.0001" value={tempPaymentPlanItem?.exchangeRate || ""} onChange={e => {
                  const r = parseFloat(e.target.value) || 0;
                  const amount = tempPaymentPlanItem?.amount || 0;
                  const cur = tempPaymentPlanItem?.currency || "TRY";
                  const tl = cur === "TRY" ? amount : amount * r;
                  setTempPaymentPlanItem((p: any) => ({
                    ...p,
                    exchangeRate: r,
                    totalTRY: tl
                  }));
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentPlanTotalTRYInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentPlanTotalTRYInput(raw);
                  const tl = cleanInputValue(raw) || 0;
                  const rate = tempPaymentPlanItem?.exchangeRate || 1;
                  const newAmount = rate > 0 ? tl / rate : 0;
                  setTempPaymentPlanItem((p: any) => ({
                    ...p,
                    totalTRY: tl,
                    amount: newAmount
                  }));
                  setPaymentPlanAmountInput(formatNumberForDisplay(newAmount));
                }} onBlur={e => {
                  const tl = cleanInputValue(e.target.value) || 0;
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPaymentPlan();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={saveNewPaymentPlan} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title={t('common.save') || "Kaydet"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button onClick={resetPaymentPlanState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title={t('common.cancel') || "İptal"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>}
              {getFilteredAndSortedPlans().map((p, idx) => editingPaymentPlanIndex === idx ? <tr key={p.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0" onDoubleClick={() => {
              setEditingPaymentPlanIndex(idx);
              setTempPaymentPlanItem({
                ...p
              });
              setPaymentPlanAmountInput(formatNumberForDisplay(p.amount || 0));
              setPaymentPlanTotalTRYInput(formatNumberForDisplay(p.totalTRY || 0));
            }}>
                    <td className="px-2 py-2">
                      <input type="date" value={tempPaymentPlanItem?.date ?? p.date} onChange={e => setTempPaymentPlanItem((pp: any) => ({
                  ...pp,
                  date: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" ref={editingPaymentPlanIndex === idx ? setPaymentPlanSupplierInputRef : undefined} value={editingPaymentPlanIndex === idx ? paymentPlanHotelSupplierSearch : p.hotel || ""} onChange={e => {
                  const value = e.target.value;
                  setPaymentPlanHotelSupplierSearch(value);
                  setTempPaymentPlanItem((pp: any) => ({
                    ...pp,
                    hotel: value
                  }));
                  setShowPaymentPlanHotelSupplierDropdown(true);
                  updateDropdownPosition();
                }} onClick={() => {
                  if (editingPaymentPlanIndex === idx) {
                    setPaymentPlanHotelSupplierSearch(p.hotel || "");
                    setShowPaymentPlanHotelSupplierDropdown(true);
                    updateDropdownPosition();
                  }
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showPaymentPlanHotelSupplierDropdown && selectedPaymentPlanSupplierIndex >= 0 && selectedPaymentPlanSupplierIndex < filteredPaymentPlanSuppliers.length) {
                      const supplier = filteredPaymentPlanSuppliers[selectedPaymentPlanSupplierIndex];
                      handlePaymentPlanSupplierSelect(supplier);
                    } else {
                      saveExistingPaymentPlan(idx, p);
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  } else {
                    handlePaymentPlanKeyDown(e);
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('projects.searchHotelSupplier') || "Otel/Tedarikçi ara..."} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={(tempPaymentPlanItem?.paymentType ?? p.paymentType) || ""} onChange={e => setTempPaymentPlanItem((pp: any) => ({
                  ...pp,
                  paymentType: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="">{t('common.select') || "Seçin"}</option>
                        <option value="banka">{t('projects.bankTransfer') || "Banka Havalesi"}</option>
                        <option value="pos">{t('projects.creditCard') || "Kredi Kartı / Pos"}</option>
                        <option value="cek">{t('projects.checkPromissoryNote') || "Çek / Senet"}</option>
                        <option value="nakit">{t('projects.cash') || "Nakit"}</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempPaymentPlanItem?.description ?? p.description} onChange={e => setTempPaymentPlanItem((pp: any) => ({
                  ...pp,
                  description: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('common.description') || "Açıklama"} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentPlanAmountInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentPlanAmountInput(raw);
                  const amount = cleanInputValue(raw) || 0;
                  const rate = (tempPaymentPlanItem?.exchangeRate ?? p.exchangeRate) || 1;
                  const cur = (tempPaymentPlanItem?.currency ?? p.currency) || "TRY";
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentPlanItem((pp: any) => ({
                    ...pp,
                    amount,
                    totalTRY: tl
                  }));
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onBlur={e => {
                  const amount = cleanInputValue(e.target.value) || 0;
                  setPaymentPlanAmountInput(formatNumberForDisplay(amount));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempPaymentPlanItem?.currency ?? p.currency} onChange={e => {
                  const cur = e.target.value;
                  const amount = (tempPaymentPlanItem?.amount ?? p.amount) || 0;
                  const rate = (tempPaymentPlanItem?.exchangeRate ?? p.exchangeRate) || 1;
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentPlanItem((pp: any) => ({
                    ...pp,
                    currency: cur,
                    totalTRY: tl
                  }));
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="EUR">EUR</option>
<option value="TRY">TRY</option>
<option value="USD">USD</option>
<option value="GBP">GBP</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.0001" value={tempPaymentPlanItem?.exchangeRate ?? p.exchangeRate} onChange={e => {
                  const r = parseFloat(e.target.value) || 0;
                  const amount = (tempPaymentPlanItem?.amount ?? p.amount) || 0;
                  const cur = (tempPaymentPlanItem?.currency ?? p.currency) || "TRY";
                  const tl = cur === "TRY" ? amount : amount * r;
                  setTempPaymentPlanItem((pp: any) => ({
                    ...pp,
                    exchangeRate: r,
                    totalTRY: tl
                  }));
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentPlanTotalTRYInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentPlanTotalTRYInput(raw);
                  const tl = cleanInputValue(raw) || 0;
                  const rate = (tempPaymentPlanItem?.exchangeRate ?? p.exchangeRate) || 1;
                  const newAmount = rate > 0 ? tl / rate : 0;
                  setTempPaymentPlanItem((pp: any) => ({
                    ...pp,
                    totalTRY: tl,
                    amount: newAmount
                  }));
                  setPaymentPlanAmountInput(formatNumberForDisplay(newAmount));
                }} onBlur={e => {
                  const tl = cleanInputValue(e.target.value) || 0;
                  setPaymentPlanTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPaymentPlan(idx, p);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentPlanState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => saveExistingPaymentPlan(idx, p)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title={t('common.save') || "Kaydet"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button onClick={resetPaymentPlanState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title={t('common.cancel') || "İptal"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr> : <tr key={p.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0" onDoubleClick={() => {
              setEditingPaymentPlanIndex(idx);
              setTempPaymentPlanItem({
                ...p
              });
              setPaymentPlanAmountInput(formatNumberForDisplay(p.amount || 0));
              setPaymentPlanTotalTRYInput(formatNumberForDisplay(p.totalTRY || 0));
            }}>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {formatDateForDisplay(p.date)}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {p.hotel || "-"}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {p.paymentType === "banka" ? (t('projects.bankTransfer') || "Banka Havalesi") : p.paymentType === "pos" ? (t('projects.creditCard') || "Kredi Kartı / Pos") : p.paymentType === "cek" ? (t('projects.checkPromissoryNote') || "Çek / Senet") : p.paymentType === "nakit" ? (t('projects.cash') || "Nakit") : "-"}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white max-w-xs truncate" title={p.description}>
                      {p.description}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                      {formatNumberForDisplay(p.amount)}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-center">
                      {p.currency}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                      {formatTRY(p.exchangeRate || 1)}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                      {formatTRY(p.totalTRY || p.amount)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => {
                    setEditingPaymentPlanIndex(idx);
                    setTempPaymentPlanItem({
                      ...p
                    });
                    setPaymentPlanAmountInput(formatNumberForDisplay(p.amount || 0));
                    setPaymentPlanTotalTRYInput(formatNumberForDisplay(p.totalTRY || 0));
                    setPaymentPlanHotelSupplierSearch(p.hotel || "");
                  }} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30" title={t('common.edit') || "Düzenle"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deletePaymentPlan(idx, p)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title={t('common.delete') || "Sil"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ödemeler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('projects.paymentsTitle') || "Ödemeler"}
          </h3>
          
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col className="w-32" />
              <col className="w-40" />
              <col className="w-36" />
              <col />
              <col className="w-32" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-20" />
            </colgroup>
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th onClick={() => handleSortActual("date")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('common.dateUpper') || "TARİH"} <SortIcon sortConfig={sortConfigActual} columnKey="date" /></th>
                <th onClick={() => handleSortActual("hotel")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.hotelSupplierUpper') || "OTEL/TEDARİKÇİ"} <SortIcon sortConfig={sortConfigActual} columnKey="hotel" /></th>
                <th onClick={() => handleSortActual("paymentType")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.paymentTypeUpper') || "ÖDEME TİPİ"} <SortIcon sortConfig={sortConfigActual} columnKey="paymentType" /></th>
                <th onClick={() => handleSortActual("description")} className="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('common.descriptionUpper') || "AÇIKLAMA"} <SortIcon sortConfig={sortConfigActual} columnKey="description" /></th>
                <th onClick={() => handleSortActual("amount")} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.amountUpper') || "TUTAR"} <SortIcon sortConfig={sortConfigActual} columnKey="amount" /></th>
                <th onClick={() => handleSortActual("currency")} className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.currencyUpper') || "DÖVİZ"} <SortIcon sortConfig={sortConfigActual} columnKey="currency" /></th>
                <th onClick={() => handleSortActual("exchangeRate")} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.exchangeRateUpper') || "KUR"} <SortIcon sortConfig={sortConfigActual} columnKey="exchangeRate" /></th>
                <th onClick={() => handleSortActual("totalTRY")} className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('projects.totalTRYUpper') || "TOPLAM TL"} <SortIcon sortConfig={sortConfigActual} columnKey="totalTRY" /></th>
                <th className="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">
                  {t('common.actionsUpper') || "İŞLEMLER"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {editingPaymentIndex !== null && editingPaymentIndex === payments.length && <tr>
                    <td className="px-2 py-2">
                      <input type="date" value={tempPaymentItem?.date || ""} onChange={e => setTempPaymentItem((p: any) => ({
                  ...p,
                  date: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" ref={setPaymentSupplierInputRef} value={paymentHotelSupplierSearch} onChange={e => {
                  const value = e.target.value;
                  setPaymentHotelSupplierSearch(value);
                  setTempPaymentItem((p: any) => ({
                    ...p,
                    hotel: value
                  }));
                  setShowPaymentHotelSupplierDropdown(true);
                  updateDropdownPosition();
                }} onClick={() => {
                  setShowPaymentHotelSupplierDropdown(true);
                  updateDropdownPosition();
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showPaymentHotelSupplierDropdown && selectedPaymentSupplierIndex >= 0 && selectedPaymentSupplierIndex < filteredPaymentSuppliers.length) {
                      const supplier = filteredPaymentSuppliers[selectedPaymentSupplierIndex];
                      handlePaymentSupplierSelect(supplier);
                    } else {
                      saveNewPayment();
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  } else {
                    handlePaymentKeyDownLocal(e);
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('projects.searchHotelSupplier') || "Otel/Tedarikçi ara..."} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempPaymentItem?.paymentType || ""} onChange={e => setTempPaymentItem((p: any) => ({
                  ...p,
                  paymentType: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="">{t('common.select') || "Seçin"}</option>
                        <option value="banka">{t('projects.bankTransfer') || "Banka Havalesi"}</option>
                        <option value="pos">{t('projects.creditCard') || "Kredi Kartı / Pos"}</option>
                        <option value="cek">{t('projects.checkPromissoryNote') || "Çek / Senet"}</option>
                        <option value="nakit">{t('projects.cash') || "Nakit"}</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempPaymentItem?.description || ""} onChange={e => setTempPaymentItem((p: any) => ({
                  ...p,
                  description: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('common.description') || "Açıklama"} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentAmountInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentAmountInput(raw);
                  const amount = cleanInputValue(raw) || 0;
                  const rate = tempPaymentItem?.exchangeRate || 1;
                  const cur = tempPaymentItem?.currency || "TRY";
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentItem((p: any) => ({
                    ...p,
                    amount,
                    totalTRY: tl
                  }));
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onBlur={e => {
                  const amount = cleanInputValue(e.target.value) || 0;
                  setPaymentAmountInput(formatNumberForDisplay(amount));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempPaymentItem?.currency || "TRY"} onChange={e => {
                  const cur = e.target.value;
                  const amount = tempPaymentItem?.amount || 0;
                  const rate = tempPaymentItem?.exchangeRate || 1;
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentItem((p: any) => ({
                    ...p,
                    currency: cur,
                    totalTRY: tl
                  }));
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="EUR">EUR</option>
<option value="TRY">TRY</option>
<option value="USD">USD</option>
<option value="GBP">GBP</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.0001" value={tempPaymentItem?.exchangeRate || ""} onChange={e => {
                  const r = parseFloat(e.target.value) || 0;
                  const amount = tempPaymentItem?.amount || 0;
                  const cur = tempPaymentItem?.currency || "TRY";
                  const tl = cur === "TRY" ? amount : amount * r;
                  setTempPaymentItem((p: any) => ({
                    ...p,
                    exchangeRate: r,
                    totalTRY: tl
                  }));
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentTotalTRYInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentTotalTRYInput(raw);
                  const tl = cleanInputValue(raw) || 0;
                  const rate = tempPaymentItem?.exchangeRate || 1;
                  const newAmount = rate > 0 ? tl / rate : 0;
                  setTempPaymentItem((p: any) => ({
                    ...p,
                    totalTRY: tl,
                    amount: newAmount
                  }));
                  setPaymentAmountInput(formatNumberForDisplay(newAmount));
                }} onBlur={e => {
                  const tl = cleanInputValue(e.target.value) || 0;
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNewPayment();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={saveNewPayment} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title={t('common.save') || "Kaydet"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button onClick={resetPaymentState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title={t('common.cancel') || "İptal"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>}
              {getFilteredAndSortedActuals().map((pay, idx) => editingPaymentIndex === idx ? <tr key={pay.id}>
                    <td className="px-2 py-2">
                      <input type="date" value={tempPaymentItem?.date ?? pay.date} onChange={e => setTempPaymentItem((pp: any) => ({
                  ...pp,
                  date: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" ref={editingPaymentIndex === idx ? setPaymentSupplierInputRef : undefined} value={editingPaymentIndex === idx ? paymentHotelSupplierSearch : pay.hotel || ""} onChange={e => {
                  const value = e.target.value;
                  setPaymentHotelSupplierSearch(value);
                  setTempPaymentItem((pp: any) => ({
                    ...pp,
                    hotel: value
                  }));
                  setShowPaymentHotelSupplierDropdown(true);
                  updateDropdownPosition();
                }} onClick={() => {
                  if (editingPaymentIndex === idx) {
                    setPaymentHotelSupplierSearch(pay.hotel || "");
                    setShowPaymentHotelSupplierDropdown(true);
                    updateDropdownPosition();
                  }
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showPaymentHotelSupplierDropdown && selectedPaymentSupplierIndex >= 0 && selectedPaymentSupplierIndex < filteredPaymentSuppliers.length) {
                      const supplier = filteredPaymentSuppliers[selectedPaymentSupplierIndex];
                      handlePaymentSupplierSelect(supplier);
                    } else {
                      saveExistingPayment(idx, pay);
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  } else {
                    handlePaymentKeyDown(e);
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder={t('projects.searchHotelSupplier') || "Otel/Tedarikçi ara..."} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={(tempPaymentItem?.paymentType ?? pay.paymentType) || ""} onChange={e => setTempPaymentItem((pp: any) => ({
                  ...pp,
                  paymentType: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="">{t('common.select') || "Seçin"}</option>
                        <option value="banka">{t('projects.bankTransfer') || "Banka Havalesi"}</option>
                        <option value="pos">{t('projects.creditCard') || "Kredi Kartı / Pos"}</option>
                        <option value="cek">{t('projects.checkPromissoryNote') || "Çek / Senet"}</option>
                        <option value="nakit">{t('projects.cash') || "Nakit"}</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={tempPaymentItem?.description ?? pay.description} onChange={e => setTempPaymentItem((pp: any) => ({
                  ...pp,
                  description: e.target.value
                }))} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:text-white" placeholder="Açıklama" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentAmountInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentAmountInput(raw);
                  const amount = cleanInputValue(raw) || 0;
                  const rate = (tempPaymentItem?.exchangeRate ?? pay.exchangeRate) || 1;
                  const cur = (tempPaymentItem?.currency ?? pay.currency) || "TRY";
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentItem((pp: any) => ({
                    ...pp,
                    amount,
                    totalTRY: tl
                  }));
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onBlur={e => {
                  const amount = cleanInputValue(e.target.value) || 0;
                  setPaymentAmountInput(formatNumberForDisplay(amount));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <select value={tempPaymentItem?.currency ?? pay.currency} onChange={e => {
                  const cur = e.target.value;
                  const amount = (tempPaymentItem?.amount ?? pay.amount) || 0;
                  const rate = (tempPaymentItem?.exchangeRate ?? pay.exchangeRate) || 1;
                  const tl = cur === "TRY" ? amount : amount * rate;
                  setTempPaymentItem((pp: any) => ({
                    ...pp,
                    currency: cur,
                    totalTRY: tl
                  }));
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-center dark:bg-gray-700 dark:text-white" disabled={!permEdit || compIsLocked && !isSuperAdmin}>
                        <option value="EUR">EUR</option>
<option value="TRY">TRY</option>
<option value="USD">USD</option>
<option value="GBP">GBP</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" step="0.0001" value={tempPaymentItem?.exchangeRate ?? pay.exchangeRate} onChange={e => {
                  const r = parseFloat(e.target.value) || 0;
                  const amount = (tempPaymentItem?.amount ?? pay.amount) || 0;
                  const cur = (tempPaymentItem?.currency ?? pay.currency) || "TRY";
                  const tl = cur === "TRY" ? amount : amount * r;
                  setTempPaymentItem((pp: any) => ({
                    ...pp,
                    exchangeRate: r,
                    totalTRY: tl
                  }));
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="1.00" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={paymentTotalTRYInput} onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(/\./g, ",");
                  setPaymentTotalTRYInput(raw);
                  const tl = cleanInputValue(raw) || 0;
                  const rate = (tempPaymentItem?.exchangeRate ?? pay.exchangeRate) || 1;
                  const newAmount = rate > 0 ? tl / rate : 0;
                  setTempPaymentItem((pp: any) => ({
                    ...pp,
                    totalTRY: tl,
                    amount: newAmount
                  }));
                  setPaymentAmountInput(formatNumberForDisplay(newAmount));
                }} onBlur={e => {
                  const tl = cleanInputValue(e.target.value) || 0;
                  setPaymentTotalTRYInput(formatNumberForDisplay(tl));
                }} onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveExistingPayment(idx, pay);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }} className="w-full px-1 py-0.5 border rounded text-xs text-right dark:bg-gray-700 dark:text-white" placeholder="0,00" inputMode="decimal" disabled={!permEdit || compIsLocked && !isSuperAdmin} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => saveExistingPayment(idx, pay)} className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" title={t('common.save') || "Kaydet"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button onClick={resetPaymentState} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30" title={t('common.cancel') || "İptal"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr> : <tr key={pay.id}>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {formatDateForDisplay(pay.date)}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {pay.hotel || "-"}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {pay.paymentType === "banka" ? (t('projects.bankTransfer') || "Banka Havalesi") : pay.paymentType === "pos" ? (t('projects.creditCard') || "Kredi Kartı / Pos") : pay.paymentType === "cek" ? (t('projects.checkPromissoryNote') || "Çek / Senet") : pay.paymentType === "nakit" ? (t('projects.cash') || "Nakit") : "-"}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white">
                      {pay.description}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                      {formatNumberForDisplay(pay.amount)}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-center">
                      {pay.currency}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                      {formatTRY(pay.exchangeRate || 1)}
                    </td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-right">
                      {formatTRY(pay.totalTRY || pay.amount)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => {
                    setEditingPaymentIndex(idx);
                    setTempPaymentItem({
                      ...pay
                    });
                    setPaymentAmountInput(formatNumberForDisplay(pay.amount || 0));
                    setPaymentTotalTRYInput(formatNumberForDisplay(pay.totalTRY || 0));
                    setPaymentHotelSupplierSearch(pay.hotel || "");
                  }} className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-900/30" title={t('common.edit') || "Düzenle"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deletePayment(idx, pay)} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title={t('common.delete') || "Sil"}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bakiye Özeti (Döviz Bazında) */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mt-6 border border-red-100 dark:border-red-800/50">
        <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
          {t('projects.balanceSummary') || "Bakiye Özeti (Döviz Bazında)"}
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-red-800/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-red-50/50 dark:bg-red-900/40 border-b border-red-100 dark:border-red-800/50">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-red-900 dark:text-red-100">
                    {t('projects.currencyUpper') || "DÖVİZ"}
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-red-900 dark:text-red-100">
                    {t('projects.plannedUpper') || "PLANLANAN"}
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-red-900 dark:text-red-100">
                    {t('projects.paidUpper') || "ÖDENEN"}
                  </th>
                  <th className="px-3 py-2 text-right font-bold text-red-900 dark:text-red-100">
                    {t('projects.balanceUpper') || "BAKİYE"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 dark:divide-red-800/30">
                {Object.keys({
                ...paymentPlanByCurrency,
                ...paidByCurrency
              }).map(cur => {
                const plan = paymentPlanByCurrency[cur] || 0;
                const paid = paidByCurrency[cur] || 0;
                const balance = plan - paid;
                return <tr key={cur} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white uppercase">
                        {cur}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                        {formatNumberForDisplay(plan)}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600 dark:text-red-400 font-medium">
                        {formatNumberForDisplay(paid)}
                      </td>
                      <td className={`px-3 py-2 text-right font-bold ${balance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                        {formatNumberForDisplay(balance)}
                      </td>
                    </tr>;
              })}
              </tbody>
              <tfoot className="bg-red-50/30 dark:bg-red-900/30 border-t-2 border-red-100 dark:border-red-800/50">
                <tr className="font-bold">
                  <td className="px-3 py-2 text-left text-red-900 dark:text-red-100">
                    {t('projects.totalTRYUpper') || "TOPLAM (TRY)"}
                  </td>
                  <td className="px-3 py-2 text-right text-red-900 dark:text-red-100">
                    {formatTRY(paymentSummary.planTRY)}
                  </td>
                  <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                    {formatTRY(paymentSummary.paidTRY)}
                  </td>
                  <td className={`px-3 py-2 text-right ${paymentSummary.balanceTRY > 0 ? "text-red-600 dark:text-red-400" : "text-red-900 dark:text-red-100"}`}>
                    {formatTRY(paymentSummary.balanceTRY)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

            {/* Portal ile render edilen dropdown - Ödeme Planı */}
      {showPaymentPlanHotelSupplierDropdown && createPortal(<div className="hotel-supplier-dropdown payment-plan-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-60 overflow-y-auto" style={dropdownPosition ? {
      top: dropdownPosition.top,
      left: dropdownPosition.left,
      width: dropdownPosition.width
    } : {
      display: "none"
    }}>
            {allSuppliers.filter(s => (s.displayName || s.name || "").toLowerCase().includes(paymentPlanHotelSupplierSearch?.toLowerCase() || "")).map((supplier, index) => <div key={`payment-plan-supplier-${supplier.id}-${supplier.type}-${index}`} onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        handlePaymentPlanSupplierSelect(supplier);
      }} onMouseEnter={() => setSelectedPaymentPlanSupplierIndex(index)} className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 ${index === selectedPaymentPlanSupplierIndex ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  <div className="text-xs font-medium">
                    {supplier.displayName || supplier.name}
                  </div>
                  {supplier.title && <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {supplier.title}
                    </div>}
                </div>)}
          </div>, document.body)}

      {/* Portal ile render edilen dropdown - Ödeme */}
      {showPaymentHotelSupplierDropdown && createPortal(<div className="hotel-supplier-dropdown payment-supplier-dropdown fixed z-[9999] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-60 overflow-y-auto" style={dropdownPosition ? {
      top: dropdownPosition.top,
      left: dropdownPosition.left,
      width: dropdownPosition.width
    } : {
      display: "none"
    }}>
            {allSuppliers.filter(s => (s.displayName || s.name || "").toLowerCase().includes(paymentHotelSupplierSearch?.toLowerCase() || "")).map((supplier, index) => <div key={`payment-supplier-${supplier.id}-${supplier.type}-${index}`} onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        handlePaymentSupplierSelect(supplier);
      }} onMouseEnter={() => setSelectedPaymentSupplierIndex(index)} className={`px-3 py-2 text-xs cursor-pointer transition-colors duration-150 ${index === selectedPaymentSupplierIndex ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                  <div className="text-xs font-medium">
                    {supplier.displayName || supplier.name}
                  </div>
                  {supplier.title && <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {supplier.title}
                    </div>}
                </div>)}
          </div>, document.body)}
    </div>;
}