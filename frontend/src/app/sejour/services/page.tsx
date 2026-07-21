"use client";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import ExcelJS from "exceljs";
import { getLogosForExcel } from "@/utils/logoUtils";
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
import { useRouter } from "next/navigation";
import { getDayNameShort } from "@/utils/formatters";
import LoadingSpinner from "@/components/LoadingSpinner";
import { usePermissions, Module } from "@/lib/permissions";

type Currency = "TRY" | "USD" | "EUR" | "GBP" | string;

interface SejourServiceRow {
  voucherNumber: string;
  customerType: "agency" | "customer";
  customerName: string;
  checkInDate: string; // ISO
  checkOutDate: string; // ISO
  hotelName: string;
  guestName: string;
  boardType: string;
  roomType: string;
  accommodationAmount: number;
  accommodationCurrency: Currency;
  flightAmount: number;
  flightCurrency: Currency;
  transferAmount: number;
  transferCurrency: Currency;
  extraAmount: number;
  extraCurrency: Currency;
  totalAmount: number;
  totalCurrency: Currency;
}

interface SejourCostRow {
  voucherNumber: string;
  customerType: "agency" | "customer";
  customerName: string;
  checkInDate: string; // ISO
  checkOutDate: string; // ISO
  hotelName: string;
  guestName: string;
  boardType: string;
  roomType: string;
  accommodationCost: number;
  accommodationCurrency: Currency;
  flightCost: number;
  flightCurrency: Currency;
  transferCost: number;
  transferCurrency: Currency;
  extraCost: number;
  extraCurrency: Currency;
  totalCost: number;
  totalCurrency: Currency;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  total?: number;
}

interface ApiError {
  success: false;
  message?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

function formatCurrency(amount?: number, currency?: string) {
  if (amount == null || Number.isNaN(amount)) return "-";
  const c = currency || "TRY";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: c,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("tr-TR")} ${c}`;
  }
}

function formatDate(date?: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
}

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply?: (start?: string, end?: string) => void;
}

export default function SejourServicesPage() {
  const router = useRouter();
  const { canView, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<"sales" | "costs">("sales");
  const [rows, setRows] = useState<SejourServiceRow[]>([]);
  const [costRows, setCostRows] = useState<SejourCostRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Satış tabı için filtreler
  const todayStr = new Date().toISOString().split("T")[0];
  const [salesFromDate, setSalesFromDate] = useState<string>(todayStr);
  const [salesToDate, setSalesToDate] = useState<string>("");
  const [appliedSalesFromDate, setAppliedSalesFromDate] =
    useState<string>(todayStr);
  const [appliedSalesToDate, setAppliedSalesToDate] = useState<string>("");
  const [salesVoucherTokens, setSalesVoucherTokens] = useState<string[]>([]);
  const [salesVoucherInput, setSalesVoucherInput] = useState<string>("");
  const [salesCustomerTokens, setSalesCustomerTokens] = useState<string[]>([]);
  const [salesCustomerInput, setSalesCustomerInput] = useState<string>("");
  const [salesHotelTokens, setSalesHotelTokens] = useState<string[]>([]);
  const [salesHotelInput, setSalesHotelInput] = useState<string>("");
  const [salesGuestTokens, setSalesGuestTokens] = useState<string[]>([]);
  const [salesGuestInput, setSalesGuestInput] = useState<string>("");

  // Alış tabı için filtreler
  const [costFromDate, setCostFromDate] = useState<string>(todayStr);
  const [costToDate, setCostToDate] = useState<string>("");
  const [appliedCostFromDate, setAppliedCostFromDate] =
    useState<string>(todayStr);
  const [appliedCostToDate, setAppliedCostToDate] = useState<string>("");
  const [costVoucherTokens, setCostVoucherTokens] = useState<string[]>([]);
  const [costVoucherInput, setCostVoucherInput] = useState<string>("");
  const [costCustomerTokens, setCostCustomerTokens] = useState<string[]>([]);
  const [costCustomerInput, setCostCustomerInput] = useState<string>("");
  const [costHotelTokens, setCostHotelTokens] = useState<string[]>([]);
  const [costHotelInput, setCostHotelInput] = useState<string>("");
  const [costGuestTokens, setCostGuestTokens] = useState<string[]>([]);
  const [costGuestInput, setCostGuestInput] = useState<string>("");

  const [forceReload, setForceReload] = useState<number>(0); // Veriyi zorla yeniden yüklemek için

  // Sıralama için state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    const currentVoucherQuery =
      activeTab === "sales"
        ? salesVoucherTokens.join(" ")
        : costVoucherTokens.join(" ");
    const currentCustomerQuery =
      activeTab === "sales"
        ? salesCustomerTokens.join(" ")
        : costCustomerTokens.join(" ");
    const currentHotelQuery =
      activeTab === "sales"
        ? salesHotelTokens.join(" ")
        : costHotelTokens.join(" ");
    const currentGuestQuery =
      activeTab === "sales"
        ? salesGuestTokens.join(" ")
        : costGuestTokens.join(" ");

    const currentFromDate =
      activeTab === "sales" ? appliedSalesFromDate : appliedCostFromDate;
    const currentToDate =
      activeTab === "sales" ? appliedSalesToDate : appliedCostToDate;

    if (currentVoucherQuery) q.set("voucher", currentVoucherQuery);
    if (currentCustomerQuery) q.set("customer", currentCustomerQuery);
    if (currentHotelQuery) q.set("hotel", currentHotelQuery);
    if (currentGuestQuery) q.set("guest", currentGuestQuery);
    if (currentFromDate) q.set("from", currentFromDate);
    if (currentToDate) q.set("to", currentToDate);
    q.set("_t", String(Date.now())); // cache-bust
    return q.toString();
  }, [
    salesVoucherTokens,
    salesVoucherInput,
    salesCustomerTokens,
    salesHotelTokens,
    salesGuestTokens,
    costVoucherTokens,
    costVoucherInput,
    costCustomerTokens,
    costHotelTokens,
    costGuestTokens,
    appliedSalesFromDate,
    appliedSalesToDate,
    appliedCostFromDate,
    appliedCostToDate,
    activeTab,
  ]);

  // Sıralama fonksiyonu
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sıralanmış veriler
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;

    return [...rows].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  const sortedCostRows = useMemo(() => {
    if (!sortConfig) return costRows;

    return [...costRows].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [costRows, sortConfig]);
  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    appliedSalesFromDate,
    appliedSalesToDate,
    appliedCostFromDate,
    appliedCostToDate,
    sortConfig,
    salesVoucherTokens,
    salesVoucherInput,
    salesCustomerTokens,
    salesHotelTokens,
    salesGuestTokens,
    costVoucherTokens,
    costCustomerTokens,
    costHotelTokens,
    costGuestTokens,
  ]);

  const handleApplySalesDates = (start?: string, end?: string) => {
    setAppliedSalesFromDate(start !== undefined ? start : salesFromDate);
    setAppliedSalesToDate(end !== undefined ? end : salesToDate);
    setPage(1);
  };

  const handleApplyCostDates = (start?: string, end?: string) => {
    setAppliedCostFromDate(start !== undefined ? start : costFromDate);
    setAppliedCostToDate(end !== undefined ? end : costToDate);
    setPage(1);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentVoucherQuery =
        activeTab === "sales"
          ? salesVoucherTokens.join(" ")
          : costVoucherTokens.join(" ");
      const currentFromDate =
        activeTab === "sales" ? appliedSalesFromDate : appliedCostFromDate;
      const currentToDate =
        activeTab === "sales" ? appliedSalesToDate : appliedCostToDate;
      const response = await SejourService.getSejoursPage({
        page,
        pageSize,
        searchTerm: currentVoucherQuery,
        startDate: currentFromDate,
        endDate: currentToDate,
        sortField: "check_in_date",
        sortDirection: "asc",
        statusFilter: "konfirme",
      });
      const sejourData = response.data;
      setTotalCount(response.total);
      setTotalPages(response.totalPages);

      // Sadece konfirme durumundaki sejour'ları filtrele
      const confirmedSejours = sejourData.filter((sejour: any) => {
        const status = (sejour.status || "").toString().toLowerCase();
        return status.includes("konf") || status.includes("confirm");
      });

      // Sejour verilerini hizmet formatına çevir
      const services: SejourServiceRow[] = confirmedSejours.map(
        (sejour: any) => {
          // Otel bilgisini al (ilk odadan)
          let hotelName = "";
          let roomType = "";
          let boardType = "";
          let guestNames: string[] = [];

          if (sejour.rooms && sejour.rooms.length > 0) {
            const firstRoom = sejour.rooms[0];
            // Otel adını bul: önce odaya bağlanan otel adı, sonra sejour üzerindeki otel, en son id fallback
            hotelName =
              firstRoom.hotelName ||
              (sejour as any).hotels?.name ||
              firstRoom.hotelId ||
              "";
            roomType = firstRoom.roomType || "";
            boardType = firstRoom.accommodationType || "";

            // Misafir bilgilerini topla
            sejour.rooms.forEach((room: any) => {
              if (room.guestInfo) {
                guestNames.push(room.guestInfo);
              }
            });
          }

          // Toplam tutarları hesapla
          const totals = sejour.totals || { TRY: 0, USD: 0, EUR: 0 };
          const mainCurrency = Object.keys(totals).reduce((a, b) =>
            totals[a as keyof typeof totals] > totals[b as keyof typeof totals]
              ? a
              : b,
          ) as Currency;

          const totalAmount = totals[mainCurrency] || 0;

          return {
            voucherNumber: sejour.voucherNumber || "",
            customerType: sejour.customerType || "customer",
            customerName:
              sejour.customerType === "agency"
                ? sejour.agencyName || ""
                : sejour.customerName || "",
            checkInDate: sejour.checkInDate || "",
            checkOutDate: sejour.checkOutDate || "",
            hotelName: hotelName || "-",
            guestName: guestNames.length > 0 ? guestNames.join(", ") : "-",
            boardType: boardType || "-",
            roomType: roomType || "-",
            accommodationAmount: Math.floor(totalAmount * 0.6), // %60 konaklama
            accommodationCurrency: mainCurrency,
            flightAmount: Math.floor(totalAmount * 0.3), // %30 uçuş
            flightCurrency: mainCurrency,
            transferAmount: Math.floor(totalAmount * 0.07), // %7 transfer
            transferCurrency: mainCurrency,
            extraAmount: Math.floor(totalAmount * 0.03), // %3 ekstra
            extraCurrency: mainCurrency,
            totalAmount: totalAmount,
            totalCurrency: mainCurrency,
          };
        },
      );

      // Filtreleme uygula - ek güvenlik filtresi
      let filteredServices = services;

      // Token tabanlı filtreleme
      const currentCustomerTokens =
        activeTab === "sales" ? salesCustomerTokens : costCustomerTokens;
      const currentHotelTokens =
        activeTab === "sales" ? salesHotelTokens : costHotelTokens;
      const currentGuestTokens =
        activeTab === "sales" ? salesGuestTokens : costGuestTokens;

      if (currentVoucherQuery) {
        filteredServices = filteredServices.filter((s) =>
          includesByTokens(
            s.voucherNumber,
            activeTab === "sales"
              ? [...salesVoucherTokens, salesVoucherInput.trim()].filter(
                  Boolean,
                )
              : [...costVoucherTokens, costVoucherInput.trim()].filter(Boolean),
          ),
        );
      }
      if (currentCustomerTokens.length > 0) {
        filteredServices = filteredServices.filter((s) =>
          includesByTokens(s.customerName, currentCustomerTokens),
        );
      }
      if (currentHotelTokens.length > 0) {
        filteredServices = filteredServices.filter((s) =>
          includesByTokens(s.hotelName, currentHotelTokens),
        );
      }
      if (currentGuestTokens.length > 0) {
        filteredServices = filteredServices.filter((s) =>
          includesByTokens(s.guestName, currentGuestTokens),
        );
      }

      // Tarih filtresi
      if (currentFromDate) {
        filteredServices = filteredServices.filter(
          (service) =>
            new Date(service.checkInDate) >= new Date(currentFromDate),
        );
      }

      if (currentToDate) {
        filteredServices = filteredServices.filter(
          (service) =>
            new Date(service.checkOutDate) <= new Date(currentToDate),
        );
      }

      setRows(filteredServices);

      // Maliyet verilerini de yükle (satış fiyatlarının %70'i olarak hesapla)
      const costServices: SejourCostRow[] = confirmedSejours.map(
        (sejour: any) => {
          // Otel bilgisini al (ilk odadan)
          let hotelName = "";
          let roomType = "";
          let boardType = "";
          let guestNames: string[] = [];

          if (sejour.rooms && sejour.rooms.length > 0) {
            const firstRoom = sejour.rooms[0];
            // Otel adını bul: önce oda üzerinden gelen otel adı, sonra sejour üzerindeki otel, en son id
            hotelName =
              firstRoom.hotelName ||
              (sejour as any).hotels?.name ||
              firstRoom.hotelId ||
              "";
            roomType = firstRoom.roomType || "";
            boardType = firstRoom.accommodationType || "";

            // Misafir bilgilerini topla
            sejour.rooms.forEach((room: any) => {
              if (room.guestInfo) {
                guestNames.push(room.guestInfo);
              }
            });
          }

          // Toplam tutarları hesapla
          const totals = sejour.totals || { TRY: 0, USD: 0, EUR: 0 };
          const mainCurrency = Object.keys(totals).reduce((a, b) =>
            totals[a as keyof typeof totals] > totals[b as keyof typeof totals]
              ? a
              : b,
          ) as Currency;

          const totalAmount = totals[mainCurrency] || 0;
          const costMultiplier = 0.7; // Maliyet satış fiyatının %70'i

          return {
            voucherNumber: sejour.voucherNumber || "",
            customerType: sejour.customerType || "customer",
            customerName:
              sejour.customerType === "agency"
                ? sejour.agencyName || ""
                : sejour.customerName || "",
            checkInDate: sejour.checkInDate || "",
            checkOutDate: sejour.checkOutDate || "",
            hotelName: hotelName || "-",
            guestName: guestNames.length > 0 ? guestNames.join(", ") : "-",
            boardType: boardType || "-",
            roomType: roomType || "-",
            accommodationCost: Math.floor(totalAmount * 0.6 * costMultiplier), // %60 konaklama maliyeti
            accommodationCurrency: mainCurrency,
            flightCost: Math.floor(totalAmount * 0.3 * costMultiplier), // %30 uçuş maliyeti
            flightCurrency: mainCurrency,
            transferCost: Math.floor(totalAmount * 0.07 * costMultiplier), // %7 transfer maliyeti
            transferCurrency: mainCurrency,
            extraCost: Math.floor(totalAmount * 0.03 * costMultiplier), // %3 ekstra maliyet
            extraCurrency: mainCurrency,
            totalCost: Math.floor(totalAmount * costMultiplier), // Toplam maliyet
            totalCurrency: mainCurrency,
          };
        },
      );

      // Maliyet verilerini de filtrele - aktif tab'a göre doğru filtreleri kullan
      let filteredCostServices = costServices;

      if (currentVoucherQuery) {
        filteredCostServices = filteredCostServices.filter((service) => {
          const query = currentVoucherQuery.toLowerCase();
          return (
            service.voucherNumber.toLowerCase().includes(query) ||
            service.customerName.toLowerCase().includes(query) ||
            service.guestName.toLowerCase().includes(query) ||
            service.hotelName.toLowerCase().includes(query) ||
            service.boardType.toLowerCase().includes(query) ||
            service.roomType.toLowerCase().includes(query) ||
            service.checkInDate.toLowerCase().includes(query) ||
            service.checkOutDate.toLowerCase().includes(query) ||
            service.totalCost.toString().includes(query) ||
            service.accommodationCost.toString().includes(query) ||
            service.flightCost.toString().includes(query) ||
            service.transferCost.toString().includes(query) ||
            service.extraCost.toString().includes(query)
          );
        });
      }

      if (currentFromDate) {
        filteredCostServices = filteredCostServices.filter(
          (service) =>
            new Date(service.checkInDate) >= new Date(currentFromDate),
        );
      }

      if (currentToDate) {
        filteredCostServices = filteredCostServices.filter(
          (service) =>
            new Date(service.checkOutDate) <= new Date(currentToDate),
        );
      }

      setCostRows(filteredCostServices);
      // Burada return etmiyoruz; Supabase verisi üzerinden çalıştığımız için
      // fonksiyonun geri kalanında ekstra işlem yok.
    } catch (e) {
      const message = (e as any)?.message || "Veri yüklenemedi";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sayfa ilk açıldığında otomatik olarak yükle
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece bir kez çalışsın

  // Filtre değişikliklerinde veriyi yeniden yükle
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedSalesFromDate,
    appliedSalesToDate,
    appliedCostFromDate,
    appliedCostToDate,
    salesVoucherTokens,
    salesVoucherInput,
    salesCustomerTokens,
    salesHotelTokens,
    salesGuestTokens,
    costVoucherTokens,
    costVoucherInput,
    costCustomerTokens,
    costHotelTokens,
    costGuestTokens,
    activeTab,
    forceReload,
  ]);

  // ExcelJS ile Export - Satış Tabı
  const exportSalesExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Sejour Satış Hizmetleri`,
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

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(false); // Açık tema logosu kullan
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
        tl: { col: 11.5, row: 0.23 },
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }

    // Columns
    sheet.columns = [
      { header: "VOUCHER NO", key: "voucherNumber", width: 16 },
      { header: "ACENTE/MÜŞTERİ", key: "customerName", width: 20 },
      { header: "GİRİŞ TARİHİ", key: "checkInDate", width: 14 },
      { header: "ÇIKIŞ TARİHİ", key: "checkOutDate", width: 14 },
      { header: "OTEL", key: "hotelName", width: 20 },
      { header: "MİSAFİR", key: "guestName", width: 25 },
      { header: "KONAKLAMA TİPİ", key: "boardType", width: 16 },
      { header: "ODA TİPİ", key: "roomType", width: 16 },
      { header: "KONAKLAMA SATIŞI", key: "accommodationAmount", width: 16 },
      { header: "UÇUŞ SATIŞI", key: "flightAmount", width: 14 },
      { header: "TRANSFER SATIŞI", key: "transferAmount", width: 16 },
      { header: "EKSTRA SATIŞI", key: "extraAmount", width: 14 },
      { header: "TOPLAM SATIŞI", key: "totalAmount", width: 16 },
      { header: "DÖVİZ", key: "currency", width: 8 },
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
    sheet.getColumn("accommodationAmount").numFmt = "#,##0.00";
    sheet.getColumn("flightAmount").numFmt = "#,##0.00";
    sheet.getColumn("transferAmount").numFmt = "#,##0.00";
    sheet.getColumn("extraAmount").numFmt = "#,##0.00";
    sheet.getColumn("totalAmount").numFmt = "#,##0.00";

    const fmtDate = (d?: string) =>
      d ? new Date(d).toLocaleDateString("tr-TR") : "";

    sortedRows.forEach((row: any) => {
      const dataRow = sheet.addRow({
        voucherNumber: row.voucherNumber || "",
        customerName: row.customerName || "",
        checkInDate: fmtDate(row.checkInDate),
        checkOutDate: fmtDate(row.checkOutDate),
        hotelName: row.hotelName || "",
        guestName: row.guestName || "",
        boardType: row.boardType || "",
        roomType: row.roomType || "",
        accommodationAmount: Number(row.accommodationAmount || 0),
        flightAmount: Number(row.flightAmount || 0),
        transferAmount: Number(row.transferAmount || 0),
        extraAmount: Number(row.extraAmount || 0),
        totalAmount: Number(row.totalAmount || 0),
        currency: row.currency || "TRY",
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      for (let i = 9; i <= 13; i++) {
        // 9-13 arası sayısal sütunlar
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
    link.download = `sejour_satis_hizmetleri_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // ExcelJS ile Export - Alış Tabı
  const exportCostsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      `${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} - Sejour Alış Hizmetleri`,
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

    // Logos - yeni sistem (URL'den base64'e çevirir)
    const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(false); // Açık tema logosu kullan
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
        tl: { col: 11.5, row: 0.23 },
        ext: { width: (typeof iconWidth !== "undefined" ? iconWidth : 120), height: (typeof iconHeight !== "undefined" ? iconHeight : 60) } as any,
      } as any);
    }

    // Columns
    sheet.columns = [
      { header: "VOUCHER NO", key: "voucherNumber", width: 16 },
      { header: "ACENTE/MÜŞTERİ", key: "customerName", width: 20 },
      { header: "GİRİŞ TARİHİ", key: "checkInDate", width: 14 },
      { header: "ÇIKIŞ TARİHİ", key: "checkOutDate", width: 14 },
      { header: "OTEL", key: "hotelName", width: 20 },
      { header: "MİSAFİR", key: "guestName", width: 25 },
      { header: "KONAKLAMA TİPİ", key: "boardType", width: 16 },
      { header: "ODA TİPİ", key: "roomType", width: 16 },
      { header: "KONAKLAMA MALİYETİ", key: "accommodationCost", width: 18 },
      { header: "UÇUŞ MALİYETİ", key: "flightCost", width: 16 },
      { header: "TRANSFER MALİYETİ", key: "transferCost", width: 18 },
      { header: "EKSTRA MALİYETİ", key: "extraCost", width: 16 },
      { header: "TOPLAM MALİYETİ", key: "totalCost", width: 18 },
      { header: "DÖVİZ", key: "currency", width: 8 },
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
    sheet.getColumn("accommodationCost").numFmt = "#,##0.00";
    sheet.getColumn("flightCost").numFmt = "#,##0.00";
    sheet.getColumn("transferCost").numFmt = "#,##0.00";
    sheet.getColumn("extraCost").numFmt = "#,##0.00";
    sheet.getColumn("totalCost").numFmt = "#,##0.00";

    const fmtDate = (d?: string) =>
      d ? new Date(d).toLocaleDateString("tr-TR") : "";

    sortedCostRows.forEach((row: any) => {
      const dataRow = sheet.addRow({
        voucherNumber: row.voucherNumber || "",
        customerName: row.customerName || "",
        checkInDate: fmtDate(row.checkInDate),
        checkOutDate: fmtDate(row.checkOutDate),
        hotelName: row.hotelName || "",
        guestName: row.guestName || "",
        boardType: row.boardType || "",
        roomType: row.roomType || "",
        accommodationCost: Number(row.accommodationCost || 0),
        flightCost: Number(row.flightCost || 0),
        transferCost: Number(row.transferCost || 0),
        extraCost: Number(row.extraCost || 0),
        totalCost: Number(row.totalCost || 0),
        currency: row.currency || "TRY",
      });
      // Veri satırı: sayısal sütunlar sağa hizalı
      for (let i = 9; i <= 13; i++) {
        // 9-13 arası sayısal sütunlar
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
    link.download = `sejour_alis_hizmetleri_${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtreleri temizleme fonksiyonu - Services sayfası için
  const clearServicesFilters = () => {
    if (activeTab === "sales") {
      setSalesFromDate("");
      setSalesToDate("");
      setAppliedSalesFromDate("");
      setAppliedSalesToDate("");
      setSalesVoucherTokens([]);
      setSalesVoucherInput("");
      setSalesCustomerTokens([]);
      setSalesCustomerInput("");
      setSalesHotelTokens([]);
      setSalesHotelInput("");
      setSalesGuestTokens([]);
      setSalesGuestInput("");
    } else {
      setCostFromDate("");
      setCostToDate("");
      setAppliedCostFromDate("");
      setAppliedCostToDate("");
      setCostVoucherTokens([]);
      setCostVoucherInput("");
      setCostCustomerTokens([]);
      setCostCustomerInput("");
      setCostHotelTokens([]);
      setCostHotelInput("");
      setCostGuestTokens([]);
      setCostGuestInput("");
    }
    setPage(1);
    setForceReload((prev) => prev + 1);
  };

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
  const activeRows = activeTab === "sales" ? sortedRows : sortedCostRows;
  const visibleRows = activeRows;

  const voucherSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          activeRows.map((r) => (r.voucherNumber || "").trim()).filter(Boolean),
        ),
      ),
    [activeRows],
  );

  const customerSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          activeRows.map((r) => (r.customerName || "").trim()).filter(Boolean),
        ),
      ),
    [activeRows],
  );

  const hotelSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          activeRows.map((r) => (r.hotelName || "").trim()).filter(Boolean),
        ),
      ),
    [activeRows],
  );

  const guestSuggestions = useMemo(() => {
    const guests = new Set<string>();
    activeRows.forEach((r) => {
      if (r.guestName) {
        r.guestName.split(",").forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) guests.add(trimmed);
        });
      }
    });
    return Array.from(guests);
  }, [activeRows]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  if (!canView(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">Yetki Gerekli</h1>
          <p className="text-v3-muted mb-6">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <a
            href="/sejour"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Sejour Listesine Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col">
        {/* Header */}

        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text">
              Sejour Hizmet Listesi
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Sejour hizmet kalemlerini inceleyin ve filtreleyin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="flex-1 min-w-[200px]">
              <ResponsiveDateRangeField
                label="C-IN C-OUT Tarihi"
                startValue={
                  activeTab === "sales" ? salesFromDate : costFromDate
                }
                endValue={activeTab === "sales" ? salesToDate : costToDate}
                onStartChange={
                  activeTab === "sales" ? setSalesFromDate : setCostFromDate
                }
                onEndChange={
                  activeTab === "sales" ? setSalesToDate : setCostToDate
                }
                onApply={
                  activeTab === "sales"
                    ? handleApplySalesDates
                    : handleApplyCostDates
                }
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Voucher No, Müşteri, Otel, Misafir)"
                tokens={
                  activeTab === "sales" ? salesVoucherTokens : costVoucherTokens
                }
                inputValue={
                  activeTab === "sales" ? salesVoucherInput : costVoucherInput
                }
                suggestions={voucherSuggestions}
                onInputChange={
                  activeTab === "sales"
                    ? setSalesVoucherInput
                    : setCostVoucherInput
                }
                onAddToken={(value) =>
                  activeTab === "sales"
                    ? addToken(
                        value,
                        setSalesVoucherTokens,
                        setSalesVoucherInput,
                      )
                    : addToken(value, setCostVoucherTokens, setCostVoucherInput)
                }
                onRemoveToken={(value) =>
                  activeTab === "sales"
                    ? removeToken(value, setSalesVoucherTokens)
                    : removeToken(value, setCostVoucherTokens)
                }
              />
            </div>



            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 border-l border-v3-border pl-3">
              <button
                onClick={exportSalesExcel}
                className="bg-green-500 hover:bg-green-600 text-white border-transparent shadow-[0_0_15px_rgba(34,197,94,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                title="Satış Excel'e Aktar"
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
                Satış Excel
              </button>
              <button
                onClick={exportCostsExcel}
                className="bg-blue-500 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] px-4 h-10 rounded-xl transition-all duration-300 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2"
                title="Alış Excel'e Aktar"
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
                Alış Excel
              </button>
            </div>
          </div>
        </div>

        {/* Unified Stats Strip for Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1 pl-1">
              VERİ TÜRÜ:
            </span>
            <button
              onClick={() => {
                setActiveTab("sales");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${activeTab === "sales" ? "bg-blue-500/20 border border-blue-500/50 text-white" : "hover:bg-v3-surface/5 border border-transparent text-white"}`}
            >
              <span>SATIŞ HİZMETLERİ</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("costs");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${activeTab === "costs" ? "bg-emerald-500/20 border border-emerald-500/50 text-white" : "hover:bg-v3-surface/5 border border-transparent text-white"}`}
            >
              <span>ALIŞ HİZMETLERİ</span>
            </button>
          </div>
        </div>

        {/* Hatalar/Loading */}
        {loading && (
          <div className="bg-v3-surface/5 backdrop-blur-md border border-v3-border rounded-xl p-4 mb-4 shadow-sm">
            <LoadingSpinner message="Servis listesi yükleniyor..." compact />
          </div>
        )}
        {error && (
          <div className="bg-v3-surface/5 backdrop-blur-md border border-v3-border rounded-xl p-4 mb-4 shadow-sm">
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Tablo */}
        {!loading && !error && (
          <div className="flex-1 bg-v3-surface/5 backdrop-blur-md border border-v3-border rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-v3-surface sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-v3-border">
                  <tr>
                    <th
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("voucherNumber")}
                    >
                      <div className="flex items-center gap-1">
                        Voucher No
                        {sortConfig?.key === "voucherNumber" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("customerName")}
                    >
                      <div className="flex items-center gap-1">
                        Acente/Müşteri
                        {sortConfig?.key === "customerName" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("checkInDate")}
                    >
                      <div className="flex items-center gap-1">
                        C-In
                        {sortConfig?.key === "checkInDate" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("checkOutDate")}
                    >
                      <div className="flex items-center gap-1">
                        C-Out
                        {sortConfig?.key === "checkOutDate" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("hotelName")}
                    >
                      <div className="flex items-center gap-1">
                        Otel
                        {sortConfig?.key === "hotelName" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("guestName")}
                    >
                      <div className="flex items-center gap-1">
                        Misafir
                        {sortConfig?.key === "guestName" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("boardType")}
                    >
                      <div className="flex items-center gap-1">
                        Konaklama Tipi
                        {sortConfig?.key === "boardType" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-left text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() => handleSort("roomType")}
                    >
                      <div className="flex items-center gap-1">
                        Oda Tipi
                        {sortConfig?.key === "roomType" && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-right text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() =>
                        handleSort(
                          activeTab === "costs"
                            ? "accommodationCost"
                            : "accommodationAmount",
                        )
                      }
                    >
                      <div className="flex items-center gap-1 justify-end">
                        {activeTab === "costs"
                          ? "Konaklama Maliyeti"
                          : "Konaklama Satışı"}
                        {sortConfig?.key ===
                          (activeTab === "costs"
                            ? "accommodationCost"
                            : "accommodationAmount") && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-right text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() =>
                        handleSort(
                          activeTab === "costs" ? "flightCost" : "flightAmount",
                        )
                      }
                    >
                      <div className="flex items-center gap-1 justify-end">
                        {activeTab === "costs"
                          ? "Uçuş Maliyeti"
                          : "Uçuş Satışı"}
                        {sortConfig?.key ===
                          (activeTab === "costs"
                            ? "flightCost"
                            : "flightAmount") && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-right text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() =>
                        handleSort(
                          activeTab === "costs"
                            ? "transferCost"
                            : "transferAmount",
                        )
                      }
                    >
                      <div className="flex items-center gap-1 justify-end">
                        {activeTab === "costs"
                          ? "Transfer Maliyeti"
                          : "Transfer Satışı"}
                        {sortConfig?.key ===
                          (activeTab === "costs"
                            ? "transferCost"
                            : "transferAmount") && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="px-2.5 py-2.5 text-right text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface/10 transition-colors border-b border-v3-border"
                      onClick={() =>
                        handleSort(
                          activeTab === "costs" ? "extraCost" : "extraAmount",
                        )
                      }
                    >
                      <div className="flex items-center gap-1 justify-end">
                        {activeTab === "costs"
                          ? "Ekstra Maliyet"
                          : "Ekstra Satışı"}
                        {sortConfig?.key ===
                          (activeTab === "costs"
                            ? "extraCost"
                            : "extraAmount") && (
                          <svg
                            className={`w-3 h-3 ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
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
                      className="text-right px-2 py-2 text-xs font-medium text-v3-text uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() =>
                        handleSort(
                          activeTab === "costs" ? "totalCost" : "totalAmount",
                        )
                      }
                    >
                      {activeTab === "costs"
                        ? "Toplam Maliyet"
                        : "Toplam Satışı"}{" "}
                      {sortConfig?.key ===
                        (activeTab === "costs" ? "totalCost" : "totalAmount") &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {visibleRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-2.5 py-4 text-center text-v3-muted text-xs"
                      >
                        Kayıt bulunamadı
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((r, idx) => (
                    <tr
                      key={`${r.voucherNumber}-${idx}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                      onDoubleClick={() =>
                        router.push("/sejour?search=" + r.voucherNumber)
                      }
                    >
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text transition-colors duration-200">
                        <button
                          onClick={() => {
                            // TODO: Supabase'den sejour ID'sini bul
                            console.log(
                              "Sejour detayı açılacak:",
                              r.voucherNumber,
                            );
                            // Şimdilik voucher number ile arama yapılacak
                            // window.open(`/sejour/search?q=${r.voucherNumber}`, '_blank');
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer font-medium"
                          title="Sejour detayını görüntüle"
                        >
                          {r.voucherNumber}
                        </button>
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                        {r.customerName}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-white">
                        <div className="flex items-center">
                          <span>{formatDate(r.checkInDate)}</span>
                          {r.checkInDate && (
                            <span className="text-slate-500 ml-1 text-[10px] uppercase font-medium tracking-wider">
                              , {getDayNameShort(r.checkInDate)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-white">
                        <div className="flex items-center">
                          <span>{formatDate(r.checkOutDate)}</span>
                          {r.checkOutDate && (
                            <span className="text-slate-500 ml-1 text-[10px] uppercase font-medium tracking-wider">
                              , {getDayNameShort(r.checkOutDate)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                        {r.hotelName || "-"}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                        {r.guestName || "-"}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                        {r.boardType || "-"}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200">
                        {r.roomType || "-"}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200 text-right">
                        {formatCurrency(
                          activeTab === "costs"
                            ? (r as SejourCostRow).accommodationCost
                            : (r as SejourServiceRow).accommodationAmount,
                          activeTab === "costs"
                            ? (r as SejourCostRow).accommodationCurrency
                            : (r as SejourServiceRow).accommodationCurrency,
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200 text-right">
                        {formatCurrency(
                          activeTab === "costs"
                            ? (r as SejourCostRow).flightCost
                            : (r as SejourServiceRow).flightAmount,
                          activeTab === "costs"
                            ? (r as SejourCostRow).flightCurrency
                            : (r as SejourServiceRow).flightCurrency,
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200 text-right">
                        {formatCurrency(
                          activeTab === "costs"
                            ? (r as SejourCostRow).transferCost
                            : (r as SejourServiceRow).transferAmount,
                          activeTab === "costs"
                            ? (r as SejourCostRow).transferCurrency
                            : (r as SejourServiceRow).transferCurrency,
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200 text-right">
                        {formatCurrency(
                          activeTab === "costs"
                            ? (r as SejourCostRow).extraCost
                            : (r as SejourServiceRow).extraAmount,
                          activeTab === "costs"
                            ? (r as SejourCostRow).extraCurrency
                            : (r as SejourServiceRow).extraCurrency,
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors duration-200 text-right">
                        {formatCurrency(
                          activeTab === "costs"
                            ? (r as SejourCostRow).totalCost
                            : (r as SejourServiceRow).totalAmount,
                          activeTab === "costs"
                            ? (r as SejourCostRow).totalCurrency
                            : (r as SejourServiceRow).totalCurrency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalCount > 0 && (
              <div className="flex justify-end px-4 py-3 bg-black/5 dark:bg-white/5 backdrop-blur-md border-t border-v3-border">
                <div className="flex items-center gap-3 text-v3-text">
                  <span className="text-sm">Toplam {totalCount} kayıt</span>
                  <button
                    className="h-8 w-8 rounded-md border border-v3-border disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ‹
                  </button>
                  <span className="text-sm font-medium">{page}</span>
                  <button
                    className="h-8 w-8 rounded-md border border-v3-border disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    ›
                  </button>
                  <select
                    value={pageSize}
                    className="h-8 rounded-md border border-v3-border bg-v3-surface px-2 text-sm"
                    onChange={(e) => {
                      const size = Number(e.target.value) || DEFAULT_PAGE_SIZE;
                      setPageSize(size);
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} / sayfa
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
