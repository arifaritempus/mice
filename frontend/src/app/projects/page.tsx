"use client";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { formatNumber, formatDate, getDayNameShort } from "@/utils/formatters";
import {
  projectsService,
  agenciesService,
  hotelsService,
  quotesService,
  quoteItemsService,
  projectSalesItemsService,
  projectPurchaseItemsService,
  publicLinksService,
  projectUsersService,
} from "@/lib/supabaseService";
import { ExcelUtils } from "@/utils/excelUtils";
import PaginationControls from "@/components/PaginationControls";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePermissions, Module } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/types/pagination";
import Modal from "@/components/Modal";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ScrollText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
// import { loadProjeler } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const projeler = await loadProjeler();
//   console.log(projeler);
// }

// fetchData();

interface Project {
  id: string;
  title: string;
  description: string;
  status: string; // only 'active' | 'completed'
  priority?: string;
  start_date: string;
  end_date: string;
  budget: number;
  progress: number;
  team_members: number;
  quote_id?: string;
  created_at: string;
  updated_at?: string;
  // Enriched fields from quote
  reference?: string;
  company_name?: string;
  agency_id?: string;
  hotel_id?: string;
  quote_type?: string;
  room_count?: number;
  pax_count?: number;
  room_pax?: string;
  confirmed_at?: string; // Konfirme Tarihi
  // Kilit bilgisi (opsiyonel)
  locked?: boolean;
}

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply?: (start?: string, end?: string) => void;
}

const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ProjectsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const todayStr = new Date().toISOString().split("T")[0];
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [searchTerm] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [draftDateStart, setDraftDateStart] = useState("");
  const [draftDateEnd, setDraftDateEnd] = useState("");
  const [orgDateStart, setOrgDateStart] = useState(todayStr);
  const [orgDateEnd, setOrgDateEnd] = useState("");
  const [appliedOrgDateStart, setAppliedOrgDateStart] = useState(todayStr);
  const [appliedOrgDateEnd, setAppliedOrgDateEnd] = useState("");
  const [draftOrgDateStart, setDraftOrgDateStart] = useState(todayStr);
  const [draftOrgDateEnd, setDraftOrgDateEnd] = useState("");
  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [projectUsersMap, setProjectUsersMap] = useState<
    Record<string, string[]>
  >({});
  const [exporting, setExporting] = useState(false);
  const [lockUpdatingId, setLockUpdatingId] = useState<string | null>(null);
  const [lockFeatureAvailable, setLockFeatureAvailable] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });
  const [deleting, setDeleting] = useState(false);

  const loadedRef = useRef(false);
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsService.getPage({
        page,
        pageSize,
        filter,
        searchTerm,
        dateStart: appliedOrgDateStart,
        dateEnd: appliedOrgDateEnd,
        sortField,
        sortDirection,
      });
      setProjects(response.data);
      if (response.data.length > 0) {
        const hasLockedColumn = Object.prototype.hasOwnProperty.call(
          response.data[0],
          "locked",
        );
        if (!hasLockedColumn) {
          setLockFeatureAvailable(false);
        }
      }
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading projects from Supabase:", error);
      toast.error("Projeler yüklenirken bir hata oluştu.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const agenciesData = await agenciesService.getAll();
      setAgencies(agenciesData);
    } catch (error) {
      console.error("Error loading agencies from Supabase:", error);
      setAgencies([]);
    }
  };

  const loadHotels = async () => {
    try {
      const hotelsData = await hotelsService.getAll();
      setHotels(hotelsData);
    } catch (error) {
      console.error("Error loading hotels from Supabase:", error);
      setHotels([]);
    }
  };

  const loadProjectUsers = async () => {
    try {
      const data = await projectUsersService.getAll();
      const map: Record<string, string[]> = {};
      data.forEach((item: any) => {
        if (!map[item.project_id]) map[item.project_id] = [];
        map[item.project_id].push(item.user_id);
      });
      setProjectUsersMap(map);
    } catch (error) {
      console.error("Error loading project users:", error);
    }
  };

  const getAgencyName = (agencyId?: string) =>
    agencies.find((a) => a.id === agencyId)?.name || "";
  const getHotelName = (hotelId?: string) =>
    hotels.find((h) => h.id === hotelId)?.name || "";

  // Onay bilgilerini yükle
  const loadApprovalData = async (projectId: string) => {
    try {
      setLoadingApproval(true);
      // Proje için public linkleri getir
      const links = await publicLinksService.getByProjectId(projectId);
      // Onaylanmış linki bul
      const approvedLink = links.find(
        (link) => link.approval?.is_approved === true,
      );

      if (approvedLink && approvedLink.approval) {
        setApprovalData(approvedLink.approval);
        setShowApprovalModal(true);
      } else {
        toast.error("Bu proje için onay bilgisi bulunamadı.");
      }
    } catch (error) {
      console.error("Error loading approval data:", error);
      toast.error("Onay bilgileri yüklenirken bir hata oluştu.");
    } finally {
      setLoadingApproval(false);
    }
  };

  // Onay modal'ını kapat
  const handleCloseApprovalModal = () => {
    setShowApprovalModal(false);
    setApprovalData(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "on_hold":
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t('projects.statusActive') || "Aktif";
      case "completed":
        return t('projects.statusCompleted') || "Tamamlandı";
      case "on_hold":
      case "on-hold":
        return t('projects.statusOnHold') || "Beklemede";
      case "cancelled":
        return t('projects.statusCancelled') || "İptal";
      case "approved":
        return t('projects.statusApproved') || "Onaylandı";
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return priority;
    }
  };

  const toggleProjectLock = async (project: Project) => {
    if (!lockFeatureAvailable) return;
    // Şemada locked kolonu yoksa hiç API çağrısı yapma
    if (!Object.prototype.hasOwnProperty.call(project, "locked")) {
      setLockFeatureAvailable(false);
      toast.error("Projelerde kilit özelliği bu veritabanında aktif değil.");
      return;
    }
    if (!isSuperAdmin) return;
    if (lockUpdatingId) return;
    try {
      setLockUpdatingId(project.id);
      const updated = await projectsService.update(project.id, {
        locked: !project.locked,
      } as any);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, locked: (updated as any).locked } : p,
        ),
      );
    } catch (error) {
      console.error("Proje kilitleme/kilidi açma hatası:", error);
      if (
        String((error as any)?.message || "").includes(
          "Could not find the 'locked' column",
        )
      ) {
        setLockFeatureAvailable(false);
        toast.error("Projelerde kilit özelliği aktif değil.");
        return;
      }
      toast.error("Proje kilidi güncellenirken bir hata oluştu.");
    } finally {
      setLockUpdatingId(null);
    }
  };

  // Excel Export Fonksiyonu
  const handleExportExcel = async () => {
    setExporting(true);

    try {
      // Filtrelenmiş projeleri al
      const filteredProjects = projects.filter((project) => {
        // Durum filtresi
        if (filter !== "all") {
          // on-hold ve on_hold durumlarını destekle
          if (
            filter === "on-hold" &&
            project.status !== "on-hold" &&
            project.status !== "on_hold"
          ) {
            return false;
          } else if (filter !== "on-hold" && project.status !== filter) {
            return false;
          }
        }

        // Tarih filtreleri
        if (dateStart) {
          const projectQuoteDate = (project.created_at || "").slice(0, 10);
          if (projectQuoteDate < dateStart) return false;
        }

        if (dateEnd) {
          const projectQuoteDate = (project.created_at || "").slice(0, 10);
          if (projectQuoteDate > dateEnd) return false;
        }

        if (appliedOrgDateStart) {
          const projectStartDate = new Date(project.start_date);
          const filterStartDate = new Date(appliedOrgDateStart);
          if (projectStartDate < filterStartDate) return false;
        }

        if (appliedOrgDateEnd) {
          const projectEndDate = new Date(project.end_date);
          const filterEndDate = new Date(appliedOrgDateEnd);
          if (projectEndDate > filterEndDate) return false;
        }

        // Arama filtresi
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const searchFields = [
            project.title,
            project.description,
            project.status,
            project.priority || "",
            project.reference || "",
            project.company_name || "",
            getAgencyName(project.agency_id),
            getHotelName(project.hotel_id),
            project.quote_type || "",
            project.room_pax || "",
            project.budget?.toString() || "",
          ];
          const searchText = searchFields.join(" ");
          if (!searchText.includes(s)) return false;
        }

        return true;
      });

      // Sıralama uygula
      const sortedProjects = sortProjects(
        filteredProjects,
        sortField,
        sortDirection,
      );

      console.log("Export edilecek proje sayısı:", sortedProjects.length);
      console.log("Uygulanan filtreler:", {
        statusFilter: filter,
        searchTerm,
        quoteDateStart: dateStart,
        quoteDateEnd: dateEnd,
        appliedOrgDateStart,
        appliedOrgDateEnd,
        sortField,
        sortDirection,
      });

      // ExcelUtils.exportProjects fonksiyonunu çağır
      await ExcelUtils.exportProjects(sortedProjects, agencies, hotels);
      toast.success(
        `Excel dosyası başarıyla indirildi! (${sortedProjects.length} proje)`,
      );
    } catch (error) {
      console.error("Excel export hatası:", error);
      toast.error("Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (loadedRef.current) return; // StrictMode tekrarlı çağrıyı engelle
    loadedRef.current = true;
    // load agency/hotel names for display
    loadAgencies();
    loadHotels();
    loadProjectUsers();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [
    page,
    pageSize,
    filter,
    appliedOrgDateStart,
    appliedOrgDateEnd,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    filter,
    appliedOrgDateStart,
    appliedOrgDateEnd,
    sortField,
    sortDirection,
  ]);

  const handleDeleteProject = (project: Project) => {
    setDeleteModal({ open: true, project });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.project) return;
    try {
      setDeleting(true);
      await projectsService.delete(deleteModal.project.id);
      setProjects((prev) =>
        prev.filter((p) => p.id !== deleteModal.project!.id),
      );
      setDeleteModal({ open: false, project: null });
      toast.success("Proje başarıyla silindi");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Proje silinirken bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  const sortProjects = (
    items: Project[],
    field: string,
    direction: "asc" | "desc",
  ) => {
    if (!field) return items;
    const sorted = [...items].sort((a, b) => {
      let av: any;
      let bv: any;
      switch (field) {
        case "created_at":
          av = new Date(a.created_at || "").getTime();
          bv = new Date(b.created_at || "").getTime();
          break;
        case "title":
          av = a.title || "";
          bv = b.title || "";
          break;
        case "status":
          av = a.status || "";
          bv = b.status || "";
          break;
        case "priority":
          av = a.priority || "";
          bv = b.priority || "";
          break;
        case "date":
          av = new Date(a.start_date || "").getTime();
          bv = new Date(b.start_date || "").getTime();
          break;
        case "budget":
          av = a.budget || 0;
          bv = b.budget || 0;
          break;
        case "progress":
          av = a.progress || 0;
          bv = b.progress || 0;
          break;
        case "team":
          av = a.team_members || 0;
          bv = b.team_members || 0;
          break;
        default:
          return 0;
      }
      if (direction === "asc") return av > bv ? 1 : av < bv ? -1 : 0;
      return av < bv ? 1 : av > bv ? -1 : 0;
    });
    return sorted;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtrelenmiş projeleri kullanarak istatistikleri hesapla
  const totalProjects = totalCount;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const approvedProjects = projects.filter(
    (p) => p.status === "approved",
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed",
  ).length;
  const onHoldProjects = projects.filter(
    (p) => p.status === "on-hold" || p.status === "on_hold",
  ).length;
  const cancelledProjects = projects.filter(
    (p) => p.status === "cancelled",
  ).length;
  const includesByTokens = (value: string, tokens: string[]) => {
    if (tokens.length === 0) return true;
    const normalized = (value || "").toLowerCase();
    return tokens.some((token) => normalized.includes(token.toLowerCase()));
  };
  const addToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>,
  ) => {
    const normalized = value.trim();
    if (!normalized) return;
    setTokens((prev) => {
      if (prev.some((item) => item.toLowerCase() === normalized.toLowerCase()))
        return prev;
      return [...prev, normalized];
    });
    setInput("");
  };
  const removeToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
  ) => {
    setTokens((prev) => prev.filter((item) => item !== value));
  };
  const referenceSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          projects.map((p) => (p.reference || "").trim()).filter(Boolean),
        ),
      ),
    [projects],
  );
  const companySuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          projects.map((p) => (p.company_name || "").trim()).filter(Boolean),
        ),
      ),
    [projects],
  );
  const agencySuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => (getAgencyName(p.agency_id) || "").trim())
            .filter(Boolean),
        ),
      ),
    [projects, agencies],
  );
  const statusSuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          "Aktif",
          "Onaylandı",
          "Tamamlandı",
          "Beklemede",
          "İptal",
          ...projects
            .map((p) => getStatusText(p.status).trim())
            .filter(Boolean),
        ]),
      ),
    [projects],
  );
  const visibleProjects = projects.filter((project) => {
    const agencyName = getAgencyName(project.agency_id);
    const reference = project.reference || "";
    const company = project.company_name || "";
    const status = getStatusText(project.status);
    const quoteDate = (project.created_at || "").slice(0, 10);
    const organizationStartDate = (project.start_date || "").slice(0, 10);
    const organizationEndDate = (project.end_date || "").slice(0, 10);

    if (dateStart && quoteDate && quoteDate < dateStart) return false;
    if (dateEnd && quoteDate && quoteDate > dateEnd) return false;
    if (
      appliedOrgDateStart &&
      organizationStartDate &&
      organizationStartDate < appliedOrgDateStart
    )
      return false;
    if (
      appliedOrgDateEnd &&
      organizationEndDate &&
      organizationEndDate > appliedOrgDateEnd
    )
      return false;

    const searchTerms = [...globalTokens, globalInput.trim()].filter(Boolean);
    if (searchTerms.length > 0) {
      const match = searchTerms.every((token) => {
        const t = token.toLowerCase();
        return (
          (project.reference || "").toLowerCase().includes(t) ||
          company.toLowerCase().includes(t) ||
          agencyName.toLowerCase().includes(t) ||
          status.toLowerCase().includes(t) ||
          (project.quote_type || "").toLowerCase().includes(t)
        );
      });
      if (!match) return false;
    }
    return true;
  });

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Projects görüntüleme yetkisi kontrolü
  if (!canView(Module.PROJECTS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            {t('common.unauthorized') || "Yetki Gerekli"}
          </h1>
          <p className="text-v3-muted mb-6">
            {t('projects.unauthorizedDesc') || "Projeler sayfasına erişim için yetkiniz bulunmuyor."}
          </p>
          <Link
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            {t('common.backToHome') || "Ana Sayfaya Dön"}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message={t('projects.loading') || "Projeler yükleniyor..."} />;
  }

  return (
    <div className="flex-1 min-h-0 w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              {t('projects.title') || "Projeler"}
            </h1>
            <p className="text-xs text-v3-muted mt-1">{t('projects.description') || "Projelerinizi yönetin"}</p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label={t('projects.dateQuote') || "Teklif Tarihi"}
                startValue={draftDateStart}
                endValue={draftDateEnd}
                onStartChange={setDraftDateStart}
                onEndChange={setDraftDateEnd}
                onApply={(s, e) => {
                  setDateStart(s !== undefined ? s : draftDateStart);
                  setDateEnd(e !== undefined ? e : draftDateEnd);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label={t('projects.dateOrganization') || "Organizasyon Tarihi"}
                startValue={draftOrgDateStart}
                endValue={draftOrgDateEnd}
                onStartChange={setDraftOrgDateStart}
                onEndChange={setDraftOrgDateEnd}
                onApply={(s, e) => {
                  setOrgDateStart(s !== undefined ? s : draftOrgDateStart);
                  setOrgDateEnd(e !== undefined ? e : draftOrgDateEnd);
                  setAppliedOrgDateStart(
                    s !== undefined ? s : draftOrgDateStart,
                  );
                  setAppliedOrgDateEnd(e !== undefined ? e : draftOrgDateEnd);
                  setPage(1);
                }}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label={t('projects.searchPlaceholder') || "Genel Arama (Firma, Acente, Referans...)"}
                tokens={globalTokens}
                inputValue={globalInput}
                suggestions={Array.from(
                  new Set([
                    ...projects.map((p) => (p.reference || "").trim()),
                    ...projects.map((p) => (p.company_name || "").trim()),
                    ...projects.map((p) =>
                      (getAgencyName(p.agency_id) || "").trim(),
                    ),
                    ...projects.map((p) =>
                      (getStatusText(p.status) || "").trim(),
                    ),
                  ]),
                ).filter(Boolean)}
                onInputChange={setGlobalInput}
                onAddToken={(value) =>
                  addToken(value, setGlobalTokens, setGlobalInput)
                }
                onRemoveToken={(value) => removeToken(value, setGlobalTokens)}
              />
            </div>



            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-v3-border pl-3">
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                title={t('common.exportExcel') || "Excel'e Aktar"}
              >
                {exporting ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 text-v3-text"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </>
                ) : (
                  <>
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1 pl-1">
            Durum:
          </span>

          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "all" ? "bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {t('common.all') || "Tümü"}
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {totalProjects}
            </span>
          </button>

          <button
            onClick={() => setFilter("active")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "active" ? "bg-teal-500/20 border-teal-500/50 text-teal-600 dark:text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {t('common.active') || "Aktif"}
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {activeProjects}
            </span>
          </button>

          <button
            onClick={() => setFilter("approved")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "approved" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {t('projects.lblConfirmed') || "Konfirme"}
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {approvedProjects}
            </span>
          </button>

          <button
            onClick={() => setFilter("completed")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "completed" ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {t('common.completed') || "Tamamlandı"}
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {completedProjects}
            </span>
          </button>

          <button
            onClick={() => setFilter("on-hold")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "on-hold" ? "bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {t('common.onHold') || "Beklemede"}
            </span>
            <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
              {onHoldProjects}
            </span>
          </button>
        </div>

        {/* Projects Table */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden">
          <div className="w-full flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-surface sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-v3-border">
                <tr>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        {t('projects.dateQuote') || "Teklif Tarihi"}
                      </span>
                      {sortField === "created_at" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort("reference")}
                  >
                    <div className="flex items-center">
                      {t('projects.reference') || "Referans"}
                      {sortField === "reference" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("start_date")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        {t('projects.cinCoutDate') || "C-IN C-OUT Tarihi"}
                      </span>
                      {sortField === "start_date" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("company_name")}
                  >
                    <div className="flex items-center">
                      {t('home.companyName') || "Firma Adı"}
                      {sortField === "company_name" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("agency_id")}
                  >
                    <div className="flex items-center">
                      {t('home.agency') || "Acente"}
                      {sortField === "agency_id" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("hotel_id")}
                  >
                    <div className="flex items-center">
                      {t('home.hotel') || "Otel"}
                      {sortField === "hotel_id" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("quote_type")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        {t('projects.quoteType') || "Teklif Türü"}
                      </span>
                      {sortField === "quote_type" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("room_pax")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        {t('projects.roomPax') || "ODA | PAX"}
                      </span>
                      {sortField === "room_pax" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("team_members")}
                  >
                    <div className="flex items-center">
                      {t('projects.team') || "Ekip"}
                      {sortField === "team_members" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      {t('common.status') || "Durum"}
                      {sortField === "status" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  {/* Kilit durumu (sadece süper admin için) */}
                  {isSuperAdmin && lockFeatureAvailable && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider">
                      {t('common.lock') || "Kilit"}
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider">
                    {t('common.actions') || "İşlemler"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                    onDoubleClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text">
                      {formatDate(project.confirmed_at || project.created_at)}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text">
                      {project.reference || "-"}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      <div className="leading-tight flex flex-col gap-0.5">
                        <div className="flex items-center">
                          <span>{formatDate(project.start_date)}</span>
                          <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">
                            , {getDayNameShort(project.start_date, language === 'en' ? 'en-US' : 'tr-TR')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>{formatDate(project.end_date)}</span>
                          <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">
                            , {getDayNameShort(project.end_date, language === 'en' ? 'en-US' : 'tr-TR')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {project.company_name || "-"}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {getAgencyName(project.agency_id)}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text max-w-[160px]">
                      {(() => {
                        let tooltipNames: string[] = [];
                        let firstHotelName = "";
                        
                        if ((project as any).hotels_data && Array.isArray((project as any).hotels_data) && (project as any).hotels_data.length > 0) {
                          firstHotelName = getHotelName((project as any).hotels_data[0].hotel_id) || (project as any).hotels_data[0].hotel_name || "Bilinmeyen Otel";
                          tooltipNames = (project as any).hotels_data.map((h: any) => {
                            const name = getHotelName(h.hotel_id) || h.hotel_name || "Bilinmeyen Otel";
                            const inDate = h.check_in_date ? formatDate(h.check_in_date) : "";
                            const outDate = h.check_out_date ? formatDate(h.check_out_date) : "";
                            let text = name;
                            if (inDate && outDate) text = `${name} (${inDate} - ${outDate})`;
                            return text.replace(/ /g, "\u00A0").replace(/-/g, "\u2011");
                          });
                        } else if (project.hotel_id) {
                          firstHotelName = getHotelName(project.hotel_id) || "Bilinmeyen Otel";
                          const inDate = project.start_date ? formatDate(project.start_date) : "";
                          const outDate = project.end_date ? formatDate(project.end_date) : "";
                          let text = firstHotelName;
                          if (inDate && outDate) {
                            text = `${firstHotelName} (${inDate} - ${outDate})`;
                          }
                          tooltipNames = [text.replace(/ /g, "\u00A0").replace(/-/g, "\u2011")];
                        }
                        
                        if (tooltipNames.length === 0) return <span>-</span>;
                        
                        const additionalCount = tooltipNames.length - 1;
                        const allHotelsText = tooltipNames.join("\n");
                        
                        return (
                          <div className="flex items-center gap-1 group" title={allHotelsText}>
                            <span className="truncate block max-w-[120px] cursor-help">{firstHotelName}</span>
                            {additionalCount > 0 && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded cursor-help whitespace-nowrap flex-shrink-0">
                                +{additionalCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {project.quote_type ? (
                        project.quote_type.toLowerCase() === "konaklamalı" ? (t('projects.quoteWithAccommodation') || "Konaklamalı") :
                        project.quote_type.toLowerCase() === "konaklamasız" ? (t('projects.quoteWithoutAccommodation') || "Konaklamasız") :
                        project.quote_type.toLowerCase() === "birim" || project.quote_type.toLowerCase() === "bi̇ri̇m" ? (t('projects.quoteUnit') || "BİRİM") :
                        project.quote_type.toLowerCase() === "paket" ? (t('projects.quotePackage') || "PAKET") :
                        project.quote_type
                      ) : "-"}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {project.room_pax ||
                        (project.room_count && project.pax_count
                          ? `${project.room_count} | ${project.pax_count}`
                          : "N/A")}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {(projectUsersMap[project.id]?.length ??
                        project.team_members) ||
                        0}{" "}
                      {t('projects.person') || "kişi"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {project.status === "approved" ? (
                        <button
                          onClick={() => loadApprovalData(project.id)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)} cursor-pointer hover:opacity-80 transition-opacity duration-200`}
                          title={t('projects.viewApprovalDetails') || "Onay detaylarını görüntüle"}
                        >
                          {getStatusText(project.status)}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}
                        >
                          {getStatusText(project.status)}
                        </span>
                      )}
                    </td>
                    {/* Kilit sütunu */}
                    {isSuperAdmin && lockFeatureAvailable && (
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => toggleProjectLock(project)}
                          disabled={!!lockUpdatingId}
                          className={`p-1 rounded border text-xs inline-flex items-center justify-center ${
                            project.locked
                              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200"
                              : "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200"
                          } ${lockUpdatingId ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
                          title={project.locked ? (t('common.unlock') || "Kilidi Aç") : (t('common.lock') || "Kilitle")}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {project.locked ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 11V9a7 7 0 1114 0v2m-2 0V9a5 5 0 10-10 0v2m-1 0h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 11V7a4 4 0 10-8 0v4m2 0V7a2 2 0 114 0v4m3 0h7a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2h7z"
                              />
                            )}
                          </svg>
                        </button>
                      </td>
                    )}
                    <td className="px-2 py-1 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/projects/${project.id}`)
                          }
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                          title={t('common.view') || "Görüntüle"}
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {canDelete(Module.PROJECTS) && !project.locked && (
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                            title={t('common.delete') || "Sil"}
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={isSuperAdmin && lockFeatureAvailable ? 13 : 12}
                      className="px-4 py-8 text-center text-sm text-v3-muted"
                    >
                      {t('projects.noRecordsFound') || "Filtrelere uygun kayıt bulunamadı."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            preferenceKey="projects_page_size"
          />
        </div>
      </div>

      {/* Onay Detayları Modal */}
      {showApprovalModal && (
        <Modal
          isOpen={showApprovalModal}
          onClose={handleCloseApprovalModal}
          title={t('projects.lblApprovalDetails') || "Onay Detayları"}
          maxWidth="max-w-2xl"
        >
          <div className="p-6 text-v3-text">
            {loadingApproval ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner compact />
              </div>
            ) : approvalData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                      {t('home.name') || "Ad"}
                    </label>
                    <div className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl text-sm text-v3-text">
                      {approvalData.name || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                      {t('home.surname') || "Soyad"}
                    </label>
                    <div className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl text-sm text-v3-text">
                      {approvalData.surname || "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    {t('home.email') || "E-posta"}
                  </label>
                  <div className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl text-sm text-v3-text">
                    {approvalData.email || "-"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                      {t('projects.lblApprovalDate') || "Onay Tarihi"}
                    </label>
                    <div className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl text-sm text-v3-text">
                      {approvalData.approved_at
                        ? formatDate(approvalData.approved_at)
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                      {t('projects.lblApprovalTime') || "Onay Saati"}
                    </label>
                    <div className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl text-sm text-v3-text">
                      {approvalData.approved_at
                        ? new Date(approvalData.approved_at).toLocaleTimeString(
                            "tr-TR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            },
                          )
                        : "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-v3-text ml-1 mb-1.5">
                    {t('projects.lblIpAddress') || "IP Adresi"}
                  </label>
                  <div className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border rounded-xl text-sm text-v3-text font-mono">
                    {approvalData.ip_address || "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-v3-muted">
                Onay bilgisi bulunamadı.
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-v3-border flex justify-end">
              <button
                onClick={handleCloseApprovalModal}
                className="px-6 py-2 bg-v3-border border border-v3-border text-v3-text hover:text-v3-text hover:bg-v3-surface rounded-xl text-xs font-semibold transition-all uppercase"
              >
                {t('common.close') || "Kapat"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* MODERN SİLME ONAY MODALI */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() =>
          !deleting && setDeleteModal({ open: false, project: null })
        }
        title={t('projects.lblDeleteProject') || "Projeyi Sil"}
        maxWidth="max-w-md"
      >
        <div className="p-6 text-v3-text">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-light text-v3-text glow-text">
                {t('projects.lblDeleteProject') || "Projeyi Sil"}
              </h3>
              <p className="text-xs text-v3-muted mt-1">
                {t('common.cannotBeUndone') || "Bu işlem geri alınamaz"}
              </p>
            </div>
          </div>

          <div className="bg-v3-surface border border-v3-border rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-v3-text truncate">
              {deleteModal.project?.title}
            </p>
            {deleteModal.project?.company_name && (
              <p className="text-xs text-v3-muted mt-0.5">
                {deleteModal.project.company_name}
              </p>
            )}
          </div>

          <div className="text-sm text-v3-text mb-6 space-y-1">
            <p className="font-semibold text-v3-text">{t('projects.lblDataToBeDeleted') || "Silinecek veriler:"}</p>
            <ul className="list-disc list-inside space-y-1 text-xs mt-2 text-v3-muted">
              <li>Konaklama, etkinlik ve transfer kalemleri</li>
              <li>Satış ve alış kalemleri</li>
              <li>Tahsilat ve ödeme planları</li>
              <li>Fatura kalemleri ve bağlantılı tüm veriler</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-v3-border">
            <button
              onClick={() => setDeleteModal({ open: false, project: null })}
              disabled={deleting}
              className="px-6 py-2 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors uppercase disabled:opacity-50"
            >
              {t('common.cancel') || "Vazgeç"}
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-6 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] uppercase flex items-center gap-2 disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  {t('common.deleting') || "Siliniyor..."}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t('common.yesDelete') || "Evet, Sil"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
