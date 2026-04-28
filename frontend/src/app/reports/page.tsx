'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/api';
import DatePicker from 'react-datepicker';
import { tr } from 'date-fns/locale';
import { formatDate, formatInteger, formatNumber } from '@/utils/formatters';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { usePermissions, Module } from '@/lib/permissions';
import LoadingSpinner from '@/components/LoadingSpinner';

type DatePreset = 'bu_hafta' | 'bu_ay' | 'bu_yil' | 'ozel';
type DataRow = Record<string, string | number | null>;

type ReportDef = {
  id: string;
  title: string;
  description: string;
  dateField: string;
};

type ReportGroup = {
  id: string;
  title: string;
  reports: ReportDef[];
};

const REPORT_GROUPS: ReportGroup[] = [
  {
    id: 'teklif',
    title: 'Teklif Raporları',
    reports: [
      {
        id: 'opsiyon_takip',
        title: 'Opsiyon Takip Raporu',
        description: '',
        dateField: 'opsiyon_tarihi'
      },
      {
        id: 'otel_detay_teklif',
        title: 'Otel Detaylı Teklif Raporu',
        description: '',
        dateField: 'cin_tarihi'
      }
    ]
  },
  {
    id: 'proje_kar',
    title: 'Proje Karlılık Raporları',
    reports: [
      {
        id: 'otel_detay_proje_maliyet',
        title: 'Otel Detaylı Proje Maliyet Raporu',
        description: 'Proje konaklama (CAT_001/CAT_002) satış satırları; birim satış ve eşleşen alış birim maliyeti.',
        dateField: 'organizasyon_tarihi'
      },
      { id: 'acente_kar_zarar', title: 'Acente Bazlı Kar/Zarar', description: 'Acente bazında satış, maliyet, kar/zarar ve yüzde', dateField: 'organizasyon_tarihi' },
      { id: 'otel_kar_zarar', title: 'Otel Bazlı Kar/Zarar', description: 'Otel bazında satış, maliyet, kar/zarar ve yüzde', dateField: 'organizasyon_tarihi' },
      { id: 'kar_zarar_detay', title: 'Kar/Zarar Raporu', description: 'Proje bazında satış, maliyet, kar/zarar ve marj', dateField: 'organizasyon_tarihi' },
      { id: 'acente_marj', title: 'Kar Marjına Göre Acente Raporu', description: 'Acenteleri kar marjına göre sıralar', dateField: 'organizasyon_tarihi' },
      { id: 'otel_marj', title: 'Kar Marjına Göre Otel Raporu', description: 'Otelleri kar marjına göre sıralar', dateField: 'organizasyon_tarihi' },
      { id: 'yillik_kar_zarar_tl', title: 'Yıllık Kar/Zarar (Aylık Yatay - TL)', description: 'Sadece TL bazında aylık kar/zarar ve toplam', dateField: 'yil' }
    ]
  },
  {
    id: 'sejour',
    title: 'Sejour Raporları',
    reports: [
      { id: 'sejour_kar_zarar', title: 'Sejour Kar/Zarar Raporu', description: 'Voucher bazında satış, maliyet, kar/zarar ve marj', dateField: 'giris_tarihi' },
      { id: 'sejour_acente', title: 'Acente Bazlı Sejour Raporu', description: 'Acenteye göre sejour satış, maliyet, kar/zarar', dateField: 'giris_tarihi' },
      { id: 'sejour_otel', title: 'Otel Bazlı Sejour Raporu', description: 'Otele göre sejour satış, maliyet, kar/zarar', dateField: 'giris_tarihi' }
    ]
  }
];

const OPSIYON_DURUMU_FILTER_OPTIONS = ['1. OPSİYON', '2. OPSİYON', 'SOR-SAT'];
const GROUP_CARD_STYLES: Record<string, string> = {
  teklif: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-800/50',
  proje_kar: 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50',
  sejour: 'bg-violet-50/60 dark:bg-violet-950/20 border-violet-200/70 dark:border-violet-800/50'
};
const COLUMN_LABELS: Record<string, string> = {
  teklif_no: 'TEKLIF NO',
  cin_tarihi: 'C/IN TARIHI',
  cout_tarihi: 'C/OUT TARIHI',
  firma_adi: 'FIRMA ADI',
  acente: 'ACENTE',
  otel: 'OTEL',
  opsiyon_tarihi: 'OPSIYON TARIHI',
  opsiyon_durumu: 'OPSIYON DURUMU',
  otel_durumu: 'OTEL DURUMU',
  kalan_gun: 'KALAN GUN',
  toplam_tutar: 'TOPLAM TUTAR',
  opsiyon_tutari: 'TOPLAM TUTAR',
  doviz_birimi: 'DOVIZ BIRIMI'
  ,
  birim_satis: 'BIRIM SATIS',
  birim_maliyet: 'BIRIM MALIYET',
  adet: 'ADET',
  sefer: 'SEFER',
  para_birimi: 'PARA BIRIMI',
  satir_toplami: 'SATIR TOPLAMI',
  kalem_otel: 'KALEM OTELI',
  teklif_durumu: 'TEKLIF DURUMU'
  ,
  alt_kategori: 'ALT KATEGORI',
  proje_referans: 'PROJE REFERANS',
  referans_no: 'REFERANS NO',
  organizasyon_tarihi: 'ORGANIZASYON TARIHI',
  cikis_tarihi: 'CIKIS TARIHI',
  firma: 'FIRMA',
  durum: 'DURUM',
  satis_tl: 'SATIS (TL)',
  maliyet_tl: 'MALIYET (TL)',
  kar_zarar_tl: 'KAR/ZARAR (TL)',
  kar_marj_yuzde: 'KAR MARJI %',
  proje_sayisi: 'PROJE SAYISI',
  voucher_no: 'VOUCHER NO',
  voucher_sayisi: 'VOUCHER SAYISI',
  proje_sayisi: 'PROJE SAYISI',
  yil: 'YIL',
  toplam_tl: 'TOPLAM (TL)',
  ocak: 'OCAK',
  subat: 'SUBAT',
  mart: 'MART',
  nisan: 'NISAN',
  mayis: 'MAYIS',
  haziran: 'HAZIRAN',
  temmuz: 'TEMMUZ',
  agustos: 'AGUSTOS',
  eylul: 'EYLUL',
  ekim: 'EKIM',
  kasim: 'KASIM',
  aralik: 'ARALIK'
};

const statusBadgeClass = (value: unknown) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized.includes('KONF')) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (normalized.includes('IPT') || normalized.includes('İPT')) return 'bg-red-500/20 text-red-300 border-red-500/30';
  return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
};
const formatCell = (value: unknown, columnKey?: string) => {
  if (value === null || value === undefined || value === '') return '-';
  if (columnKey === 'kar_marj_yuzde') {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return `%${formatNumber(n)}`;
  }
  if (columnKey === 'kalan_gun') {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return formatInteger(n);
  }
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);
  return String(value);
};

const toLocalInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseSearchTerms = (value: string) =>
  value
    .split(/[+\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const applyClientSearchTerms = (rows: DataRow[], value: string) => {
  const terms = parseSearchTerms(value).map((term) => term.toLocaleLowerCase('tr-TR'));
  if (!terms.length) return rows;
  return rows.filter((row) => {
    const haystack = Object.values(row).join(' ').toLocaleLowerCase('tr-TR');
    return terms.every((term) => haystack.includes(term));
  });
};

const parseIsoDate = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function ReportsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [activeReportId, setActiveReportId] = useState(REPORT_GROUPS[0].reports[0].id);
  const [datePreset, setDatePreset] = useState<DatePreset>('bu_ay');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [opsiyonDurumuFilter, setOpsiyonDurumuFilter] = useState('tum');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearchInput, setAppliedSearchInput] = useState('');
  const [otelFilterInput, setOtelFilterInput] = useState('');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [pickerRange, setPickerRange] = useState<[Date | null, Date | null]>([null, null]);
  const [rangeCalendarPos, setRangeCalendarPos] = useState({ top: 0, left: 0 });
  const [reportHotels, setReportHotels] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [rows, setRows] = useState<DataRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dateRangeRef = useRef<HTMLDivElement | null>(null);
  const dateRangeCalendarRef = useRef<HTMLDivElement | null>(null);



  const activeReport = useMemo(() => {
    const all = REPORT_GROUPS.flatMap((g) => g.reports);
    return all.find((r) => r.id === activeReportId) || all[0];
  }, [activeReportId]);

  const columns = useMemo(() => {
    if (activeReport.id === 'opsiyon_takip') {
      return [
        'teklif_no',
        'cin_tarihi',
        'cout_tarihi',
        'firma_adi',
        'acente',
        'otel',
        'opsiyon_tarihi',
        'opsiyon_durumu',
        'otel_durumu',
        'kalan_gun',
        'toplam_tutar',
        'doviz_birimi'
      ];
    }
    if (activeReport.id === 'otel_detay_teklif') {
      return [
        'teklif_no',
        'cin_tarihi',
        'cout_tarihi',
        'firma_adi',
        'acente',
        'otel',
        'alt_kategori',
        'adet',
        'sefer',
        'birim_satis',
        'para_birimi',
        'teklif_durumu'
      ];
    }
    if (activeReport.id === 'otel_detay_proje_maliyet') {
      return [
        'proje_referans',
        'organizasyon_tarihi',
        'cikis_tarihi',
        'firma_adi',
        'acente',
        'otel',
        'alt_kategori',
        'adet',
        'sefer',
        'birim_satis',
        'birim_maliyet',
        'para_birimi'
      ];
    }
    if (activeReport.id === 'acente_kar_zarar' || activeReport.id === 'acente_marj') {
      return ['acente', 'proje_sayisi', 'satis_tl', 'maliyet_tl', 'kar_zarar_tl', 'kar_marj_yuzde'];
    }
    if (activeReport.id === 'otel_kar_zarar' || activeReport.id === 'otel_marj') {
      return ['otel', 'proje_sayisi', 'satis_tl', 'maliyet_tl', 'kar_zarar_tl', 'kar_marj_yuzde'];
    }
    if (activeReport.id === 'kar_zarar_detay') {
      return [
        'referans_no',
        'organizasyon_tarihi',
        'cikis_tarihi',
        'firma',
        'acente',
        'otel',
        'durum',
        'satis_tl',
        'maliyet_tl',
        'kar_zarar_tl',
        'kar_marj_yuzde'
      ];
    }
    return rows[0] ? Object.keys(rows[0]).filter((k) => k !== 'project_id') : [];
  }, [rows, activeReport.id]);
  useEffect(() => {
    setCurrentPage(1);
  }, [activeReport.id, appliedSearchInput, opsiyonDurumuFilter, otelFilterInput, startDate, endDate, sortKey, sortDirection, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'ozel') return;
    const now = new Date();
    if (preset === 'bu_yil') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(`${now.getFullYear()}-12-31`);
      return;
    }
    if (preset === 'bu_ay') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toLocalInputDate(first));
      setEndDate(toLocalInputDate(last));
      return;
    }
    const day = now.getDay() || 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7);
    setStartDate(toLocalInputDate(monday));
    setEndDate(toLocalInputDate(sunday));
  };

  useEffect(() => {
    // Varsayılan "Bu Ay" seçimi için tarihleri ilk yüklemede otomatik doldur.
    applyPreset('bu_ay');
  }, []);

  useEffect(() => {
    if (!isDateRangeOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dateRangeRef.current?.contains(target)) return;
      if (dateRangeCalendarRef.current?.contains(target)) return;
      setIsDateRangeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateRangeOpen]);

  useLayoutEffect(() => {
    if (!isDateRangeOpen) return;
    const updatePos = () => {
      const rect = dateRangeRef.current?.getBoundingClientRect();
      if (!rect) return;
      setRangeCalendarPos({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 680))
      });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isDateRangeOpen]);

  useEffect(() => {
    if (!isDateRangeOpen) return;
    setPickerRange([parseIsoDate(startDate), parseIsoDate(endDate)]);
  }, [isDateRangeOpen, startDate, endDate]);

  useEffect(() => {
    const loadReportHotels = async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('name')
        .order('name', { ascending: true })
        .limit(10000);
      if (error) return;
      const hotelNames = [...new Set((data || []).map((h: any) => String(h?.name || '').trim()).filter(Boolean))] as string[];
      setReportHotels(hotelNames);
    };
    loadReportHotels();
  }, []);

  const handleSort = (column: string) => {
    if (sortKey === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(column);
    setSortDirection('asc');
  };

  const fetchReport = async (params?: { searchValue?: string; pageOverride?: number }) => {
    setLoading(true);
    setError('');
    try {
      const effectiveSearch = (params?.searchValue ?? appliedSearchInput).trim();
      const searchTerms = parseSearchTerms(effectiveSearch);
      const hasMultiSearch = searchTerms.length > 1;
      const effectivePage = params?.pageOverride ?? currentPage;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("Yetkilendirme token'ı gerekli. Lütfen tekrar giriş yapın.");
      }
      const query = new URLSearchParams();
      query.set('reportId', activeReport.id);
      query.set('page', String(hasMultiSearch ? 1 : effectivePage));
      query.set('pageSize', String(hasMultiSearch ? 1000 : pageSize));
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);
      if (!hasMultiSearch && searchTerms.length > 0) query.set('searchTerm', searchTerms.join(' '));
      if (otelFilterInput.trim()) query.set('otelFilter', otelFilterInput.trim());
      if (opsiyonDurumuFilter) query.set('opsiyonDurumu', opsiyonDurumuFilter);
      if (sortKey) query.set('sortKey', sortKey);
      if (sortDirection) query.set('sortDirection', sortDirection);

      const json = await apiRequest<{ success?: boolean; message?: string; data?: DataRow[]; total?: number; totalPages?: number }>(
        `/api/reports/data?${query.toString()}`,
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!json?.success) {
        throw new Error(json?.message || 'Rapor verisi alınamadı');
      }
      const serverRows = (json.data || []) as DataRow[];
      const filteredRows = applyClientSearchTerms(serverRows, effectiveSearch);
      setRows(filteredRows);
      if (hasMultiSearch) {
        setTotalCount(filteredRows.length);
        setTotalPages(1);
      } else {
        setTotalCount(Number(json.total || 0));
        setTotalPages(Number(json.totalPages || 1));
      }
    } catch (e: any) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      setError(e?.message || 'Rapor verisi hazırlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    const nextSearch = searchInput.trim();
    setAppliedSearchInput(nextSearch);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport.id, currentPage, pageSize, startDate, endDate, appliedSearchInput, otelFilterInput, opsiyonDurumuFilter, sortKey, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Reports görüntüleme yetkisi kontrolü
  if (!canView(Module.REPORTS)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Yetki Gerekli</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Raporlar sayfasına erişim için yetkiniz bulunmuyor.</p>
          <a href="/" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 transition-colors duration-200 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 w-full min-w-0">
      <div className="max-w-[1600px] mx-auto space-y-3 text-sm flex-1 flex flex-col min-h-0 w-full">
        <div
          className="rounded-2xl border p-4 shadow-sm transition-colors duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Rapor Merkezi</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {REPORT_GROUPS.map((group) => (
            <div
              key={group.id}
              className={`rounded-2xl border p-3 transition-colors duration-200 ${GROUP_CARD_STYLES[group.id] || 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}
            >
              <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">{group.title}</h2>
              <div className="flex flex-wrap gap-2">
                {group.reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => {
                      setActiveReportId(report.id);
                      setRows([]);
                      setError('');
                      setOpsiyonDurumuFilter('tum');
                      setSearchInput('');
                      setAppliedSearchInput('');
                      setOtelFilterInput('');
                      setCurrentPage(1);
                      setSortKey('');
                      setSortDirection('asc');
                    }}
                    style={
                      activeReportId === report.id
                        ? {
                            backgroundColor: 'var(--color-primary, #2563eb)',
                            borderColor: 'var(--color-primary, #2563eb)'
                          }
                        : {}
                    }
                    className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                      activeReportId === report.id
                        ? 'text-white shadow'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {report.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl border p-3 shadow-sm transition-colors duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0 gap-3"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{activeReport.title}</h3>
            {activeReport.description ? (
              <p className="text-xs text-gray-600 dark:text-gray-300">{activeReport.description}</p>
            ) : null}
            </div>

            <div
              className="w-full rounded-2xl border p-2 transition-colors duration-200 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <div className="flex w-full flex-nowrap items-end gap-2">
                <label className="text-xs text-gray-600 dark:text-gray-300 min-w-0 flex-1">
                  Arama
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applySearch();
                      }
                    }}
                    placeholder="Teklif no, firma... (+acente +otel) Enter"
                    className="mt-1 w-full rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </label>
                {(activeReport.id === 'otel_detay_teklif' ||
                  activeReport.id === 'otel_detay_proje_maliyet' ||
                  activeReport.id === 'otel_kar_zarar' ||
                  activeReport.id === 'otel_marj') && (
                  <label className="text-xs text-gray-600 dark:text-gray-300 w-[170px] shrink-0">
                    Otel
                    <input
                      list="report-hotels-list"
                      value={otelFilterInput}
                      onChange={(e) => setOtelFilterInput(e.target.value)}
                      placeholder="Tüm oteller (ara/seç)"
                      className="mt-1 w-full rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <datalist id="report-hotels-list">
                      {reportHotels.map((hotelName) => (
                        <option key={hotelName} value={hotelName} />
                      ))}
                    </datalist>
                  </label>
                )}
                {activeReport.id === 'opsiyon_takip' && (
                  <label className="text-xs text-gray-600 dark:text-gray-300 w-[150px] shrink-0">
                    Opsiyon Durumu
                    <select
                      value={opsiyonDurumuFilter}
                      onChange={(e) => setOpsiyonDurumuFilter(e.target.value)}
                      className="mt-1 w-full rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="tum">Tümü</option>
                      {OPSIYON_DURUMU_FILTER_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <span className="text-xs font-semibold uppercase tracking-wide mr-1 mb-2 text-gray-600 dark:text-gray-300 shrink-0">Dönem</span>
                <div
                  className="inline-flex shrink-0 rounded-xl border p-1 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <button
                    onClick={() => applyPreset('bu_ay')}
                    style={
                      datePreset === 'bu_ay'
                        ? { backgroundColor: 'var(--color-primary, #2563eb)' }
                        : {}
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${datePreset === 'bu_ay' ? 'text-white shadow' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Bu Ay
                  </button>
                  <button
                    onClick={() => applyPreset('bu_yil')}
                    style={
                      datePreset === 'bu_yil'
                        ? { backgroundColor: 'var(--color-primary, #2563eb)' }
                        : {}
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${datePreset === 'bu_yil' ? 'text-white shadow' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Bu Yıl
                  </button>
                  <button
                    onClick={() => applyPreset('ozel')}
                    style={
                      datePreset === 'ozel'
                        ? { backgroundColor: 'var(--color-primary, #2563eb)' }
                        : {}
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${datePreset === 'ozel' ? 'text-white shadow' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    Özel
                  </button>
                </div>

                {datePreset !== 'ozel' ? (
                  <>
                    <label className="text-xs text-gray-600 dark:text-gray-300 shrink-0">
                      Başlangıç
                      <input
                        type="date"
                        value={startDate}
                        readOnly
                        className="mt-1 w-[132px] rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      />
                    </label>
                    <label className="text-xs text-gray-600 dark:text-gray-300 shrink-0">
                      Bitiş
                      <input
                        type="date"
                        value={endDate}
                        readOnly
                        className="mt-1 w-[132px] rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      />
                    </label>
                  </>
                ) : (
                  <div className="relative shrink-0" ref={dateRangeRef}>
                    <div className="flex items-end gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-300 shrink-0">
                        Başlangıç
                        <input
                          type="text"
                          readOnly
                          value={startDate ? formatDate(startDate) : ''}
                          placeholder="Tarih seçin"
                          onClick={() => setIsDateRangeOpen(true)}
                          className="mt-1 h-[42px] w-[132px] rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer"
                        />
                      </label>
                      <label className="text-xs text-gray-600 dark:text-gray-300 shrink-0">
                        Bitiş
                        <input
                          type="text"
                          readOnly
                          value={endDate ? formatDate(endDate) : ''}
                          placeholder="Tarih seçin"
                          onClick={() => setIsDateRangeOpen(true)}
                          className="mt-1 h-[42px] w-[132px] rounded-xl border px-2 py-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer"
                        />
                      </label>
                    </div>
                    {isDateRangeOpen &&
                      typeof document !== 'undefined' &&
                      createPortal(
                        <div
                          ref={dateRangeCalendarRef}
                          className="transfer-range-datepicker-popover fixed z-[300] rounded-xl border p-2 shadow-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                          style={{ top: `${rangeCalendarPos.top}px`, left: `${rangeCalendarPos.left}px` }}
                        >
                          <DatePicker
                            inline
                            locale={tr}
                            monthsShown={2}
                            selectsRange
                            startDate={pickerRange[0]}
                            endDate={pickerRange[1]}
                            onChange={(dates) => {
                              const [a, b] = dates as [Date | null, Date | null];
                              setPickerRange([a, b]);
                              if (a && b) {
                                const t0 = a.getTime();
                                const t1 = b.getTime();
                                const rangeStart = t0 <= t1 ? a : b;
                                const rangeEnd = t0 <= t1 ? b : a;
                                setStartDate(toLocalInputDate(rangeStart));
                                setEndDate(toLocalInputDate(rangeEnd));
                                setIsDateRangeOpen(false);
                              }
                            }}
                            openToDate={pickerRange[0] || pickerRange[1] || new Date()}
                            calendarClassName="!text-xs"
                          />
                        </div>,
                        document.body
                      )}
                  </div>
                )}

                <button
                  onClick={applySearch}
                  className="text-xs px-3 py-2 rounded-xl text-white shadow h-[40px] shrink-0"
                  style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}
                >
                  Raporu Getir
                </button>
                <button
                  onClick={() => {
                    setDatePreset('bu_ay');
                    setStartDate('');
                    setEndDate('');
                    setSearchInput('');
                    setAppliedSearchInput('');
                    setOtelFilterInput('');
                    setIsDateRangeOpen(false);
                    setCurrentPage(1);
                    setRows([]);
                    setError('');
                    applyPreset('bu_ay');
                  }}
                  className="text-xs px-3 py-2 rounded-xl border h-[40px] shrink-0 transition-colors duration-200 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Temizle
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border transition-colors duration-200 border-gray-200 dark:border-gray-700 flex-1 min-h-0 w-full relative">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c}
                      onClick={() => handleSort(c)}
                      className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                      {COLUMN_LABELS[c] || c.replace(/_/g, ' ').toUpperCase()}
                      {sortKey === c ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y bg-white dark:bg-gray-900 divide-gray-200 dark:divide-gray-700">
                {loading && (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-3 py-6 text-center text-xs text-gray-600 dark:text-gray-300">
                      Rapor hazırlanıyor...
                    </td>
                  </tr>
                )}
                {!loading && !!error && (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-3 py-6 text-center text-xs text-red-300">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {columns.map((c) => (
                        <td key={`${i}-${c}`} className="px-3 py-2 text-xs whitespace-pre-line text-gray-800 dark:text-gray-100">
                          {c.includes('durum') || c.includes('status') ? (
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClass(r[c])}`}>{formatCell(r[c], c)}</span>
                          ) : (
                            formatCell(
                              c === 'toplam_tutar'
                                ? (r[c] ?? r.opsiyon_tutari)
                                : c === 'doviz_birimi'
                                ? (r[c] ?? '-')
                                : r[c],
                              c
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                      Bu dönem veya arama kriterlerine uygun kayıt bulunamadı. Tarih aralığını veya filtreleri genişletmeyi deneyin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && !error && (
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 px-1">
              <span>
                Toplam {totalCount} kayıt - Sayfa {currentPage}/{totalPages}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs whitespace-nowrap">Sayfa Boyutu</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 w-[88px] rounded-lg border px-2 transition-colors duration-200 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    {[20, 50, 100, 200, 1000].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
