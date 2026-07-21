"use client";

import { useState, useEffect } from "react";
import PaginationControls from "@/components/PaginationControls";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { serviceTypesService } from "@/lib/supabaseService";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";
import { usePermissions, Module } from "@/lib/permissions";

interface ServiceType {
  id: string;
  name: string;
  code: string;
  description: string;
  expense_accounting_code: string;
  revenue_accounting_code: string;
  revenue_vat_code: string;
  revenue_vat_rate: number;
  expense_vat_code: string;
  expense_vat_rate: number;
  is_active: boolean;
  notes: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export default function ServiceTypesPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    loading: permissionsLoading,
  } = usePermissions();
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingServiceType, setEditingServiceType] =
    useState<ServiceType | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [statsFilter, setStatsFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [newServiceType, setNewServiceType] = useState({
    name: "",
    code: "",
    description: "",
    expense_accounting_code: "",
    revenue_accounting_code: "",
    revenue_vat_code: "",
    revenue_vat_rate: 0,
    expense_vat_code: "",
    expense_vat_rate: 0,
    is_active: true,
    notes: "",
  });

  // Sıralama fonksiyonu

  const searchAndFilterServiceTypes = (list: ServiceType[]) => {
    return list.filter((st) => {
      // Stats filter
      if (statsFilter === "active" && !st.is_active) return false;
      if (statsFilter === "transfer" && st.code !== "TRANSFER") return false;
      if (statsFilter === "guide" && st.code !== "GUIDE") return false;

      // Search term & tokens
      if (!searchTerm && (!searchTokens || searchTokens.length === 0))
        return true;

      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return (
          st.name.toLowerCase().includes(lowerS) ||
          (st.code && st.code.toLowerCase().includes(lowerS)) ||
          (st.description && st.description.toLowerCase().includes(lowerS)) ||
          (st.notes && st.notes.toLowerCase().includes(lowerS))
        );
      };

      if (searchTerm && !matches(searchTerm)) return false;

      if (searchTokens && searchTokens.length > 0) {
        for (const t of searchTokens) {
          if (!matches(t)) return false;
        }
      }

      return true;
    });
  };

  const sortServiceTypes = (list: ServiceType[]) => {
    return [...list].sort((a, b) => {
      const aOrder = a.sort_order ?? 999;
      const bOrder = b.sort_order ?? 999;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return (a.name || "").localeCompare(b.name || "", "tr", {
        sensitivity: "base",
      });
    });
  };

  const handleToggleActive = async (
    serviceTypeId: string,
    currentStatus: boolean,
  ) => {
    try {
      await serviceTypesService.update(serviceTypeId, {
        is_active: !currentStatus,
      } as any);
      await loadServiceTypes();
      setSuccess("Hizmet türü durumu güncellendi");
    } catch (err) {
      setError("Hizmet türü durumu güncellenirken hata oluştu");
    }
  };

  const exportToExcel = () => {
    // Basic CSV export for now
    const headers = [
      "Tür Adı",
      "Kod",
      "Açıklama",
      "Notlar",
      "Gider Kodu",
      "Gider KDV",
      "Gider KDV Oranı",
      "Gelir Kodu",
      "Gelir KDV",
      "Gelir KDV Oranı",
      "Durum",
    ];

    const sortedData = sortServiceTypes(
      searchAndFilterServiceTypes(serviceTypes),
    );

    const rows = sortedData.map((st) => [
      st.name,
      st.code,
      st.description || "",
      st.notes || "",
      st.expense_accounting_code || "",
      st.expense_vat_code || "",
      st.expense_vat_rate || 0,
      st.revenue_accounting_code || "",
      st.revenue_vat_code || "",
      st.revenue_vat_rate || 0,
      st.is_active ? "Aktif" : "Pasif",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((e) =>
        e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `hizmet_turleri_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadServiceTypes = async () => {
    try {
      const rows = await serviceTypesService.getAll();
      const normalized: ServiceType[] = (rows || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description || "",
        expense_accounting_code: r.expense_accounting_code || "",
        revenue_accounting_code: r.revenue_accounting_code || "",
        revenue_vat_code: r.revenue_vat_code || "",
        revenue_vat_rate: r.revenue_vat_rate || 0,
        expense_vat_code: r.expense_vat_code || "",
        expense_vat_rate: r.expense_vat_rate || 0,
        is_active: r.is_active ?? true,
        notes: r.notes || "",
        sort_order: r.sort_order ?? 999,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
      setServiceTypes(sortServiceTypes(normalized));
      setLoading(false);
    } catch (error: any) {
      setError("Hizmet türleri yüklenirken hata oluştu");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceTypes();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchTokens, statsFilter]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SUPPLIERS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text group-hover:text-blue-600 dark:text-blue-300 mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/suppliers"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Tedarikçilere Dön
          </a>
        </div>
      </div>
    );
  }

  const handleCreateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await serviceTypesService.create({
        name: newServiceType.name,
        code: newServiceType.code,
        description: newServiceType.description,
        expense_accounting_code: newServiceType.expense_accounting_code,
        revenue_accounting_code: newServiceType.revenue_accounting_code,
        revenue_vat_code: newServiceType.revenue_vat_code,
        revenue_vat_rate: newServiceType.revenue_vat_rate,
        expense_vat_code: newServiceType.expense_vat_code,
        expense_vat_rate: newServiceType.expense_vat_rate,
        is_active: newServiceType.is_active,
        notes: newServiceType.notes,
        sort_order: (serviceTypes.length || 0) + 1,
      } as any);
      await loadServiceTypes();

      setSuccess("Hizmet türü başarıyla oluşturuldu");
      setShowCreateModal(false);
      setNewServiceType({
        name: "",
        code: "",
        description: "",
        expense_accounting_code: "",
        revenue_accounting_code: "",
        revenue_vat_code: "",
        revenue_vat_rate: 0,
        expense_vat_code: "",
        expense_vat_rate: 0,
        is_active: true,
        notes: "",
      });
    } catch (error: any) {
      setError(error.message || "Hizmet türü oluşturulurken hata oluştu");
    }
  };

  const handleEditServiceType = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType);
    setShowEditModal(true);
  };

  const handleUpdateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceType) return;

    setError("");
    setSuccess("");

    try {
      await serviceTypesService.update(editingServiceType.id, {
        name: editingServiceType.name,
        code: editingServiceType.code,
        description: editingServiceType.description,
        expense_accounting_code: editingServiceType.expense_accounting_code,
        revenue_accounting_code: editingServiceType.revenue_accounting_code,
        revenue_vat_code: editingServiceType.revenue_vat_code,
        revenue_vat_rate: editingServiceType.revenue_vat_rate,
        expense_vat_code: editingServiceType.expense_vat_code,
        expense_vat_rate: editingServiceType.expense_vat_rate,
        is_active: editingServiceType.is_active,
        notes: editingServiceType.notes,
      } as any);
      await loadServiceTypes();

      setSuccess("Hizmet türü başarıyla güncellendi");
      setShowEditModal(false);
      setEditingServiceType(null);
    } catch (error: any) {
      setError("Hizmet türü güncellenirken hata oluştu");
    }
  };

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm("Bu hizmet türünü silmek istediğinizden emin misiniz?"))
      return;

    try {
      await serviceTypesService.delete(id);
      await loadServiceTypes();

      setSuccess("Hizmet türü başarıyla silindi");
    } catch (error: any) {
      setError("Hizmet türü silinirken hata oluştu");
    }
  };

  // Yukarı/Aşağı taşıma fonksiyonları
  const moveServiceTypeUp = async (serviceTypeId: string) => {
    console.log("moveServiceTypeUp called:", { serviceTypeId });

    // Önce sıralanmış service typesleri al
    const filteredServiceTypes = searchAndFilterServiceTypes(serviceTypes);
    const sortedServiceTypes = sortServiceTypes(filteredServiceTypes);
    console.log(
      "sortedServiceTypes found:",
      sortedServiceTypes.map((st) => ({
        id: st.id,
        name: st.name,
        sort_order: st.sort_order,
      })),
    );
    const currentIndex = sortedServiceTypes.findIndex(
      (st) => st.id === serviceTypeId,
    );
    console.log("currentIndex:", currentIndex);

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const reorderedServiceTypes = Array.from(sortedServiceTypes);
      const [movedItem] = reorderedServiceTypes.splice(currentIndex, 1);
      reorderedServiceTypes.splice(newIndex, 0, movedItem);

      // sort_order değerlerini güncelle
      const updatedServiceTypes = reorderedServiceTypes.map((st, index) => ({
        ...st,
        sort_order: index + 1,
        updated_at: new Date().toISOString(),
      }));

      console.log(
        "Updated service types:",
        updatedServiceTypes.map((st) => ({
          id: st.id,
          name: st.name,
          sort_order: st.sort_order,
        })),
      );
      // Supabase'e yaz
      for (const st of updatedServiceTypes) {
        await serviceTypesService.update(st.id, {
          sort_order: st.sort_order,
        } as any);
      }
      await loadServiceTypes();
    } else {
      console.log("Cannot move up - already at top");
    }
  };

  const moveServiceTypeDown = async (serviceTypeId: string) => {
    console.log("moveServiceTypeDown called:", { serviceTypeId });

    // Önce sıralanmış service typesleri al
    const sortedServiceTypes = sortServiceTypes(serviceTypes);
    console.log(
      "sortedServiceTypes found:",
      sortedServiceTypes.map((st) => ({
        id: st.id,
        name: st.name,
        sort_order: st.sort_order,
      })),
    );
    const currentIndex = sortedServiceTypes.findIndex(
      (st) => st.id === serviceTypeId,
    );
    console.log("currentIndex:", currentIndex);

    if (currentIndex < sortedServiceTypes.length - 1) {
      const newIndex = currentIndex + 1;
      const reorderedServiceTypes = Array.from(sortedServiceTypes);
      const [movedItem] = reorderedServiceTypes.splice(currentIndex, 1);
      reorderedServiceTypes.splice(newIndex, 0, movedItem);

      // sort_order değerlerini güncelle
      const updatedServiceTypes = reorderedServiceTypes.map((st, index) => ({
        ...st,
        sort_order: index + 1,
        updated_at: new Date().toISOString(),
      }));

      console.log(
        "Updated service types:",
        updatedServiceTypes.map((st) => ({
          id: st.id,
          name: st.name,
          sort_order: st.sort_order,
        })),
      );
      for (const st of updatedServiceTypes) {
        await serviceTypesService.update(st.id, {
          sort_order: st.sort_order,
        } as any);
      }
      await loadServiceTypes();
    } else {
      console.log("Cannot move down - already at bottom");
    }
  };

  const stats = {
    total: serviceTypes.length,
    active: serviceTypes.filter((s) => s.is_active).length,
  };
  const filteredServiceTypes = searchAndFilterServiceTypes(serviceTypes);
  const sortedServiceTypes = sortServiceTypes(filteredServiceTypes);
  const paginatedServiceTypes = paginateItems(
    sortedServiceTypes,
    page,
    pageSize,
  );

  if (loading) {
    return <LoadingSpinner message="Servis tipleri yükleniyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
                Hizmet Kategori Yönetimi
              </h1>
              <p className="text-xs text-v3-muted mt-1">
                Transfer, rehber, otel ve diğer hizmet türlerini yönetin
              </p>
            </div>
          </div>

          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                GENEL ARAMA (TÜR, KOD, AÇIKLAMA...)
              </label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchTerm}
                  onInputChange={setSearchTerm}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchTerm("");
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter((st) => st !== t));
                  }}
                />
              </div>
            </div>

            {/* Trash Button */}
            <button
              onClick={() => {
                setStatsFilter("all");
                setSearchTerm("");
                setSearchTokens([]);
              }}
              className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all shrink-0"
              title="Filtreleri Temizle"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            <button
              onClick={exportToExcel}
              className="h-10 bg-v3-surface text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 py-2 px-4 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              EXCEL
            </button>

            {canCreate(Module.SUPPLIERS) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                + YENİ HİZMET TÜRÜ
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl transition-colors duration-200 text-xs font-medium">
            {success}
          </div>
        )}

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-v3-border">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-v3-text">Durum:</span>
          </div>

          <button
            onClick={() => setStatsFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "all" ? "bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            TÜMÜ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "all" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300" : "bg-white/10"}`}
            >
              {serviceTypes.length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "active" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            AKTİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "active" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-white/10"}`}
            >
              {serviceTypes.filter((st) => st.is_active).length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("transfer")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "transfer" ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            TRANSFER
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "transfer" ? "bg-purple-500/20 text-purple-300" : "bg-white/10"}`}
            >
              {serviceTypes.filter((st) => st.code === "TRANSFER").length}
            </span>
          </button>
          <button
            onClick={() => setStatsFilter("guide")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${statsFilter === "guide" ? "bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            REHBER
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${statsFilter === "guide" ? "bg-orange-500/20 text-orange-600 dark:text-orange-300" : "bg-white/10"}`}
            >
              {serviceTypes.filter((st) => st.code === "GUIDE").length}
            </span>
          </button>
        </div>

        {/* Hizmet Türleri Listesi */}
        <div className="space-y-3 overflow-auto w-full flex-1">
          {paginatedServiceTypes.items.map((serviceType, localIndex) => {
            const index =
              (paginatedServiceTypes.page - 1) *
                paginatedServiceTypes.pageSize +
              localIndex;
            return (
              <div
                key={serviceType.id}
                className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl overflow-hidden hover:bg-blue-500/10 cursor-pointer transition-colors duration-200 group"
                onDoubleClick={() => {
                  setEditingServiceType(serviceType);
                  setShowEditModal(true);
                }}
              >
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5 mr-3 border-r border-v3-border pr-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveServiceTypeUp(serviceType.id);
                        }}
                        className="p-0.5 hover:bg-v3-surface rounded text-v3-muted hover:text-v3-text transition-colors"
                        title="Yukarı Taşı"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveServiceTypeDown(serviceType.id);
                        }}
                        className="p-0.5 hover:bg-v3-surface rounded text-v3-muted hover:text-v3-text transition-colors"
                        title="Aşağı Taşı"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-6 h-6 bg-v3-border border border-v3-border rounded-full flex items-center justify-center">
                        <span className="text-v3-muted text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-v3-text group-hover:text-blue-600 dark:text-blue-300">
                          {serviceType.name}
                        </h3>
                        <p className="text-xs text-v3-muted">
                          {serviceType.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-v3-muted">
                            Kod:{" "}
                            <span className="font-mono">
                              {serviceType.code}
                            </span>
                          </span>
                          {serviceType.notes && (
                            <span className="text-xs text-v3-muted">
                              Not: {serviceType.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Muhasebe ve KDV Kodları */}
                      <div className="hidden lg:flex items-center space-x-8 text-xs">
                        <div className="text-center">
                          <span className="text-v3-muted font-medium">
                            Gider:
                          </span>
                          <span className="font-mono text-v3-text ml-1">
                            {serviceType.expense_accounting_code || "-"}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-v3-muted font-medium">
                            Gelir:
                          </span>
                          <span className="font-mono text-v3-text ml-1">
                            {serviceType.revenue_accounting_code || "-"}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-v3-muted font-medium">
                            Gelir KDV:
                          </span>
                          <span className="font-mono text-v3-text ml-1">
                            {serviceType.revenue_vat_code || "-"} (
                            {serviceType.revenue_vat_rate || 0}%)
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-v3-muted font-medium">
                            Gider KDV:
                          </span>
                          <span className="font-mono text-v3-text ml-1">
                            {serviceType.expense_vat_code || "-"} (
                            {serviceType.expense_vat_rate || 0}%)
                          </span>
                        </div>
                      </div>

                      {/* Durum */}
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          serviceType.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {serviceType.is_active ? "Aktif" : "Pasif"}
                      </span>

                      {/* İşlem Butonları */}
                      <div className="flex items-center space-x-1">
                        {/* Sıralama Butonları */}
                        <button
                          onClick={() => moveServiceTypeUp(serviceType.id)}
                          disabled={index === 0}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-600 dark:text-blue-300 p-1 rounded hover:bg-blue-500/10 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Yukarı Taşı"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveServiceTypeDown(serviceType.id)}
                          disabled={index === serviceTypes.length - 1}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-600 dark:text-blue-300 p-1 rounded hover:bg-blue-500/10 dark:hover:bg-blue-900/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Aşağı Taşı"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditServiceType(serviceType)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                          title="Düzenle"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteServiceType(serviceType.id)
                          }
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                          title="Sil"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Hizmet Türü Yoksa Mesaj */}
          {serviceTypes.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-sm font-medium text-v3-text group-hover:text-blue-600 dark:text-blue-300 mb-2">
                Henüz hizmet türü eklenmemiş
              </h3>
              <p className="text-xs text-v3-muted">
                Yeni hizmet türü ekleyerek başlayın
              </p>
            </div>
          )}
        </div>
        <PaginationControls
          page={paginatedServiceTypes.page}
          pageSize={paginatedServiceTypes.pageSize}
          total={paginatedServiceTypes.total}
          totalPages={paginatedServiceTypes.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="service_types_page_size"
          compactRight
        />

        {/* Yeni Hizmet Türü Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-v3-text group-hover:text-blue-600 dark:text-blue-300 mb-3">
                  Yeni Hizmet Türü Ekle
                </h3>
                <form onSubmit={handleCreateServiceType}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Hizmet Türü Adı
                        </label>
                        <input
                          type="text"
                          value={newServiceType.name}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              name: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Kod
                        </label>
                        <input
                          type="text"
                          value={newServiceType.code}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-v3-text">
                        Açıklama
                      </label>
                      <textarea
                        value={newServiceType.description}
                        onChange={(e) =>
                          setNewServiceType({
                            ...newServiceType,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gider Muhasebe Bağlantı Kodu
                        </label>
                        <input
                          type="text"
                          value={newServiceType.expense_accounting_code}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              expense_accounting_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gelir Muhasebe Bağlantı Kodu
                        </label>
                        <input
                          type="text"
                          value={newServiceType.revenue_accounting_code}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              revenue_accounting_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gelir KDV Kodu
                        </label>
                        <input
                          type="text"
                          value={newServiceType.revenue_vat_code}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              revenue_vat_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 391.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gelir KDV Oranı (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={newServiceType.revenue_vat_rate}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              revenue_vat_rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gider KDV Kodu
                        </label>
                        <input
                          type="text"
                          value={newServiceType.expense_vat_code}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              expense_vat_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 191.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gider KDV Oranı (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={newServiceType.expense_vat_rate}
                          onChange={(e) =>
                            setNewServiceType({
                              ...newServiceType,
                              expense_vat_rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-v3-text">
                        Notlar
                      </label>
                      <textarea
                        value={newServiceType.notes}
                        onChange={(e) =>
                          setNewServiceType({
                            ...newServiceType,
                            notes: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        placeholder="Hizmet türü ile ilgili özel notlar..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
                        checked={newServiceType.is_active}
                        onChange={(e) =>
                          setNewServiceType({
                            ...newServiceType,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <label
                        htmlFor="isActive"
                        className="ml-2 block text-xs text-gray-900 dark:text-gray-300"
                      >
                        Aktif
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-v3-text hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-300"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-500 dark:bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-500/90 dark:hover:bg-blue-500"
                    >
                      Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Düzenleme Modal */}
        {showEditModal && editingServiceType && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-2 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-v3-text group-hover:text-blue-600 dark:text-blue-300 mb-3">
                  Hizmet Türü Düzenle
                </h3>
                <form onSubmit={handleUpdateServiceType}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Hizmet Türü Adı
                        </label>
                        <input
                          type="text"
                          value={editingServiceType.name}
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              name: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Kod
                        </label>
                        <input
                          type="text"
                          value={editingServiceType.code}
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              code: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-v3-text">
                        Açıklama
                      </label>
                      <textarea
                        value={editingServiceType.description}
                        onChange={(e) =>
                          setEditingServiceType({
                            ...editingServiceType,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gider Muhasebe Bağlantı Kodu
                        </label>
                        <input
                          type="text"
                          value={
                            editingServiceType.expense_accounting_code || ""
                          }
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              expense_accounting_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gelir Muhasebe Bağlantı Kodu
                        </label>
                        <input
                          type="text"
                          value={
                            editingServiceType.revenue_accounting_code || ""
                          }
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              revenue_accounting_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 120.01.001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gelir KDV Kodu
                        </label>
                        <input
                          type="text"
                          value={editingServiceType.revenue_vat_code || ""}
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              revenue_vat_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 391.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gelir KDV Oranı (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editingServiceType.revenue_vat_rate || 0}
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              revenue_vat_rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gider KDV Kodu
                        </label>
                        <input
                          type="text"
                          value={editingServiceType.expense_vat_code || ""}
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              expense_vat_code: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 191.01.001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-v3-text">
                          Gider KDV Oranı (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editingServiceType.expense_vat_rate || 0}
                          onChange={(e) =>
                            setEditingServiceType({
                              ...editingServiceType,
                              expense_vat_rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                          placeholder="Örn: 18"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-v3-text">
                        Notlar
                      </label>
                      <textarea
                        value={editingServiceType.notes}
                        onChange={(e) =>
                          setEditingServiceType({
                            ...editingServiceType,
                            notes: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-v3-text group-hover:text-blue-600 dark:text-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-xs"
                        rows={2}
                        placeholder="Hizmet türü ile ilgili özel notlar..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isActiveEdit"
                        name="isActiveEdit"
                        type="checkbox"
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
                        checked={editingServiceType.is_active}
                        onChange={(e) =>
                          setEditingServiceType({
                            ...editingServiceType,
                            is_active: e.target.checked,
                          })
                        }
                      />
                      <label
                        htmlFor="isActiveEdit"
                        className="ml-2 block text-xs text-gray-900 dark:text-gray-300"
                      >
                        Aktif
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingServiceType(null);
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-v3-text hover:bg-gray-50 dark:hover:bg-gray-700 bg-gray-300"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-500 dark:bg-blue-500 text-white rounded-md text-xs font-medium hover:bg-blue-500/90 dark:hover:bg-blue-500"
                    >
                      Güncelle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Hata ve Başarı Mesajları */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError("")}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Kapat</span>
              <svg
                className="fill-current h-6 w-6"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Kapat</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
            <span className="block sm:inline">{success}</span>
            <button
              onClick={() => setSuccess("")}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Kapat</span>
              <svg
                className="fill-current h-6 w-6"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Kapat</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
