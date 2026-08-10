"use client";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import PaginationControls from "@/components/PaginationControls";
import { useTheme } from "@/components/providers/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatNumber, formatDate } from "@/utils/formatters";
import { usePermissions, Module } from "@/lib/permissions";
import { SejourService } from "@/lib/supabaseService";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import DatePicker from "react-datepicker";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import Modal from "@/components/Modal";
import { toast } from "react-hot-toast";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
// import { loadSejourlar } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const sejourlar = await loadSejourlar();
//   console.log(sejourlar);
// }

// fetchData();

import ExcelJS from "exceljs";
import { getLogosForExcel } from "@/utils/logoUtils";

interface SejourSale {
  id: string;
  voucherNumber: string;
  reference?: string; // Backward compatibility
  customerType: string;
  customerName: string;
  agencyName?: string;
  checkInDate: string;
  checkOutDate: string;
  check_in_date?: string; // Backward compatibility
  check_out_date?: string; // Backward compatibility
  room_count?: number;
  pax_count?: number;
  room_type?: string;
  board_type?: string;
  totalAmount: number;
  total_amount?: number; // Backward compatibility
  currency: string;
  status: string;
  created_at: string;
  // Yeni alanlar
  totals?: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  costs?: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  collections?: Collection[];
  // Detaylı maliyet hesaplama için gerekli alanlar
  rooms?: Room[];
  flights?: FlightInfo[];
  transfers?: TransferInfo[];
  extraServices?: ExtraService[];
}

interface SejourData {
  id: string;
  voucherNumber: string;
  customerType: string;
  agencyId: string;
  agencyName: string;
  customerName: string;
  checkInDate: string;
  checkOutDate: string;
  rooms: Room[];
  flights: FlightInfo[];
  transfers: TransferInfo[];
  extraServices: ExtraService[];
  totals: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  costs: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  profits: {
    EUR: number;
    USD: number;
    TRY: number;
    GBP?: number;
  };
  currency: string;
  status: string;
  notes: string;
  collections: Collection[];
  salesInvoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  created_at: string;
}

interface Room {
  id: string;
  roomNumber: string;
  hotelId: string;
  accommodationType?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface FlightInfo {
  id: string;
  flightDate: string;
  airline: string;
  route: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  type: "departure" | "return";
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface TransferInfo {
  id: string;
  date: string;
  provider: string;
  type: "private" | "economic";
  vehicle: string;
  time: string;
  price: number;
  currency: string;
  direction: "arrival" | "return";
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface ExtraService {
  id: string;
  serviceType: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface Collection {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
}

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    serviceName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  serviceType: string;
  provider: string;
  amount: number;
  currency: string;
  description: string;
}

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

export default function SejourPage() {
  const router = useRouter();

  const getDayNameShort = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("tr-TR", { weekday: "short" });
  };

  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    loading: permissionsLoading,
  } = usePermissions();
  const { isDark } = useTheme();
  const [sejours, setSejours] = useState<SejourSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  const searchTerm = globalTokens.join(" ");
  
  const [sejourData, setSejourData] = useState<SejourData | null>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    startDate: todayStr,
    endDate: "",
  });
  const [dateStart, setDateStart] = useState(todayStr);
  const [dateEnd, setDateEnd] = useState("");
  const [appliedDateStart, setAppliedDateStart] = useState(todayStr);
  const [appliedDateEnd, setAppliedDateEnd] = useState("");
  const [draftDateStart, setDraftDateStart] = useState(todayStr);
  const [draftDateEnd, setDraftDateEnd] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sejourToDelete, setSejourToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detaylı verilerden toplam maliyet hesaplama
  const calculateTotalCostFromDetails = (sejour: any) => {
    const costs: any = { EUR: 0, USD: 0, TRY: 0, GBP: 0 };

    // Odalar
    if (sejour.rooms && Array.isArray(sejour.rooms)) {
      sejour.rooms.forEach((room: any) => {
        if (
          room.costPrice !== undefined &&
          room.costPrice !== null &&
          room.costCurrency
        ) {
          costs[room.costCurrency as keyof typeof costs] =
            (costs[room.costCurrency as keyof typeof costs] || 0) +
            (room.costPrice || 0);
        }
      });
    }

    // Uçuşlar
    if (sejour.flights && Array.isArray(sejour.flights)) {
      sejour.flights.forEach((flight: any) => {
        if (
          flight.costPrice !== undefined &&
          flight.costPrice !== null &&
          flight.costCurrency
        ) {
          costs[flight.costCurrency as keyof typeof costs] =
            (costs[flight.costCurrency as keyof typeof costs] || 0) +
            (flight.costPrice || 0);
        }
      });
    }

    // Transferler
    if (sejour.transfers && Array.isArray(sejour.transfers)) {
      sejour.transfers.forEach((transfer: any) => {
        if (
          transfer.costPrice !== undefined &&
          transfer.costPrice !== null &&
          transfer.costCurrency
        ) {
          costs[transfer.costCurrency as keyof typeof costs] =
            (costs[transfer.costCurrency as keyof typeof costs] || 0) +
            (transfer.costPrice || 0);
        }
      });
    }

    // Ek hizmetler
    if (sejour.extraServices && Array.isArray(sejour.extraServices)) {
      sejour.extraServices.forEach((service: any) => {
        if (
          service.costPrice !== undefined &&
          service.costPrice !== null &&
          service.costCurrency
        ) {
          costs[service.costCurrency as keyof typeof costs] =
            (costs[service.costCurrency as keyof typeof costs] || 0) +
            (service.costPrice || 0);
        }
      });
    }

    return costs;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await SejourService.getSejoursPage({
        page,
        pageSize,
        searchTerm,
        statusFilter,
        startDate: appliedDateStart,
        endDate: appliedDateEnd,
        sortField,
        sortDirection,
      });
      const sejourData = response.data;
      setTotalCount(response.total);
      setTotalPages(response.totalPages);

      // Verileri zenginleştir ve maliyetleri hesapla
      const enrichedData = sejourData.map((sejour: any) => {
        // Maliyetleri detaylı hesapla (rooms, flights, transfers, extraServices'ten)
        const costs = calculateTotalCostFromDetails(sejour);

        return {
          ...sejour,
          costs: costs, // Hesaplanan maliyetleri kullan
          totals: sejour.totals || { EUR: 0, USD: 0, TRY: 0, GBP: 0 },
          collections: sejour.collections || [],
          rooms: sejour.rooms || [],
          flights: sejour.flights || [],
          transfers: sejour.transfers || [],
          extraServices: sejour.extraServices || [],
        };
      });

      setSejours(enrichedData);
    } catch (error) {
      console.error("Error loading sejour data:", error);
      setError("Sejour verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    page,
    pageSize,
    statusFilter,
    appliedDateStart,
    appliedDateEnd,
    searchTerm,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    appliedDateStart,
    appliedDateEnd,
    searchTerm,
    sortField,
    sortDirection,
  ]);

  const globalSuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          ...sejours.map((s) => (s.voucherNumber || "").trim()).filter(Boolean),
          ...sejours.map((s) => (s.customerName || "").trim()).filter(Boolean),
          ...sejours.map((s) => (s.agencyName || "").trim()).filter(Boolean),
          ...sejours
            .flatMap((s) =>
              (s.rooms || []).map((r) => (r.guestInfo || "").trim()),
            )
            .filter(Boolean),
          "Konfirme",
          "Bekleyen",
          "İptal",
          ...sejours.map((s) => (s.status || "").trim()).filter(Boolean),
        ]),
      ),
    [sejours],
  );
  const customerSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          sejours.map((s) => (s.customerName || "").trim()).filter(Boolean),
        ),
      ),
    [sejours],
  );
  const agencySuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          sejours.map((s) => (s.agencyName || "").trim()).filter(Boolean),
        ),
      ),
    [sejours],
  );
  const guestSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          sejours
            .flatMap((s) =>
              (s.rooms || []).map((r) => (r.guestInfo || "").trim()),
            )
            .filter(Boolean),
        ),
      ),
    [sejours],
  );
  const statusSuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          "Konfirme",
          "Bekleyen",
          "İptal",
          ...sejours.map((s) => (s.status || "").trim()).filter(Boolean),
        ]),
      ),
    [sejours],
  );

  // Helper fonksiyonları - Early return'lerden ÖNCE tanımlanmalı

  // Helper fonksiyonları - Early return'lerden ÖNCE tanımlanmalı
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

  const sejoursKonfirmeCount = sejours.filter(
    (s) =>
      (s.status || "").toLowerCase().includes("konfirme") ||
      (s.status || "").toLowerCase().includes("konfir") ||
      (s.status || "").toLowerCase().includes("konfi"),
  ).length;
  const sejoursBekleyenCount = sejours.filter(
    (s) =>
      (s.status || "").toLowerCase().includes("bekleyen") ||
      (s.status || "").toLowerCase().includes("beklen") ||
      (s.status || "").toLowerCase().includes("bekle"),
  ).length;
  const sejoursIptalCount = sejours.filter(
    (s) =>
      (s.status || "").toLowerCase().includes("iptal") ||
      (s.status || "").toLowerCase().includes("ipta"),
  ).length;

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SEJOUR)) {
    // Debug için console log (geliştirme ortamında)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Sejour Page] ❌ Erişim reddedildi - Role: ${userRole}, Module: ${Module.SEJOUR}`,
      );
    }
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">Yetki Gerekli</h1>
          <p className="text-v3-muted mb-6">
            Sejour sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <Link
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const filteredSejours = sejours;

  // Sıralama fonksiyonu
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "konfirme":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
      case "bekleyen":
      case "beklemede":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
      case "iptal":
      case "i̇ptal":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-v3-border/50";
    }
  };

  const handleDeleteSejour = (id: string) => {
    setSejourToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSejour = async () => {
    if (!sejourToDelete) return;

    try {
      setIsDeleting(true);
      await SejourService.deleteSejour(sejourToDelete);
      setSejours((prev) => prev.filter((s) => s.id !== sejourToDelete));
      toast.success("Sejour başarıyla silindi");
    } catch (error) {
      console.error("Error deleting sejour:", error);
      toast.error("Sejour silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setSejourToDelete(null);
    }
  };

  // Filtreleri temizleme fonksiyonu - Ana sejour sayfası için
  const clearAllFilters = () => {
    setDateStart("");
    setDateEnd("");
    setAppliedDateStart("");
    setAppliedDateEnd("");
    setGlobalTokens([]);
    setGlobalInput("");
    setStatusFilter("all");
    setPage(1);
  };

  const handleApplyDates = (start?: string, end?: string) => {
    setAppliedDateStart(start !== undefined ? start : dateStart);
    setAppliedDateEnd(end !== undefined ? end : dateEnd);
    setPage(1);
  };

  // Sıralanmış sejours
  const paginatedSejours = {
    items: filteredSejours,
    page,
    pageSize,
    total: totalCount,
    totalPages,
  };

  // Toplam maliyet hesaplama
  const calculateTotalCost = (sejour: SejourSale | SejourData) => {
    const costs: any = { EUR: 0, USD: 0, TRY: 0, GBP: 0 };

    // Eğer sejour.costs varsa onu kullan
    if ("costs" in sejour && sejour.costs) {
      return { EUR: 0, USD: 0, TRY: 0, GBP: 0, ...sejour.costs } as any;
    }

    // Eğer SejourData ise detaylı hesaplama yap
    if ("rooms" in sejour && sejour.rooms) {
      // Odalar
      sejour.rooms.forEach((room) => {
        if (room.costPrice && room.costCurrency) {
          costs[room.costCurrency as keyof typeof costs] =
            (costs[room.costCurrency as keyof typeof costs] || 0) +
            room.costPrice;
        }
      });
    }

    if ("flights" in sejour && sejour.flights) {
      // Uçuşlar
      sejour.flights.forEach((flight) => {
        if (flight.costPrice && flight.costCurrency) {
          costs[flight.costCurrency as keyof typeof costs] =
            (costs[flight.costCurrency as keyof typeof costs] || 0) +
            flight.costPrice;
        }
      });
    }

    if ("transfers" in sejour && sejour.transfers) {
      // Transferler
      sejour.transfers.forEach((transfer) => {
        if (transfer.costPrice && transfer.costCurrency) {
          costs[transfer.costCurrency as keyof typeof costs] =
            (costs[transfer.costCurrency as keyof typeof costs] || 0) +
            transfer.costPrice;
        }
      });
    }

    if ("extraServices" in sejour && sejour.extraServices) {
      // Ek hizmetler
      sejour.extraServices.forEach((service) => {
        if (service.costPrice && service.costCurrency) {
          costs[service.costCurrency as keyof typeof costs] =
            (costs[service.costCurrency as keyof typeof costs] || 0) +
            service.costPrice;
        }
      });
    }

    return costs;
  };

  // Belirli para birimi için maliyet alma
  const getCostForCurrency = (
    sejour: SejourSale | SejourData,
    currency: string,
  ) => {
    const costs = calculateTotalCost(sejour);
    return costs[currency as keyof typeof costs] || 0;
  };

  // Belirli para birimi için kar/zarar hesaplama
  const getProfitForCurrency = (
    sejour: SejourSale | SejourData,
    currency: string,
  ) => {
    const totalSales =
      sejour.totals?.[currency as keyof typeof sejour.totals] || 0;
    const totalCost = getCostForCurrency(sejour, currency);
    return totalSales - totalCost;
  };

  // ExcelJS ile Export
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Sejour Listesi`,
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
    sheet.mergeCells("A1:V1");
    for (let c = 1; c <= 22; c++) {
      sheet.getRow(1).getCell(c).value = "";
      sheet.getRow(1).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF232F38" },
      } as any;
    }

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(false); // Sejour için açık tema logosu kullan
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
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }
    if (wordmarkLogoBase64) {
      const markId = workbook.addImage({
        base64: wordmarkLogoBase64,
        extension: guessExt(wordmarkLogoBase64),
      });
      sheet.addImage(markId, {
        tl: { col: 19.5, row: 0.23 },
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }

    // Columns
    sheet.columns = [
      { header: "VOUCHER NO", key: "voucherNumber", width: 16 },
      { header: "MÜŞTERİ", key: "customerName", width: 20 },
      { header: "ACENTE", key: "agencyName", width: 18 },
      { header: "GİRİŞ TARİHİ", key: "checkInDate", width: 14 },
      { header: "ÇIKIŞ TARİHİ", key: "checkOutDate", width: 14 },
      { header: "TOPLAM TRY", key: "totalTRY", width: 12 },
      { header: "TOPLAM EUR", key: "totalEUR", width: 12 },
      { header: "TOPLAM USD", key: "totalUSD", width: 12 },
      { header: "TOPLAM GBP", key: "totalGBP", width: 12 },
      { header: "MALİYET TRY", key: "costTRY", width: 12 },
      { header: "MALİYET EUR", key: "costEUR", width: 12 },
      { header: "MALİYET USD", key: "costUSD", width: 12 },
      { header: "MALİYET GBP", key: "costGBP", width: 12 },
      { header: "TAHSİLAT TRY", key: "collectionTRY", width: 12 },
      { header: "TAHSİLAT EUR", key: "collectionEUR", width: 12 },
      { header: "TAHSİLAT USD", key: "collectionUSD", width: 12 },
      { header: "TAHSİLAT GBP", key: "collectionGBP", width: 12 },
      { header: "BAKİYE TRY", key: "balanceTRY", width: 12 },
      { header: "BAKİYE EUR", key: "balanceEUR", width: 12 },
      { header: "BAKİYE USD", key: "balanceUSD", width: 12 },
      { header: "BAKİYE GBP", key: "balanceGBP", width: 12 },
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
    sheet.getColumn("totalTRY").numFmt = "#,##0.00";
    sheet.getColumn("totalEUR").numFmt = "#,##0.00";
    sheet.getColumn("totalUSD").numFmt = "#,##0.00";
    sheet.getColumn("totalGBP").numFmt = "#,##0.00";
    sheet.getColumn("costTRY").numFmt = "#,##0.00";
    sheet.getColumn("costEUR").numFmt = "#,##0.00";
    sheet.getColumn("costUSD").numFmt = "#,##0.00";
    sheet.getColumn("costGBP").numFmt = "#,##0.00";
    sheet.getColumn("collectionTRY").numFmt = "#,##0.00";
    sheet.getColumn("collectionEUR").numFmt = "#,##0.00";
    sheet.getColumn("collectionUSD").numFmt = "#,##0.00";
    sheet.getColumn("collectionGBP").numFmt = "#,##0.00";
    sheet.getColumn("balanceTRY").numFmt = "#,##0.00";
    sheet.getColumn("balanceEUR").numFmt = "#,##0.00";
    sheet.getColumn("balanceUSD").numFmt = "#,##0.00";
    sheet.getColumn("balanceGBP").numFmt = "#,##0.00";

    const fmtDate = (d?: string) =>
      d ? new Date(d).toLocaleDateString("tr-TR") : "";

    filteredSejours.forEach((sejour: any) => {
      // Tahsilat hesaplama
      const collectionTRY =
        sejour.collections?.reduce(
          (sum: number, col: any) =>
            sum + (col.currency === "TRY" ? col.amount : 0),
          0,
        ) || 0;
      const collectionEUR =
        sejour.collections?.reduce(
          (sum: number, col: any) =>
            sum + (col.currency === "EUR" ? col.amount : 0),
          0,
        ) || 0;
      const collectionUSD =
        sejour.collections?.reduce(
          (sum: number, col: any) =>
            sum + (col.currency === "USD" ? col.amount : 0),
          0,
        ) || 0;
      const collectionGBP =
        sejour.collections?.reduce(
          (sum: number, col: any) =>
            sum + (col.currency === "GBP" ? col.amount : 0),
          0,
        ) || 0;

      // Bakiye hesaplama
      const balanceTRY = (sejour.totals?.TRY || 0) - collectionTRY;
      const balanceEUR = (sejour.totals?.EUR || 0) - collectionEUR;
      const balanceUSD = (sejour.totals?.USD || 0) - collectionUSD;
      const balanceGBP = ((sejour as any).totals?.GBP || 0) - collectionGBP;

      const dataRow = sheet.addRow({
        voucherNumber: sejour.voucherNumber || "",
        customerName: sejour.customerName || "",
        agencyName: sejour.agencyName || "",
        checkInDate: fmtDate(sejour.checkInDate || sejour.check_in_date),
        checkOutDate: fmtDate(sejour.checkOutDate || sejour.check_out_date),
        totalTRY: Number(sejour.totals?.TRY || 0),
        totalEUR: Number(sejour.totals?.EUR || 0),
        totalUSD: Number(sejour.totals?.USD || 0),
        totalGBP: Number((sejour as any).totals?.GBP || 0),
        costTRY: Number(sejour.costs?.TRY || 0),
        costEUR: Number(sejour.costs?.EUR || 0),
        costUSD: Number(sejour.costs?.USD || 0),
        costGBP: Number((sejour as any).costs?.GBP || 0),
        collectionTRY: Number(collectionTRY),
        collectionEUR: Number(collectionEUR),
        collectionUSD: Number(collectionUSD),
        collectionGBP: Number(collectionGBP),
        balanceTRY: Number(balanceTRY),
        balanceEUR: Number(balanceEUR),
        balanceUSD: Number(balanceUSD),
        balanceGBP: Number(balanceGBP),
        status: sejour.status || "",
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      for (let i = 6; i <= 21; i++) {
        // 6-21 arası sayısal sütunlar
        dataRow.getCell(i).alignment = {
          horizontal: "right",
          vertical: "middle",
        } as any;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sejour_listesi_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Oda maliyeti güncelleme
  const updateRoomCost = (
    id: string,
    field: "costPrice" | "costCurrency",
    value: number | string,
  ) => {
    if (!sejourData) return;

    const updatedRooms = sejourData.rooms.map((room) =>
      room.id === id ? { ...room, [field]: value } : room,
    );

    const updatedSejourData = {
      ...sejourData,
      rooms: updatedRooms,
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log("Room cost updated:", { id, field, value, updatedSejourData });
  };

  // Uçuş maliyeti güncelleme
  const updateFlightCost = (
    id: string,
    field: "costPrice" | "costCurrency",
    value: number | string,
  ) => {
    if (!sejourData) return;

    const updatedFlights = sejourData.flights.map((flight) =>
      flight.id === id ? { ...flight, [field]: value } : flight,
    );

    const updatedSejourData = {
      ...sejourData,
      flights: updatedFlights,
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log("Flight cost updated:", {
      id,
      field,
      value,
      updatedSejourData,
    });
  };

  // Transfer maliyeti güncelleme
  const updateTransferCost = (
    id: string,
    field: "costPrice" | "costCurrency",
    value: number | string,
  ) => {
    if (!sejourData) return;

    const updatedTransfers = sejourData.transfers.map((transfer) =>
      transfer.id === id ? { ...transfer, [field]: value } : transfer,
    );

    const updatedSejourData = {
      ...sejourData,
      transfers: updatedTransfers,
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log("Transfer cost updated:", {
      id,
      field,
      value,
      updatedSejourData,
    });
  };

  // Ek hizmet maliyeti güncelleme
  const updateExtraServiceCost = (
    id: string,
    field: "costPrice" | "costCurrency",
    value: number | string,
  ) => {
    if (!sejourData) return;

    const updatedExtraServices = sejourData.extraServices.map((service) =>
      service.id === id ? { ...service, [field]: value } : service,
    );

    const updatedSejourData = {
      ...sejourData,
      extraServices: updatedExtraServices,
    };

    setSejourData(updatedSejourData);

    // TODO: Supabase'e güncelleme yapılacak
    console.log("Extra service cost updated:", {
      id,
      field,
      value,
      updatedSejourData,
    });
  };

  if (loading) {
    return <LoadingSpinner message="Sejour kayıtları yükleniyor..." />;
  }

  return (
    <div className="flex-1 min-h-0 w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4 transition-colors duration-200">
            {error}
          </div>
        )}

        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text">
              Sejour Yönetimi
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Sejour işlemlerini yönetin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="Konaklama Tarihi"
                startValue={dateStart}
                endValue={dateEnd}
                onStartChange={setDateStart}
                onEndChange={setDateEnd}
                onApply={handleApplyDates}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher No, Müşteri, Acente, Misafir, Durum)"
                tokens={globalTokens}
                inputValue={globalInput}
                suggestions={globalSuggestions}
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
                onClick={exportToExcel}
                className="bg-green-500 hover:bg-green-600 text-white border-transparent shadow-[0_0_15px_rgba(34,197,94,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                title="Excel'e Aktar"
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
              {canCreate(Module.SEJOUR) && (
                <Link
                  href="/sejour/create"
                  className="bg-blue-500 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Yeni Sejour
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm w-full overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1 pl-1 shrink-0">
              DURUM:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${statusFilter === "all" ? "bg-blue-500/20 border border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "hover:bg-v3-surface/5 border border-transparent text-v3-text"}`}
            >
              <span className="text-[10px] sm:text-xs">TÜMÜ</span>
              <span className="font-bold text-[10px] sm:text-xs">{totalCount}</span>
            </button>
            <button
              onClick={() => setStatusFilter("konfirme")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${statusFilter === "konfirme" ? "bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.15)]" : "hover:bg-v3-surface/5 border border-transparent text-v3-text"}`}
            >
              <span className="text-[10px] sm:text-xs">KONFİRME</span>
              <span className="font-bold text-[10px] sm:text-xs">{sejoursKonfirmeCount}</span>
            </button>
            <button
              onClick={() => setStatusFilter("bekleyen")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${statusFilter === "bekleyen" ? "bg-yellow-500/20 border border-yellow-500/50 text-amber-700 dark:text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.15)]" : "hover:bg-v3-surface/5 border border-transparent text-v3-text"}`}
            >
              <span className="text-[10px] sm:text-xs">BEKLEYEN</span>
              <span className="font-bold text-[10px] sm:text-xs">{sejoursBekleyenCount}</span>
            </button>
            <button
              onClick={() => setStatusFilter("iptal")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${statusFilter === "iptal" ? "bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.15)]" : "hover:bg-v3-surface/5 border border-transparent text-v3-text"}`}
            >
              <span className="text-[10px] sm:text-xs">İPTAL</span>
              <span className="font-bold text-[10px] sm:text-xs">{sejoursIptalCount}</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-v3-surface/5 backdrop-blur-md border border-v3-border rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-v3-surface sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-v3-border">
                <tr>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                    onClick={() => handleSort("voucherNumber")}
                  >
                    <div className="flex items-center gap-1">
                      Voucher No
                      {sortField === "voucherNumber" && (
                        <svg
                          className={`w-3 h-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                    onClick={() => handleSort("customerName")}
                  >
                    <div className="flex items-center gap-1">
                      Müşteri
                      {sortField === "customerName" && (
                        <svg
                          className={`w-3 h-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                    onClick={() => handleSort("agencyName")}
                  >
                    <div className="flex items-center gap-1">
                      Acente
                      {sortField === "agencyName" && (
                        <svg
                          className={`w-3 h-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Misafirler
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                    onClick={() => handleSort("checkInDate")}
                  >
                    <div className="flex items-center gap-1">
                      Giriş
                      {sortField === "checkInDate" && (
                        <svg
                          className={`w-3 h-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                    onClick={() => handleSort("checkOutDate")}
                  >
                    <div className="flex items-center gap-1">
                      Çıkış
                      {sortField === "checkOutDate" && (
                        <svg
                          className={`w-3 h-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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

                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Toplam Tutar
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Toplam Maliyet
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Tahsilat
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Bakiye
                  </th>
                  <th
                    className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Durum
                      {sortField === "status" && (
                        <svg
                          className={`w-3 h-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-v3-text uppercase tracking-wider border-b border-v3-border">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedSejours.items.map((sejour) => (
                  <tr
                    key={sejour.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                    onDoubleClick={() => router.push(`/sejour/${sejour.id}`)}
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-v3-text transition-colors duration-200">
                      {sejour.voucherNumber}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {sejour.customerName}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {sejour.agencyName || "-"}
                    </td>
                                        <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="text-xs max-w-xs">
                        {sejour.rooms && Array.isArray(sejour.rooms) && sejour.rooms.length > 0 ? (
                          <div className="flex items-center gap-2 group relative">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-v3-text text-[11px]">
                                {String(sejour.rooms[0].roomNumber || "").toLowerCase().includes("oda") ? sejour.rooms[0].roomNumber : `Oda ${sejour.rooms[0].roomNumber || 1}`}
                              </span>
                              <span className="text-v3-text uppercase truncate max-w-[150px]" title={sejour.rooms[0].guestInfo}>{sejour.rooms[0].guestInfo || "Misafir bilgisi yok"}</span>
                            </div>
                            {sejour.rooms.length > 1 && (
                              <div className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-help">
                                +{sejour.rooms.length - 1} Oda
                              </div>
                            )}
                            {sejour.rooms.length > 1 && (
                              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-3 z-50 min-w-[200px]">
                                {sejour.rooms.map((room: any, index: number) => {
                                  const isMatchedGuest = globalTokens.length > 0 && globalTokens.some((token) => (room.guestInfo || "").toLowerCase().includes(token.toLowerCase()));
                                  return (
                                    <div key={index} className={`flex flex-col gap-0.5 text-[11px] p-1.5 rounded ${isMatchedGuest ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                      <span className="font-semibold text-v3-text text-xs">
                                        {String(room.roomNumber || "").toLowerCase().includes("oda") ? room.roomNumber : `Oda ${room.roomNumber || index + 1}`}
                                      </span>
                                      <span className={`uppercase ${isMatchedGuest ? 'text-yellow-700 dark:text-yellow-300 font-bold' : 'text-v3-text'}`}>{room.guestInfo || "Misafir bilgisi yok"}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-v3-muted dark:text-gray-500">
                            Misafir bilgisi yok
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {formatDate(
                        sejour.checkInDate || sejour.check_in_date || "",
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      {formatDate(
                        sejour.checkOutDate || sejour.check_out_date || "",
                      )}
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="text-xs">
                        {(() => {
                          const tryAmt = sejour.totals?.TRY || 0;
                          const eurAmt = sejour.totals?.EUR || 0;
                          const usdAmt = sejour.totals?.USD || 0;
                          const gbpAmt = (sejour as any).totals?.GBP || 0;
                          const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                          if (!hasAny)
                            return <div className="text-v3-muted">-</div>;
                          return (
                            <>
                              {!!tryAmt && (
                                <div>TRY: {formatNumber(tryAmt)}</div>
                              )}
                              {!!eurAmt && (
                                <div>EUR: {formatNumber(eurAmt)}</div>
                              )}
                              {!!usdAmt && (
                                <div>USD: {formatNumber(usdAmt)}</div>
                              )}
                              {!!gbpAmt && (
                                <div>GBP: {formatNumber(gbpAmt)}</div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="text-xs">
                        {(() => {
                          const tryAmt = sejour.costs?.TRY || 0;
                          const eurAmt = sejour.costs?.EUR || 0;
                          const usdAmt = sejour.costs?.USD || 0;
                          const gbpAmt = (sejour as any).costs?.GBP || 0;
                          const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                          if (!hasAny)
                            return <div className="text-v3-muted">-</div>;
                          return (
                            <>
                              {!!tryAmt && (
                                <div>TRY: {formatNumber(tryAmt)}</div>
                              )}
                              {!!eurAmt && (
                                <div>EUR: {formatNumber(eurAmt)}</div>
                              )}
                              {!!usdAmt && (
                                <div>USD: {formatNumber(usdAmt)}</div>
                              )}
                              {!!gbpAmt && (
                                <div>GBP: {formatNumber(gbpAmt)}</div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="text-xs">
                        {(() => {
                          const tryAmt =
                            sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "TRY" ? col.amount : 0),
                              0,
                            ) || 0;
                          const eurAmt =
                            sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "EUR" ? col.amount : 0),
                              0,
                            ) || 0;
                          const usdAmt =
                            sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "USD" ? col.amount : 0),
                              0,
                            ) || 0;
                          const gbpAmt =
                            sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "GBP" ? col.amount : 0),
                              0,
                            ) || 0;
                          const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                          if (!hasAny)
                            return <div className="text-v3-muted">-</div>;
                          return (
                            <>
                              {!!tryAmt && (
                                <div>TRY: {formatNumber(tryAmt)}</div>
                              )}
                              {!!eurAmt && (
                                <div>EUR: {formatNumber(eurAmt)}</div>
                              )}
                              {!!usdAmt && (
                                <div>USD: {formatNumber(usdAmt)}</div>
                              )}
                              {!!gbpAmt && (
                                <div>GBP: {formatNumber(gbpAmt)}</div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                      <div className="text-xs">
                        {(() => {
                          const tryAmt =
                            (sejour.totals?.TRY || 0) -
                            (sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "TRY" ? col.amount : 0),
                              0,
                            ) || 0);
                          const eurAmt =
                            (sejour.totals?.EUR || 0) -
                            (sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "EUR" ? col.amount : 0),
                              0,
                            ) || 0);
                          const usdAmt =
                            (sejour.totals?.USD || 0) -
                            (sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "USD" ? col.amount : 0),
                              0,
                            ) || 0);
                          const gbpAmt =
                            ((sejour as any).totals?.GBP || 0) -
                            (sejour.collections?.reduce(
                              (sum, col) =>
                                sum + (col.currency === "GBP" ? col.amount : 0),
                              0,
                            ) || 0);
                          const hasAny = tryAmt || eurAmt || usdAmt || gbpAmt;
                          if (!hasAny)
                            return <div className="text-v3-muted">-</div>;
                          return (
                            <>
                              {!!tryAmt && (
                                <div>TRY: {formatNumber(tryAmt)}</div>
                              )}
                              {!!eurAmt && (
                                <div>EUR: {formatNumber(eurAmt)}</div>
                              )}
                              {!!usdAmt && (
                                <div>USD: {formatNumber(usdAmt)}</div>
                              )}
                              {!!gbpAmt && (
                                <div>GBP: {formatNumber(gbpAmt)}</div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sejour.status)}`}
                      >
                        {sejour.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/sejour/${sejour.id}`}
                          className="text-v3-muted hover:text-blue-600 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                          title="Görüntüle"
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
                        </Link>
                        {canEdit(Module.SEJOUR) && (
                          <Link
                            href={`/sejour/${sejour.id}/edit`}
                            className="text-v3-muted hover:text-green-600 dark:hover:text-green-300 p-1.5 rounded-lg hover:bg-green-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                          </Link>
                        )}
                        {canDelete(Module.SEJOUR) && (
                          <button
                            onClick={() => handleDeleteSejour(sejour.id)}
                            className="text-v3-muted hover:text-red-600 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
            preferenceKey="sejour_page_size"
          />
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Sejour Silme Onayı"
          maxWidth="max-w-md"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-v3-text mb-2">Emin misiniz?</h3>
            <p className="text-sm text-v3-muted mb-6">
              Bu sejour kaydını silmek istediğinizden emin misiniz? Bu işlemle
              birlikte sejour ile ilişkili tüm faturalar ve kalemler de
              silinecektir. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-v3-text bg-black/5 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmDeleteSejour}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
              >
                {isDeleting ? (
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
      </div>
    </div>
  );
}
