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
import { useTheme } from "@/components/providers/ThemeProvider";
import { formatNumber } from "@/utils/formatters";
import { getLogosForExcel } from "@/utils/logoUtils";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  paginateItems,
} from "@/types/pagination";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import PaginationControls from "@/components/PaginationControls";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { usePermissions, Module } from "@/lib/permissions";
// import { loadBiletler } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const biletler = await loadBiletler();
//   console.log(biletler);
// }

// fetchData();

// Misafir isimlerini getiren yardımcı fonksiyon (artık kullanılmıyor, ticket içinde guestNames var)
const getGuestNames = (sejourId: string) => {
  // Bu fonksiyon artık kullanılmıyor çünkü veriler ticket içinde guestNames olarak geliyor
  return "-";
};

// Tarih formatını GG.AA.YYYY yapan yardımcı fonksiyon
const formatDateCustom = (dateString: string) => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (error) {
    return dateString;
  }
};

// Saat formatını düzenleyen yardımcı fonksiyon
const formatTime = (timeString: string) => {
  if (!timeString) return "-";

  try {
    // ISO string formatında ise (örn: "2024-01-15T14:30:00Z")
    if (timeString.includes("T")) {
      const date = new Date(timeString);
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    // Sadece saat formatında ise (örn: "14:30")
    if (timeString.includes(":")) {
      return timeString;
    }

    // Unix timestamp ise
    const timestamp = parseInt(timeString);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    return timeString;
  } catch (error) {
    return timeString;
  }
};

/** Tabloda gösterilecek tek satır (önce acente) */
function agencyCustomerLine(t: { agencyName?: string; customerName?: string }) {
  if (t.agencyName?.trim()) return t.agencyName.trim();
  if (t.customerName?.trim()) return t.customerName.trim();
  return "-";
}

/** Tooltip: acente ve müşteri ikisi de varsa ikisini göster */
function agencyCustomerTooltip(t: {
  agencyName?: string;
  customerName?: string;
}) {
  const parts = [t.agencyName?.trim(), t.customerName?.trim()].filter(
    Boolean,
  ) as string[];
  if (parts.length === 0) return "";
  return parts.join(" — ");
}

interface Ticket {
  id: string;
  sejourId: string;
  voucherNumber: string;
  customerName: string;
  agencyName: string;
  companyName?: string;
  flightDate: string;
  ticketingDate: string;
  ticketingProvider: string;
  pnr: string;
  airline: string;
  route: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  costPrice: number;
  costCurrency: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  created_at: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkInOut?: string;
  guestNames?: string;
  // MICE için ek alanlar
  returnDate?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
}

interface Sejour {
  id: string;
  voucherNumber: string;
  customerName: string;
  agencyName: string;
  checkInDate: string;
  checkOutDate: string;
  flights: any[];
  status: string;
}

export default function TicketsPage() {
  const { canView, loading: permissionsLoading } = usePermissions();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>(
    "all",
  );
  const [filter, setFilter] = useState<"all" | "mice" | "sejour">("all");
  const [typeCounts, setTypeCounts] = useState({ all: 0, mice: 0, sejour: 0 });
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filterKey, setFilterKey] = useState<number>(0);
  const [forceReload, setForceReload] = useState<number>(0);

  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    startDate: todayStr,
    endDate: "",
  });
  const [draftTicketingStart, setDraftTicketingStart] = useState(todayStr);
  const [draftTicketingEnd, setDraftTicketingEnd] = useState("");

  const [flightDateRange, setFlightDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [draftFlightStart, setDraftFlightStart] = useState("");
  const [draftFlightEnd, setDraftFlightEnd] = useState("");

  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState("");
  const [pnrTokens, setPnrTokens] = useState<string[]>([]);
  const [pnrInput, setPnrInput] = useState("");
  const [airlineTokens, setAirlineTokens] = useState<string[]>([]);
  const [airlineInput, setAirlineInput] = useState("");
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState("");
  const [guestTokens, setGuestTokens] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState("");

  const voucherTerms = useMemo(
    () => [...voucherTokens, voucherInput.trim()].filter(Boolean),
    [voucherTokens, voucherInput],
  );
  const customerTerms = useMemo(
    () => [...customerTokens, customerInput.trim()].filter(Boolean),
    [customerTokens, customerInput],
  );
  const pnrTerms = useMemo(
    () => [...pnrTokens, pnrInput.trim()].filter(Boolean),
    [pnrTokens, pnrInput],
  );
  const airlineTerms = useMemo(
    () => [...airlineTokens, airlineInput.trim()].filter(Boolean),
    [airlineTokens, airlineInput],
  );
  const supplierTerms = useMemo(
    () => [...supplierTokens, supplierInput.trim()].filter(Boolean),
    [supplierTokens, supplierInput],
  );
  const guestTerms = useMemo(
    () => [...guestTokens, guestInput.trim()].filter(Boolean),
    [guestTokens, guestInput],
  );

  const scopedSearchState = useMemo(
    () =>
      JSON.stringify({
        voucherTerms,
        customerTerms,
        pnrTerms,
        airlineTerms,
        supplierTerms,
        guestTerms,
      }),
    [
      voucherTerms,
      customerTerms,
      pnrTerms,
      airlineTerms,
      supplierTerms,
      guestTerms,
    ],
  );

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

  // ExcelJS ile Detay Export (kurumsal header)
  const exportDetailsExcel = async (rows: any[]) => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Biletler (Detay)`,
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
    sheet.mergeCells("A1:R1");
    for (let c = 1; c <= 18; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }
    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } =
      await getLogosForExcel(isDark);
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
        tl: { col: 14.5, row: 0.23 },
        ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any,
      } as any);
    }

    // Columns matching Detay tab order (MICE alanlarıyla uyumlu)
    sheet.columns = [
      { header: "Voucher", key: "voucher", width: 16 },
      { header: "BİLETLEME TARİHİ", key: "ticketing", width: 16 },
      { header: "Tür", key: "type", width: 10 },
      { header: "C-IN / C-OUT", key: "checkInOut", width: 20 },
      { header: "FİRMA ADI", key: "company", width: 20 },
      { header: "ACENTE/MÜŞTERİ", key: "customer", width: 24 },
      { header: "Misafir Adı", key: "guest", width: 28 },
      { header: "PNR", key: "pnr", width: 16 },
      { header: "Uçuş Tarihi", key: "flight_date", width: 14 },
      { header: "GİDİŞ SAATİ", key: "dep_time", width: 12 },
      { header: "DÖNÜŞ TARİHİ", key: "ret_date", width: 14 },
      { header: "DÖNÜŞ SAATİ", key: "ret_time", width: 12 },
      { header: "HAVAYOLU", key: "airline", width: 12 },
      { header: "GÜZERGAH", key: "route", width: 16 },
      { header: "UÇUŞ NO", key: "flight_no", width: 12 },
      { header: "TEDARİKÇİ", key: "supplier", width: 20 },
      { header: "MALİYET", key: "cost", width: 12 },
      { header: "MALİYET DÖVİZİ", key: "cost_cur", width: 14 },
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    // Sayısal sütun biçimi
    sheet.getColumn("cost").numFmt = "#,##0.00";
    sheet.getColumn("cost").alignment = { horizontal: "right" } as any;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F3B46" },
      } as any;
      cell.alignment = { vertical: "middle", horizontal: "center" } as any;
    });
    const fmtDate = (d?: string) =>
      d ? new Date(d).toLocaleDateString("tr-TR") : "";
    const fmtTime = (t?: string) =>
      t
        ? t.includes("T")
          ? new Date(t).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : t
        : "";
    const typeFromId = (sid?: string) =>
      sid && typeof sid === "string" && sid.startsWith("project:")
        ? "MICE"
        : "Sejour";
    rows.forEach((t: any) => {
      const guest =
        (typeof t.guestNames === "string" && t.guestNames.trim()) || "";
      sheet.addRow({
        voucher: t.voucherNumber || "",
        ticketing: fmtDate(t.ticketingDate),
        type: typeFromId(t.sejourId),
        customer: t.agencyName || t.customerName || "",
        company: t.companyName || "",
        checkInOut:
          t.checkInDate && t.checkOutDate
            ? `${fmtDate(t.checkInDate)} / ${fmtDate(t.checkOutDate)}`
            : "",
        guest: guest,
        pnr: t.pnr || "",
        flight_date: fmtDate(t.flightDate),
        dep_time: fmtTime(t.departureTime),
        ret_date: fmtDate(t.returnDate),
        ret_time: fmtTime(t.returnDepartureTime),
        airline: t.airline || "",
        route: t.route || "",
        flight_no: t.flightNo || "",
        supplier: t.ticketingProviderName || t.ticketingProvider || "",
        cost: Number(t.costPrice || 0),
        cost_cur: t.costCurrency || "",
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biletler_detay_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // ExcelJS ile Özet Export
  const exportSummaryExcel = async (rows: any[], suppliersList: any[] = []) => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Biletler (Özet)`,
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
    const top = sheet.addRow([]);
    top.height = 48;
    sheet.mergeCells("A1:R1");
    for (let c = 1; c <= 18; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }
    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } =
      await getLogosForExcel(isDark);
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
        tl: { col: 14.5, row: 0.23 },
        ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any,
      } as any);
    }

    sheet.columns = [
      { header: "Voucher", key: "voucher", width: 16 },
      { header: "BİLETLEME TARİHİ", key: "ticketing", width: 16 },
      { header: "Tür", key: "type", width: 10 },
      { header: "C-IN / C-OUT", key: "checkInOut", width: 20 },
      { header: "FİRMA ADI", key: "company", width: 20 },
      { header: "ACENTE/MÜŞTERİ", key: "customer", width: 24 },
      { header: "Misafir Adı", key: "guest", width: 28 },
      { header: "PNR", key: "pnr", width: 16 },
      { header: "Gidiş Tarihi", key: "dep_date", width: 14 },
      { header: "GİDİŞ SAATİ", key: "dep_time", width: 12 },
      { header: "Dönüş Tarihi", key: "ret_date", width: 14 },
      { header: "DÖNÜŞ SAATİ", key: "ret_time", width: 12 },
      { header: "HAVAYOLU", key: "airline", width: 12 },
      { header: "GÜZERGAH", key: "route", width: 16 },
      { header: "UÇUŞ NO", key: "flight_no", width: 12 },
      { header: "TEDARİKÇİ", key: "supplier", width: 20 },
      { header: "MALİYET", key: "cost", width: 12 },
      { header: "MALİYET DÖVİZİ", key: "cost_cur", width: 14 },
    ];
    const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
    sheet.getRow(headerRow.number).height = 18;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2F3B46" },
      } as any;
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: false,
        indent: 0,
      } as any;
    });
    const fmtDate = (d?: string) =>
      d ? new Date(d).toLocaleDateString("tr-TR") : "";
    const fmtTime = (t?: string) =>
      t
        ? t.includes("T")
          ? new Date(t).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : t
        : "";
    // Maliyet sütunu sayı formatı (yalnızca veri hücrelerinde sağa hizalama uygulayacağız)
    sheet.getColumn("cost").numFmt = "#,##0.00";
    const typeFromId = (sid?: string) =>
      sid && typeof sid === "string" && sid.startsWith("project:")
        ? "MICE"
        : "Sejour";
    rows.forEach((s: any) => {
      const guestNames =
        (typeof s.guestNames === "string" && s.guestNames.trim()) || "";
      const supplierName =
        suppliersList.find(
          (sup: any) =>
            sup.id === s.ticketingProvider || sup.code === s.ticketingProvider,
        )?.name ||
        s.ticketingProvider ||
        "";
      const dataRow = sheet.addRow({
        voucher: s.voucherNumber || "",
        ticketing: fmtDate(s.ticketingDate),
        type: typeFromId(s.sejourId),
        customer: s.agencyName || s.customerName || "",
        company: s.companyName || "",
        checkInOut:
          s.checkInDate && s.checkOutDate
            ? `${fmtDate(s.checkInDate)} / ${fmtDate(s.checkOutDate)}`
            : "",
        guest: guestNames,
        pnr: s.pnr || "",
        dep_date: fmtDate(s.departureDate || s.flightDate),
        dep_time: fmtTime(s.departureTime),
        ret_date: fmtDate(s.returnDate),
        ret_time: fmtTime(s.returnDepartureTime || s.arrivalTime),
        airline: s.airline || s.airlines || "",
        route: s.route || s.departureRoute || "",
        flight_no: s.flightNo || "",
        supplier: supplierName || s.ticketingProvider || "",
        cost: Number(s.totalCost || 0),
        cost_cur: s.costCurrency || "",
      });
      // Veri satırı: cost hücresi sağa hizalı
      dataRow.getCell(15).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any;
    });
    // En sonda başlık O2 ve P2 ortalaması (kolon stilleri olası override etmesin)
    headerRow.getCell(15).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
      indent: 0,
    } as any;
    headerRow.getCell(16).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
      indent: 0,
    } as any;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biletler_ozet_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleApplyTicketingDates = (start?: string, end?: string) => {
    setDateRange({
      startDate: start !== undefined ? start : draftTicketingStart,
      endDate: end !== undefined ? end : draftTicketingEnd,
    });
    setPage(1);
    setForceReload((prev) => prev + 1);
  };

  const handleApplyFlightDates = (start?: string, end?: string) => {
    setFlightDateRange({
      startDate: start !== undefined ? start : draftFlightStart,
      endDate: end !== undefined ? end : draftFlightEnd,
    });
    setPage(1);
    setForceReload((prev) => prev + 1);
  };

  const loadData = async () => {
    try {
      if (!initialFetchDone) setLoading(true);
      else setTableBusy(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        searchTerm: pnrTokens.join(" "),
        filter,
        sortField,
        sortDirection,
        startDate: dateRange.startDate || "",
        endDate: dateRange.endDate || "",
        flightStartDate: flightDateRange.startDate || "",
        flightEndDate: flightDateRange.endDate || "",
        voucherTerms: JSON.stringify(voucherTerms),
        customerTerms: JSON.stringify(customerTerms),
        pnrTerms: JSON.stringify(pnrTerms),
        airlineTerms: JSON.stringify(airlineTerms),
        supplierTerms: JSON.stringify(supplierTerms),
        guestTerms: JSON.stringify(guestTerms),
      });
      const response = await fetch(
        `/api/operations/tickets?${params.toString()}`,
      );
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Bilet verileri alınamadı");
      }

      setTickets(Array.isArray(result.data) ? result.data : []);
      setTotalCount(Number(result.total || 0));
      setTotalPages(Number(result.totalPages || 1));
      if (result.typeCounts) {
        setTypeCounts(result.typeCounts);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Veri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
      setTableBusy(false);
      setInitialFetchDone(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    page,
    pageSize,
    scopedSearchState,
    filter,
    sortField,
    sortDirection,
    dateRange,
    flightDateRange,
    forceReload,
  ]);

  // Filtreleri temizleme fonksiyonu
  const clearFilters = () => {
    setVoucherTokens([]);
    setVoucherInput("");
    setCustomerTokens([]);
    setCustomerInput("");
    setPnrTokens([]);
    setPnrInput("");
    setAirlineTokens([]);
    setAirlineInput("");
    setSupplierTokens([]);
    setSupplierInput("");
    setGuestTokens([]);
    setGuestInput("");
    setDraftTicketingStart("");
    setDraftTicketingEnd("");
    setDateRange({ startDate: "", endDate: "" });
    setDraftFlightStart("");
    setDraftFlightEnd("");
    setFlightDateRange({ startDate: "", endDate: "" });
    setFilter("all");
    setPage(1);
    setFilterKey((prev) => prev + 1);
    setForceReload((prev) => prev + 1);
  };

  // Tedarikçi kodunu isme çevir
  const getSupplierName = (supplierCode: string) => {
    if (!supplierCode) return "";
    const supplier = suppliers.find(
      (s) => s.code === supplierCode || s.id === supplierCode,
    );
    return supplier ? supplier.name : supplierCode;
  };

  // Sejour türünü belirle
  const getSejourType = (sejourId: string) => {
    if (sejourId && sejourId.startsWith("project:")) return "MICE";
    const sejour = sejours.find((s) => s.id === sejourId);
    if (!sejour) return "Sejour";
    return "Sejour";
  };

  // Sıralama fonksiyonu
  const handleSort = (field: keyof Ticket) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Voucher numarasına tıklandığında önizleme aç
  const handleVoucherClick = (sejourId: string) => {
    if (sejourId && sejourId.startsWith("project:")) {
      const projectId = sejourId.replace("project:", "");
      window.open(`/projects/${projectId}`, "_blank");
    } else {
      window.open(`/sejour/${sejourId}`, "_blank");
    }
  };

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const statusCardCounts = useMemo(
    () => ({
      all: tickets.length,
      pending: tickets.filter((t) => t.status === "pending").length,
      confirmed: tickets.filter((t) => t.status === "confirmed").length,
      completed: tickets.filter((t) => t.status === "completed").length,
      cancelled: tickets.filter((t) => t.status === "cancelled").length,
    }),
    [tickets],
  );

  const voucherSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          tickets.map((t) => (t.voucherNumber || "").trim()).filter(Boolean),
        ),
      ),
    [tickets],
  );
  const customerSuggestions = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach((t) => {
      if ((t.customerName || "").trim()) s.add(t.customerName.trim());
      if ((t.agencyName || "").trim()) s.add(t.agencyName.trim());
    });
    return Array.from(s);
  }, [tickets]);
  const pnrSuggestions = useMemo(
    () =>
      Array.from(
        new Set(tickets.map((t) => (t.pnr || "").trim()).filter(Boolean)),
      ),
    [tickets],
  );
  const airlineSuggestions = useMemo(
    () =>
      Array.from(
        new Set(tickets.map((t) => (t.airline || "").trim()).filter(Boolean)),
      ),
    [tickets],
  );
  const supplierSuggestions = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach((t) => {
      const code = (t.ticketingProvider || "").trim();
      if (!code) return;
      s.add(code);
      const name = suppliers.find(
        (sup: any) => sup.id === code || sup.code === code,
      )?.name;
      if (name?.trim()) s.add(name.trim());
    });
    return Array.from(s);
  }, [tickets, suppliers]);
  const guestSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          tickets.map((t) => (t.guestNames || "").trim()).filter(Boolean),
        ),
      ),
    [tickets],
  );

  const clearAllFilters = () => {
    setStatusFilter("all");
    setDraftTicketingStart("");
    setDraftTicketingEnd("");
    setDateRange({ startDate: "", endDate: "" });
    setDraftFlightStart("");
    setDraftFlightEnd("");
    setFlightDateRange({ startDate: "", endDate: "" });
    setVoucherTokens([]);
    setVoucherInput("");
    setCustomerTokens([]);
    setCustomerInput("");
    setPnrTokens([]);
    setPnrInput("");
    setAirlineTokens([]);
    setAirlineInput("");
    setSupplierTokens([]);
    setSupplierInput("");
    setGuestTokens([]);
    setGuestInput("");
    setPage(1);
  };

  // Sıralama uygula
  const sortedTickets = filteredTickets;
  const paginatedTickets = {
    items: sortedTickets,
    page,
    pageSize,
    total: totalCount,
    totalPages,
  };

  // Özet verileri hesapla (Voucher No ve PNR'a göre grupla)
  const summaryData = useMemo(() => {
    if (!filteredTickets.length) return [];

    const summaryMap = new Map();

    filteredTickets.forEach((ticket) => {
      const key = `${ticket.voucherNumber}-${ticket.pnr}`;

      if (summaryMap.has(key)) {
        const existing = summaryMap.get(key);
        existing.flightCount++;
        existing.totalCost += ticket.costPrice || 0;
        existing.totalPrice += ticket.price || 0;
        existing.flightDates.push(ticket.flightDate);
        // MICE dönüş tarih/saat bilgilerini de topla
        if (ticket.returnDate) {
          (existing.returnDates ||= []).push(ticket.returnDate);
        }
        if (ticket.returnDepartureTime) {
          existing.arrivalTime =
            existing.arrivalTime || ticket.returnDepartureTime;
        }
        if (!existing.departureTime && ticket.departureTime)
          existing.departureTime = ticket.departureTime;
        existing.airlines.add(ticket.airline);
        existing.routes.add(ticket.route);
        // Ek detayları da ekle
        if (ticket.ticketingProvider)
          existing.ticketingProvider = ticket.ticketingProvider;
        if (ticket.flightNo) existing.flightNo = ticket.flightNo;
        if (ticket.ticketingDate) existing.ticketingDate = ticket.ticketingDate;
        if (ticket.notes) existing.notes = ticket.notes;
        if (ticket.created_at) existing.created_at = ticket.created_at;
        if (ticket.guestNames)
          existing.guestNames = existing.guestNames || ticket.guestNames;
        // C-IN/C-OUT ve Firma bilgilerini ekle (ilk geleni koru)
        if (!existing.checkInDate && ticket.checkInDate)
          existing.checkInDate = ticket.checkInDate;
        if (!existing.checkOutDate && ticket.checkOutDate)
          existing.checkOutDate = ticket.checkOutDate;
        if (!existing.companyName && (ticket as any).companyName)
          existing.companyName = (ticket as any).companyName;
      } else {
        summaryMap.set(key, {
          voucherNumber: ticket.voucherNumber,
          pnr: ticket.pnr,
          customerName: ticket.customerName,
          agencyName: ticket.agencyName,
          flightCount: 1,
          totalCost: ticket.costPrice || 0,
          totalPrice: ticket.price || 0,
          costCurrency: ticket.costCurrency,
          priceCurrency: ticket.currency,
          flightDates: [ticket.flightDate],
          airlines: new Set([ticket.airline]),
          routes: new Set([ticket.route]),
          sejourId: ticket.sejourId,
          guestNames: ticket.guestNames,
          checkInDate: ticket.checkInDate,
          checkOutDate: ticket.checkOutDate,
          companyName: (ticket as any).companyName,
          // Ek detaylar
          ticketingProvider: ticket.ticketingProvider,
          flightNo: ticket.flightNo,
          departureTime: ticket.departureTime,
          arrivalTime: ticket.returnDepartureTime || ticket.arrivalTime,
          ticketingDate: ticket.ticketingDate,
          notes: ticket.notes,
          created_at: ticket.created_at,
          returnDates: ticket.returnDate ? [ticket.returnDate] : [],
        });
      }
    });

    return Array.from(summaryMap.values()).map((item) => {
      // Filtrelere uygun uçuş tarihlerini filtrele
      let filteredFlightDates: string[] = [...new Set(item.flightDates)].filter(
        (date): date is string => typeof date === "string",
      );

      // Uçuş tarihi filtresi uygula
      if (flightDateRange.startDate) {
        filteredFlightDates = filteredFlightDates.filter(
          (date: string) =>
            new Date(date) >= new Date(flightDateRange.startDate),
        );
      }

      if (flightDateRange.endDate) {
        filteredFlightDates = filteredFlightDates.filter(
          (date: string) => new Date(date) <= new Date(flightDateRange.endDate),
        );
      }

      // Biletleme tarihi filtresi uygula
      if (dateRange.startDate) {
        filteredFlightDates = filteredFlightDates.filter(
          (date: string) => new Date(date) >= new Date(dateRange.startDate),
        );
      }

      if (dateRange.endDate) {
        filteredFlightDates = filteredFlightDates.filter(
          (date: string) => new Date(date) <= new Date(dateRange.endDate),
        );
      }

      // Gidiş ve dönüş tarihleri
      const departureRoutes = new Set<string>();
      const returnRoutes = new Set<string>();
      const departureDates = new Set<string>();
      const returnDates = new Set<string>(
        Array.isArray(item.returnDates) ? item.returnDates : [],
      );
      // Gidiş tarihini mevcut flightDates'ten ilk değer olarak kabul et
      item.flightDates.forEach((date: unknown) => {
        if (typeof date === "string" && departureDates.size === 0) {
          departureDates.add(date);
        }
      });

      // Eğer dönüş tarihi set edilmemişse (Sejour senaryosu), tüm uçuş tarihleri içinden en geç tarihi dönüş olarak ata
      if (returnDates.size === 0) {
        const uniqueSorted = [
          ...new Set(
            item.flightDates.filter((d: any) => typeof d === "string"),
          ),
        ].sort();
        if (uniqueSorted.length > 1) {
          returnDates.add(uniqueSorted[uniqueSorted.length - 1] as string);
        }
      }

      // Route'ları da ayır (basit mantık)
      const routeArray = Array.from(item.routes);
      if (routeArray.length > 0 && typeof routeArray[0] === "string") {
        departureRoutes.add(routeArray[0]);
      }
      if (routeArray.length > 1 && typeof routeArray[1] === "string") {
        returnRoutes.add(routeArray[1]);
      }

      return {
        ...item,
        airlines: Array.from(item.airlines).join(", "),
        departureRoute: Array.from(departureRoutes).join(", "),
        returnRoute: Array.from(returnRoutes).join(", "),
        departureDate: Array.from(departureDates).sort().join(", "),
        returnDate: Array.from(returnDates).sort().join(", "),
        originalFlightDates: [...new Set(item.flightDates)].sort().join(", "),
        flightDates: filteredFlightDates.sort().join(", "),
        // Filtrelenmiş tarihlere göre uçuş sayısını güncelle
        filteredFlightCount: filteredFlightDates.length,
      };
    });
  }, [filteredTickets, flightDateRange, dateRange]);
  const paginatedSummary = paginateItems(summaryData, page, pageSize);
  const listTotalPages =
    activeTab === "detail" ? totalPages : paginatedSummary.totalPages;
  const listPage = activeTab === "detail" ? page : paginatedSummary.page;
  const listTotalCount =
    activeTab === "detail" ? totalCount : paginatedSummary.total;

  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    scopedSearchState,
    sortField,
    sortDirection,
    dateRange.startDate,
    dateRange.endDate,
    flightDateRange.startDate,
    flightDateRange.endDate,
    statusFilter,
  ]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.TICKETS)) {
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
    return <LoadingSpinner message="Operasyon biletleri yükleniyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">
      <div className="w-full min-w-0 flex flex-col flex-1 min-h-0">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-white glow-text">
              Bilet Opsiyon Takip
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Uçak biletlerinin opsiyon tarihlerini ve detaylarını yönetin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Opsiyon Tarihi"
                startValue={dateRange.startDate}
                endValue={dateRange.endDate}
                onStartChange={(v) => setDraftTicketingStart(v)}
                onEndChange={(v) => setDraftTicketingEnd(v)}
                onApply={handleApplyTicketingDates}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Uçuş Tarihi"
                startValue={flightDateRange.startDate}
                endValue={flightDateRange.endDate}
                onStartChange={(v) => setDraftFlightStart(v)}
                onEndChange={(v) => setDraftFlightEnd(v)}
                onApply={handleApplyFlightDates}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (PNR, Voucher, Firma, Misafir)"
                tokens={pnrTokens}
                inputValue={pnrInput}
                suggestions={pnrSuggestions}
                onInputChange={setPnrInput}
                onAddToken={(v) => addToken(v, setPnrTokens, setPnrInput)}
                onRemoveToken={(v) => removeToken(v, setPnrTokens)}
              />
            </div>

            {/* Clear Button */}
            <div className="shrink-0">
              <button
                onClick={clearFilters}
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
                onClick={async () => {
                  const enriched = tickets.map((t) => ({
                    ...t,
                    guestNames: t.guestNames || "",
                    ticketingProviderName:
                      suppliers.find(
                        (sup: any) =>
                          sup.id === t.ticketingProvider ||
                          sup.code === t.ticketingProvider,
                      )?.name ||
                      t.ticketingProvider ||
                      "",
                  }));
                  await exportDetailsExcel(enriched);
                }}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                title="Detay Excel'e Aktar"
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
                Detay Excel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await exportSummaryExcel(summaryData, suppliers);
                }}
                className="bg-blue-500 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
                title="Özet Excel'e Aktar"
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
                Özet Excel
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">
              BİLET KAYNAĞI:
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

          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="text-slate-400 font-medium uppercase tracking-wider">
              GÖRÜNÜM:
            </span>
            <button
              onClick={() => setActiveTab("detail")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${activeTab === "detail" ? "bg-purple-500/20 border border-purple-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>📋 DETAY</span>
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${activeTab === "summary" ? "bg-pink-500/20 border border-pink-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>📊 ÖZET</span>
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px] relative">
          {tableBusy && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-gray-900/50 backdrop-blur-[1px]"
              aria-busy="true"
              aria-label="Yükleniyor"
            >
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-600" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
            </div>
          )}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
                <tr>
                  {activeTab === "detail" ? (
                    <>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("voucherNumber")}
                      >
                        <div className="flex items-center">
                          Voucher
                          {sortField === "voucherNumber" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("ticketingDate")}
                      >
                        <div className="flex items-center">
                          BİLETLEME TARİHİ
                          {sortField === "ticketingDate" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("sejourId")}
                      >
                        <div className="flex items-center">
                          Tür
                          {sortField === "sejourId" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("checkInOut")}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex items-center">C-IN / C-OUT</div>
                          {sortField === "checkInOut" && (
                            <span className="shrink-0 self-center text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("companyName")}
                      >
                        <div className="flex items-center">
                          FİRMA ADI
                          {sortField === "companyName" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("customerName")}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex items-center">
                            Acente / Müşteri
                          </div>
                          {sortField === "customerName" && (
                            <span className="shrink-0 self-center text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                        <div className="flex items-center">Misafir Adı</div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("pnr")}
                      >
                        <div className="flex items-center">
                          PNR
                          {sortField === "pnr" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("flightDate")}
                      >
                        <div className="flex items-center">
                          Uçuş Tarihi
                          {sortField === "flightDate" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10">
                        <div className="flex items-center">GİDİŞ SAATİ</div>
                      </th>
                      {/* MICE özel sütunları */}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                        Dönüş Tarihi
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                        DÖNÜŞ SAATİ
                      </th>

                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("airline")}
                      >
                        <div className="flex items-center">
                          HAVAYOLU
                          {sortField === "airline" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("route")}
                      >
                        <div className="flex items-center">
                          GÜZERGAH
                          {sortField === "airline" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("flightNo")}
                      >
                        <div className="flex items-center">
                          UÇUŞ NO
                          {sortField === "flightNo" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("ticketingProvider")}
                      >
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs tracking-wide leading-tight">
                            TEDARİKÇİ
                          </span>
                          {sortField === "ticketingProvider" && (
                            <span className="shrink-0 text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>

                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("costPrice")}
                      >
                        <div className="flex items-center">
                          MALİYET
                          {sortField === "costPrice" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("costCurrency")}
                      >
                        <div className="flex items-center">
                          MALİYET DÖVİZİ
                          {sortField === "costCurrency" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("voucherNumber")}
                      >
                        <div className="flex items-center">
                          VOUCHER
                          {sortField === "voucherNumber" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("ticketingDate")}
                      >
                        <div className="flex items-center">
                          BİLETLEME TARİHİ
                          {sortField === "ticketingDate" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("sejourId")}
                      >
                        <div className="flex items-center">
                          TÜR
                          {sortField === "sejourId" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("checkInOut")}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex items-center">C-IN / C-OUT</div>
                          {sortField === "checkInOut" && (
                            <span className="shrink-0 self-center text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("companyName")}
                      >
                        <div className="flex items-center">
                          FİRMA ADI
                          {sortField === "companyName" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("customerName")}
                      >
                        <div className="flex items-center gap-0.5">
                          <div className="flex items-center">
                            Acente / Müşteri
                          </div>
                          {sortField === "customerName" && (
                            <span className="shrink-0 self-center text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                        <div className="flex items-center">Misafir Adı</div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("pnr")}
                      >
                        <div className="flex items-center">
                          PNR
                          {sortField === "pnr" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("flightDate")}
                      >
                        <div className="flex items-center">
                          GİDİŞ TARİHİ
                          {sortField === "flightDate" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10">
                        <div className="flex items-center">GİDİŞ SAATİ</div>
                      </th>
                      <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10">
                        <div className="flex items-center">DÖNÜŞ TARİHİ</div>
                      </th>
                      <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10">
                        <div className="flex items-center">DÖNÜŞ SAATİ</div>
                      </th>

                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("airline")}
                      >
                        <div className="flex items-center">
                          Havayolu
                          {sortField === "airline" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("route")}
                      >
                        <div className="flex items-center">
                          Güzergah
                          {sortField === "route" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("flightNo")}
                      >
                        <div className="flex items-center">
                          Uçuş No
                          {sortField === "flightNo" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("ticketingProvider")}
                      >
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs tracking-wide leading-tight">
                            TEDARİKÇİ
                          </span>
                          {sortField === "ticketingProvider" && (
                            <span className="shrink-0 text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>

                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("costPrice")}
                      >
                        <div className="flex items-center">
                          Maliyet
                          {sortField === "costPrice" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                        onClick={() => handleSort("costCurrency")}
                      >
                        <div className="flex items-center">
                          Maliyet Dövizi
                          {sortField === "costCurrency" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeTab === "detail"
                  ? paginatedTickets.items.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                          <button
                            onClick={() => handleVoucherClick(ticket.sejourId)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                          >
                            {ticket.voucherNumber}
                          </button>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {formatDateCustom(ticket.ticketingDate)}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${"bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-400"}`}
                          >
                            {getSejourType(ticket.sejourId)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.checkInDate && ticket.checkOutDate ? (
                            <div className="flex items-center leading-tight">
                              <span>
                                {formatDateCustom(ticket.checkInDate)}
                                <br />
                                {formatDateCustom(ticket.checkOutDate)}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.companyName || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className="block truncate"
                            title={
                              agencyCustomerTooltip(ticket) ||
                              agencyCustomerLine(ticket)
                            }
                          >
                            {agencyCustomerLine(ticket)}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className="block truncate whitespace-nowrap overflow-hidden text-ellipsis"
                            title={
                              (ticket.guestNames && ticket.guestNames.trim()) ||
                              getGuestNames(ticket.sejourId)
                            }
                          >
                            {(ticket.guestNames && ticket.guestNames.trim()) ||
                              getGuestNames(ticket.sejourId)}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.pnr}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {formatDateCustom(ticket.flightDate)}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.departureTime
                            ? formatTime(ticket.departureTime)
                            : "-"}
                        </td>
                        {/* MICE özel hücreler: sadece project:* için değer göster, aksi halde '-' */}
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.sejourId?.startsWith("project:")
                            ? ticket.returnDate
                              ? formatDateCustom(ticket.returnDate)
                              : "-"
                            : "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.sejourId?.startsWith("project:")
                            ? ticket.returnDepartureTime
                              ? formatTime(ticket.returnDepartureTime)
                              : "-"
                            : "-"}
                        </td>

                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.airline}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.route}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.flightNo}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className="block truncate whitespace-nowrap"
                            title={
                              getSupplierName(ticket.ticketingProvider) || ""
                            }
                          >
                            {getSupplierName(ticket.ticketingProvider)}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {formatNumber(ticket.costPrice)}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {ticket.costCurrency}
                        </td>
                      </tr>
                    ))
                  : paginatedSummary.items.map((summary: any, idx: number) => (
                      <tr
                        key={`${summary.voucherNumber}-${summary.pnr}-${idx}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                          <button
                            onClick={() => handleVoucherClick(summary.sejourId)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer transition-colors duration-200"
                          >
                            {summary.voucherNumber}
                          </button>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.ticketingDate
                            ? formatDateCustom(summary.ticketingDate)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${"bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-400"}`}
                          >
                            {getSejourType(summary.sejourId)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-900 dark:text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.checkInDate && summary.checkOutDate ? (
                            <div className="flex items-center leading-tight">
                              <span>
                                {formatDateCustom(summary.checkInDate)}
                                <br />
                                {formatDateCustom(summary.checkOutDate)}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.companyName || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className="block truncate"
                            title={
                              agencyCustomerTooltip(summary) ||
                              agencyCustomerLine(summary)
                            }
                          >
                            {agencyCustomerLine(summary)}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className="block truncate whitespace-nowrap overflow-hidden text-ellipsis"
                            title={
                              (summary.guestNames &&
                                summary.guestNames.trim()) ||
                              getGuestNames(summary.sejourId)
                            }
                          >
                            {(summary.guestNames &&
                              summary.guestNames.trim()) ||
                              getGuestNames(summary.sejourId)}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.pnr || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.departureDate
                            ? formatDateCustom(summary.departureDate)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.departureTime
                            ? formatTime(summary.departureTime)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.returnDate
                            ? formatDateCustom(summary.returnDate)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.arrivalTime
                            ? formatTime(summary.arrivalTime)
                            : "-"}
                        </td>

                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.airline || summary.airlines || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.route || summary.departureRoute || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.flightNo || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          <span
                            className="block truncate whitespace-nowrap"
                            title={
                              getSupplierName(summary.ticketingProvider) || ""
                            }
                          >
                            {getSupplierName(summary.ticketingProvider) || "-"}
                          </span>
                        </td>

                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {formatNumber(
                            summary.costPrice || summary.totalCost || 0,
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 text-[11px] text-white transition-colors duration-200 whitespace-nowrap">
                          {summary.costCurrency || "-"}
                        </td>
                      </tr>
                    ))}

                {listTotalCount === 0 && !tableBusy && (
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
            page={listPage}
            pageSize={pageSize}
            total={listTotalCount}
            totalPages={listTotalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            preferenceKey="tickets_page_size"
          />
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg transition-colors duration-200 z-50">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg transition-colors duration-200 z-50">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
