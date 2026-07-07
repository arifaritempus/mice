"use client";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { usePermissions, Module } from "@/lib/permissions";
import {
  ticketOptionsService,
  AgencyService,
  SupplierService,
} from "@/lib/supabaseService";
import PaginationControls from "@/components/PaginationControls";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";
import { toast } from "react-hot-toast";
import Modal from "@/components/Modal";
import { Trash2, AlertCircle } from "lucide-react";
import { getLogosForExcel } from "@/utils/logoUtils";

interface TicketOption {
  id: string;
  voucher_no: string;
  agent: string;
  company_name: string;
  supplier: string;
  airline: string;
  group_ref_no: string;
  flight_type: string;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  route: string;
  passenger_count: number;
  pp_cost: number;
  total_cost: number;
  currency: string;
  option_end_date: string;
  option_end_time: string;
  pnr: string;
  status: "active" | "expired" | "confirmed" | "cancelled";
  entry_date: string;
}

interface Agency {
  id: string;
  name: string;
  company_name: string;
}

interface Supplier {
  id: string;
  name: string;
  title: string;
}

const parseTypedDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = parseDateFns(trimmed, "dd.MM.yyyy", new Date());
  if (!isValidDate(parsed)) return null;
  return formatDateFns(parsed, "yyyy-MM-dd");
};

/** ISO / DB datetime → yerel takvim günü YYYY-MM-DD (UTC split ve saat kayması olmadan) */
function toCalendarYmd(value: string | Date | null | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const y = value.getFullYear();
    const mo = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const mo = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export default function TicketOptionsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Searchable Select Component
  const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = "Seçin...",
    className = "",
  }: {
    options: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const selected = options.find((o) => o.name === value);
    const display = open ? query : selected?.name || "";

    const filtered = useMemo(() => {
      if (!query) return options.slice(0, 100);
      const lowerQuery = query.toLowerCase();
      return options
        .filter((o) => o.name?.toLowerCase().includes(lowerQuery))
        .slice(0, 100);
    }, [options, query]);

    const handleSelect = (name: string) => {
      onChange(name);
      setOpen(false);
      setQuery("");
    };

    return (
      <div className="relative w-full">
        <input
          type="text"
          value={display}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              setOpen(true);
              e.preventDefault();
              return;
            }
            if (!open) return;
            if (e.key === "ArrowDown") {
              setHighlight((h) =>
                Math.min(h + 1, Math.max(filtered.length - 1, 0)),
              );
              e.preventDefault();
            }
            if (e.key === "ArrowUp") {
              setHighlight((h) => Math.max(h - 1, 0));
              e.preventDefault();
            }
            if (e.key === "Enter") {
              const opt = filtered[highlight];
              if (opt) handleSelect(opt.name);
              e.preventDefault();
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className={className || "w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"}
        />
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {filtered.map((opt, idx) => (
              <button
                type="button"
                key={opt.id}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.name)}
                className={`w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  idx === highlight ? "bg-blue-500/10 dark:bg-blue-900/30" : ""
                } text-gray-900 dark:text-white`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}
        {open && filtered.length === 0 && query && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
            Sonuç bulunamadı
          </div>
        )}
      </div>
    );
  };
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "confirmed" | "cancelled"
  >("all");
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" }); // Uçuş Tarihi
  const [flightDateRange, setFlightDateRange] = useState({
    startDate: todayStr,
    endDate: "",
  }); // Opsiyon Tarihi

  const [voucherTokens, setVoucherTokens] = useState<string[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [customerTokens, setCustomerTokens] = useState<string[]>([]);
  const [customerInput, setCustomerInput] = useState("");
  const [supplierTokens, setSupplierTokens] = useState<string[]>([]);
  const [supplierInput, setSupplierInput] = useState("");
  const [airlineTokens, setAirlineTokens] = useState<string[]>([]);
  const [airlineInput, setAirlineInput] = useState("");
  const [routeTokens, setRouteTokens] = useState<string[]>([]);
  const [routeInput, setRouteInput] = useState("");

  const [filterKey, setFilterKey] = useState(0);

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

  const voucherTerms = useMemo(() => [...voucherTokens], [voucherTokens]);
  const customerTerms = useMemo(() => [...customerTokens], [customerTokens]);
  const supplierTerms = useMemo(() => [...supplierTokens], [supplierTokens]);
  const airlineTerms = useMemo(() => [...airlineTokens], [airlineTokens]);
  const routeTerms = useMemo(() => [...routeTokens], [routeTokens]);

  const scopedSearchState = useMemo(
    () =>
      JSON.stringify({
        voucherTerms,
        customerTerms,
        supplierTerms,
        airlineTerms,
        routeTerms,
      }),
    [voucherTerms, customerTerms, supplierTerms, airlineTerms, routeTerms],
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketOption | null>(
    null,
  );
  const [confirmPassengerCount, setConfirmPassengerCount] = useState(0);
  const [confirmDate, setConfirmDate] = useState("");
  const [confirmPnr, setConfirmPnr] = useState("");

  // Durum değiştirme modal state'leri
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeTicket, setStatusChangeTicket] =
    useState<TicketOption | null>(null);
  const [newStatus, setNewStatus] = useState<
    "active" | "expired" | "confirmed" | "cancelled"
  >("active");

  // Silme Onay Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Yeni state'ler
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketOption | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ExcelJS ile Export
  const exportOptionsExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Bilet Opsiyonları`,
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
    sheet.mergeCells("A1:Q1");
    for (let c = 1; c <= 17; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64 } =
      await getLogosForExcel(false); // Açık tema logosu kullan
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

    // Columns
    sheet.columns = [
      { header: "VOUCHER NO", key: "voucher_no", width: 16 },
      { header: "ACENTE", key: "agent", width: 20 },
      { header: "FİRMA ADI", key: "company_name", width: 22 },
      { header: "TEDARİKÇİ", key: "supplier", width: 20 },
      { header: "HAVAYOLU", key: "airline", width: 12 },
      { header: "GRUP REF NO", key: "group_ref_no", width: 16 },
      { header: "UÇUŞ TİPİ", key: "flight_type", width: 14 },
      { header: "GİDİŞ TARİHİ", key: "departure_date", width: 14 },
      { header: "GİDİŞ SAATİ", key: "departure_time", width: 12 },
      { header: "DÖNÜŞ TARİHİ", key: "return_date", width: 14 },
      { header: "DÖNÜŞ SAATİ", key: "return_time", width: 12 },
      { header: "GÜZERGAH", key: "route", width: 16 },
      { header: "KİŞİ SAYISI", key: "passenger_count", width: 12 },
      { header: "PP MALİYET", key: "pp_cost", width: 12 },
      { header: "TOPLAM MALİYET", key: "total_cost", width: 14 },
      { header: "DÖVİZ", key: "currency", width: 8 },
      { header: "DURUM", key: "status", width: 12 },
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

    // Sayısal sütunlar
    sheet.getColumn("passenger_count").numFmt = "0";
    sheet.getColumn("pp_cost").numFmt = "#,##0.00";
    sheet.getColumn("total_cost").numFmt = "#,##0.00";

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
    const getStatusText = (status: string) => {
      switch (status) {
        case "active":
          return "Aktif";
        case "expired":
          return "Süresi Dolmuş";
        case "confirmed":
          return "Konfirme";
        case "cancelled":
          return "İptal";
        default:
          return status;
      }
    };

    sortedOptions.forEach((option: any) => {
      const dataRow = sheet.addRow({
        voucher_no: option.voucher_no || "",
        agent: option.agent || "",
        company_name: option.company_name || "",
        supplier: option.supplier || "",
        airline: option.airline || "",
        group_ref_no: option.group_ref_no || "",
        flight_type: option.flight_type || "",
        departure_date: fmtDate(option.departure_date),
        departure_time: fmtTime(option.departure_time),
        return_date: fmtDate(option.return_date),
        return_time: fmtTime(option.return_time),
        route: option.route || "",
        passenger_count: Number(option.passenger_count || 0),
        pp_cost: Number(option.pp_cost || 0),
        total_cost: Number(option.total_cost || 0),
        currency: option.currency || "",
        status: getStatusText(option.status),
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      dataRow.getCell(13).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // passenger_count
      dataRow.getCell(14).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // pp_cost
      dataRow.getCell(15).alignment = {
        horizontal: "right",
        vertical: "middle",
      } as any; // total_cost
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bilet_opsiyonlari_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Yeni form state'i
  const [newTicketOption, setNewTicketOption] = useState({
    voucher_no: "",
    agent: "",
    company_name: "",
    supplier: "",
    airline: "",
    group_ref_no: "",
    flight_type: "",
    departure_date: "",
    departure_time: "",
    return_date: "",
    return_time: "",
    route: "",
    passenger_count: 0,
    pp_cost: 0,
    total_cost: 0,
    currency: "TRY",
    option_end_date: toCalendarYmd(new Date()),
    option_end_time: "",
    pnr: "",
  });

  // Düzenleme form state'i
  const [editTicketOption, setEditTicketOption] = useState({
    voucher_no: "",
    agent: "",
    company_name: "",
    supplier: "",
    airline: "",
    group_ref_no: "",
    flight_type: "",
    departure_date: "",
    departure_time: "",
    return_date: "",
    return_time: "",
    route: "",
    passenger_count: 0,
    pp_cost: 0,
    total_cost: 0,
    currency: "EUR",
    option_end_date: toCalendarYmd(new Date()),
    option_end_time: "",
    pnr: "",
  });

  // Total cost hesaplama
  useEffect(() => {
    setNewTicketOption((prev) => ({
      ...prev,
      total_cost: prev.passenger_count * prev.pp_cost,
    }));
  }, [newTicketOption.passenger_count, newTicketOption.pp_cost]);

  // Edit modal total cost hesaplama
  useEffect(() => {
    setEditTicketOption((prev) => ({
      ...prev,
      total_cost: prev.passenger_count * prev.pp_cost,
    }));
  }, [editTicketOption.passenger_count, editTicketOption.pp_cost]);

  // Verileri Supabase'den yükle
  useEffect(() => {
    const loadTicketOptions = async () => {
      try {
        setLoading(true);
        const data = await ticketOptionsService.getAll();
        // Tarih formatlarını düzenle (Supabase'den gelen formatı sayfa formatına çevir)
        const formattedData = data.map((option: any) => ({
          ...option,
          departure_date: toCalendarYmd(option.departure_date),
          return_date: toCalendarYmd(option.return_date),
          option_end_date: toCalendarYmd(option.option_end_date),
          entry_date: toCalendarYmd(option.entry_date),
          departure_time: option.departure_time || "",
          return_time: option.return_time || "",
          option_end_time: option.option_end_time || "",
          pnr: option.pnr || "",
          group_ref_no: option.group_ref_no || "",
          route: option.route || "",
          status: option.status || "active",
        }));
        setTicketOptions(formattedData);
      } catch (error) {
        console.error("Bilet opsiyonları yüklenirken hata:", error);
        setTicketOptions([]);
      } finally {
        setLoading(false);
        setInitialFetchDone(true);
      }
    };

    loadTicketOptions();
  }, []);

  // Acenteleri ve tedarikçileri yükle
  useEffect(() => {
    loadAgenciesAndSuppliers();
  }, []);

  const loadAgenciesAndSuppliers = async () => {
    try {
      // Acenteleri Supabase'den yükle
      const agenciesData = await AgencyService.getAgencies();
      setAgencies(
        agenciesData.map((agency: any) => ({
          id: agency.id,
          name: agency.name,
          company_name: agency.company_name || agency.name,
        })),
      );

      // Tedarikçileri Supabase'den yükle
      const suppliersData = await SupplierService.getSuppliers();
      setSuppliers(
        suppliersData.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name,
          title: supplier.title || supplier.name,
        })),
      );
    } catch (error) {
      console.error("Acenteler ve tedarikçiler yüklenirken hata:", error);
    }
  };

  const tokenDateFilteredOptions = useMemo(() => {
    const matchesFieldTerms = (
      terms: string[],
      values: (string | undefined)[],
    ) => {
      if (!terms.length) return true;
      const target = values.map((v) => String(v || "").toLowerCase()).join(" ");
      return terms.some((term) =>
        target.includes(String(term || "").toLowerCase()),
      );
    };

    return ticketOptions.filter((option) => {
      const hasScopedTerms =
        voucherTerms.length ||
        voucherInput ||
        customerTerms.length ||
        customerInput ||
        supplierTerms.length ||
        supplierInput ||
        airlineTerms.length ||
        airlineInput ||
        routeTerms.length ||
        routeInput;

      let matchesTokens = true;
      if (hasScopedTerms) {
        matchesTokens =
          matchesFieldTerms(
            voucherInput ? [...voucherTerms, voucherInput] : voucherTerms,
            [option.voucher_no],
          ) &&
          matchesFieldTerms(
            customerInput ? [...customerTerms, customerInput] : customerTerms,
            [option.agent, option.company_name],
          ) &&
          matchesFieldTerms(
            supplierInput ? [...supplierTerms, supplierInput] : supplierTerms,
            [option.supplier],
          ) &&
          matchesFieldTerms(
            airlineInput ? [...airlineTerms, airlineInput] : airlineTerms,
            [option.airline],
          ) &&
          matchesFieldTerms(
            routeInput ? [...routeTerms, routeInput] : routeTerms,
            [option.route, option.group_ref_no, option.pnr],
          );
      }

      // İlk tarih: gidiş (departure_date) alt sınır; ikinci tarih: dönüş (return_date) üst sınır — YMD yerel gün
      const depY = toCalendarYmd(option.departure_date);
      const retY = toCalendarYmd(option.return_date);
      let matchesDateRange = true;
      if (dateRange.startDate) {
        if (!depY) matchesDateRange = false;
        else matchesDateRange = depY >= dateRange.startDate;
      }
      if (matchesDateRange && dateRange.endDate && retY) {
        matchesDateRange = retY <= dateRange.endDate;
      }

      let matchesFlightDateRange = true;
      if (flightDateRange.startDate && option.option_end_date) {
        matchesFlightDateRange =
          option.option_end_date >= flightDateRange.startDate;
      }
      if (
        flightDateRange.endDate &&
        option.option_end_date &&
        matchesFlightDateRange
      ) {
        matchesFlightDateRange =
          option.option_end_date <= flightDateRange.endDate;
      }

      return matchesTokens && matchesDateRange && matchesFlightDateRange;
    });
  }, [
    ticketOptions,
    voucherTerms,
    customerTerms,
    supplierTerms,
    airlineTerms,
    routeTerms,
    dateRange.startDate,
    dateRange.endDate,
    flightDateRange.startDate,
    flightDateRange.endDate,
    voucherInput,
    customerInput,
    supplierInput,
    airlineInput,
    routeInput,
  ]);

  const statusCardCounts = useMemo(
    () => ({
      all: tokenDateFilteredOptions.length,
      active: tokenDateFilteredOptions.filter((o) => o.status === "active")
        .length,
      expired: tokenDateFilteredOptions.filter((o) => o.status === "expired")
        .length,
      confirmed: tokenDateFilteredOptions.filter(
        (o) => o.status === "confirmed",
      ).length,
      cancelled: tokenDateFilteredOptions.filter(
        (o) => o.status === "cancelled",
      ).length,
    }),
    [tokenDateFilteredOptions],
  );

  const filteredOptions = useMemo(() => {
    if (statusFilter === "all") return tokenDateFilteredOptions;
    return tokenDateFilteredOptions.filter((o) => o.status === statusFilter);
  }, [tokenDateFilteredOptions, statusFilter]);

  const sortedOptions = useMemo(() => {
    return [...filteredOptions].sort((a, b) => {
      if (!sortField) return 0;

      const aValue = (a as any)[sortField];
      const bValue = (b as any)[sortField];

      if (sortField === "agent") {
        return sortDirection === "asc"
          ? String(aValue || "").localeCompare(String(bValue || ""), "tr")
          : String(bValue || "").localeCompare(String(aValue || ""), "tr");
      }

      if (sortField === "supplier") {
        return sortDirection === "asc"
          ? String(aValue || "").localeCompare(String(bValue || ""), "tr")
          : String(bValue || "").localeCompare(String(aValue || ""), "tr");
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue, "tr")
          : bValue.localeCompare(aValue, "tr");
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (
        sortField === "entry_date" ||
        sortField === "option_end_date" ||
        sortField === "departure_date" ||
        sortField === "return_date"
      ) {
        const aDate = new Date(aValue || 0);
        const bDate = new Date(bValue || 0);
        return sortDirection === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      return 0;
    });
  }, [filteredOptions, sortField, sortDirection]);

  const voucherSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          ticketOptions.map((o) => (o.voucher_no || "").trim()).filter(Boolean),
        ),
      ),
    [ticketOptions],
  );
  const customerSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          ticketOptions.flatMap((o) =>
            [o.agent, o.company_name]
              .map((x) => (x || "").trim())
              .filter(Boolean),
          ),
        ),
      ),
    [ticketOptions],
  );
  const supplierSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          ticketOptions.map((o) => (o.supplier || "").trim()).filter(Boolean),
        ),
      ),
    [ticketOptions],
  );
  const airlineSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          ticketOptions.map((o) => (o.airline || "").trim()).filter(Boolean),
        ),
      ),
    [ticketOptions],
  );
  const routeSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const o of ticketOptions) {
      const r = (o.route || "").trim();
      if (r) set.add(r);
      const g = (o.group_ref_no || "").trim();
      if (g) set.add(g);
      const p = (o.pnr || "").trim();
      if (p) set.add(p);
    }
    return Array.from(set);
  }, [ticketOptions]);

  const paginatedOptions = paginateItems(sortedOptions, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [
    scopedSearchState,
    statusFilter,
    dateRange.startDate,
    dateRange.endDate,
    flightDateRange.startDate,
    flightDateRange.endDate,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "expired":
        return "Süresi Dolmuş";
      case "confirmed":
        return "Konfirme";
      case "cancelled":
        return "İptal";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("tr-TR");
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    try {
      // Eğer timeString zaten saat formatındaysa (HH:MM)
      if (timeString.includes(":")) {
        return timeString;
      }
      // Eğer ISO string ise
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return timeString;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    // TL para birimini TRY olarak değiştir
    const normalizedCurrency = currency === "TL" ? "TRY" : currency;

    return (
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) +
      " " +
      normalizedCurrency
    );
  };

  const clearFilters = useCallback(() => {
    setVoucherTokens([]);
    setVoucherInput("");
    setCustomerTokens([]);
    setCustomerInput("");
    setSupplierTokens([]);
    setSupplierInput("");
    setAirlineTokens([]);
    setAirlineInput("");
    setRouteTokens([]);
    setRouteInput("");
    setDateRange({ startDate: "", endDate: "" });
    setFlightDateRange({ startDate: "", endDate: "" });
    setStatusFilter("all");
    setSortField("");
    setSortDirection("asc");
    setFilterKey((k) => k + 1);
    setPage(1);
  }, []);

  const openAddModal = () => {
    setShowAddModal(true);
    setNewTicketOption({
      voucher_no: "",
      agent: "",
      company_name: "",
      supplier: "",
      airline: "",
      group_ref_no: "",
      flight_type: "",
      departure_date: "",
      departure_time: "",
      return_date: "",
      return_time: "",
      route: "",
      passenger_count: 0,
      pp_cost: 0,
      total_cost: 0,
      currency: "EUR",
      option_end_date: toCalendarYmd(new Date()),
      option_end_time: "",
      pnr: "",
    });
  };

  const handleAddTicketOption = async () => {
    try {
      const newOptionData = {
        voucher_no: newTicketOption.voucher_no,
        agent: newTicketOption.agent,
        company_name: newTicketOption.company_name,
        supplier: newTicketOption.supplier,
        airline: newTicketOption.airline,
        group_ref_no: newTicketOption.group_ref_no || null,
        flight_type: newTicketOption.flight_type,
        departure_date: newTicketOption.departure_date || null,
        departure_time: newTicketOption.departure_time || null,
        return_date: newTicketOption.return_date || null,
        return_time: newTicketOption.return_time || null,
        route: newTicketOption.route || null,
        passenger_count: newTicketOption.passenger_count,
        pp_cost: newTicketOption.pp_cost,
        total_cost: newTicketOption.passenger_count * newTicketOption.pp_cost,
        currency: newTicketOption.currency,
        option_end_date: newTicketOption.option_end_date || null,
        option_end_time: newTicketOption.option_end_time || null,
        pnr: newTicketOption.pnr || null,
        status: "active" as const,
        entry_date: toCalendarYmd(new Date()),
      };

      const createdOption = await ticketOptionsService.create(newOptionData);

      // Tarih formatlarını düzenle
      const formattedOption = {
        ...createdOption,
        departure_date: toCalendarYmd(createdOption.departure_date),
        return_date: toCalendarYmd(createdOption.return_date),
        option_end_date: toCalendarYmd(createdOption.option_end_date),
        entry_date: toCalendarYmd(createdOption.entry_date),
        departure_time: createdOption.departure_time || "",
        return_time: createdOption.return_time || "",
        option_end_time: createdOption.option_end_time || "",
        pnr: createdOption.pnr || "",
        group_ref_no: createdOption.group_ref_no || "",
        route: createdOption.route || "",
      };

      // State'i güncelle
      setTicketOptions([formattedOption, ...ticketOptions]);

      setShowAddModal(false);

      // Form'u sıfırla
      setNewTicketOption({
        voucher_no: "",
        agent: "",
        company_name: "",
        supplier: "",
        airline: "",
        group_ref_no: "",
        flight_type: "",
        departure_date: "",
        departure_time: "",
        return_date: "",
        return_time: "",
        route: "",
        passenger_count: 0,
        pp_cost: 0,
        total_cost: 0,
        currency: "TRY",
        option_end_date: toCalendarYmd(new Date()),
        option_end_time: "",
        pnr: "",
      });
    } catch (error) {
      console.error("Bilet opsiyonu eklenirken hata:", error);
      toast.error(
        "Bilet opsiyonu eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  const handleDeleteClick = (id: string) => {
    setTicketToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;

    setIsDeleting(true);
    try {
      await ticketOptionsService.delete(ticketToDelete);

      // State'i güncelle
      const updatedOptions = ticketOptions.filter(
        (option) => option.id !== ticketToDelete,
      );
      setTicketOptions(updatedOptions);
      toast.success("Bilet opsiyonu başarıyla silindi.");
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Bilet opsiyonu silinirken hata:", error);
      toast.error(
        "Bilet opsiyonu silinirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsDeleting(false);
      setTicketToDelete(null);
    }
  };

  const openEditModal = (ticket: TicketOption) => {
    setEditingTicket(ticket);
    setEditTicketOption({
      voucher_no: ticket.voucher_no,
      agent: ticket.agent,
      company_name: ticket.company_name,
      supplier: ticket.supplier,
      airline: ticket.airline,
      group_ref_no: ticket.group_ref_no,
      flight_type: ticket.flight_type,
      departure_date: ticket.departure_date,
      departure_time: ticket.departure_time || "",
      return_date: ticket.return_date,
      return_time: ticket.return_time || "",
      route: ticket.route,
      passenger_count: ticket.passenger_count,
      pp_cost: ticket.pp_cost,
      total_cost: ticket.total_cost,
      currency: ticket.currency,
      option_end_date: ticket.option_end_date,
      option_end_time: ticket.option_end_time || "",
      pnr: ticket.pnr,
    });
    setShowEditModal(true);
  };

  const handleEditTicketOption = async () => {
    if (!editingTicket) return;

    try {
      const updateData = {
        voucher_no: editTicketOption.voucher_no,
        agent: editTicketOption.agent,
        company_name: editTicketOption.company_name,
        supplier: editTicketOption.supplier,
        airline: editTicketOption.airline,
        group_ref_no: editTicketOption.group_ref_no || null,
        flight_type: editTicketOption.flight_type,
        departure_date: editTicketOption.departure_date || null,
        departure_time: editTicketOption.departure_time || null,
        return_date: editTicketOption.return_date || null,
        return_time: editTicketOption.return_time || null,
        route: editTicketOption.route || null,
        passenger_count: editTicketOption.passenger_count,
        pp_cost: editTicketOption.pp_cost,
        total_cost: editTicketOption.passenger_count * editTicketOption.pp_cost,
        currency: editTicketOption.currency,
        option_end_date: editTicketOption.option_end_date || null,
        option_end_time: editTicketOption.option_end_time || null,
        pnr: editTicketOption.pnr || null,
      };

      const updatedOption = await ticketOptionsService.update(
        editingTicket.id,
        updateData,
      );

      // Tarih formatlarını düzenle
      const formattedOption = {
        ...updatedOption,
        departure_date: toCalendarYmd(updatedOption.departure_date),
        return_date: toCalendarYmd(updatedOption.return_date),
        option_end_date: toCalendarYmd(updatedOption.option_end_date),
        entry_date: toCalendarYmd(updatedOption.entry_date),
        departure_time: updatedOption.departure_time || "",
        return_time: updatedOption.return_time || "",
        option_end_time: updatedOption.option_end_time || "",
        pnr: updatedOption.pnr || "",
        group_ref_no: updatedOption.group_ref_no || "",
        route: updatedOption.route || "",
      };

      // State'i güncelle
      const updatedOptions = ticketOptions.map((option) =>
        option.id === editingTicket.id ? formattedOption : option,
      );
      setTicketOptions(updatedOptions);

      setShowEditModal(false);
      setEditingTicket(null);
    } catch (error) {
      console.error("Bilet opsiyonu güncellenirken hata:", error);
      toast.error(
        "Bilet opsiyonu güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  const openConfirmModal = (ticket: TicketOption) => {
    setSelectedTicket(ticket);
    setConfirmPassengerCount(ticket.passenger_count);
    setConfirmDate(
      new Date().toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setConfirmPnr("");
    setShowConfirmModal(true);
  };

  const openStatusChangeModal = (ticket: TicketOption) => {
    setStatusChangeTicket(ticket);
    setNewStatus(ticket.status);
    setShowStatusChangeModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedTicket || !confirmPnr) return;

    try {
      // Supabase'de güncelle
      const updatedOption = await ticketOptionsService.update(
        selectedTicket.id,
        {
          status: "confirmed",
          pnr: confirmPnr,
          passenger_count: confirmPassengerCount,
          total_cost: confirmPassengerCount * selectedTicket.pp_cost,
        },
      );

      // Tarih formatlarını düzenle
      const formattedOption = {
        ...updatedOption,
        departure_date: toCalendarYmd(updatedOption.departure_date),
        return_date: toCalendarYmd(updatedOption.return_date),
        option_end_date: toCalendarYmd(updatedOption.option_end_date),
        entry_date: toCalendarYmd(updatedOption.entry_date),
        departure_time: updatedOption.departure_time || "",
        return_time: updatedOption.return_time || "",
        option_end_time: updatedOption.option_end_time || "",
        pnr: updatedOption.pnr || "",
        group_ref_no: updatedOption.group_ref_no || "",
        route: updatedOption.route || "",
      };

      // State'i güncelle
      const updatedOptions = ticketOptions.map((option) =>
        option.id === selectedTicket.id ? formattedOption : option,
      );
      setTicketOptions(updatedOptions);

      setShowConfirmModal(false);
      setSelectedTicket(null);
      setConfirmPnr("");
      setConfirmPassengerCount(0);
      setConfirmDate("");
    } catch (error) {
      console.error("Bilet opsiyonu konfirme edilirken hata:", error);
      toast.error(
        "Bilet opsiyonu konfirme edilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  const handleStatusChange = async () => {
    if (!statusChangeTicket) return;

    try {
      // Supabase'de güncelle
      const updatedOption = await ticketOptionsService.update(
        statusChangeTicket.id,
        {
          status: newStatus,
        },
      );

      // Tarih formatlarını düzenle
      const formattedOption = {
        ...updatedOption,
        departure_date: toCalendarYmd(updatedOption.departure_date),
        return_date: toCalendarYmd(updatedOption.return_date),
        option_end_date: toCalendarYmd(updatedOption.option_end_date),
        entry_date: toCalendarYmd(updatedOption.entry_date),
        departure_time: updatedOption.departure_time || "",
        return_time: updatedOption.return_time || "",
        option_end_time: updatedOption.option_end_time || "",
        pnr: updatedOption.pnr || "",
        group_ref_no: updatedOption.group_ref_no || "",
        route: updatedOption.route || "",
      };

      // State'i güncelle
      const updatedOptions = ticketOptions.map((option) =>
        option.id === statusChangeTicket.id ? formattedOption : option,
      );
      setTicketOptions(updatedOptions);

      setShowStatusChangeModal(false);
      setStatusChangeTicket(null);
    } catch (error) {
      console.error("Bilet opsiyonu durumu değiştirilirken hata:", error);
      toast.error(
        "Bilet opsiyonu durumu değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  if (!initialFetchDone && loading) {
    return <LoadingSpinner message="Bilet opsiyonları yükleniyor..." />;
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
              MICE rezervasyonlarındaki bilet opsiyonlarını takip edin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Gidiş Dönüş Tarihi"
                startValue={dateRange.startDate}
                endValue={dateRange.endDate}
                onStartChange={(value) =>
                  setDateRange((prev) => ({ ...prev, startDate: value }))
                }
                onEndChange={(value) =>
                  setDateRange((prev) => ({ ...prev, endDate: value }))
                }
                onApply={() => setPage(1)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Opsiyon Bitiş Tarihi"
                startValue={flightDateRange.startDate}
                endValue={flightDateRange.endDate}
                onStartChange={(value) =>
                  setFlightDateRange((prev) => ({ ...prev, startDate: value }))
                }
                onEndChange={(value) =>
                  setFlightDateRange((prev) => ({ ...prev, endDate: value }))
                }
                onApply={() => setPage(1)}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher, PNR, Firma vb.)"
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
                onClick={exportOptionsExcel}
                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
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
                Excel
              </button>
              {canCreate(Module.TICKETS) && (
                <button
                  onClick={openAddModal}
                  className="bg-blue-500 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide"
                >
                  Opsiyon Ekle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium uppercase tracking-wider ml-2">
              DURUM:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${statusFilter === "all" ? "bg-blue-500/20 border border-blue-500/50 text-white" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>TÜMÜ</span>
              <span className="font-bold">{statusCardCounts.all}</span>
            </button>
            <button
              onClick={() => setStatusFilter("confirmed")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${statusFilter === "confirmed" ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>KONFİRME</span>
              <span className="font-bold">{statusCardCounts.confirmed}</span>
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${statusFilter === "active" ? "bg-purple-500/20 border border-purple-500/50 text-purple-400" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>AKTİF</span>
              <span className="font-bold">{statusCardCounts.active}</span>
            </button>
            <button
              onClick={() => setStatusFilter("expired")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${statusFilter === "expired" ? "bg-orange-500/20 border border-orange-500/50 text-orange-400" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>SÜRESİ DOLMUŞ</span>
              <span className="font-bold">{statusCardCounts.expired}</span>
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${statusFilter === "cancelled" ? "bg-red-500/20 border border-red-500/50 text-red-400" : "hover:bg-white/5 border border-transparent text-white"}`}
            >
              <span>İPTAL</span>
              <span className="font-bold">{statusCardCounts.cancelled}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4 text-slate-400">
            <span className="font-medium text-white">
              {sortedOptions.length}
            </span>{" "}
            kayıt gösteriliyor
          </div>
        </div>

        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px] relative">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
                <tr>
                  <th
                    onClick={() => handleSort("voucher_no")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    VOUCHER NO{" "}
                    {sortField === "voucher_no" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("agent")}
                    className="w-[7.5rem] px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    ACENTE{" "}
                    {sortField === "agent" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("company_name")}
                    className="w-[8rem] px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    FİRMA ADI{" "}
                    {sortField === "company_name" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("supplier")}
                    className="w-[8.5rem] px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    TEDARİKÇİ{" "}
                    {sortField === "supplier" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("airline")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    HAVAYOLU{" "}
                    {sortField === "airline" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("group_ref_no")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    GRUP REF NO{" "}
                    {sortField === "group_ref_no" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("flight_type")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    UÇUŞ TİPİ{" "}
                    {sortField === "flight_type" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("departure_date")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    <div className="text-left">
                      <div>GİDİŞ TARİHİ</div>
                      <div>VE SAATİ</div>
                    </div>
                    {sortField === "departure_date" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("return_date")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    <div className="text-left">
                      <div>DÖNÜŞ TARİHİ</div>
                      <div>VE SAATİ</div>
                    </div>
                    {sortField === "return_date" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("route")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    GÜZERGAH{" "}
                    {sortField === "route" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("passenger_count")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    <div className="text-left">
                      <div>KİŞİ</div>
                      <div>SAYISI</div>
                    </div>
                    {sortField === "passenger_count" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("pp_cost")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    <div className="text-left">
                      <div>PP</div>
                      <div>MALİYET</div>
                    </div>
                    {sortField === "pp_cost" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("total_cost")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    <div className="text-left">
                      <div>TOPLAM</div>
                      <div>MALİYET</div>
                    </div>
                    {sortField === "total_cost" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("currency")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    DÖVİZ{" "}
                    {sortField === "currency" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("option_end_date")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    <div className="text-left">
                      <div>OPSİYON BİTİŞ</div>
                      <div>TARİHİ VE SAATİ</div>
                    </div>
                    {sortField === "option_end_date" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("pnr")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    PNR{" "}
                    {sortField === "pnr" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10"
                  >
                    DURUM{" "}
                    {sortField === "status" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-2.5 py-2.5 text-right text-[11px] font-semibold text-white uppercase tracking-wider cursor-pointer border-b border-white/10">
                    İŞLEMLER
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOptions.items.map((option) => (
                  <tr
                    key={option.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="py-2.5 px-2.5 font-mono text-blue-600 dark:text-blue-400 text-left whitespace-nowrap text-[11px]">
                      {option.voucher_no}
                    </td>
                    <td
                      className="w-[7.5rem] min-w-[7.5rem] max-w-[7.5rem] py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]"
                      title={(option.agent || "").trim() || undefined}
                    >
                      <div className="truncate">
                        {(option.agent || "").trim() || "—"}
                      </div>
                    </td>
                    <td
                      className="w-[8rem] min-w-[8rem] max-w-[8rem] py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]"
                      title={(option.company_name || "").trim() || undefined}
                    >
                      <div className="truncate">
                        {(option.company_name || "").trim() || "—"}
                      </div>
                    </td>
                    <td
                      className="w-[8.5rem] min-w-[8.5rem] max-w-[8.5rem] py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]"
                      title={(option.supplier || "").trim() || undefined}
                    >
                      <div className="truncate">
                        {(option.supplier || "").trim() || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.airline}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.group_ref_no}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.flight_type}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      <div className="text-left">
                        <div>{formatDate(option.departure_date)}</div>
                        <div className="text-xs text-gray-300 dark:text-gray-200">
                          {option.departure_time || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      <div className="text-left">
                        <div>{formatDate(option.return_date)}</div>
                        <div className="text-xs text-gray-300 dark:text-gray-200">
                          {option.return_time || "-"}
                        </div>
                      </div>
                    </td>
                    <td
                      className="max-w-[14rem] py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]"
                      title={(option.route || "").trim() || undefined}
                    >
                      <div className="truncate">
                        {(option.route || "").trim() || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-center text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.passenger_count}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-right text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.pp_cost.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-right text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.total_cost.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-center text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.currency}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      <div className="text-left">
                        <div>{formatDate(option.option_end_date)}</div>
                        <div className="text-xs text-gray-300 dark:text-gray-200">
                          {option.option_end_time || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-left text-gray-700 dark:text-gray-300 text-[11px]">
                      {option.pnr}
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(option.status)}`}
                      >
                        {getStatusText(option.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2.5 px-2.5 text-center">
                      <div className="flex space-x-1">
                        {canEdit(Module.TICKETS) && (
                          <>
                            <button
                              onClick={() => openConfirmModal(option)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-200"
                              title="Konfirme Et"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openStatusChangeModal(option)}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200"
                              title="Durum Değiştir"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEditModal(option)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
                              title="Düzenle"
                            >
                              <svg
                                className="w-3 h-3"
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
                          </>
                        )}
                        {canDelete(Module.TICKETS) && (
                          <button
                            onClick={() => handleDeleteClick(option.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
                            title="Sil"
                          >
                            <svg
                              className="w-3 h-3"
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

                {sortedOptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={20}
                      className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {voucherTerms.length ||
                      customerTerms.length ||
                      supplierTerms.length ||
                      airlineTerms.length ||
                      dateRange.startDate ||
                      dateRange.endDate
                        ? "Filtrelere uygun bilet opsiyonu bulunamadı."
                        : "Kayıtlı bilet opsiyonu bulunamadı."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={paginatedOptions.page}
            pageSize={paginatedOptions.pageSize}
            total={paginatedOptions.total}
            totalPages={paginatedOptions.totalPages}
            preferenceKey="tickets_options_page_size"
            compactRight
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Konfirme Modal */}
      {showConfirmModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 transition-all duration-300">
          <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-3xl rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-[#0f172a]">
              <div>
                <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                  Bilet Konfirme Et
                </h2>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                  {selectedTicket.company_name || selectedTicket.agent || "Bilet"} - {selectedTicket.pnr || "Opsiyon"}
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              
              {/* Grup 1: Temel Bilgiler */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <h3 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                  Bilet Detayları
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Voucher No</label>
                    <input
                      type="text"
                      value={selectedTicket.voucher_no}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed outline-none"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">PNR Kodu *</label>
                    <input
                      type="text"
                      placeholder="PNR girin..."
                      value={confirmPnr}
                      onChange={(e) => setConfirmPnr(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Grup 2: Yolcu ve Maliyet */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <h3 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Yolcu & Maliyet
                </h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Yolcu Sayısı</label>
                    <input
                      type="number"
                      value={confirmPassengerCount === 0 ? "" : confirmPassengerCount}
                      onChange={(e) => setConfirmPassengerCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">PP Maliyet</label>
                    <input
                      type="text"
                      value={formatCurrency(selectedTicket.pp_cost, selectedTicket.currency)}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>
                
                <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/30 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">Toplam Kesinleşen</p>
                    <p className="text-xs text-purple-800 dark:text-purple-300">Yolcu sayısı üzerinden</p>
                  </div>
                  <div className="text-lg font-black text-purple-700 dark:text-purple-300">
                    {formatCurrency(confirmPassengerCount * selectedTicket.pp_cost, selectedTicket.currency)}
                  </div>
                </div>
              </div>

              {/* Grup 3: Tarih */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Konfirme Tarihi</label>
                  <input
                    type="datetime-local"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                İptal Et
              </button>
              {canEdit(Module.TICKETS) && (
                <button
                  onClick={handleConfirm}
                  disabled={!confirmPnr}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  Bileti Konfirme Et
                </button>
              )}
            </div>
          </div>
        </div>
      )}

            {/* Yeni Opsiyon Takip Ekle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                ✨ Yeni Opsiyon Takip Ekle
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 dark:bg-gray-800 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Grup 1: Kurumsal Bilgiler */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Kurumsal Bilgiler
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[2] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[2]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Voucher No</label>
                    <input type="text" value={newTicketOption.voucher_no} onChange={(e) => setNewTicketOption({ ...newTicketOption, voucher_no: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Voucher" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Acente *</label>
                    <SearchableSelect options={agencies.map((agency) => ({ id: agency.id, name: agency.name }))} value={newTicketOption.agent} onChange={(value) => setNewTicketOption({ ...newTicketOption, agent: value })} placeholder="Acente seçin..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Firma Adı</label>
                    <input type="text" value={newTicketOption.company_name} onChange={(e) => setNewTicketOption({ ...newTicketOption, company_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Firma Adı" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Tedarikçi *</label>
                    <SearchableSelect options={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))} value={newTicketOption.supplier} onChange={(value) => setNewTicketOption({ ...newTicketOption, supplier: value })} placeholder="Tedarikçi seçin..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Grup 2: Uçuş Detayları */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                  Uçuş Detayları
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1.2] lg:[&>*:nth-child(2)]:flex-[1.2] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.5] lg:[&>*:nth-child(5)]:flex-[1]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Uçuş Tipi *</label>
                    <select value={newTicketOption.flight_type} onChange={(e) => setNewTicketOption({ ...newTicketOption, flight_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="">Seçiniz</option>
                      <option value="Gidiş Dönüş">Gidiş Dönüş</option>
                      <option value="Tek Yön">Tek Yön</option>
                      <option value="Çok Segment">Çok Segment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Havayolu</label>
                    <input type="text" value={newTicketOption.airline} onChange={(e) => setNewTicketOption({ ...newTicketOption, airline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Örn: TK" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Grup Ref No</label>
                    <input type="text" value={newTicketOption.group_ref_no} onChange={(e) => setNewTicketOption({ ...newTicketOption, group_ref_no: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ref No" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Güzergah</label>
                    <input type="text" value={newTicketOption.route} onChange={(e) => setNewTicketOption({ ...newTicketOption, route: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="IST-ECN" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">PNR</label>
                    <input type="text" value={newTicketOption.pnr} onChange={(e) => setNewTicketOption({ ...newTicketOption, pnr: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="PNR" />
                  </div>
                </div>
              </div>

              {/* Grup 3: Tarih ve Saatler */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                  Tarih ve Saat Planlaması
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full [&>*]:flex-1">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Gidiş Tarihi *</label>
                    <input type="date" value={newTicketOption.departure_date} onChange={(e) => setNewTicketOption({ ...newTicketOption, departure_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Gidiş Saati</label>
                    <input type="time" value={newTicketOption.departure_time} onChange={(e) => setNewTicketOption({ ...newTicketOption, departure_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Dönüş Tarihi</label>
                    <input type="date" value={newTicketOption.return_date} onChange={(e) => setNewTicketOption({ ...newTicketOption, return_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Dönüş Saati</label>
                    <input type="time" value={newTicketOption.return_time} onChange={(e) => setNewTicketOption({ ...newTicketOption, return_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Grup 4: Opsiyon ve Maliyet */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-orange-200 dark:hover:border-orange-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
                  Maliyet & Opsiyon Bitiş
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.2] lg:[&>*:nth-child(5)]:flex-[1.2] lg:[&>*:nth-child(6)]:flex-[1.5]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Kişi Sayısı</label>
                    <input type="number" value={newTicketOption.passenger_count === 0 ? "" : newTicketOption.passenger_count} onChange={(e) => setNewTicketOption({ ...newTicketOption, passenger_count: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">PP Maliyet</label>
                    <input type="number" step="0.01" value={newTicketOption.pp_cost === 0 ? "" : newTicketOption.pp_cost} onChange={(e) => setNewTicketOption({ ...newTicketOption, pp_cost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Döviz</label>
                    <select value={newTicketOption.currency} onChange={(e) => setNewTicketOption({ ...newTicketOption, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none">
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="TRY">TRY</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Son Opsiyon Trh.</label>
                    <input type="date" value={newTicketOption.option_end_date} onChange={(e) => setNewTicketOption({ ...newTicketOption, option_end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Son Opsiyon Saat</label>
                    <input type="time" value={newTicketOption.option_end_time} onChange={(e) => setNewTicketOption({ ...newTicketOption, option_end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="flex flex-col justify-end pb-1 pl-2">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Toplam Maliyet</p>
                     <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">
                        {newTicketOption.total_cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {newTicketOption.currency}
                     </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center space-x-3 mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl font-bold transition-colors duration-200 text-xs"
              >
                İptal Et
              </button>
              {canCreate(Module.TICKETS) && (
                <button
                  onClick={handleAddTicketOption}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Kaydet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

            {/* Bilet Opsiyonu Düzenle Modal */}
      {showEditModal && editingTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                ✨ Bilet Opsiyonu Düzenle
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 dark:bg-gray-800 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Grup 1: Kurumsal Bilgiler */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  Kurumsal Bilgiler
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[2] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[2]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Voucher No</label>
                    <input type="text" value={editTicketOption.voucher_no} onChange={(e) => setEditTicketOption({ ...editTicketOption, voucher_no: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Voucher" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Acente *</label>
                    <SearchableSelect options={agencies.map((agency) => ({ id: agency.id, name: agency.name }))} value={editTicketOption.agent} onChange={(value) => setEditTicketOption({ ...editTicketOption, agent: value })} placeholder="Acente seçin..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Firma Adı</label>
                    <input type="text" value={editTicketOption.company_name} onChange={(e) => setEditTicketOption({ ...editTicketOption, company_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Firma Adı" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Tedarikçi *</label>
                    <SearchableSelect options={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))} value={editTicketOption.supplier} onChange={(value) => setEditTicketOption({ ...editTicketOption, supplier: value })} placeholder="Tedarikçi seçin..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Grup 2: Uçuş Detayları */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                  Uçuş Detayları
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1.2] lg:[&>*:nth-child(2)]:flex-[1.2] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.5] lg:[&>*:nth-child(5)]:flex-[1]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Uçuş Tipi *</label>
                    <select value={editTicketOption.flight_type} onChange={(e) => setEditTicketOption({ ...editTicketOption, flight_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="">Seçiniz</option>
                      <option value="Gidiş Dönüş">Gidiş Dönüş</option>
                      <option value="Tek Yön">Tek Yön</option>
                      <option value="Çok Segment">Çok Segment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Havayolu</label>
                    <input type="text" value={editTicketOption.airline} onChange={(e) => setEditTicketOption({ ...editTicketOption, airline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Örn: TK" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Grup Ref No</label>
                    <input type="text" value={editTicketOption.group_ref_no} onChange={(e) => setEditTicketOption({ ...editTicketOption, group_ref_no: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ref No" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Güzergah</label>
                    <input type="text" value={editTicketOption.route} onChange={(e) => setEditTicketOption({ ...editTicketOption, route: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="IST-ECN" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">PNR</label>
                    <input type="text" value={editTicketOption.pnr} onChange={(e) => setEditTicketOption({ ...editTicketOption, pnr: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="PNR" />
                  </div>
                </div>
              </div>

              {/* Grup 3: Tarih ve Saatler */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                  Tarih ve Saat Planlaması
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full [&>*]:flex-1">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Gidiş Tarihi *</label>
                    <input type="date" value={editTicketOption.departure_date} onChange={(e) => setEditTicketOption({ ...editTicketOption, departure_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Gidiş Saati</label>
                    <input type="time" value={editTicketOption.departure_time} onChange={(e) => setEditTicketOption({ ...editTicketOption, departure_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Dönüş Tarihi</label>
                    <input type="date" value={editTicketOption.return_date} onChange={(e) => setEditTicketOption({ ...editTicketOption, return_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Dönüş Saati</label>
                    <input type="time" value={editTicketOption.return_time} onChange={(e) => setEditTicketOption({ ...editTicketOption, return_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Grup 4: Opsiyon ve Maliyet */}
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:border-orange-200 dark:hover:border-orange-800/50">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
                  Maliyet & Opsiyon Bitiş
                </h4>
                <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.2] lg:[&>*:nth-child(5)]:flex-[1.2] lg:[&>*:nth-child(6)]:flex-[1.5]">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Kişi Sayısı</label>
                    <input type="number" value={editTicketOption.passenger_count === 0 ? "" : editTicketOption.passenger_count} onChange={(e) => setEditTicketOption({ ...editTicketOption, passenger_count: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">PP Maliyet</label>
                    <input type="number" step="0.01" value={editTicketOption.pp_cost === 0 ? "" : editTicketOption.pp_cost} onChange={(e) => setEditTicketOption({ ...editTicketOption, pp_cost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Döviz</label>
                    <select value={editTicketOption.currency} onChange={(e) => setEditTicketOption({ ...editTicketOption, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none">
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="TRY">TRY</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Son Opsiyon Trh.</label>
                    <input type="date" value={editTicketOption.option_end_date} onChange={(e) => setEditTicketOption({ ...editTicketOption, option_end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 ml-1">Son Opsiyon Saat</label>
                    <input type="time" value={editTicketOption.option_end_time} onChange={(e) => setEditTicketOption({ ...editTicketOption, option_end_time: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="flex flex-col justify-end pb-1 pl-2">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Toplam Maliyet</p>
                     <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">
                        {editTicketOption.total_cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {editTicketOption.currency}
                     </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center space-x-3 mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl font-bold transition-colors duration-200 text-xs"
              >
                İptal Et
              </button>
              {canEdit(Module.TICKETS) && (
                <button
                  onClick={handleEditTicketOption}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Güncelle
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Durum Değiştirme Modal */}
      {showStatusChangeModal && statusChangeTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Bilet Durumu Değiştir
            </h3>

            <div className="space-y-3">
              {/* Voucher No */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voucher No
                </label>
                <input
                  type="text"
                  value={statusChangeTicket.voucher_no}
                  disabled
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                />
              </div>

              {/* Mevcut Durum */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mevcut Durum
                </label>
                <input
                  type="text"
                  value={getStatusText(statusChangeTicket.status)}
                  disabled
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                />
              </div>

              {/* Yeni Durum */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yeni Durum *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(
                      e.target.value as
                        | "active"
                        | "expired"
                        | "confirmed"
                        | "cancelled",
                    )
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                >
                  <option value="active">Aktif</option>
                  <option value="expired">Süresi Dolmuş</option>
                  <option value="confirmed">Konfirme Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  setStatusChangeTicket(null);
                }}
                className="px-3 py-1 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 text-xs"
              >
                İptal
              </button>
              {canEdit(Module.TICKETS) && (
                <button
                  onClick={handleStatusChange}
                  className="px-3 py-1 text-white bg-orange-600 dark:bg-orange-500 rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors duration-200 text-xs"
                >
                  Durumu Değiştir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODERN SİLME ONAY MODALI */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        title="Bilet Opsiyonunu Sil"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Emin misiniz?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bu bilet opsiyonunu silmek istediğinizden emin misiniz? Bu işlem
            geri alınamaz.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
            >
              Vazgeç
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Evet, Sil"
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
