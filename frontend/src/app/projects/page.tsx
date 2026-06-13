'use client';
import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';

import { useState, useEffect, useRef, useMemo, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import { format as formatDateFns, parse as parseDateFns, isValid as isValidDate, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatNumber, formatDate } from '@/utils/formatters';
import { projectsService, agenciesService, hotelsService, quotesService, quoteItemsService, projectSalesItemsService, projectPurchaseItemsService, publicLinksService, projectUsersService } from '@/lib/supabaseService';
import { ExcelUtils } from '@/utils/excelUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { usePermissions, Module } from '@/lib/permissions';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/types/pagination';
import Modal from '@/components/Modal';
import { toast } from 'react-hot-toast';
import { Trash2, AlertCircle, CheckCircle2, Lock, Unlock } from 'lucide-react';
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

interface MultiTokenFilterInputProps {
  label: string;
  tokens: string[];
  inputValue: string;
  suggestions: string[];
  onInputChange: (value: string) => void;
  onAddToken: (value: string) => void;
  onRemoveToken: (value: string) => void;
}

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply?: (start?: string, end?: string) => void;
}




function MultiTokenFilterInput({
  label,
  tokens,
  inputValue,
  suggestions,
  onInputChange,
  onAddToken,
  onRemoveToken
}: MultiTokenFilterInputProps) {
  const normalizedInput = inputValue.trim().toLowerCase();
  const tooltipText = tokens.length > 0
    ? tokens.map((token, index) => `+${index + 1}: ${token}`).join('\n')
    : '';
  const filteredSuggestions = suggestions
    .filter((item) => {
      const normalizedItem = item.toLowerCase();
      const alreadyAdded = tokens.some(token => token.toLowerCase() === normalizedItem);
      return !alreadyAdded && normalizedInput.length > 0 && normalizedItem.includes(normalizedInput);
    })
    .slice(0, 6);

  return (
    <div className="relative min-w-0">
      <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      <div
        className="w-full h-8 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex items-center gap-1 overflow-x-auto"
        title={tooltipText}
      >
        {tokens.map((token, index) => (
          <span key={`${token}-${index}`} className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200" title={`+${index + 1}: ${token}`}>
            +{index + 1}
            <button type="button" className="text-blue-700 dark:text-blue-200 hover:text-red-500" onClick={() => onRemoveToken(token)} title="Kaldır">×</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddToken(inputValue);
            }
            if (e.key === 'Backspace' && inputValue.length === 0 && tokens.length > 0) {
              onRemoveToken(tokens[tokens.length - 1]);
            }
          }}
          className="flex-1 min-w-[80px] h-full bg-transparent outline-none text-gray-900 dark:text-white"
          placeholder="Yaz, Enter ile ekle"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-36 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onAddToken(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProjectsPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const { canView, canCreate, canEdit, canDelete, userRole, isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [searchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateRange, setDateRange] = useState({ 
    startDate: '', 
    endDate: '' 
  });
  const [draftDateStart, setDraftDateStart] = useState('');
  const [draftDateEnd, setDraftDateEnd] = useState('');
  const [orgDateStart, setOrgDateStart] = useState(todayStr);
  const [orgDateEnd, setOrgDateEnd] = useState('');
  const [appliedOrgDateStart, setAppliedOrgDateStart] = useState(todayStr);
  const [appliedOrgDateEnd, setAppliedOrgDateEnd] = useState('');
  const [draftOrgDateStart, setDraftOrgDateStart] = useState(todayStr);
  const [draftOrgDateEnd, setDraftOrgDateEnd] = useState('');
  const [referenceTokens, setReferenceTokens] = useState<string[]>([]);
  const [referenceInput, setReferenceInput] = useState('');
  const [companyTokens, setCompanyTokens] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [agencyTokens, setAgencyTokens] = useState<string[]>([]);
  const [agencyInput, setAgencyInput] = useState('');
  const [statusTokens, setStatusTokens] = useState<string[]>([]);
  const [statusInput, setStatusInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [projectUsersMap, setProjectUsersMap] = useState<Record<string, string[]>>({});
  const [exporting, setExporting] = useState(false);
  const [lockUpdatingId, setLockUpdatingId] = useState<string | null>(null);
  const [lockFeatureAvailable, setLockFeatureAvailable] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; project: Project | null }>({ open: false, project: null });
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
        sortDirection
      });
      setProjects(response.data);
      if (response.data.length > 0) {
        const hasLockedColumn = Object.prototype.hasOwnProperty.call(response.data[0], 'locked');
        if (!hasLockedColumn) {
          setLockFeatureAvailable(false);
        }
      }
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading projects from Supabase:', error);
      toast.error('Projeler yüklenirken bir hata oluştu.');
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
      console.error('Error loading agencies from Supabase:', error);
      setAgencies([]);
    }
  };

  const loadHotels = async () => {
    try {
      const hotelsData = await hotelsService.getAll();
      setHotels(hotelsData);
    } catch (error) {
      console.error('Error loading hotels from Supabase:', error);
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
      console.error('Error loading project users:', error);
    }
  };


  const getAgencyName = (agencyId?: string) => agencies.find(a => a.id === agencyId)?.name || '';
  const getHotelName = (hotelId?: string) => hotels.find(h => h.id === hotelId)?.name || '';

  // Onay bilgilerini yükle
  const loadApprovalData = async (projectId: string) => {
    try {
      setLoadingApproval(true);
      // Proje için public linkleri getir
      const links = await publicLinksService.getByProjectId(projectId);
      // Onaylanmış linki bul
      const approvedLink = links.find(link => link.approval?.is_approved === true);

      if (approvedLink && approvedLink.approval) {
        setApprovalData(approvedLink.approval);
        setShowApprovalModal(true);
      } else {
        toast.error('Bu proje için onay bilgisi bulunamadı.');
      }
    } catch (error) {
      console.error('Error loading approval data:', error);
      toast.error('Onay bilgileri yüklenirken bir hata oluştu.');
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
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on_hold':
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      case 'on_hold':
      case 'on-hold':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal';
      case 'approved':
        return 'Onaylandı';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  const toggleProjectLock = async (project: Project) => {
    if (!lockFeatureAvailable) return;
    // Şemada locked kolonu yoksa hiç API çağrısı yapma
    if (!Object.prototype.hasOwnProperty.call(project, 'locked')) {
      setLockFeatureAvailable(false);
      toast.error('Projelerde kilit özelliği bu veritabanında aktif değil.');
      return;
    }
    if (!isSuperAdmin) return;
    if (lockUpdatingId) return;
    try {
      setLockUpdatingId(project.id);
      const updated = await projectsService.update(project.id, { locked: !project.locked } as any);
      setProjects(prev =>
        prev.map(p => (p.id === project.id ? { ...p, locked: (updated as any).locked } : p)),
      );
    } catch (error) {
      console.error('Proje kilitleme/kilidi açma hatası:', error);
      if (String((error as any)?.message || '').includes("Could not find the 'locked' column")) {
        setLockFeatureAvailable(false);
        toast.error('Projelerde kilit özelliği aktif değil.');
        return;
      }
      toast.error('Proje kilidi güncellenirken bir hata oluştu.');
    } finally {
      setLockUpdatingId(null);
    }
  };

  // Excel Export Fonksiyonu
  const handleExportExcel = async () => {
    setExporting(true);

    try {
      // Filtrelenmiş projeleri al
      const filteredProjects = projects.filter(project => {
        // Durum filtresi
        if (filter !== 'all') {
          // on-hold ve on_hold durumlarını destekle
          if (filter === 'on-hold' && project.status !== 'on-hold' && project.status !== 'on_hold') {
            return false;
          } else if (filter !== 'on-hold' && project.status !== filter) {
            return false;
          }
        }

        // Tarih filtreleri
        if (dateStart) {
          const projectQuoteDate = (project.created_at || '').slice(0, 10);
          if (projectQuoteDate < dateStart) return false;
        }

        if (dateEnd) {
          const projectQuoteDate = (project.created_at || '').slice(0, 10);
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
            project.priority || '',
            project.reference || '',
            project.company_name || '',
            getAgencyName(project.agency_id),
            getHotelName(project.hotel_id),
            project.quote_type || '',
            project.room_pax || '',
            project.budget?.toString() || ''
          ];
          const searchText = searchFields.join(' ');
          if (!searchText.includes(s)) return false;
        }

        return true;
      });

      // Sıralama uygula
      const sortedProjects = sortProjects(filteredProjects, sortField, sortDirection);

      console.log('Export edilecek proje sayısı:', sortedProjects.length);
      console.log('Uygulanan filtreler:', {
        statusFilter: filter,
        searchTerm,
        quoteDateStart: dateStart,
        quoteDateEnd: dateEnd,
        appliedOrgDateStart,
        appliedOrgDateEnd,
        sortField,
        sortDirection
      });

      // ExcelUtils.exportProjects fonksiyonunu çağır
      await ExcelUtils.exportProjects(sortedProjects, agencies, hotels);
      toast.success(`Excel dosyası başarıyla indirildi! (${sortedProjects.length} proje)`);
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu.');
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
  }, [page, pageSize, filter, appliedOrgDateStart, appliedOrgDateEnd, sortField, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter, appliedOrgDateStart, appliedOrgDateEnd, sortField, sortDirection]);

  const handleDeleteProject = (project: Project) => {
    setDeleteModal({ open: true, project });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.project) return;
    try {
      setDeleting(true);
      await projectsService.delete(deleteModal.project.id);
      setProjects(prev => prev.filter(p => p.id !== deleteModal.project!.id));
      setDeleteModal({ open: false, project: null });
      toast.success('Proje başarıyla silindi');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Proje silinirken bir hata oluştu.');
    } finally {
      setDeleting(false);
    }
  };

  const sortProjects = (items: Project[], field: string, direction: 'asc' | 'desc') => {
    if (!field) return items;
    const sorted = [...items].sort((a, b) => {
      let av: any;
      let bv: any;
      switch (field) {
        case 'created_at':
          av = new Date(a.created_at || '').getTime();
          bv = new Date(b.created_at || '').getTime();
          break;
        case 'title':
          av = a.title || '';
          bv = b.title || '';
          break;
        case 'status':
          av = a.status || '';
          bv = b.status || '';
          break;
        case 'priority':
          av = a.priority || '';
          bv = b.priority || '';
          break;
        case 'date':
          av = new Date(a.start_date || '').getTime();
          bv = new Date(b.start_date || '').getTime();
          break;
        case 'budget':
          av = a.budget || 0;
          bv = b.budget || 0;
          break;
        case 'progress':
          av = a.progress || 0;
          bv = b.progress || 0;
          break;
        case 'team':
          av = a.team_members || 0;
          bv = b.team_members || 0;
          break;
        default:
          return 0;
      }
      if (direction === 'asc') return av > bv ? 1 : av < bv ? -1 : 0;
      return av < bv ? 1 : av > bv ? -1 : 0;
    });
    return sorted;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrelenmiş projeleri kullanarak istatistikleri hesapla
  const totalProjects = totalCount;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const approvedProjects = projects.filter(p => p.status === 'approved').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const onHoldProjects = projects.filter(p => p.status === 'on-hold' || p.status === 'on_hold').length;
  const cancelledProjects = projects.filter(p => p.status === 'cancelled').length;
  const includesByTokens = (value: string, tokens: string[]) => {
    if (tokens.length === 0) return true;
    const normalized = (value || '').toLowerCase();
    return tokens.some(token => normalized.includes(token.toLowerCase()));
  };
  const addToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>
  ) => {
    const normalized = value.trim();
    if (!normalized) return;
    setTokens(prev => {
      if (prev.some(item => item.toLowerCase() === normalized.toLowerCase())) return prev;
      return [...prev, normalized];
    });
    setInput('');
  };
  const removeToken = (value: string, setTokens: Dispatch<SetStateAction<string[]>>) => {
    setTokens(prev => prev.filter(item => item !== value));
  };
  const referenceSuggestions = useMemo(
    () => Array.from(new Set(projects.map(p => (p.reference || '').trim()).filter(Boolean))),
    [projects]
  );
  const companySuggestions = useMemo(
    () => Array.from(new Set(projects.map(p => (p.company_name || '').trim()).filter(Boolean))),
    [projects]
  );
  const agencySuggestions = useMemo(
    () => Array.from(new Set(projects.map(p => (getAgencyName(p.agency_id) || '').trim()).filter(Boolean))),
    [projects, agencies]
  );
  const statusSuggestions = useMemo(
    () => Array.from(new Set(['Aktif', 'Onaylandı', 'Tamamlandı', 'Beklemede', 'İptal', ...projects.map(p => getStatusText(p.status).trim()).filter(Boolean)])),
    [projects]
  );
  const visibleProjects = projects.filter((project) => {
    const agencyName = getAgencyName(project.agency_id);
    const reference = project.reference || '';
    const company = project.company_name || '';
    const status = getStatusText(project.status);
    const quoteDate = (project.created_at || '').slice(0, 10);
    const organizationStartDate = (project.start_date || '').slice(0, 10);
    const organizationEndDate = (project.end_date || '').slice(0, 10);

    if (dateStart && quoteDate && quoteDate < dateStart) return false;
    if (dateEnd && quoteDate && quoteDate > dateEnd) return false;
    if (appliedOrgDateStart && organizationStartDate && organizationStartDate < appliedOrgDateStart) return false;
    if (appliedOrgDateEnd && organizationEndDate && organizationEndDate > appliedOrgDateEnd) return false;

    if (!includesByTokens(reference, referenceTokens)) return false;
    if (!includesByTokens(company, companyTokens)) return false;
    if (!includesByTokens(agencyName, agencyTokens)) return false;
    if (!includesByTokens(status, statusTokens)) return false;
    return true;
  });

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Projects görüntüleme yetkisi kontrolü
  if (!canView(Module.PROJECTS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Projeler sayfasına erişim için yetkiniz bulunmuyor.</p>
          <Link href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Projeler yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0">
      <div className="w-full min-w-0 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Projeler</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Projelerinizi yönetin</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Excel Export Butonu */}
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 text-xs disabled:opacity-60 flex items-center"
              title="Excel'e Aktar"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  İşleniyor...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-nowrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'all' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Toplam Proje</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{totalProjects}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'active' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Aktif</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{activeProjects}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'approved' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-emerald-100 dark:bg-emerald-900/70 rounded-lg">
                <svg className="w-3 h-3 text-emerald-800 dark:text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Onaylandı</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{approvedProjects}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'completed' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-3 h-3 text-purple-600 dark:purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Tamamlandı</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{completedProjects}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('on-hold')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'on-hold' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Beklemede</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{onHoldProjects}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter('cancelled')}
            className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${filter === 'cancelled' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
          >
            <div className="flex items-center">
              <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">İptal</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200">{cancelledProjects}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Bağımsız Arama Alanı */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .projects-filters-grid {
              display: grid !important;
              grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto !important;
            }
          }
        `}} />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 p-3 transition-colors duration-200 w-full min-w-0">
          <div className="flex flex-col projects-filters-grid items-end gap-2 w-full min-w-0">
            <div className="w-full min-w-0">
              <ResponsiveDateRangeField
                label="Teklif Tarihi"
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
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Referans"
                tokens={referenceTokens}
                inputValue={referenceInput}
                suggestions={referenceSuggestions}
                onInputChange={setReferenceInput}
                onAddToken={(value) => addToken(value, setReferenceTokens, setReferenceInput)}
                onRemoveToken={(value) => removeToken(value, setReferenceTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <ResponsiveDateRangeField
                label="Organizasyon Tarihi"
                startValue={draftOrgDateStart}
                endValue={draftOrgDateEnd}
                onStartChange={setDraftOrgDateStart}
                onEndChange={setDraftOrgDateEnd}
                onApply={(s, e) => {
                  setOrgDateStart(s !== undefined ? s : draftOrgDateStart);
                  setOrgDateEnd(e !== undefined ? e : draftOrgDateEnd);
                  setAppliedOrgDateStart(s !== undefined ? s : draftOrgDateStart);
                  setAppliedOrgDateEnd(e !== undefined ? e : draftOrgDateEnd);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Firma Adı"
                tokens={companyTokens}
                inputValue={companyInput}
                suggestions={companySuggestions}
                onInputChange={setCompanyInput}
                onAddToken={(value) => addToken(value, setCompanyTokens, setCompanyInput)}
                onRemoveToken={(value) => removeToken(value, setCompanyTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Acente Adı"
                tokens={agencyTokens}
                inputValue={agencyInput}
                suggestions={agencySuggestions}
                onInputChange={setAgencyInput}
                onAddToken={(value) => addToken(value, setAgencyTokens, setAgencyInput)}
                onRemoveToken={(value) => removeToken(value, setAgencyTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Durum"
                tokens={statusTokens}
                inputValue={statusInput}
                suggestions={statusSuggestions}
                onInputChange={setStatusInput}
                onAddToken={(value) => addToken(value, setStatusTokens, setStatusInput)}
                onRemoveToken={(value) => removeToken(value, setStatusTokens)}
              />
            </div>
            <div className="w-8 shrink-0 flex items-end">
              <div className="w-full">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1 opacity-0 hidden md:block">Temizle</label>
                <button
                  onClick={() => {
                    setFilter('all');
                    setDraftDateStart('');
                    setDraftDateEnd('');
                    setDateStart('');
                    setDateEnd('');
                    setOrgDateStart('');
                    setOrgDateEnd('');
                    setAppliedOrgDateStart('');
                    setAppliedOrgDateEnd('');
                    setDraftOrgDateStart('');
                    setDraftOrgDateEnd('');
                    setReferenceTokens([]);
                    setReferenceInput('');
                    setCompanyTokens([]);
                    setCompanyInput('');
                    setAgencyTokens([]);
                    setAgencyInput('');
                    setStatusTokens([]);
                    setStatusInput('');
                    setFilter('all');
                    setPage(1);
                  }}
                  className="w-8 h-8 inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                  title="Filtreleri Temizle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center leading-tight"><span>Teklif<br />Tarihi</span>{sortField === 'created_at' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center">Referans{sortField === 'reference' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('start_date')}
                  >
                    <div className="flex items-center leading-tight"><span>C-IN C-OUT<br />Tarihi</span>{sortField === 'start_date' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center">Firma Adı{sortField === 'company_name' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('agency_id')}
                  >
                    <div className="flex items-center">Acente{sortField === 'agency_id' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('hotel_id')}
                  >
                    <div className="flex items-center">Otel{sortField === 'hotel_id' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('quote_type')}
                  >
                    <div className="flex items-center leading-tight"><span>Teklif<br />Türü</span>{sortField === 'quote_type' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('room_pax')}
                  >
                    <div className="flex items-center leading-tight"><span>ODA |<br />PAX</span>{sortField === 'room_pax' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('team_members')}
                  >
                    <div className="flex items-center">Ekip{sortField === 'team_members' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">Durum{sortField === 'status' && (
                      <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}</div>
                  </th>
                  {/* Kilit durumu (sadece süper admin için) */}
                  {isSuperAdmin && lockFeatureAvailable && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kilit
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {visibleProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">{formatDate(project.confirmed_at || project.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200">{project.reference || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{formatDate(project.start_date)} - {formatDate(project.end_date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{project.company_name || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{getAgencyName(project.agency_id)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{getHotelName(project.hotel_id)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{project.quote_type || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{project.room_pax || (project.room_count && project.pax_count ? `${project.room_count} | ${project.pax_count}` : 'N/A')}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white transition-colors duration-200">{(projectUsersMap[project.id]?.length ?? project.team_members) || 0} kişi</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {project.status === 'approved' ? (
                        <button
                          onClick={() => loadApprovalData(project.id)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)} cursor-pointer hover:opacity-80 transition-opacity duration-200`}
                          title="Onay detaylarını görüntüle"
                        >
                          {getStatusText(project.status)}
                        </button>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>{getStatusText(project.status)}</span>
                      )}
                    </td>
                    {/* Kilit sütunu */}
                    {isSuperAdmin && lockFeatureAvailable && (
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => toggleProjectLock(project)}
                          disabled={!!lockUpdatingId}
                        className={`p-1 rounded border text-xs inline-flex items-center justify-center ${project.locked
                              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200'
                              : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200'
                            } ${lockUpdatingId ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                          title={project.locked ? 'Kilidi Aç' : 'Kilitle'}
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
                          onClick={() => window.location.href = `/projects/${project.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200"
                          title="Görüntüle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {canDelete(Module.PROJECTS) && !project.locked && (
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleProjects.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin && lockFeatureAvailable ? 13 : 12} className="px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                      Filtrelere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalCount > 0 && (
            <div className="flex justify-end px-2 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <span className="text-sm">Toplam {totalCount} proje</span>
                <button className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                <span className="text-sm font-medium">{page}</span>
                <button className="h-8 w-8 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
                <select
                  value={pageSize}
                  className="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-sm"
                  onChange={(e) => {
                    const size = Number(e.target.value) || DEFAULT_PAGE_SIZE;
                    setPageSize(size);
                    setPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size} / sayfa</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onay Detayları Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseApprovalModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Onay Detayları</h2>
              <button
                onClick={handleCloseApprovalModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingApproval ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner compact />
              </div>
            ) : approvalData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad</label>
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white">
                      {approvalData.name || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Soyad</label>
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white">
                      {approvalData.surname || '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta</label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white">
                    {approvalData.email || '-'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Onay Tarihi</label>
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white">
                      {approvalData.approved_at ? formatDate(approvalData.approved_at) : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Onay Saati</label>
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white">
                      {approvalData.approved_at ? new Date(approvalData.approved_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Adresi</label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white font-mono">
                    {approvalData.ip_address || '-'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Onay bilgisi bulunamadı.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseApprovalModal}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODERN SİLME ONAY MODALI */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleting && setDeleteModal({ open: false, project: null })}
        title="Projeyi Sil"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Projeyi Sil</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Bu işlem geri alınamaz</p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {deleteModal.project?.title}
            </p>
            {deleteModal.project?.company_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{deleteModal.project.company_name}</p>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
            <p className="font-medium text-gray-800 dark:text-gray-200">Silinecek veriler:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Konaklama, etkinlik ve transfer kalemleri</li>
              <li>Satış ve alış kalemleri</li>
              <li>Tahsilat ve ödeme planları</li>
              <li>Fatura kalemleri ve bağlantılı tüm veriler</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteModal({ open: false, project: null })}
              disabled={deleting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Evet, Sil
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
);
} 