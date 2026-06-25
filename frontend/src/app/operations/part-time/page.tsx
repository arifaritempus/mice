"use client";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { formatNumber, formatDate } from "@/utils/formatters";
import PaginationControls from "@/components/PaginationControls";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { usePermissions, Module } from "@/lib/permissions";

interface PartTimeService {
  id: string;
  sejour_id: string;
  voucher_number: string;
  customer_type: "sejour" | "mice";
  project_type?: "project";
  project_id?: string;
  check_in_date: string;
  check_out_date: string;
  employee_name: string;
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
  hours?: string;
  status: "active" | "completed" | "cancelled";
  notes: string;
  created_at: string;
}

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export default function PartTimePage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const [partTimeServices, setPartTimeServices] = useState<PartTimeService[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Voucher numarasına tıklandığında önizleme aç
  const handleVoucherClick = (
    sejourId: string,
    projectType?: string,
    projectId?: string,
  ) => {
    if (projectType === "project" && projectId) {
      window.open(`/projects/${projectId}`, "_blank");
    } else {
      window.open(`/sejour/${sejourId}`, "_blank");
    }
  };

  const addToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
    setInput: Dispatch<SetStateAction<string>>,
  ) => {
    const parts = value
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTokens((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((item) => item.toLowerCase() === p.toLowerCase()))
          next.push(p);
      }
      return next;
    });
    setInput("");
  };

  const removeToken = (
    value: string,
    setTokens: Dispatch<SetStateAction<string[]>>,
  ) => {
    setTokens((prev) => prev.filter((item) => item !== value));
  };

  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState("");
  const [hotelTokens, setHotelTokens] = useState<string[]>([]);
  const [hotelInput, setHotelInput] = useState("");
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState("");
  const [employeeTokens, setEmployeeTokens] = useState<string[]>([]);
  const [employeeInput, setEmployeeInput] = useState("");

  const voucherTerms = useMemo(() => [...voucherTokens], [voucherTokens]);
  const customerTerms = useMemo(() => [...customerTokens], [customerTokens]);
  const hotelTerms = useMemo(() => [...hotelTokens], [hotelTokens]);
  const supplierTerms = useMemo(() => [...supplierTokens], [supplierTokens]);
  const employeeTerms = useMemo(() => [...employeeTokens], [employeeTokens]);

  const scopedSearchState = useMemo(
    () =>
      JSON.stringify({
        voucherTerms: voucherInput
          ? [...voucherTerms, voucherInput]
          : voucherTerms,
        customerTerms: customerInput
          ? [...customerTerms, customerInput]
          : customerTerms,
        hotelTerms: hotelInput ? [...hotelTerms, hotelInput] : hotelTerms,
        supplierTerms: supplierInput
          ? [...supplierTerms, supplierInput]
          : supplierTerms,
        employeeTerms: employeeInput
          ? [...employeeTerms, employeeInput]
          : employeeTerms,
      }),
    [
      voucherTerms,
      voucherInput,
      customerTerms,
      customerInput,
      hotelTerms,
      hotelInput,
      supplierTerms,
      supplierInput,
      employeeTerms,
      employeeInput,
    ],
  );
  const [sortField, setSortField] =
    useState<keyof PartTimeService>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "mice" | "sejour">("all");
  const [typeCounts, setTypeCounts] = useState({ all: 0, mice: 0, sejour: 0 });

  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    startDate: todayStr,
    endDate: "",
  });
  const [draftStart, setDraftStart] = useState(todayStr);
  const [draftEnd, setDraftEnd] = useState("");

  const [filterKey, setFilterKey] = useState<number>(0);
  const [forceReload, setForceReload] = useState<number>(0);

  useEffect(() => {
    const handleProjectChange = () => setForceReload((prev) => prev + 1);
    const handleStorage = () => setForceReload((prev) => prev + 1);
    window.addEventListener("projectUpdated", handleProjectChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("projectUpdated", handleProjectChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const loadPartTimeServices = async () => {
    try {
      if (!initialFetchDone) setLoading(true);
      else setTableBusy(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        searchTerm: voucherTokens.join(" "),
        filter,
        sortField: String(sortField),
        sortDirection,
        startDate: dateRange.startDate || "",
        endDate: dateRange.endDate || "",
        voucherTerms: JSON.stringify(
          voucherInput ? [...voucherTerms, voucherInput] : voucherTerms,
        ),
        customerTerms: JSON.stringify(
          customerInput ? [...customerTerms, customerInput] : customerTerms,
        ),
        hotelTerms: JSON.stringify(
          hotelInput ? [...hotelTerms, hotelInput] : hotelTerms,
        ),
        supplierTerms: JSON.stringify(
          supplierInput ? [...supplierTerms, supplierInput] : supplierTerms,
        ),
        employeeTerms: JSON.stringify(
          employeeInput ? [...employeeTerms, employeeInput] : employeeTerms,
        ),
      });
      const response = await fetch(
        `/api/operations/part-time?${params.toString()}`,
      );
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Part-time verileri alinamadi");
      }
      setPartTimeServices(Array.isArray(result.data) ? result.data : []);
      setTotalCount(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
      if (result.typeCounts) {
        setTypeCounts(result.typeCounts);
      }
    } catch (error) {
      console.error("Part-Time hizmet verileri yüklenirken hata:", error);
    } finally {
      setLoading(false);
      setTableBusy(false);
      setInitialFetchDone(true);
    }
  };

  useEffect(() => {
    loadPartTimeServices();
  }, [
    page,
    pageSize,
    scopedSearchState,
    filter,
    sortField,
    sortDirection,
    dateRange,
    forceReload,
  ]);

  const handleApplyDates = (start?: string, end?: string) => {
    setDateRange({
      startDate: start !== undefined ? start : draftStart,
      endDate: end !== undefined ? end : draftEnd,
    });
    setPage(1);
    setForceReload((prev) => prev + 1);
  };

  // Filtreleri temizleme fonksiyonu - Part-Time sayfası için
  const clearPartTimeFilters = () => {
    setVoucherTokens([]);
    setVoucherInput("");
    setCustomerTokens([]);
    setCustomerInput("");
    setHotelTokens([]);
    setHotelInput("");
    setSupplierTokens([]);
    setSupplierInput("");
    setEmployeeTokens([]);
    setEmployeeInput("");
    setDraftStart("");
    setDraftEnd("");
    setDateRange({ startDate: "", endDate: "" });
    setFilter("all");
    setPage(1);
    setFilterKey((prev) => prev + 1);
    setForceReload((prev) => prev + 1);
  };

  // Excel export fonksiyonu - Bilet sayfası formatında header ile
  const exportPartTimeToExcel = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(
        `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Part-Time Hizmetler`,
      );
      sheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        paperSize: 9,
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.3,
          bottom: 0.3,
          header: 0.1,
          footer: 0.1,
        },
      } as any;

      // Header band
      const top = sheet.addRow([]);
      top.height = 48;
      sheet.mergeCells("A1:N1");
      for (let c = 1; c <= 14; c++) {
        sheet.getRow(1).getCell(c).value = "";
        sheet.getRow(1).getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF232F38" },
        } as any;
      }

      // Logos (Supabase settings)
      let iconLogoBase64: string | undefined;
      let wordmarkLogoBase64: string | undefined;
      try {
        const { SettingsService } = await import("@/lib/supabaseService");
        const settings = await SettingsService.getSettings();
        const general = settings?.general_settings || {};
        iconLogoBase64 = general?.icon_logo;
        wordmarkLogoBase64 = general?.wordmark_logo;
      } catch {}

      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): "png" | "jpeg" =>
        (dataUrl || "").includes("image/png") ? "png" : "jpeg";

      if (iconLogoBase64) {
        const iconId = workbook.addImage({
          base64: iconLogoBase64,
          extension: guessExt(iconLogoBase64),
        });
        sheet.addImage(iconId, {
          tl: { col: 0.15, row: 0.15 },
          ext: { width: inchToPx(1.25), height: inchToPx(0.7) } as any,
        } as any);
      }
      if (wordmarkLogoBase64) {
        const markId = workbook.addImage({
          base64: wordmarkLogoBase64,
          extension: guessExt(wordmarkLogoBase64),
        });
        sheet.addImage(markId, {
          tl: { col: 11.5, row: 0.23 },
          ext: { width: inchToPx(2.0), height: inchToPx(0.5) } as any,
        } as any);
      }

      // Sütun tanımları
      sheet.columns = [
        { header: "Voucher", key: "voucher_number", width: 16 },
        { header: "Tarih", key: "check_in_date", width: 14 },
        { header: "Tür", key: "customer_type", width: 12 },
        { header: "C-IN / C-OUT", key: "check_in_out", width: 20 },
        { header: "Firma Adı", key: "company_name", width: 20 },
        { header: "Acente/Müşteri", key: "customer_name", width: 20 },
        { header: "Otel", key: "hotel_name", width: 18 },
        { header: "Hizmet Türü", key: "service_type", width: 18 },
        { header: "Tedarikçi", key: "supplier", width: 18 },
        { header: "Çalışan Adı", key: "employee_name", width: 18 },
        { header: "Maliyet", key: "cost_price", width: 12 },
        { header: "Döviz", key: "currency", width: 8 },
        { header: "Kur", key: "fx", width: 10 },
        { header: "Toplam TL", key: "totalTRY", width: 12 },
      ];

      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      sheet.getRow(headerRow.number).height = 18;

      // Sayısal sütun biçimi
      sheet.getColumn("cost_price").numFmt = "#,##0.00";
      sheet.getColumn("cost_price").alignment = { horizontal: "right" } as any;
      sheet.getColumn("fx").numFmt = "#,##0.00";
      sheet.getColumn("fx").alignment = { horizontal: "right" } as any;
      sheet.getColumn("totalTRY").numFmt = "#,##0.00";
      sheet.getColumn("totalTRY").alignment = { horizontal: "right" } as any;

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2F3B46" },
        } as any;
        cell.alignment = { vertical: "middle", horizontal: "center" } as any;
      });

      const fmtDate = (d?: string) => {
        if (!d) return "";
        try {
          return new Date(d).toLocaleDateString("tr-TR");
        } catch {
          return d;
        }
      };

      const toNum = (num: number | string | undefined): number => {
        if (num == null) return 0;
        const parsed = typeof num === "string" ? parseFloat(num) : num;
        return Number.isFinite(parsed) ? parsed : 0;
      };

      filteredAndSortedServices.forEach((service: any) => {
        const costPrice = toNum(service.cost_price);
        const fx = toNum(service.fx) || 1;
        const totalTRY = costPrice * fx;
        sheet.addRow({
          voucher_number: service.voucher_number,
          check_in_date: fmtDate(service.check_in_date),
          customer_type: service.customer_type === "mice" ? "MICE" : "Sejour",
          check_in_out:
            service.check_in_date && service.check_out_date
              ? `${fmtDate(service.check_in_date)} / ${fmtDate(service.check_out_date)}`
              : service.check_in_date
                ? fmtDate(service.check_in_date)
                : service.check_out_date
                  ? fmtDate(service.check_out_date)
                  : "",
          company_name: service.company_name || "",
          customer_name: service.customer_name || "",
          hotel_name: service.hotel_name || "",
          service_type: service.service_type || "",
          supplier: service.supplier || "",
          employee_name: service.employee_name || "",
          cost_price: costPrice,
          currency: service.cost_currency || service.currency || "TRY",
          fx,
          totalTRY,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `part_time_hizmetler_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess("Part-Time hizmetler Excel dosyası olarak indirildi!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Excel export hatası:", error);
      setError("Excel dosyası oluşturulurken bir hata oluştu!");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSort = (field: keyof PartTimeService) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const voucherSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          partTimeServices
            .map((s) => (s.voucher_number || "").trim())
            .filter(Boolean),
        ),
      ),
    [partTimeServices],
  );
  const customerSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          partTimeServices
            .flatMap((s) =>
              [s.customer_name, s.company_name].map((x) => (x || "").trim()),
            )
            .filter(Boolean),
        ),
      ),
    [partTimeServices],
  );
  const hotelSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          partTimeServices
            .map((s) => (s.hotel_name || "").trim())
            .filter(Boolean),
        ),
      ),
    [partTimeServices],
  );
  const supplierSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          partTimeServices
            .map((s) => (s.supplier || "").trim())
            .filter(Boolean),
        ),
      ),
    [partTimeServices],
  );
  const employeeSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const s of partTimeServices) {
      const e = (s.employee_name || "").trim();
      if (e) set.add(e);
      const t = (s.service_type || "").trim();
      if (t) set.add(t);
    }
    return Array.from(set);
  }, [partTimeServices]);

  const filteredAndSortedServices = partTimeServices;

  const paginatedPartTime = {
    items: partTimeServices,
    page,
    pageSize,
    total: totalCount,
    totalPages,
  };

  useEffect(() => {
    setPage(1);
  }, [
    scopedSearchState,
    dateRange.startDate,
    dateRange.endDate,
    sortField,
    sortDirection,
  ]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.PART_TIME)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/operations"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Operasyonlara Dön
          </a>
        </div>
      </div>
    );
  }

  if (!initialFetchDone && loading) {
    return <LoadingSpinner message="Part-time kayıtları yükleniyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">
              Yarı Zamanlı Çalışan Yönetimi
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              MICE ve Sejour part-time operasyonlarını tek ekrandan yönetin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Hizmet Tarihi"
                startValue={dateRange.startDate}
                endValue={dateRange.endDate}
                onStartChange={(v) => setDraftStart(v)}
                onEndChange={(v) => setDraftEnd(v)}
                onApply={handleApplyDates}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher, Çalışan, Otel vb.)"
                tokens={voucherTokens}
                inputValue={voucherInput}
                suggestions={voucherSuggestions}
                onInputChange={setVoucherInput}
                onAddToken={(value) =>
                  addToken(value, setVoucherTokens, setVoucherInput)
                }
                onRemoveToken={(value) => removeToken(value, setVoucherTokens)}
              />
            </div>

            {/* Clear Button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={clearPartTimeFilters}
                className="w-10 h-10 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all duration-300 hover:scale-105"
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
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
              <button
                type="button"
                onClick={exportPartTimeToExcel}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                title="Excel İndir"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Excel İndir
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">
              KAYNAK:
            </span>
            <button
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${filter === "all" ? "bg-blue-500/20 border border-blue-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>TÜMÜ</span>
              <span className="font-bold">{typeCounts.all}</span>
            </button>
            <button
              onClick={() => {
                setFilter("mice");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${filter === "mice" ? "bg-orange-500/20 border border-orange-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>MICE</span>
              <span className="font-bold">{typeCounts.mice}</span>
            </button>
            <button
              onClick={() => {
                setFilter("sejour");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${filter === "sejour" ? "bg-emerald-500/20 border border-emerald-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>SEJOUR</span>
              <span className="font-bold">{typeCounts.sejour}</span>
            </button>
          </div>
        </div>

        <div
          className={`flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px] relative ${tableBusy ? "opacity-80" : ""}`}
        >
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
                <tr>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("voucher_number")}
                  >
                    Voucher No
                    {sortField === "voucher_number" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("check_in_date")}
                  >
                    Tarih
                    {sortField === "check_in_date" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("customer_type")}
                  >
                    Tür
                    {sortField === "customer_type" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("check_in_date")}
                  >
                    C-IN / C-OUT
                    {sortField === "check_in_date" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("company_name")}
                  >
                    FİRMA ADI
                    {sortField === "company_name" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("customer_name")}
                  >
                    ACENTE/MÜŞTERİ
                    {sortField === "customer_name" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("hotel_name")}
                  >
                    Otel
                    {sortField === "hotel_name" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("service_type")}
                  >
                    Hizmet Türü
                    {sortField === "service_type" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("supplier")}
                  >
                    Tedarikçi
                    {sortField === "supplier" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("employee_name")}
                  >
                    Çalışan Adı
                    {sortField === "employee_name" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("cost_price")}
                  >
                    Maliyet
                    {sortField === "cost_price" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("cost_currency")}
                  >
                    Döviz
                    {sortField === "cost_currency" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("fx")}
                  >
                    Kur
                    {sortField === "fx" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                    onClick={() => handleSort("totalTRY")}
                  >
                    Toplam TL
                    {sortField === "totalTRY" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedPartTime.items.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleVoucherClick(
                            service.sejour_id,
                            service.project_type,
                            service.project_id,
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                      >
                        {service.voucher_number}
                      </button>
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      {formatDate(service.check_in_date)}
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          service.customer_type === "mice"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {service.customer_type === "mice" ? "MICE" : "SEJOUR"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      {service.check_in_date && service.check_out_date
                        ? `${formatDate(service.check_in_date)} / ${formatDate(service.check_out_date)}`
                        : "-"}
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]"
                      title={service.company_name || ""}
                    >
                      {service.company_name || "-"}
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]"
                      title={service.customer_name || ""}
                    >
                      {service.customer_name || "-"}
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[150px]"
                      title={service.hotel_name || ""}
                    >
                      {service.hotel_name || "-"}
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]"
                      title={service.service_type || ""}
                    >
                      {service.service_type}
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]"
                      title={service.supplier || ""}
                    >
                      {service.supplier || "-"}
                    </td>
                    <td
                      className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 truncate max-w-[120px]"
                      title={service.employee_name || ""}
                    >
                      {service.employee_name}
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      {formatNumber(service.cost_price)}
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      {service.cost_currency}
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      {formatNumber(service.fx || 1)}
                    </td>
                    <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                      {formatNumber(
                        (service.cost_price || 0) * (service.fx || 1),
                      )}
                    </td>
                  </tr>
                ))}

                {filteredAndSortedServices.length === 0 && (
                  <tr>
                    <td
                      colSpan={20}
                      className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Filtrelere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={paginatedPartTime.page}
            pageSize={paginatedPartTime.pageSize}
            total={paginatedPartTime.total}
            totalPages={paginatedPartTime.totalPages}
            preferenceKey="operations_parttime_page_size"
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
