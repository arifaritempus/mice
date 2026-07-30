"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getLogosForExcel } from "@/utils/logoUtils";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/api";
import DatePicker from "react-datepicker";
import { tr } from "date-fns/locale";
import { formatDate, formatInteger, formatNumber } from "@/utils/formatters";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { usePermissions, Module } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import { useLanguage } from "@/components/providers/LanguageProvider";

type DatePreset = "bu_hafta" | "bu_ay" | "bu_yil" | "ozel";
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
    id: "teklif",
    title: "Teklif Raporları",
    reports: [
      {
        id: "opsiyon_takip",
        title: "Opsiyon Takip Raporu",
        description: "",
        dateField: "opsiyon_tarihi",
      },
      {
        id: "otel_detay_teklif",
        title: "Otel Detaylı Teklif Raporu",
        description: "",
        dateField: "cin_tarihi",
      },
      {
        id: "otel_detay_talep",
        title: "Otel Detaylı Talep Raporu",
        description: "Otellerden gelen fiyat yanıtları",
        dateField: "olusturulma_tarihi",
      },
    ],
  },
  {
    id: "proje_kar",
    title: "Proje Karlılık Raporları",
    reports: [
      {
        id: "otel_detay_proje_maliyet",
        title: "Otel Detaylı Proje Maliyet Raporu",
        description:
          "Proje konaklama (CAT_001/CAT_002) satış satırları; birim satış ve eşleşen alış birim maliyeti.",
        dateField: "organizasyon_tarihi",
      },
      {
        id: "acente_kar_zarar",
        title: "Acente Bazlı Kar/Zarar",
        description: "Acente bazında satış, maliyet, kar/zarar ve yüzde",
        dateField: "organizasyon_tarihi",
      },
      {
        id: "otel_kar_zarar",
        title: "Otel Bazlı Kar/Zarar",
        description: "Otel bazında satış, maliyet, kar/zarar ve yüzde",
        dateField: "organizasyon_tarihi",
      },
      {
        id: "kar_zarar_detay",
        title: "Kar/Zarar Raporu",
        description: "Proje bazında satış, maliyet, kar/zarar ve marj",
        dateField: "organizasyon_tarihi",
      },

      {
        id: "yillik_kar_zarar_tl",
        title: "Yıllık Kar/Zarar (Aylık Yatay - TL)",
        description: "Sadece TL bazında aylık kar/zarar ve toplam",
        dateField: "yil",
      },
    ],
  },
  {
    id: "sejour",
    title: "Sejour Raporları",
    reports: [
      {
        id: "sejour_kar_zarar",
        title: "Sejour Kar/Zarar Raporu",
        description: "Voucher bazında satış, maliyet, kar/zarar ve marj",
        dateField: "giris_tarihi",
      },
      {
        id: "sejour_acente",
        title: "Acente Bazlı Sejour Raporu",
        description: "Acenteye göre sejour satış, maliyet, kar/zarar",
        dateField: "giris_tarihi",
      },
      {
        id: "sejour_otel",
        title: "Otel Bazlı Sejour Raporu",
        description: "Otele göre sejour satış, maliyet, kar/zarar",
        dateField: "giris_tarihi",
      },
    ],
  },
];

const OPSIYON_DURUMU_FILTER_OPTIONS = ["1. OPSİYON", "2. OPSİYON", "SOR-SAT"];

const COLUMN_LABELS: Record<string, string> = {
  teklif_no: "TEKLIF NO",
  cin_tarihi: "C/IN TARIHI",
  cout_tarihi: "C/OUT TARIHI",
  cin_cout_tarihi: "C/IN - C/OUT TARIHI",
  firma_adi: "FIRMA ADI",
  acente: "ACENTE",
  otel: "OTEL",
  opsiyon_tarihi: "OPSIYON TARIHI",
  opsiyon_durumu: "OPSIYON DURUMU",
  otel_durumu: "OTEL DURUMU",
  kalan_gun: "KALAN GUN",
  toplam_tutar: "TOPLAM TUTAR",
  opsiyon_tutari: "TOPLAM TUTAR",
  doviz_birimi: "DOVIZ BIRIMI",
  birim_satis: "BIRIM SATIS",
  birim_maliyet: "BIRIM MALIYET",
  adet: "ADET",
  sefer: "SEFER",
  para_birimi: "PARA BIRIMI",
  satir_toplami: "SATIR TOPLAMI",
  kalem_otel: "KALEM OTELI",
  teklif_durumu: "TEKLIF DURUMU",
  alt_kategori: "ALT KATEGORI",
  proje_referans: "PROJE REFERANS",
  referans_no: "REFERANS NO",
  organizasyon_tarihi: "ORGANIZASYON TARIHI",
  cikis_tarihi: "CIKIS TARIHI",
  organizasyon_cikis_tarihi: "ORGANIZASYON TARIHI",
  firma: "FIRMA",
  durum: "DURUM",
  satis_tl: "SATIS (TL)",
  maliyet_tl: "MALIYET (TL)",
  kar_zarar_tl: "KAR/ZARAR (TL)",
  kar_marj_yuzde: "KAR MARJI %",
  proje_sayisi: "PROJE SAYISI",
  voucher_no: "VOUCHER NO",
  voucher_sayisi: "VOUCHER SAYISI",
  yil: "YIL",
  toplam_tl: "TOPLAM (TL)",
  ocak: "OCAK",
  subat: "SUBAT",
  mart: "MART",
  nisan: "NISAN",
  mayis: "MAYIS",
  haziran: "HAZIRAN",
  temmuz: "TEMMUZ",
  agustos: "AGUSTOS",
  eylul: "EYLUL",
  ekim: "EKIM",
  kasim: "KASIM",
  aralik: "ARALIK",
  talep_no: "TALEP NO",
  talep_tarihi: "TALEP TARIHI",
  esnek_tarih: "ESNEK TARIH",
  yanit_detayi: "YANIT DETAYI",
  olusturulma_tarihi: "OLUSTURULMA TARIHI",
  gece_sayisi: "GECE SAYISI",
  talep_durumu: "TALEP DURUMU",
  fiyat: "FIYAT",
};

const formatDateWithDay = (dateVal: unknown, language: string): string => {
  if (!dateVal) return "-";
  const str = String(dateVal).split("T")[0];
  const parts = str.split("-");
  if (parts.length !== 3) return String(dateVal);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return String(dateVal);

  const formattedDate = `${parts[2].padStart(2, "0")}.${parts[1].padStart(2, "0")}.${parts[0]}`;
  const dayName = date.toLocaleDateString(language === "en" ? "en-US" : "tr-TR", { weekday: "long" });

  return `${formattedDate}, ${dayName}`;
};

const statusBadgeClass = (value: unknown) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized.includes("KONF"))
    return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  if (normalized.includes("IPT") || normalized.includes("İPT"))
    return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
  return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
};

const formatCell = (value: unknown, columnKey?: string, t?: any) => {
  if (value === null || value === undefined || value === "") return "-";
  
  if (t && (columnKey?.includes("durum") || columnKey?.includes("status") || columnKey?.includes("opsiyon"))) {
    const strVal = String(value).toUpperCase();
    if (strVal === "1. OPSİYON" || strVal === "1. OPSIYON") return t('reports.opt1') || value;
    if (strVal === "2. OPSİYON" || strVal === "2. OPSIYON") return t('reports.opt2') || value;
    if (strVal === "SOR-SAT") return t('reports.optSorSat') || value;
    if (strVal === "KONFİRME" || strVal === "KONFIRME") return t('reports.statusConfirmed') || value;
    if (strVal === "BEKLEMEDE") return t('reports.statusPending') || value;
    if (strVal === "İPTAL" || strVal === "IPTAL") return t('reports.statusCancelled') || value;
  }

  if (columnKey === "kar_marj_yuzde") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return `%${formatNumber(n)}`;
  }
  if (columnKey === "kalan_gun") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return formatInteger(n);
  }
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    return formatDate(value);
  return String(value);
};

const toLocalInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseSearchTerms = (value: string) =>
  value
    .split(/[+\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const applyClientSearchTerms = (rows: DataRow[], value: string) => {
  const terms = parseSearchTerms(value).map((term) =>
    term.toLocaleLowerCase("tr-TR"),
  );
  if (!terms.length) return rows;
  return rows.filter((row) => {
    const haystack = Object.values(row).join(" ").toLocaleLowerCase("tr-TR");
    return terms.every((term) => haystack.includes(term));
  });
};

const parseIsoDate = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const { canView, loading: permissionsLoading } = usePermissions();
  const [activeReportId, setActiveReportId] = useState("kar_zarar_detay");
  const [datePreset, setDatePreset] = useState<DatePreset>("bu_yil");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-12-31`;
  });
  const [opsiyonDurumuFilter, setOpsiyonDurumuFilter] = useState("tum");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearchInput, setAppliedSearchInput] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [otelFilterInput, setOtelFilterInput] = useState("");
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [pickerRange, setPickerRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [rangeCalendarPos, setRangeCalendarPos] = useState({ top: 0, left: 0 });
  const [reportHotels, setReportHotels] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<DataRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dateRangeRef = useRef<HTMLDivElement | null>(null);
  const dateRangeCalendarRef = useRef<HTMLDivElement | null>(null);

  const activeReport = useMemo(() => {
    const all = REPORT_GROUPS.flatMap((g) => g.reports);
    return all.find((r) => r.id === activeReportId) || all[0];
  }, [activeReportId]);

  const columns = useMemo(() => {
    if (activeReport.id === "opsiyon_takip") {
      return [
        "teklif_no",
        "cin_cout_tarihi",
        "firma_adi",
        "acente",
        "otel",
        "opsiyon_tarihi",
        "opsiyon_durumu",
        "otel_durumu",
        "kalan_gun",
        "toplam_tutar",
        "doviz_birimi",
      ];
    }
    if (activeReport.id === "otel_detay_teklif") {
      return [
        "teklif_no",
        "cin_cout_tarihi",
        "firma_adi",
        "acente",
        "otel",
        "alt_kategori",
        "adet",
        "sefer",
        "birim_satis",
        "para_birimi",
        "teklif_durumu",
      ];
    }
    if (activeReport.id === "otel_detay_talep") {
      return [
        "olusturulma_tarihi",
        "talep_no",
        "talep_tarihi",
        "esnek_tarih",
        "cin_cout_tarihi",
        "firma_adi",
        "acente",
        "otel",
        "talep_durumu",
        "fiyat",
        "para_birimi",
        "opsiyon_tarihi",
        "gece_sayisi",
        "yanit_detayi",
      ];
    }
    if (activeReport.id === "otel_detay_proje_maliyet") {
      return [
        "proje_referans",
        "organizasyon_cikis_tarihi",
        "firma_adi",
        "acente",
        "otel",
        "alt_kategori",
        "adet",
        "sefer",
        "birim_satis",
        "birim_maliyet",
        "para_birimi",
      ];
    }
    if (activeReport.id === "acente_kar_zarar") {
      return [
        "acente",
        "proje_sayisi",
        "satis_tl",
        "maliyet_tl",
        "kar_zarar_tl",
        "kar_marj_yuzde",
      ];
    }
    if (activeReport.id === "otel_kar_zarar") {
      return [
        "otel",
        "proje_sayisi",
        "satis_tl",
        "maliyet_tl",
        "kar_zarar_tl",
        "kar_marj_yuzde",
      ];
    }
    if (activeReport.id === "kar_zarar_detay") {
      return [
        "referans_no",
        "organizasyon_cikis_tarihi",
        "firma",
        "acente",
        "otel",
        "durum",
        "satis_tl",
        "maliyet_tl",
        "kar_zarar_tl",
        "kar_marj_yuzde",
      ];
    }
    return rows[0]
      ? Object.keys(rows[0]).filter((k) => k !== "project_id")
      : [];
  }, [rows, activeReport.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeReport.id,
    appliedSearchInput,
    opsiyonDurumuFilter,
    otelFilterInput,
    startDate,
    endDate,
    sortKey,
    sortDirection,
    pageSize,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "ozel") return;
    const now = new Date();
    if (preset === "bu_yil") {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(`${now.getFullYear()}-12-31`);
      return;
    }
    if (preset === "bu_ay") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toLocalInputDate(first));
      setEndDate(toLocalInputDate(last));
      return;
    }
    const day = now.getDay() || 7;
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - day + 1,
    );
    const sunday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - day + 7,
    );
    setStartDate(toLocalInputDate(monday));
    setEndDate(toLocalInputDate(sunday));
  };

  useEffect(() => {
    applyPreset("bu_yil");
  }, []);

  useEffect(() => {
    const loadReportHotels = async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("name")
        .order("name", { ascending: true })
        .limit(10000);
      if (error) return;
      const hotelNames = [
        ...new Set(
          (data || [])
            .map((h: any) => String(h?.name || "").trim())
            .filter(Boolean),
        ),
      ] as string[];
      setReportHotels(hotelNames);
    };
    loadReportHotels();
  }, []);

  const handleSort = (column: string) => {
    if (sortKey === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column);
    setSortDirection("asc");
  };

  const fetchReport = async (params?: {
    searchValue?: string;
    pageOverride?: number;
  }) => {
    setLoading(true);
    setError("");
    try {
      const effectiveSearch = (
        params?.searchValue ?? appliedSearchInput
      ).trim();
      const searchTerms = parseSearchTerms(effectiveSearch);
      const hasMultiSearch = searchTerms.length > 1;
      const effectivePage = params?.pageOverride ?? currentPage;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error(
          "Yetkilendirme token'ı gerekli. Lütfen tekrar giriş yapın.",
        );
      }
      const query = new URLSearchParams();
      query.set("reportId", activeReport.id);
      query.set("page", String(hasMultiSearch ? 1 : effectivePage));
      query.set("pageSize", String(hasMultiSearch ? 1000 : pageSize));
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);
      if (!hasMultiSearch && searchTerms.length > 0)
        query.set("searchTerm", searchTerms.join(" "));
      if (otelFilterInput.trim())
        query.set("otelFilter", otelFilterInput.trim());
      if (opsiyonDurumuFilter) query.set("opsiyonDurumu", opsiyonDurumuFilter);
      if (sortKey) query.set("sortKey", sortKey);
      if (sortDirection) query.set("sortDirection", sortDirection);

      const json = await apiRequest<{
        success?: boolean;
        message?: string;
        data?: DataRow[];
        total?: number;
        totalPages?: number;
      }>(`/api/reports/data?${query.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!json?.success) {
        throw new Error(json?.message || "Rapor verisi alınamadı");
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
      setError(e?.message || "Rapor verisi hazırlanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (rows.length === 0) {
      alert("Dışa aktarılacak veri bulunamadı.");
      return;
    }

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        activeReport.title.substring(0, 31),
      );

      // 1. LOGOS & TOP BAND (Row 1)
      const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(true); // Dark logos for dark band
      const guessExt = (dataUrl: string): "png" | "jpeg" =>
        (dataUrl || "").includes("image/png") ? "png" : "jpeg";
      const inchToPx = (inch: number) => Math.round(inch * 96);

      const topRow = worksheet.addRow([]);
      topRow.height = 48;
      const colCount = columns.length;
      const lastColLetter = String.fromCharCode(64 + colCount); // Basic A-Z mapping
      worksheet.mergeCells(1, 1, 1, colCount);

      for (let i = 1; i <= colCount; i++) {
        const cell = topRow.getCell(i);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF232F38" },
        };
      }

      if (iconLogoBase64) {
        const iconId = workbook.addImage({
          base64: iconLogoBase64,
          extension: guessExt(iconLogoBase64),
        });
        worksheet.addImage(iconId, {
          tl: { col: 0.15, row: 0.15 },
          ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) },
        });
      }

      if (wordmarkLogoBase64) {
        const wordmarkId = workbook.addImage({
          base64: wordmarkLogoBase64,
          extension: guessExt(wordmarkLogoBase64),
        });
        worksheet.addImage(wordmarkId, {
          tl: { col: Math.max(2, colCount - 2.8), row: 0.23 },
          ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) },
        });
      }

      // 2. REPORT INFO (Rows 3-5)
      worksheet.mergeCells(2, 1, 3, colCount);
      const titleCell = worksheet.getCell(2, 1);
      titleCell.value = activeReport.title.toUpperCase();
      titleCell.font = {
        name: "Arial Black",
        size: 16,
        color: { argb: "FF1E3A8A" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };

      worksheet.mergeCells(4, 1, 4, colCount);
      const metaCell = worksheet.getCell(4, 1);
      metaCell.value = `${t('reports.reportPeriod') || 'Rapor Dönemi'}: ${formatDate(startDate)} - ${formatDate(endDate)} | ${t('reports.createdAt') || 'Oluşturulma'}: ${new Date().toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')}`;
      metaCell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF64748B" },
        italic: true,
      };
      metaCell.alignment = { vertical: "middle", horizontal: "center" };

      // 3. TABLE HEADERS (Starting from Row 6)
      const startRow = 6;
      const headerRow = worksheet.getRow(startRow);
      headerRow.values = columns.map((col) => {
        const transKey = `reports.col_${col}`;
        const translated = t(transKey as any);
        return translated === transKey ? (COLUMN_LABELS[col] || col.replace(/_/g, " ").toUpperCase()) : translated;
      });
      headerRow.height = 25;

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2F3B46" },
        }; // Darker Slate
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // 4. DATA ROWS
      rows.forEach((row, index) => {
        const rowData = columns.map((col) => {
          if (col === "cin_cout_tarihi") {
            return `${formatDateWithDay(row.cin_tarihi, language)}\n${formatDateWithDay(row.cout_tarihi, language)}`;
          }
          if (col === "organizasyon_cikis_tarihi") {
            return `${formatDateWithDay(row.organizasyon_tarihi, language)}\n${formatDateWithDay(row.cikis_tarihi, language)}`;
          }
          const val = row[col];
          if (col.includes("durum") || col.includes("status") || col.includes("opsiyon_durumu")) {
             return formatCell(val, col, t);
          }
          if (
            col.includes("tutar") ||
            col.includes("satis") ||
            col.includes("maliyet") ||
            col.includes("fiyat") ||
            col.includes("tl") ||
            col.includes("adet") ||
            col.includes("sefer") ||
            col.includes("proje_sayisi") ||
            col.includes("voucher_sayisi")
          ) {
            return Number(val) || 0;
          }
          if (col === "kar_marj_yuzde") return (Number(val) || 0) / 100;
          return val;
        });

        const r = worksheet.addRow(rowData);
        r.height = 32; // Taller row to elegantly accommodate wrapped line dates

        // Striped rows
        const isEven = index % 2 === 0;
        const rowFill = isEven
          ? {
              type: "pattern" as const,
              pattern: "solid" as const,
              fgColor: { argb: "FFF8FAFC" },
            }
          : undefined;

        r.eachCell((cell, colNumber) => {
          const colKey = columns[colNumber - 1];
          cell.fill = rowFill || {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal:
              colKey.includes("tutar") ||
              colKey.includes("satis") ||
              colKey.includes("maliyet") ||
              colKey.includes("fiyat") ||
              colKey.includes("tl")
                ? "right"
                : "left",
            wrapText:
              colKey === "cin_cout_tarihi" ||
              colKey === "organizasyon_cikis_tarihi",
          };

          if (
            colKey.includes("tutar") ||
            colKey.includes("satis") ||
            colKey.includes("maliyet") ||
            colKey.includes("fiyat") ||
            colKey.includes("tl")
          ) {
            cell.numFmt = "#,##0.00";
          } else if (colKey === "kar_marj_yuzde") {
            cell.numFmt = "0.00%";
          } else if (
            colKey.includes("adet") ||
            colKey.includes("sefer") ||
            colKey.includes("proje_sayisi") ||
            colKey.includes("voucher_sayisi")
          ) {
            cell.numFmt = "#,##0";
          } else if (
            typeof cell.value === "string" &&
            /^\d{4}-\d{2}-\d{2}/.test(cell.value)
          ) {
            cell.value = new Date(cell.value);
            cell.numFmt = "dd.mm.yyyy";
          }
        });
      });

      // 4. COLUMN WIDTHS
      worksheet.columns.forEach((column) => {
        let maxLen = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
          const len = cell.value ? cell.value.toString().length : 10;
          if (len > maxLen) maxLen = len;
        });
        column.width = Math.min(40, Math.max(12, maxLen + 2));
      });

      // 5. DOWNLOAD
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeReport.title}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Excel export hatası:", error);
      alert("Excel dosyası oluşturulurken hata oluştu: " + error.message);
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
  }, [
    activeReport.id,
    currentPage,
    pageSize,
    startDate,
    endDate,
    appliedSearchInput,
    otelFilterInput,
    opsiyonDurumuFilter,
    sortKey,
    sortDirection,
  ]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.REPORTS)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="text-center max-w-md bg-white dark:bg-v3-surface p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-6">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-v3-text mb-2">
            {t('reports.accessDenied') || "Erişim Engellendi"}
          </h1>
          <p className="text-slate-600 dark:text-v3-muted mb-8">
            {t('reports.noPermission') || "Raporlar sayfasına erişim için yetkiniz bulunmuyor. Lütfen yönetici ile iletişime geçin."}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-500 hover:bg-blue-500/90 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            {t('reports.backToHome') || "Ana Sayfaya Dön"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto pt-4 pb-4 px-4 lg:px-8 gap-4 max-w-[1920px] mx-auto w-full custom-scrollbar text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-4 shrink-0 w-full">
        {/* Title Area */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-light tracking-wide text-v3-text glow-text whitespace-nowrap">
              {t('reports.title') || "Rapor Merkezi"}
            </h1>
            <p className="text-[10px] text-v3-muted mt-0.5 whitespace-nowrap">
              {t('reports.description') || "Sistem verilerinizi analiz edin"}
            </p>
          </div>
        </div>

        {/* Filters Area (Single Row) */}
        <div className="flex flex-row flex-wrap items-end justify-end gap-3 flex-1 min-w-0">
          {/* Report Period Toggle */}
          <div className="inline-flex bg-v3-surface p-1 rounded-xl border border-v3-border shrink-0 h-10">
            {(["bu_hafta", "bu_ay", "bu_yil", "ozel"] as DatePreset[]).map(
              (preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                    datePreset === preset
                      ? "bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                      : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"
                  }`}
                >
                  {preset === "bu_hafta"
                    ? t('reports.datePreset_bu_hafta') || "Bu Hafta"
                    : preset === "bu_ay"
                      ? t('reports.datePreset_bu_ay') || "Bu Ay"
                      : preset === "bu_yil"
                        ? t('reports.datePreset_bu_yil') || "Bu Yıl"
                        : t('reports.datePreset_ozel') || "Özel Tarih"}
                </button>
              ),
            )}
          </div>

          {/* Dates (Responsive Date Range Field) */}
          {datePreset === "ozel" && (
            <div className="shrink-0 w-[240px] h-10 animate-in fade-in zoom-in-95 duration-200">
              <ResponsiveDateRangeField
                label=""
                startValue={startDate}
                endValue={endDate}
                onStartChange={(v) => {
                  if (v) setStartDate(v);
                }}
                onEndChange={(v) => {
                  if (v) setEndDate(v);
                }}
                onApply={() => {}}
              />
            </div>
          )}

          {/* Search (MultiToken) */}
          <div className="flex-1 min-w-[200px] max-w-sm h-10 shrink-0">
            <MultiTokenFilterInput
              label=""
              placeholder={t('reports.searchPlaceholder') || "Yaz, Enter ile ekle"}
              inputValue={searchInput}
              onInputChange={setSearchInput}
              tokens={searchTokens}
              suggestions={[]}
              onAddToken={(t) => {
                if (!searchTokens.includes(t)) {
                  setSearchTokens([...searchTokens, t]);
                  setSearchInput("");
                }
              }}
              onRemoveToken={(t) => {
                setSearchTokens(searchTokens.filter((st) => st !== t));
              }}
            />
          </div>

          {/* Trash Button */}
          <button
            onClick={() => {
              applyPreset("bu_yil");
              setSearchInput("");
              setAppliedSearchInput("");
              setSearchTokens([]);
              setOtelFilterInput("");
              setCurrentPage(1);
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

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0 mx-1"></div>

          {/* Optional: Otel Filter */}
          {activeReport.id.includes("otel") && (
            <div className="shrink-0 w-[150px] h-10">
              <input
                list="report-hotels-list"
                value={otelFilterInput}
                onChange={(e) => setOtelFilterInput(e.target.value)}
                placeholder={t('reports.selectHotel') || "Otel seçin..."}
                className="w-full h-full bg-v3-surface border border-v3-border text-v3-text placeholder:text-v3-muted focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={() => fetchReport()}
            className="h-10 shrink-0 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {t('reports.query') || "SORGULA"}
          </button>
          <button
            onClick={handleExportExcel}
            className="h-10 shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-2 px-4 rounded-xl shadow-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            title="Excel'e Aktar"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" />
            </svg>
            EXCEL
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {REPORT_GROUPS.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-v3-surface rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`w-1.5 h-6 rounded-full ${
                  group.id === "teklif"
                    ? "bg-blue-500"
                    : group.id === "proje_kar"
                      ? "bg-emerald-500"
                      : "bg-indigo-500"
                }`}
              ></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-v3-muted dark:text-v3-muted">
                {t(`reports.group_${group.id}` as any) || group.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {group.reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => {
                    setActiveReportId(report.id);
                    setRows([]);
                    setError("");
                    setOpsiyonDurumuFilter("tum");
                    setSearchInput("");
                    setAppliedSearchInput("");
                    setSearchTokens([]);
                    setOtelFilterInput("");
                    setCurrentPage(1);
                    setSortKey("");
                    setSortDirection("asc");
                  }}
                  className={`group flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 ${
                    activeReportId === report.id
                      ? "bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-slate-50 dark:bg-v3-border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-v3-text"
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">
                    {(() => {
                      const tk = `reports.rep_${report.id}`;
                      const tr = t(tk as any);
                      return tr === tk ? report.title : tr;
                    })()}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${activeReportId === report.id ? "translate-x-1" : "group-hover:translate-x-1 opacity-50"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-v3-surface backdrop-blur-md rounded-3xl border border-slate-200 dark:border-v3-border shadow-xl flex flex-col mb-4">
        {/* Table Area */}
        <div className="flex-1 overflow-visible relative w-full">
          {loading && (
            <div className="absolute inset-0 bg-v3-border0 dark:bg-slate-950/50 backdrop-blur-[2px] z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-blue-600">{t('reports.loading') || "Yükleniyor..."}</p>
              </div>
            </div>
          )}

          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-v3-surface/80 backdrop-blur-md z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-v3-muted cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-2 group-hover:text-blue-600 dark:text-blue-400 transition-colors">
                      {(() => {
                        const tk = `reports.col_${col}`;
                        const tr = t(tk as any);
                        return tr === tk ? (COLUMN_LABELS[col] || col.replace(/_/g, " ").toUpperCase()) : tr;
                      })()}
                      <div className="flex flex-col scale-75 opacity-50">
                        <svg
                          className={`w-2 h-2 ${sortKey === col && sortDirection === "asc" ? "text-blue-600 dark:text-blue-400 opacity-100" : ""}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 5l-7 7h14l-7-7z"></path>
                        </svg>
                        <svg
                          className={`w-2 h-2 ${sortKey === col && sortDirection === "desc" ? "text-blue-600 dark:text-blue-400 opacity-100" : ""}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 19l7-7H5l7 7z"></path>
                        </svg>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length > 0
                ? rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="group hover:bg-blue-500/10/30 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      {columns.map((col) => {
                        const cellValue = row[col];
                        const isStatus =
                          col.includes("durum") || col.includes("status");
                        const isAmount =
                          col.includes("tutar") ||
                          col.includes("satis") ||
                          col.includes("maliyet") ||
                          col.includes("tl");
                        const isMargin = col === "kar_marj_yuzde";

                        return (
                          <td
                            key={`${idx}-${col}`}
                            className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-v3-text"
                          >
                            {col === "cin_cout_tarihi" ? (
                              <div className="flex flex-col gap-0.5">
                                <div>{formatDateWithDay(row.cin_tarihi, language)}</div>
                                <div>{formatDateWithDay(row.cout_tarihi, language)}</div>
                              </div>
                            ) : col === "organizasyon_cikis_tarihi" ? (
                              <div className="flex flex-col gap-0.5">
                                <div>
                                  {formatDateWithDay(row.organizasyon_tarihi, language)}
                                </div>
                                <div>{formatDateWithDay(row.cikis_tarihi, language)}</div>
                              </div>
                            ) : isStatus ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass(cellValue)}`}
                              >
                                {formatCell(cellValue, col, t)}
                              </span>
                            ) : isMargin ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-12 bg-slate-100 dark:bg-v3-surface rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${Number(cellValue) > 15 ? "bg-emerald-500" : Number(cellValue) > 5 ? "bg-blue-500" : "bg-red-500"}`}
                                    style={{
                                      width: `${Math.min(100, Math.max(0, Number(cellValue)))}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={
                                    Number(cellValue) >= 0
                                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                      : "text-red-600 dark:text-red-400 font-bold"
                                  }
                                >
                                  {formatCell(cellValue, col, t)}
                                </span>
                              </div>
                            ) : (
                              <span
                                className={
                                  isAmount ? "font-mono font-bold" : ""
                                }
                              >
                                {formatCell(
                                  col === "toplam_tutar"
                                    ? (cellValue ?? row.opsiyon_tutari)
                                    : col === "doviz_birimi"
                                      ? (cellValue ?? "-")
                                      : cellValue,
                                  col,
                                  t
                                )}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                : !loading && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-24 text-center"
                      >
                        <div className="flex flex-col items-center gap-4 text-v3-muted">
                          <svg
                            className="w-16 h-16 opacity-20"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                          </svg>
                          <p className="text-sm font-bold uppercase tracking-widest">
                            {t('reports.noData') || "Kayıt Bulunmadı"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 dark:bg-v3-surface/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="text-[11px] font-bold text-v3-muted uppercase tracking-widest">
            {t('reports.total') || "Toplam"}{" "}
            <span className="text-slate-900 dark:text-v3-text">{totalCount}</span>{" "}
            {t('reports.records') || "Kayıt"}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-v3-surface disabled:opacity-30 transition-all text-xs"
            >
              «
            </button>
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-v3-surface disabled:opacity-30 transition-all text-xs"
            >
              ‹
            </button>
            <div className="flex items-center px-4 py-2 bg-white dark:bg-v3-surface rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {currentPage} / {totalPages}
            </div>
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-v3-surface disabled:opacity-30 transition-all text-xs"
            >
              ›
            </button>
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(totalPages)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-v3-surface disabled:opacity-30 transition-all text-xs"
            >
              »
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-v3-muted uppercase">
              {t('reports.rows') || "Satır"}
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-v3-surface border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
            >
              {[25, 50, 100, 250].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <datalist id="report-hotels-list">
        {reportHotels.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }

        /* Custom Datepicker Styles */
        .custom-datepicker-wrapper .react-datepicker {
          display: flex !important;
          border: none !important;
          background: transparent !important;
          font-family: inherit !important;
        }

        .custom-datepicker-wrapper .react-datepicker__month-container {
          background: transparent !important;
          padding: 0 0.5rem;
        }

        @media (max-width: 767px) {
          .custom-datepicker-wrapper .react-datepicker {
            flex-direction: column;
            width: 100%;
          }
          .custom-datepicker-wrapper .react-datepicker__month-container {
            width: 100%;
            float: none;
            padding: 0;
          }
        }

        @media (min-width: 768px) {
          .custom-datepicker-wrapper .react-datepicker {
            flex-direction: row;
          }
          .custom-datepicker-wrapper .react-datepicker__month-container {
            width: 290px;
            float: none;
          }
          .custom-datepicker-wrapper
            .react-datepicker__month-container:first-child {
            border-right: 1px solid #f1f5f9;
            padding-right: 1rem;
            margin-right: 0.5rem;
          }
          .dark
            .custom-datepicker-wrapper
            .react-datepicker__month-container:first-child {
            border-right-color: #1e293b;
          }
        }

        .custom-datepicker-wrapper .react-datepicker__header {
          background: transparent !important;
          border-bottom: none !important;
          padding-top: 0.5rem;
          padding-bottom: 0;
        }

        .custom-datepicker-wrapper .react-datepicker__navigation {
          top: 1rem !important;
          height: 2rem !important;
          width: 2rem !important;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation-icon::before {
          border-color: #64748b !important;
          border-width: 2px 2px 0 0 !important;
          width: 8px !important;
          height: 8px !important;
        }
        .custom-datepicker-wrapper .react-datepicker__navigation:hover {
          background: #f1f5f9;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__navigation:hover {
          background: #1e293b;
        }
        .dark
          .custom-datepicker-wrapper
          .react-datepicker__navigation-icon::before {
          border-color: #94a3b8 !important;
        }

        .custom-datepicker-wrapper .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__day-name {
          color: #94a3b8 !important;
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0 !important;
          font-weight: 600 !important;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .custom-datepicker-wrapper .react-datepicker__month {
          margin: 0 !important;
          padding: 0 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__week {
          display: flex;
          justify-content: space-around;
          margin-bottom: 0.25rem;
        }

        .custom-datepicker-wrapper .react-datepicker__day {
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0 !important;
          border-radius: 50% !important;
          font-weight: 500;
          font-size: 0.875rem;
          color: #334155 !important;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .custom-datepicker-wrapper
          .react-datepicker__day:hover:not(
            .react-datepicker__day--selected
          ):not(.react-datepicker__day--in-selecting-range):not(
            .react-datepicker__day--in-range
          ) {
          background-color: #f1f5f9 !important;
        }

        .custom-datepicker-wrapper .react-datepicker__day--in-range,
        .custom-datepicker-wrapper .react-datepicker__day--in-selecting-range {
          background-color: #eff6ff !important;
          color: #2563eb !important;
          border-radius: 0 !important;
        }
        .custom-datepicker-wrapper .react-datepicker__day--range-start,
        .custom-datepicker-wrapper
          .react-datepicker__day--selecting-range-start {
          background-color: #2563eb !important;
          color: white !important;
          border-top-left-radius: 50% !important;
          border-bottom-left-radius: 50% !important;
        }
        .custom-datepicker-wrapper .react-datepicker__day--range-end,
        .custom-datepicker-wrapper .react-datepicker__day--selecting-range-end {
          background-color: #2563eb !important;
          color: white !important;
          border-top-right-radius: 50% !important;
          border-bottom-right-radius: 50% !important;
        }
        .custom-datepicker-wrapper .react-datepicker__day--selected {
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 50% !important;
        }

        .custom-datepicker-wrapper .react-datepicker__day--keyboard-selected {
          background-color: transparent !important;
          color: #334155 !important;
        }
        .dark
          .custom-datepicker-wrapper
          .react-datepicker__day--keyboard-selected {
          color: #e2e8f0 !important;
        }

        .custom-datepicker-wrapper .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--outside-month {
          color: #334155 !important;
        }

        .custom-datepicker-wrapper .react-datepicker__header__dropdown {
          margin-top: 0.25rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        .custom-datepicker-wrapper .react-datepicker__month-select,
        .custom-datepicker-wrapper .react-datepicker__year-select {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.25rem 1.5rem 0.25rem 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: #334155;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1rem;
          transition: border-color 0.2s;
        }
        .custom-datepicker-wrapper .react-datepicker__month-select:hover,
        .custom-datepicker-wrapper .react-datepicker__year-select:hover {
          border-color: #cbd5e1;
        }

        .dark .custom-datepicker-wrapper .react-datepicker__day {
          color: #e2e8f0 !important;
        }
        .dark
          .custom-datepicker-wrapper
          .react-datepicker__day:hover:not(
            .react-datepicker__day--selected
          ):not(.react-datepicker__day--in-selecting-range):not(
            .react-datepicker__day--in-range
          ) {
          background-color: #1e293b !important;
        }

        .dark .custom-datepicker-wrapper .react-datepicker__day--in-range,
        .dark
          .custom-datepicker-wrapper
          .react-datepicker__day--in-selecting-range {
          background-color: rgba(37, 99, 235, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__day--range-start,
        .dark .custom-datepicker-wrapper .react-datepicker__day--range-end,
        .dark
          .custom-datepicker-wrapper
          .react-datepicker__day--selecting-range-start,
        .dark
          .custom-datepicker-wrapper
          .react-datepicker__day--selecting-range-end,
        .dark .custom-datepicker-wrapper .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }

        .dark .custom-datepicker-wrapper .react-datepicker__month-select,
        .dark .custom-datepicker-wrapper .react-datepicker__year-select {
          background-color: #1e293b;
          border-color: #334155;
          color: #f1f5f9;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }
        .dark .custom-datepicker-wrapper .react-datepicker__month-select:hover,
        .dark .custom-datepicker-wrapper .react-datepicker__year-select:hover {
          border-color: #475569;
        }
        .dark .custom-datepicker-wrapper .react-datepicker__current-month {
          color: #f8fafc !important;
          font-size: 1rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
