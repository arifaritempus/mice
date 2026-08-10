"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/lib/permissions";
import { FileText, Camera, CheckCircle2, Clock, Trash2, Edit2, Save, Search, Eye, X } from "lucide-react";
import InvoiceUploadModal from "@/components/ocr/InvoiceUploadModal";
import EditAIInvoiceModal from "@/components/ocr/EditAIInvoiceModal";
import { categoriesService } from "@/lib/supabaseService";
import { getDayNameShort, formatDate } from "@/utils/formatters";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import Modal from "@/components/Modal";
import { toast } from "react-hot-toast";

export default function AIInvoicesPage() {
  const { canView } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalInvoice, setEditModalInvoice] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [categorySelections, setCategorySelections] = useState<Record<string, string>>({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [entitiesMap, setEntitiesMap] = useState<Record<string, any>>({});
  
  // New UI states
  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  const [appliedGlobalTokens, setAppliedGlobalTokens] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    // Eskiden default olarak 'today' atandığı için eski faturalar görünmüyordu.
    setStartDate("");
    setAppliedStartDate("");
  }, []);

  useEffect(() => {
    setAppliedGlobalTokens(globalTokens);
  }, [globalTokens]);

  const handleApplyDates = (start?: string, end?: string) => {
    setAppliedStartDate(start !== undefined ? start : startDate);
    setAppliedEndDate(end !== undefined ? end : endDate);
  };

  const addToken = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    setGlobalTokens((prev) => {
      if (prev.some((item) => item.toLowerCase() === normalized.toLowerCase())) return prev;
      return [...prev, normalized];
    });
    setGlobalInput("");
  };

  const removeToken = (value: string) => {
    setGlobalTokens((prev) => prev.filter((item) => item !== value));
  };

  useEffect(() => {
    loadInvoices();
    loadCategories();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  const loadCategories = async () => {
    try {
      const allCategories = await categoriesService.getAll();
      const mainCategories = allCategories.filter((c: any) => !c.parent_id);
      mainCategories.sort((a: any, b: any) => {
        const aOrder = a.sort_order ?? 9999;
        const bOrder = b.sort_order ?? 9999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        const aKey = (a.code || a.name || "").toString().trim();
        const bKey = (b.code || b.name || "").toString().trim();
        return aKey.localeCompare(bKey, "tr", { numeric: true, sensitivity: "base" });
      });
      setCategories(mainCategories); // Sadece ana kategoriler
    } catch (err) {
      console.error("Kategoriler yüklenirken hata:", err);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const [invRes, projRes, sejRes] = await Promise.all([
        fetch('/api/invoices/list', { cache: 'no-store' }),
        supabase.from('projects').select('id, project_code, title, company_name, start_date, end_date'),
        supabase.from('sejours').select('id, voucher_number, customer_name, check_in_date, check_out_date')
      ]);
      const data = await invRes.json();
        
      if (!invRes.ok) throw new Error(data.error || "Failed to fetch invoices");
      
      const emap: Record<string, any> = {};
      projRes.data?.forEach((p: any) => emap[p.id] = { ...p, type: 'MICE' });
      sejRes.data?.forEach((s: any) => emap[s.id] = { ...s, type: 'SEJOUR' });
      setEntitiesMap(emap);

      const invs = data.invoices || [];
      setInvoices(invs);
      
      // Kategori seçimlerini init et
      const initialCats: Record<string, string> = {};
      invs.forEach((inv: any) => {
         initialCats[inv.id] = inv.extracted_data?.category || "";
      });
      setCategorySelections(initialCats);
    } catch (err) {
      console.error("Faturalar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (invoiceId: string, val: string) => {
    setCategorySelections(prev => ({ ...prev, [invoiceId]: val }));
  };

  const handleCategorySave = async (invoiceId: string) => {
    const newCategory = categorySelections[invoiceId];
    try {
      setUpdatingId(invoiceId);
      const res = await fetch("/api/invoices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, category: newCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, extracted_data: { ...inv.extracted_data, category: newCategory } } 
          : inv
      ));
      toast.success("Kategori başarıyla kaydedildi.");
    } catch (err) {
      console.error("Kategori güncellenirken hata:", err);
      toast.error("Kategori güncellenirken hata oluştu.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveClick = async (invoice: any) => {
    try {
      const ext = invoice.extracted_data;
      if (!ext || !ext.category || !ext.invoiceNo || !ext.date || !ext.supplier) {
        toast.error("Kategori, Fatura No, Tarih veya Tedarikçi alanları eksik! Lütfen düzenleyip tekrar deneyin.");
        return;
      }
      if (!ext.items || ext.items.length === 0) {
        toast.error("Faturada en az 1 kalem olmalıdır!");
        return;
      }
      for (const item of ext.items) {
         if (!item.description || item.subtotal === undefined || item.subtotal === null) {
           toast.error("Kalem açıklaması veya matrahı eksik!");
           return;
         }
      }

      const res = await fetch('/api/invoices/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      });
      if (!res.ok) throw new Error('Failed to approve');
      
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id 
          ? { ...inv, status: 'APPROVED' } 
          : inv
      ));
      toast.success('Fatura onaylandı.');
    } catch (err) {
      console.error("Fatura onaylanırken hata:", err);
      toast.error("Fatura onaylanırken hata oluştu.");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setUpdatingId(deleteConfirmId);
      const res = await fetch("/api/invoices/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: deleteConfirmId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInvoices(prev => prev.filter(inv => inv.id !== deleteConfirmId));
      toast.success("Fatura başarıyla silindi.");
    } catch (err) {
      console.error("Fatura silinirken hata:", err);
      toast.error("Fatura silinirken hata oluştu.");
    } finally {
      setUpdatingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteClick = (invoiceId: string) => {
    setDeleteConfirmId(invoiceId);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Onaylandı</span>;
      case 'PENDING':
      case 'PROCESSING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Bekliyor</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-md text-[10px] font-bold flex items-center gap-1"><X className="w-3 h-3" /> İptal</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-md text-[10px] font-bold">{status}</span>;
    }
  };

  const getEntityBadge = (type: string) => {
    switch (type) {
      case 'MICE':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-[10px] font-bold">MICE</span>;
      case 'SEJOUR':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md text-[10px] font-bold">SEJOUR</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-md text-[10px] font-bold">GENEL</span>;
    }
  };

  const globalSuggestions = useMemo(() => {
    const suppliers = invoices.map((inv) => (inv.extracted_data?.supplier || "").trim());
    const numbers = invoices.map((inv) => (inv.extracted_data?.invoiceNo || "").trim());
    const amounts = invoices.map((inv) => String(inv.extracted_data?.total || "").trim());
    return Array.from(new Set([...suppliers, ...numbers, ...amounts])).filter(Boolean);
  }, [invoices]);

  const filteredInvoices = invoices.filter(inv => {
    let match = true;

    // Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "BEKLİYOR" && inv.status?.toUpperCase() !== "PENDING" && inv.status?.toUpperCase() !== "PROCESSING") match = false;
      if (statusFilter === "ONAYLANDI" && inv.status?.toUpperCase() !== "APPROVED") match = false;
      if (statusFilter === "İPTAL" && inv.status?.toUpperCase() !== "CANCELLED") match = false;
    }
    
    // Global Tokens Filter
    const searchTerms = [...appliedGlobalTokens, globalInput.trim()].filter(Boolean);
    if (searchTerms.length > 0) {
      const termMatch = searchTerms.every(token => {
        const q = token.toLowerCase();
        const s1 = inv.extracted_data?.supplier?.toLowerCase() || "";
        const s2 = inv.extracted_data?.invoiceNo?.toLowerCase() || "";
        const s3 = categories.find((c: any) => c.id === (categorySelections[inv.id] ?? inv.extracted_data?.category))?.name?.toLowerCase() || "";
        const s4 = String(inv.extracted_data?.total || "").toLowerCase();
        
        let s5 = "";
        if (inv.entity_id && entitiesMap[inv.entity_id]) {
          const entity = entitiesMap[inv.entity_id];
          s5 = (entity.project_code || entity.title || entity.voucher_number || entity.company_name || entity.customer_name || "").toLowerCase();
        }
        
        return s1.includes(q) || s2.includes(q) || s3.includes(q) || s4.includes(q) || s5.includes(q);
      });
      if (!termMatch) match = false;
    }

    // Date Filter
    if (appliedStartDate) {
      const invDate = new Date(inv.created_at).getTime();
      const start = new Date(appliedStartDate).getTime();
      if (invDate < start) match = false;
    }
    if (appliedEndDate) {
      const invDate = new Date(inv.created_at).getTime();
      const end = new Date(appliedEndDate).getTime() + 86400000;
      if (invDate > end) match = false;
    }
    
    return match;
  });

  const pendingCount = invoices.filter((q) => q.status?.toUpperCase() === "PENDING" || q.status?.toUpperCase() === "PROCESSING").length;
  const approvedCount = invoices.filter((q) => q.status?.toUpperCase() === "APPROVED").length;
  const cancelledCount = invoices.filter((q) => q.status?.toUpperCase() === "CANCELLED").length;

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedGlobalTokens, statusFilter, appliedStartDate, appliedEndDate, pageSize]);

  return (
    <div className="flex-1 min-h-0 w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-600" />
              Yapay Zeka Faturaları
            </h1>
            <p className="text-xs text-v3-muted mt-1">Sisteme yüklenen ve yapay zeka tarafından işlenen tüm faturalar.</p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="Fatura Tarihi"
                startValue={startDate}
                endValue={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                onApply={handleApplyDates}
              />
            </div>
            
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Tedarikçi, Fatura No...)"
                tokens={globalTokens}
                inputValue={globalInput}
                suggestions={globalSuggestions}
                onInputChange={setGlobalInput}
                onAddToken={addToken}
                onRemoveToken={removeToken}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 border-l border-v3-border pl-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                Yapay Zeka ile Fatura Oku
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-2 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 border-r border-v3-border pr-3">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1">
              Durum:
            </span>

            <button
              onClick={() => setStatusFilter("all")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${statusFilter === "all" ? "bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">Tümü</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">{invoices.length}</span>
            </button>

            <button
              onClick={() => setStatusFilter("BEKLİYOR")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${statusFilter === "BEKLİYOR" ? "bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">Bekliyor</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">{pendingCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter("ONAYLANDI")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${statusFilter === "ONAYLANDI" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">Onaylandı</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">{approvedCount}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter("İPTAL")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${statusFilter === "İPTAL" ? "bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">İptal</span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">{cancelledCount}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 min-h-0 flex-1 flex flex-col relative overflow-hidden">
          <div className="w-full flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-surface sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-v3-border">
                <tr>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider w-24 border-b border-v3-border">Tarih</th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider w-[170px] min-w-[170px] max-w-[170px] border-b border-v3-border">Tedarikçi</th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider w-20 border-b border-v3-border">Fatura No</th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider w-40 border-b border-v3-border">Kategori</th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider w-36 border-b border-v3-border">Bağlı Kayıt</th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider w-20 border-b border-v3-border">Durum</th>
                  <th className="px-2.5 py-2.5 text-right text-[11px] font-semibold text-v3-text uppercase tracking-wider w-28 border-b border-v3-border">Toplam</th>
                  <th className="px-2.5 py-2.5 text-center text-[11px] font-semibold text-v3-text uppercase tracking-wider w-24 border-b border-v3-border">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-v3-text-muted">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-v3-text-muted flex flex-col items-center justify-center border-0">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        <p>Henüz yüklenmiş veya kritere uygun fatura bulunmuyor.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => (
                    <tr key={inv.id} onDoubleClick={() => setEditModalInvoice(inv)} className="hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border dark:border-v3-border-dark last:border-0">
                      <td className="px-2.5 py-2.5 text-xs text-v3-text whitespace-nowrap">
                        <div className="flex items-center">
                          <span>{formatDate(inv.extracted_data?.date || inv.created_at)}</span>
                          <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">, {getDayNameShort(inv.extracted_data?.date || inv.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-xs font-medium text-v3-text truncate w-[170px] min-w-[170px] max-w-[170px]" title={inv.extracted_data?.supplier || "-"}>
                        {inv.extracted_data?.supplier || "-"}
                      </td>
                      <td className="px-2.5 py-2.5 text-xs text-v3-text truncate w-20 max-w-[80px]" title={inv.extracted_data?.invoiceNo || "-"}>
                        {inv.extracted_data?.invoiceNo || "-"}
                      </td>
                      <td className="px-2.5 py-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <select
                            value={categorySelections[inv.id] ?? (inv.extracted_data?.category || "")}
                            onChange={(e) => handleCategorySelect(inv.id, e.target.value)}
                            disabled={updatingId === inv.id}
                            className="w-full bg-v3-bg dark:bg-v3-bg-dark border border-v3-border dark:border-v3-border-dark rounded-lg px-2 py-1.5 text-xs font-medium text-v3-text outline-none focus:border-blue-500 disabled:opacity-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Seçiniz</option>
                            {categories.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCategorySave(inv.id); }}
                            disabled={updatingId === inv.id || categorySelections[inv.id] === (inv.extracted_data?.category || "")}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors shrink-0"
                            title="Kategoriyi Kaydet"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-xs">
                        <div className="flex flex-col items-start gap-1">
                          <div>{getEntityBadge(inv.entity_type)}</div>
                          {inv.entity_id && entitiesMap[inv.entity_id] && (
                            <div className="text-[10px] text-v3-text-muted mt-0.5 leading-tight">
                              {entitiesMap[inv.entity_id].type === 'MICE' ? (
                                <>
                                  <div className="font-bold text-v3-text">{entitiesMap[inv.entity_id].project_code || entitiesMap[inv.entity_id].title || 'KOD YOK'}</div>
                                  <div>
                                    {entitiesMap[inv.entity_id].start_date ? formatDate(entitiesMap[inv.entity_id].start_date) : '-'} / {entitiesMap[inv.entity_id].end_date ? formatDate(entitiesMap[inv.entity_id].end_date) : '-'}
                                  </div>
                                  <div className="truncate max-w-[150px]">{entitiesMap[inv.entity_id].company_name}</div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-v3-text">{entitiesMap[inv.entity_id].voucher_number || 'VOUCHER YOK'}</div>
                                  <div>
                                    {entitiesMap[inv.entity_id].check_in_date ? formatDate(entitiesMap[inv.entity_id].check_in_date) : '-'} / {entitiesMap[inv.entity_id].check_out_date ? formatDate(entitiesMap[inv.entity_id].check_out_date) : '-'}
                                  </div>
                                  <div className="truncate max-w-[150px]">{entitiesMap[inv.entity_id].customer_name}</div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-2.5 py-2.5 text-xs text-right font-bold text-v3-text">
                        {Number(inv.extracted_data?.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {inv.extracted_data?.currency || "TRY"}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.status?.toUpperCase() !== 'APPROVED' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApproveClick(inv); }}
                              disabled={updatingId === inv.id}
                              className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition-colors"
                              title="Onayla"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {inv.file_url && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const ext = inv.file_url.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg';
                                setPreviewImage(`/api/invoices/preview/${inv.id}${ext}`); 
                              }}
                              className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditModalInvoice(inv); }}
                            disabled={updatingId === inv.id}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id); }}
                            disabled={updatingId === inv.id}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end px-4 py-3 border-t border-v3-border bg-v3-surface shrink-0 text-xs text-v3-muted">
            <div className="flex items-center gap-2 mr-4">
              <span>Toplam {filteredInvoices.length} kayıt</span>
              <span>Sayfa başına</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-v3-bg border border-v3-border rounded px-2 py-1 outline-none text-v3-text"
              >
                {[20, 50, 100, 200, 1000].map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 hover:bg-v3-border rounded disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="font-medium text-v3-text">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 hover:bg-v3-border rounded disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <InvoiceUploadModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            loadInvoices(); // Modal kapandığında listeyi yenile
          }} 
        />
      )}

      {editModalInvoice && (
        <EditAIInvoiceModal
          invoice={editModalInvoice}
          categories={categories}
          onClose={() => setEditModalInvoice(null)}
          onSuccess={() => {
            setEditModalInvoice(null);
            loadInvoices();
          }}
        />
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-5xl max-h-[95vh] flex flex-col items-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            {previewImage.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewImage} className="w-[80vw] h-[90vh] bg-white rounded-xl" />
            ) : (
              <img src={previewImage} alt="Fatura" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Faturayı Sil"
      >
        <div className="text-gray-600 dark:text-gray-300 mb-6">
          Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={confirmDelete}
            className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm transition-colors"
          >
            Sil
          </button>
        </div>
      </Modal>
    </div>
  );
}
