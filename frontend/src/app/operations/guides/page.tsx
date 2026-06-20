'use client';
import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';

import { useState, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { formatNumber, formatDate } from '@/utils/formatters';
import PaginationControls from '@/components/PaginationControls';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DEFAULT_PAGE_SIZE, paginateItems } from '@/types/pagination';
import { usePermissions, Module } from '@/lib/permissions';

interface Guide {
  id: string;
  sejour_id: string;
  voucher_number: string;
  customer_type: 'sejour' | 'mice';
  project_type?: 'project';
  project_id?: string;
  check_in_date: string;
  check_out_date: string;
  guide_name: string;
  service_type: string;
  customer_name?: string;
  company_name?: string;
  hotel_name?: string;
  supplier: string;
  description: string;
  price: number;
  currency: string;
  cost_price: number;
  cost_currency: string;
  fx?: number;
  totalTRY?: number;
  status: 'active' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
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




function MultiTokenFilterInput({
  label,
  tokens,
  inputValue,
  suggestions,
  onInputChange,
  onAddToken,
  onRemoveToken,
  rootClassName = ""
}: MultiTokenFilterInputProps & { rootClassName?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedInput = inputValue.trim().toLowerCase();
  const filteredSuggestions = suggestions
    .filter((item) => {
      const normalizedItem = item.toLowerCase();
      const alreadyAdded = tokens.some((token) => token.toLowerCase() === normalizedItem);
      return !alreadyAdded && normalizedInput.length > 0 && normalizedItem.includes(normalizedInput);
    })
    .slice(0, 6);

  const handleAdd = (raw: string) => {
    onAddToken(raw);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className={`relative min-w-0 ${rootClassName}`}>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5 leading-snug truncate" title={label}>
        {label}
      </label>
      <div className="w-full h-8 px-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 flex items-center gap-0.5 overflow-x-auto">
        {tokens.length > 0 && (
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200"
            title={tokens.join(', ')}
            onClick={() => onRemoveToken(tokens[tokens.length - 1])}
          >
            <span className="text-xs font-medium">+{tokens.length}</span>
            <span className="text-[10px] leading-none">×</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd(inputValue);
            }
            if (e.key === 'Backspace' && inputValue.length === 0 && tokens.length > 0) {
              onRemoveToken(tokens[tokens.length - 1]);
            }
          }}
          className="flex-1 min-w-[1.5rem] h-full bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-xs"
          placeholder="Yaz, Enter"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-0.5 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-32 overflow-y-auto text-xs">
          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="w-full text-left px-2 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => handleAdd(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GuidesPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');



  // Voucher numarasına tıklandığında önizleme aç
  const handleVoucherClick = (sejourId: string, projectType?: string, projectId?: string) => {
    if (projectType === 'project' && projectId) {
      window.open(`/projects/${projectId}`, '_blank');
    } else {
      window.open(`/sejour/${sejourId}`, '_blank');
    }
  };

  // Proje verilerinden kokartlı rehber çekme fonksiyonu
  const buildGuidesFromProjects = async () => {
    const allGuides: Guide[] = [];
    
    try {
      console.log('=== BUILD GUIDES FROM PROJECTS BAŞLADI ===');
      
      const { projectsService, projectHumanResourcesService, categoriesService, agenciesService, hotelsService } = await import('@/lib/supabaseService');
      
      // Tüm projeleri al
      const projects = await projectsService.getAll();
      console.log('Toplam proje sayısı:', projects.length);
      
      const categories = await categoriesService.getAll();
      const agencies = await agenciesService.getAll();
      const hotels = await hotelsService.getAll();
      
      // Kokartlı rehber alt kategorisini bul
      const kokartliRehberCategory = categories.find((cat: any) => 
        cat.parent_id === 'CAT_006' && 
        cat.name.toLowerCase().includes('kokart') && 
        cat.name.toLowerCase().includes('rehber')
      );
      
      console.log('Kokartlı rehber kategorisi:', kokartliRehberCategory);
      
      if (!kokartliRehberCategory) {
        console.log('Kokartlı rehber kategorisi bulunamadı');
        return allGuides;
      }
      
      for (const project of projects) {
        try {
          console.log(`Proje kontrol ediliyor: ${project.id} - ${project.reference || project.id}`);
          
          // Proje HR extras verilerini Supabase'den al
          const hrExtras = await projectHumanResourcesService.getByProjectId(project.id);
          console.log(`Proje ${project.id} HR extras sayısı:`, hrExtras.length);
          
          hrExtras.forEach((hrExtra: any, index: number) => {
            console.log(`HR Extra ${index}:`, {
              subCategoryId: hrExtra.sub_category_id,
              subCategoryName: hrExtra.sub_category?.name,
              description: hrExtra.description
            });
            
            // Sadece kokartlı rehber kategorisindeki hizmetleri al
            if (hrExtra.sub_category_id === kokartliRehberCategory.id || 
                hrExtra.sub_category?.name?.toLowerCase().includes('kokart') && 
                hrExtra.sub_category?.name?.toLowerCase().includes('rehber')) {
              
              console.log(`Kokartlı rehber bulundu! Proje: ${project.id}, HR Extra: ${index}`);
              
              // Proje otel bilgisini al
              const projectHotelId = project.hotel_id;
              const projectHotel = hotels.find((h: any) => h.id === projectHotelId);
              const projectHotelName = projectHotel ? projectHotel.name : '';

              const guide: Guide = {
                id: `project:${project.id}-${hrExtra.id || Date.now()}`,
                sejour_id: `project:${project.id}`,
                voucher_number: project.reference || project.id,
                customer_type: 'mice',
                project_type: 'project',
                project_id: project.id,
                check_in_date: project.start_date || '',
                check_out_date: project.end_date || '',
                guide_name: hrExtra.description || 'Kokartlı Rehber',
                service_type: hrExtra.sub_category?.name || 'Kokartlı Rehber',
                customer_name: agencies.find((a: any) => a.id === project.agency_id)?.name || '',
                company_name: project.company_name || '',
                hotel_name: projectHotelName,
                supplier: hrExtra.supplier?.name || hrExtra.hotel || hrExtra.supplier || '',
                description: hrExtra.description || '',
                price: hrExtra.amount || 0,
                currency: hrExtra.currency || 'TRY',
                cost_price: hrExtra.amount || 0,
                cost_currency: hrExtra.currency || 'TRY',
                fx: hrExtra.exchange_rate || hrExtra.fx || 1,
                totalTRY: hrExtra.total_tl || hrExtra.totalTRY || (hrExtra.amount || 0) * (hrExtra.exchange_rate || hrExtra.fx || 1),
                status: 'active',
                notes: hrExtra.notes || '',
                created_at: project.created_at || new Date().toISOString()
              };
              
              allGuides.push(guide);
              console.log('Proje kokartlı rehber eklendi:', guide.voucher_number);
            }
          });
        } catch (error) {
          console.error(`Proje ${project.id} HR extras verileri yüklenirken hata:`, error);
        }
      }
      
      console.log('=== BUILD GUIDES FROM PROJECTS TAMAMLANDI ===');
      console.log('Toplam proje kokartlı rehber sayısı:', allGuides.length);
    } catch (error) {
      console.error('Proje verilerinden kokartlı rehber çekilirken hata:', error);
    }
    
    return allGuides;
  };

  // Sejour rezervasyonlarından kokartlı rehber çekme fonksiyonu
  const buildGuidesFromSejours = async () => {
    const allGuides: Guide[] = [];
    
    try {
      console.log('=== BUILD GUIDES FROM SEJOURS BAŞLADI ===');
      
      const { SejourService, serviceTypesService, suppliersService, hotelsService } = await import('@/lib/supabaseService');
      
      // Supabase'den tüm sejour'ları çek
      const sejoursAll = await SejourService.getSejours();
      console.log('Supabase\'den sejour verileri yüklendi:', sejoursAll.length, 'adet');
      
      // Sadece KONFİRME olan sejour'ları filtrele
      const sejours = sejoursAll.filter((s: any) => {
        const st = (s.status || '').toString().toLowerCase();
        return st.includes('konf') || st.includes('confirm');
      });
      
      console.log('Toplam sejour sayısı:', sejoursAll.length);
      console.log('Konfirme sejour sayısı:', sejours.length);
      
      const suppliers = await suppliersService.getAll();
      const hotels = await hotelsService.getAll();
      const serviceTypes = await serviceTypesService.getActive();
      
      console.log('Service types yüklendi:', serviceTypes.length, 'adet');
      
      sejours.forEach((sejour: any) => {
        console.log(`Sejour kontrol ediliyor: ${sejour.id} - ${sejour.voucherNumber || sejour.voucher_number || sejour.id}`);
        
        // Sejour extraServices'den kokartlı rehber çek (camelCase formatında)
        const extraServices = sejour.extraServices || sejour.extra_services || [];
        if (Array.isArray(extraServices) && extraServices.length > 0) {
          console.log(`Sejour ${sejour.id} extra services sayısı:`, extraServices.length);
          
          extraServices.forEach((service: any, index: number) => {
            console.log(`Sejour ${sejour.id} service ${index}:`, {
              serviceType: service.serviceType || service.service_type_id,
              serviceTypeId: service.serviceTypeId || service.service_type_id,
              serviceTypeName: service.serviceTypeName,
              description: service.description || service.serviceDescription,
              name: service.serviceName || service.service_name
            });
            
            // Service type ID'sini kontrol et
            const serviceTypeId = service.serviceTypeId || service.serviceType || service.service_type_id;
            console.log(`Service type ID: ${serviceTypeId}`);
            
            // Service type'ı bul
            const serviceType = serviceTypes.find((st: any) => st.id === serviceTypeId);
            
            // Kokartlı rehber kontrolü: service type adında "kokart" ve "rehber" kelimeleri olmalı
            const isKokartliRehber = serviceType && 
              serviceType.name.toLowerCase().includes('kokart') && 
              serviceType.name.toLowerCase().includes('rehber');
            
            if (isKokartliRehber) {
              
              console.log(`Kokartlı rehber bulundu! Sejour: ${sejour.id}, Service: ${index}`);
              
              // Sejour otel bilgisini al
              const rooms = sejour.rooms || sejour.sejour_rooms || [];
              const hotelId = rooms.length > 0 ? (rooms[0].hotelId || rooms[0].hotel_id) : (sejour.hotelId || sejour.hotel_id);
              const hotel = hotels.find((h: any) => h.id === hotelId);
              const hotelName = hotel ? hotel.name : '';

              const guide: Guide = {
                id: `sejour:${sejour.id}-${service.id || Date.now()}`,
                sejour_id: sejour.id,
                voucher_number: sejour.voucherNumber || sejour.voucher_number || sejour.id,
                customer_type: 'sejour',
                project_type: undefined,
                project_id: undefined,
                check_in_date: sejour.checkInDate || sejour.check_in_date || '',
                check_out_date: sejour.checkOutDate || sejour.check_out_date || '',
                guide_name: service.description || service.serviceDescription || 'Kokartlı Rehber',
                service_type: service.serviceTypeName || serviceType?.name || 'Kokartlı Rehber',
                customer_name: sejour.agencyName || sejour.customerName || '',
                company_name: sejour.companyName || sejour.company_name || '',
                hotel_name: hotelName,
                supplier: service.supplierName || service.suppliers?.name || (service.supplierId || service.provider ? (suppliers.find((s: any) => s.id === (service.supplierId || service.provider))?.name || '') : ''),
                description: service.description || service.serviceDescription || '',
                price: service.price || 0,
                currency: service.currency || 'TRY',
                cost_price: service.costPrice || service.cost_price || 0,
                cost_currency: service.costCurrency || service.cost_currency || 'TRY',
                fx: service.fx || 1,
                totalTRY: service.totalTRY || (service.price || 0) * (service.fx || 1),
                status: 'active',
                notes: service.notes || '',
                created_at: sejour.created_at || sejour.createdAt || new Date().toISOString()
              };
              
              allGuides.push(guide);
              console.log('Sejour kokartlı rehber eklendi:', guide.voucher_number);
            }
          });
        }
      });
      
      console.log('=== BUILD GUIDES FROM SEJOURS TAMAMLANDI ===');
      console.log('Toplam sejour kokartlı rehber sayısı:', allGuides.length);
    } catch (error) {
      console.error('Sejour verilerinden kokartlı rehber çekilirken hata:', error);
    }
    
    return allGuides;
  };

  const addToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>
  ) => {
    const parts = value
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTokens((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((item) => item.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setInput('');
  };

  const removeToken = (value: string, setTokens: Dispatch<SetStateAction<string[]>>) => {
    setTokens((prev) => prev.filter((item) => item !== value));
  };

  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [hotelTokens, setHotelTokens] = useState<string[]>([]);
  const [hotelInput, setHotelInput] = useState('');
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState('');
  const [guideTokens, setGuideTokens] = useState<string[]>([]);
  const [guideInput, setGuideInput] = useState('');

  // Transfer sayfası davranışıyla aynı: filtre yalnızca Enter ile token eklenince tetiklenir.
  const voucherTerms = useMemo(() => [...voucherTokens], [voucherTokens]);
  const customerTerms = useMemo(() => [...customerTokens], [customerTokens]);
  const hotelTerms = useMemo(() => [...hotelTokens], [hotelTokens]);
  const supplierTerms = useMemo(() => [...supplierTokens], [supplierTokens]);
  const guideTerms = useMemo(() => [...guideTokens], [guideTokens]);

  const scopedSearchState = useMemo(
    () => JSON.stringify({ voucherTerms, customerTerms, hotelTerms, supplierTerms, guideTerms }),
    [voucherTerms, customerTerms, hotelTerms, supplierTerms, guideTerms]
  );


  const [sortField, setSortField] = useState<keyof Guide>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'mice' | 'sejour'>('all');
  const [typeCounts, setTypeCounts] = useState({ all: 0, mice: 0, sejour: 0 });

  const todayStr = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: todayStr, endDate: '' });
  const [draftStart, setDraftStart] = useState(todayStr);
  const [draftEnd, setDraftEnd] = useState('');
  
  const [filterKey, setFilterKey] = useState<number>(0);
  const [forceReload, setForceReload] = useState<number>(0);

  const loadGuides = async () => {
    try {
      if (!initialFetchDone) setLoading(true);
      else setTableBusy(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        searchTerm: '',
        filter,
        sortField: String(sortField),
        sortDirection,
        startDate: dateRange.startDate || '',
        endDate: dateRange.endDate || '',
        voucherTerms: JSON.stringify(voucherTerms),
        customerTerms: JSON.stringify(customerTerms),
        hotelTerms: JSON.stringify(hotelTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        guideTerms: JSON.stringify(guideTerms)
      });
      const response = await fetch(`/api/operations/guides?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Kokartli rehber verileri alinamadi');
      }
      setGuides(Array.isArray(result.data) ? result.data : []);
      setTotalCount(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
      
      const tc = result.sourceTotals;
      if (tc) {
        setTypeCounts({
          all: Number(result.total || 0),
          mice: Number(tc.mice || 0),
          sejour: Number(tc.sejour || 0)
        });
      }
    } catch (error) {
      console.error('Kokartlı rehber verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setTableBusy(false);
      setInitialFetchDone(true);
    }
  };

  useEffect(() => {
    const handleProjectChange = () => setForceReload((prev) => prev + 1);
    const handleStorage = () => setForceReload((prev) => prev + 1);
    window.addEventListener('projectUpdated', handleProjectChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('projectUpdated', handleProjectChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    loadGuides();
  }, [page, pageSize, scopedSearchState, filter, sortField, sortDirection, dateRange, forceReload]);

  const handleApplyDates = (start?: string, end?: string) => {
    setDateRange({
      startDate: start !== undefined ? start : draftStart,
      endDate: end !== undefined ? end : draftEnd
    });
    setPage(1);
    setForceReload(prev => prev + 1);
  };

  // Filtreleri temizleme fonksiyonu
  const clearGuidesFilters = () => {
    setVoucherTokens([]);
    setVoucherInput('');
    setCustomerTokens([]);
    setCustomerInput('');
    setHotelTokens([]);
    setHotelInput('');
    setSupplierTokens([]);
    setSupplierInput('');
    setGuideTokens([]);
    setGuideInput('');
    setDraftStart('');
    setDraftEnd('');
    setDateRange({ startDate: '', endDate: '' });
    setFilter('all');
    setPage(1);
    setFilterKey(prev => prev + 1);
    setForceReload(prev => prev + 1);
  };

  // Excel export fonksiyonu
  const exportGuidesToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Kokartlı Rehberler');
      sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } } as any;
      
      // Header band
      const top = sheet.addRow([]); 
      top.height = 48; 
      sheet.mergeCells('A1:N1');
      for (let c = 1; c <= 14; c++) { 
        sheet.getRow(1).getCell(c).value=''; 
        sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any; 
      }
      
      // Logos
      let iconLogoBase64: string | undefined; 
      let wordmarkLogoBase64: string | undefined;
      try {
        const { SettingsService } = await import('@/lib/supabaseService');
        const settings = await SettingsService.getSettings();
        const general = settings?.general_settings || {};
        iconLogoBase64 = general?.icon_logo;
        wordmarkLogoBase64 = general?.wordmark_logo;
      } catch {}
      
      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
      
      if (iconLogoBase64) { 
        const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }); 
        sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); 
      }
      if (wordmarkLogoBase64) { 
        const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }); 
        sheet.addImage(markId, { tl: { col: 11.8, row: 0.23 }, ext: { width: inchToPx(2.0), height: inchToPx(0.50) } as any } as any); 
      }

      // Sütun tanımları
      sheet.columns = [
        { header: 'Voucher', key: 'voucher_number', width: 18 },
        { header: 'Tarih', key: 'check_in_date', width: 12 },
        { header: 'Tür', key: 'customer_type', width: 10 },
        { header: 'C-IN / C-OUT', key: 'check_in_out', width: 22 },
        { header: 'Firma Adı', key: 'company_name', width: 25 },
        { header: 'Acente/Müşteri', key: 'customer_name', width: 25 },
        { header: 'Otel', key: 'hotel_name', width: 20 },
        { header: 'Hizmet Türü', key: 'service_type', width: 18 },
        { header: 'Tedarikçi', key: 'supplier', width: 20 },
        { header: 'Rehber Adı', key: 'guide_name', width: 20 },
        { header: 'Maliyet', key: 'cost_price', width: 14 },
        { header: 'Döviz', key: 'currency', width: 8 },
        { header: 'Kur', key: 'fx', width: 10 },
        { header: 'Toplam TL', key: 'totalTRY', width: 14 }
      ];
      
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      sheet.getRow(headerRow.number).height = 18;
      
      // Sayısal sütun biçimi
      sheet.getColumn('cost_price').numFmt = '#,##0.00';
      sheet.getColumn('cost_price').alignment = { horizontal: 'right' } as any;
      sheet.getColumn('fx').numFmt = '#,##0.00';
      sheet.getColumn('fx').alignment = { horizontal: 'right' } as any;
      sheet.getColumn('totalTRY').numFmt = '#,##0.00';
      sheet.getColumn('totalTRY').alignment = { horizontal: 'right' } as any;
      
      headerRow.eachCell((cell) => { 
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any; 
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any; 
      });
      
      const fmtDate = (d?: string) => {
        if (!d) return '';
        try {
          return new Date(d).toLocaleDateString('tr-TR');
        } catch {
          return d;
        }
      };
      
      const formatNumber = (num: number | string | undefined): number => {
        if (!num) return 0;
        const parsed = typeof num === 'string' ? parseFloat(num) : num;
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Veri satırları
      filteredAndSortedGuides.forEach((guide: any) => {
        const costPrice = formatNumber(guide.cost_price);
        const fx = formatNumber(guide.fx) || 1;
        const totalTRY = costPrice * fx;
        
        sheet.addRow({
          voucher_number: guide.voucher_number || '',
          check_in_date: fmtDate(guide.check_in_date),
          customer_type: guide.customer_type === 'mice' ? 'MICE' : 'Sejour',
          check_in_out: guide.check_in_date && guide.check_out_date 
            ? `${fmtDate(guide.check_in_date)} / ${fmtDate(guide.check_out_date)}`
            : guide.check_in_date 
            ? fmtDate(guide.check_in_date)
            : guide.check_out_date
            ? fmtDate(guide.check_out_date)
            : '',
          company_name: guide.company_name || '',
          customer_name: guide.customer_name || '',
          hotel_name: guide.hotel_name || '',
          service_type: guide.service_type || '',
          supplier: guide.supplier || '',
          guide_name: guide.guide_name || '',
          cost_price: costPrice,
          currency: guide.currency || 'TRY',
          fx: fx,
          totalTRY: totalTRY
        });
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob); 
      const link = document.createElement('a');
      link.href = url; 
      link.download = `kokartli_rehberler_${new Date().toISOString().split('T')[0]}.xlsx`; 
      link.click(); 
      window.URL.revokeObjectURL(url);

      setSuccess('Kokartlı rehberler Excel dosyası olarak indirildi!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Excel export hatası:', error);
      setError('Excel dosyası oluşturulurken bir hata oluştu!');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSort = (field: keyof Guide) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const voucherSuggestions = useMemo(
    () => Array.from(new Set(guides.map((g) => (g.voucher_number || '').trim()).filter(Boolean))),
    [guides]
  );
  const customerSuggestions = useMemo(
    () => Array.from(new Set(guides.map((g) => (g.customer_name || '').trim()).filter(Boolean))),
    [guides]
  );
  const hotelSuggestions = useMemo(
    () => Array.from(new Set(guides.map((g) => (g.hotel_name || '').trim()).filter(Boolean))),
    [guides]
  );
  const supplierSuggestions = useMemo(
    () => Array.from(new Set(guides.map((g) => (g.supplier || '').trim()).filter(Boolean))),
    [guides]
  );
  const guideSuggestions = useMemo(
    () => Array.from(new Set(guides.map((g) => (g.guide_name || '').trim()).filter(Boolean))),
    [guides]
  );

  const filteredAndSortedGuides = guides;

  const paginatedGuides = {
    items: guides,
    page,
    pageSize,
    total: totalCount,
    totalPages
  };

  useEffect(() => {
    setPage(1);
  }, [scopedSearchState, dateRange.startDate, dateRange.endDate, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.GUIDES)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <a href="/operations" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Operasyonlara Dön
          </a>
        </div>
      </div>
    );
  }

  if (!initialFetchDone && loading) {
    return <LoadingSpinner message="Kokartlı rehberler yükleniyor..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Kokartlı Rehber Yönetimi</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">MICE ve Sejour rehber operasyonlarını tek ekrandan yönetin</p>
          </div>
          <button
            type="button"
            onClick={exportGuidesToExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-sm text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel İndir
          </button>
        </div>

        {/* Tab Sistemi */}
        <div className="flex gap-1 bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl w-full">
          <button
            onClick={() => { setFilter('all'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Tüm Rehberler ({typeCounts.all})
          </button>
          <button
            onClick={() => { setFilter('mice'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filter === 'mice'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            MICE ({typeCounts.mice})
          </button>
          <button
            onClick={() => { setFilter('sejour'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filter === 'sejour'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Sejour ({typeCounts.sejour})
          </button>
        </div>

        {/* Arama ve Filtreleme */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .guide-filters-grid {
              display: grid !important;
              grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1.2fr) auto !important;
            }
          }
        `}} />
        <div key={filterKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 w-full min-w-0">
          <div className="flex flex-col guide-filters-grid items-end gap-2 w-full min-w-0">
            <div className="w-full min-w-0">
              <ResponsiveDateRangeField
                label="Hizmet Tarihi"
                startValue={dateRange.startDate}
                endValue={dateRange.endDate}
                onStartChange={(v) => setDraftStart(v)}
                onEndChange={(v) => setDraftEnd(v)}
                onApply={handleApplyDates}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Voucher"
                tokens={voucherTokens}
                inputValue={voucherInput}
                suggestions={voucherSuggestions}
                onInputChange={setVoucherInput}
                onAddToken={(value) => addToken(value, setVoucherTokens, setVoucherInput)}
                onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Acente / Müşteri"
                tokens={customerTokens}
                inputValue={customerInput}
                suggestions={customerSuggestions}
                onInputChange={setCustomerInput}
                onAddToken={(value) => addToken(value, setCustomerTokens, setCustomerInput)}
                onRemoveToken={(value) => removeToken(value, setCustomerTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Otel"
                tokens={hotelTokens}
                inputValue={hotelInput}
                suggestions={hotelSuggestions}
                onInputChange={setHotelInput}
                onAddToken={(value) => addToken(value, setHotelTokens, setHotelInput)}
                onRemoveToken={(value) => removeToken(value, setHotelTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Tedarikçi"
                tokens={supplierTokens}
                inputValue={supplierInput}
                suggestions={supplierSuggestions}
                onInputChange={setSupplierInput}
                onAddToken={(value) => addToken(value, setSupplierTokens, setSupplierInput)}
                onRemoveToken={(value) => removeToken(value, setSupplierTokens)}
              />
            </div>
            <div className="w-full min-w-0">
              <MultiTokenFilterInput
                label="Rehber Adı"
                tokens={guideTokens}
                inputValue={guideInput}
                suggestions={guideSuggestions}
                onInputChange={setGuideInput}
                onAddToken={(value) => addToken(value, setGuideTokens, setGuideInput)}
                onRemoveToken={(value) => removeToken(value, setGuideTokens)}
              />
            </div>
            <div className="w-8 shrink-0 flex items-end">
              <div className="w-full">
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-300 mb-1 opacity-0 hidden md:block">Temizle</label>
                <button
                  type="button"
                  onClick={clearGuidesFilters}
                  className="w-8 h-8 inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 shadow-sm"
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

        {/* Kokartlı Rehberler Tablosu */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0 relative ${tableBusy ? 'opacity-80' : ''}`}>
          <div className="overflow-auto w-full flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 transition-colors duration-200">
                <tr>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('voucher_number')}
                  >
                    <div className="flex items-center">
                      Voucher
                      {sortField === 'voucher_number' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('check_in_date')}
                  >
                    <div className="flex items-center">
                      Tarih
                      {sortField === 'check_in_date' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('customer_type')}
                  >
                    <div className="flex items-center">
                      Tür
                      {sortField === 'customer_type' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('check_in_date')}
                  >
                    <div className="flex items-center">
                      C-IN / C-OUT
                      {sortField === 'check_in_date' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center">
                      Firma Adı
                      {sortField === 'company_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('customer_name')}
                  >
                    <div className="flex items-center">
                      Acente/Müşteri
                      {sortField === 'customer_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('hotel_name')}
                  >
                    <div className="flex items-center">
                      Otel
                      {sortField === 'hotel_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('service_type')}
                  >
                    <div className="flex items-center">
                      Hizmet Türü
                      {sortField === 'service_type' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('supplier')}
                  >
                    <div className="flex items-center">
                      Tedarikçi
                      {sortField === 'supplier' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('guide_name')}
                  >
                    <div className="flex items-center">
                      Rehber Adı
                      {sortField === 'guide_name' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('cost_price')}
                  >
                    <div className="flex items-center">
                      Maliyet
                      {sortField === 'cost_price' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('currency')}
                  >
                    <div className="flex items-center">
                      Döviz
                      {sortField === 'currency' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('fx')}
                  >
                    <div className="flex items-center">
                      Kur
                      {sortField === 'fx' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleSort('totalTRY')}
                  >
                    <div className="flex items-center">
                      Toplam TL
                      {sortField === 'totalTRY' && (
                        <svg className={`ml-1 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedGuides.items.map((guide) => (
                  <tr key={guide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      <button
                        onClick={() => handleVoucherClick(guide.sejour_id, guide.project_type, guide.project_id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                      >
                        {guide.voucher_number}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {formatDate(guide.check_in_date)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        guide.customer_type === 'mice' 
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {guide.customer_type === 'mice' ? 'MICE' : 'Sejour'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.check_in_date && guide.check_out_date 
                        ? `${formatDate(guide.check_in_date)} / ${formatDate(guide.check_out_date)}`
                        : guide.check_in_date 
                        ? formatDate(guide.check_in_date)
                        : guide.check_out_date
                        ? formatDate(guide.check_out_date)
                        : '-'
                      }
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.company_name || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.customer_name || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.hotel_name || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.service_type || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.supplier || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.guide_name || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {formatNumber(guide.cost_price || 0)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {guide.currency}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {formatNumber(guide.fx || 1)}
                    </td>
                    <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      {formatNumber((guide.cost_price || 0) * (guide.fx || 1))}
                    </td>
                  </tr>
                ))}
              
                {filteredAndSortedGuides.length === 0 && (
                  <tr>
                    <td colSpan={20} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Filtrelere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          
          <PaginationControls
            page={paginatedGuides.page}
            pageSize={paginatedGuides.pageSize}
            total={paginatedGuides.total}
            totalPages={paginatedGuides.totalPages}
            preferenceKey="operations_guides_page_size"
            compactRight
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>

        {/* Success ve Error Mesajları */}
        {success && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {success}
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
