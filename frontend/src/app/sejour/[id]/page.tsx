"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { X, ScrollText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  SejourService,
  SettingsService,
  usersService,
  agenciesService,
  hotelsService,
  categoriesService,
  suppliersService,
} from "@/lib/supabaseService";
import { getLogosForExcel } from "@/utils/logoUtils";
import Modal from "@/components/Modal";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import { supabase } from "@/lib/supabase";
import { usePermissions, Module } from "@/lib/permissions";

interface SejourRoom {
  roomNumber: string;
  hotelName?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
}

interface SejourFlight {
  type: "departure" | "return";
  airline: string;
  flightNo: string;
  flightDate: string;
  route: string;
  pnr?: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
}

interface SejourTransfer {
  direction: "arrival" | "return" | "intermediate";
  supplierName?: string;
  vehicle: string;
  type: "private" | "economic";
  time: string;
  price: number;
  currency: string;
}

interface SejourExtraService {
  serviceTypeName?: string;
  supplierName?: string;
  description: string;
  price: number;
  currency: string;
}

interface SejourData {
  id: string;
  voucherNumber: string;
  customerType: string;
  customerName: string;
  agencyName: string;
  checkInDate: string;
  checkOutDate: string;
  hotelName?: string;
  hotelAddress?: string;
  rooms: SejourRoom[];
  flights: SejourFlight[];
  transfers: SejourTransfer[];
  extraServices: SejourExtraService[];
  totals: Record<string, number>;
  currency: string;
  status: string;
  notes: string;
  created_at: string;
}

const fieldTranslations: Record<string, string> = {
  id: "ID",
  project_id: "Proje ID",
  sejour_id: "Sejour ID",
  category: "Kategori",
  sub_category: "Alt Kategori",
  description: "Açıklama",
  unit_price: "Birim Fiyat",
  unit_quantity: "Miktar",
  sefer: "Tekrar/Sefer",
  vat: "KDV (%)",
  fx: "Döviz Kuru",
  currency: "Döviz",
  total_try: "Toplam (TL)",
  total_price: "Toplam Fiyat",
  created_at: "Oluşturulma Tarihi",
  updated_at: "Güncellenme Tarihi",
  supplier_id: "Tedarikçi ID",
  supplier_name: "Tedarikçi Adı",
  status: "Durum",
  title: "Başlık",
  start_date: "Başlangıç Tarihi",
  end_date: "Bitiş Tarihi",
  hotel_id: "Otel ID",
  room_count: "Oda Sayısı",
  pax_count: "Kişi Sayısı",
  module: "Modül",
  entity_type: "Kayıt Tipi",
  action: "İşlem",
  amount: "Tutar",
  date: "Tarih",
  time: "Saat",
  notes: "Notlar",
  name: "İsim",
  surname: "Soyisim",
  identity_number: "TC/Pasaport",
  phone: "Telefon",
  email: "E-posta",
};

const translateField = (key: string) => fieldTranslations[key] || key;

const getChanges = (before: any, after: any) => {
  const changes: { field: string; oldVal: any; newVal: any }[] = [];
  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  const ignoreKeys = [
    "id",
    "created_at",
    "updated_at",
    "sejour_id",
    "project_id",
  ];

  allKeys.forEach((key) => {
    if (ignoreKeys.includes(key)) return;

    const oldVal = before ? before[key] : undefined;
    const newVal = after ? after[key] : undefined;

    const stringifyVal = (val: any) => {
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    };

    const sOld = stringifyVal(oldVal);
    const sNew = stringifyVal(newVal);

    if (sOld !== sNew) {
      changes.push({
        field: key,
        oldVal: oldVal,
        newVal: newVal,
      });
    }
  });

  return changes;
};

const resolveUuidsInString = (
  str: string,
  uuidMap?: Record<string, string>,
): string => {
  if (!str || typeof str !== "string" || !uuidMap) return str;
  let result = str.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    (match) => {
      return uuidMap[match] || "";
    },
  );
  result = result
    .replace(/\[[A-Z]:\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return result;
};

const formatLogValue = (val: any, uuidMap?: Record<string, string>): string => {
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "boolean") return val ? "Evet" : "Hayır";
  if (typeof val === "string") return resolveUuidsInString(val, uuidMap);
  if (typeof val === "object")
    return resolveUuidsInString(JSON.stringify(val), uuidMap);
  return String(val);
};

const getItemContext = (log: any, uuidMap: Record<string, string>) => {
  const data = log.after_data || log.before_data;
  if (!data) return null;
  const details: string[] = [];
  if (data.description)
    details.push(
      `Açıklama: ${resolveUuidsInString(data.description, uuidMap)}`,
    );
  if (data.title)
    details.push(`Başlık: ${resolveUuidsInString(data.title, uuidMap)}`);
  if (data.name)
    details.push(`İsim: ${resolveUuidsInString(data.name, uuidMap)}`);
  if (data.pnr) details.push(`PNR: ${resolveUuidsInString(data.pnr, uuidMap)}`);
  return details.length > 0 ? details.join(" | ") : null;
};

export default function SejourDetailPage() {
  const params = useParams();
  const { canEdit } = usePermissions();
  // Logs state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearchTerms, setLogSearchTerms] = useState<string[]>([]);
  const [logSearchInput, setLogSearchInput] = useState("");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .in("module", [
          "sejours",
          "sejour_items",
          "sejour_guests",
          "sejour_flights",
          "sejour_transfers",
          "sejour_extra_services",
        ])
        .order("occurred_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const filtered = (data || []).filter((log) => {
        if (log.entity_id === params.id) return true;
        if (log.after_data?.sejour_id === params.id) return true;
        if (log.before_data?.sejour_id === params.id) return true;
        return false;
      });

      setLogsData(filtered);
    } catch (err) {
      console.error("Loglar yüklenirken hata:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const [sejour, setSejour] = useState<SejourData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const voucherRef = useRef<HTMLDivElement>(null);
  const [darkIconLogo, setDarkIconLogo] = useState<string>("");
  const [darkWordmarkLogo, setDarkWordmarkLogo] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    company_name:
      typeof document !== "undefined"
        ? document.title.split("-")[0].trim()
        : "Firma",
    company_email: "info@firma.com",
    company_phone: "",
    company_address: "",
    company_website: "www.firma.com",
  });
  
  const [sejourInvoices, setSejourInvoices] = useState<any[]>([]);

  const loadSejourData = useCallback(async () => {
    try {
      setLoading(true);
      const [sejourData, uList, agList, htList, catList, supList] =
        await Promise.all([
          SejourService.getSejourWithDetails(params.id as string),
          usersService.getAll(),
          agenciesService.getAll(),
          hotelsService.getAll(),
          categoriesService.getAll(),
          suppliersService.getAll(),
        ]);
      if (uList) setUsers(uList);
      if (agList) setAgencies(agList);
      if (htList) setHotels(htList);
      if (catList) setCategories(catList);
      if (supList) setSuppliers(supList);
      if (sejourData) {
        setSejour(sejourData as SejourData);
        
        try {
          const response = await fetch(`/api/invoices/list?entityId=${params.id as string}`);
          const data = await response.json();
          if (response.ok && data.invoices) {
            setSejourInvoices(data.invoices.filter((inv: any) => ['APPROVED', 'PENDING', 'PROCESSING'].includes(inv.status)));
          }
        } catch (err) {
          console.error("Faturalar yüklenirken hata:", err);
        }
      } else {
        setError("Sejour bulunamadı");
      }
    } catch (err) {
      console.error("Error loading sejour:", err);
      setError("Sejour yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      loadSejourData();
    }

    const loadLogos = async () => {
      try {
        const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(false);
        if (iconLogoBase64) setDarkIconLogo(iconLogoBase64);
        if (wordmarkLogoBase64) setDarkWordmarkLogo(wordmarkLogoBase64);
      } catch (err) {
        console.error("Error loading logos:", err);
      }
    };

    const loadCompanyInfo = async () => {
      try {
        const settings = await SettingsService.getSettings();
        const generalSettings = settings.general_settings || {};
        setCompanyInfo({
          company_name:
            generalSettings.companyName || generalSettings.company_name ||
            (typeof document !== "undefined"
              ? document.title.split("-")[0].trim()
              : "Firma"),
          company_email:
            generalSettings.companyEmail || generalSettings.company_email || "info@firma.com",
          company_phone: generalSettings.companyPhone || generalSettings.company_phone || "",
          company_address: generalSettings.companyAddress || generalSettings.company_address || "",
          company_website:
            generalSettings.companyWebsite || generalSettings.company_website ||
            generalSettings.companyEmail?.split("@")[1] ||
            "www.firma.com",
        });
      } catch (err) {
        console.error("Error loading company info:", err);
      }
    };

    loadLogos();
    loadCompanyInfo();
  }, [params.id, loadSejourData]);

  const generateVoucherPDF = async () => {
    if (!voucherRef.current || !sejour) return;

    try {
      setIsGeneratingPDF(true);

      const voucherElement = voucherRef.current;
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(voucherElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: true,
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pageWidth,
        Math.min(imgHeight, pageHeight),
      );
      pdf.save(`voucher-${sejour.voucherNumber}.pdf`);
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      alert("PDF oluşturulurken hata oluştu: " + (err as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "KONFİRME":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "İPTAL":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "TEKLİF":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "BEKLEMEDE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const uuidNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (users || []).forEach((u) => {
      if (u.id) map[u.id] = u.name || u.email || "Kullanıcı";
    });
    (categories || []).forEach((c) => {
      if (c.id) map[c.id] = c.name;
    });
    (hotels || []).forEach((h) => {
      if (h.id) map[h.id] = h.name;
    });
    (agencies || []).forEach((a) => {
      if (a.id) map[a.id] = a.name;
    });
    (suppliers || []).forEach((s) => {
      if (s.id) map[s.id] = s.name;
    });
    return map;
  }, [users, categories, hotels, agencies, suppliers]);

  if (loading) {
    return (
      <div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="bg-v3-surface rounded-lg shadow-sm p-4 space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sejour) {
    return (
      <div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg shadow-sm">
            <span className="font-medium">{error || "Sejour bulunamadı"}</span>
          </div>
          <div className="mt-6">
            <Link
              href="/sejour"
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-500/90 text-white rounded-lg transition-colors"
            >
              Sejour Listesine Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">
      {/* PDF Voucher - Hidden area for capture */}
      <div
        ref={voucherRef}
        className="no-theme-root"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "210mm",
          backgroundColor: "white",
          color: "#1a1a1a",
          fontFamily: "'Inter', system-ui, sans-serif",
          zIndex: -100,
        }}
      >
        <div
          className="bg-v3-surface px-10 py-12 w-full min-h-[297mm] text-gray-900"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header with Logos */}
          <div className="flex justify-between items-center border-b-[3px] border-gray-900 pb-6 mb-8">
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {darkIconLogo && (
                <img
                  src={darkIconLogo}
                  alt="Logo"
                  className="w-16 h-auto object-contain"
                />
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {darkWordmarkLogo && (
                <img
                  src={darkWordmarkLogo}
                  alt="Wordmark"
                  className="h-6 w-auto object-contain mb-2"
                />
              )}
              <div className="text-[10px] tracking-[0.2em] text-gray-600 font-medium uppercase mt-1">
                OFFICIAL VOUCHER
              </div>
            </div>
          </div>

          {/* Voucher & Guest Profile */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-wider mb-4 uppercase">
                RESERVATION DIRECTORY
              </h1>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 responsive-filter-grid">
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                    GUEST NAME
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {sejour.customerName}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                    GUEST TYPE
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {sejour.customerType === "agency"
                      ? `Agency (${sejour.agencyName || ""})`
                      : "Individual"}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                    CHECK IN
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {sejour.checkInDate
                      ? new Date(sejour.checkInDate).toLocaleDateString("tr-TR")
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                    CHECK OUT
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {sejour.checkOutDate
                      ? new Date(sejour.checkOutDate).toLocaleDateString(
                          "tr-TR",
                        )
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-2">
                VOUCHER NO
              </span>
              <span className="block text-3xl font-light tracking-widest text-gray-900">
                {sejour.voucherNumber}
              </span>
            </div>
          </div>

          {/* ITINERARY */}
          <div className="space-y-8">
            {sejour.rooms && sejour.rooms.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">
                    Accommodation Details
                  </h2>
                </div>
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {sejour.hotelName || sejour.rooms[0]?.hotelName || "-"}
                  </h3>
                  {sejour.hotelAddress && (
                    <p className="text-xs text-gray-500 mt-1">
                      {sejour.hotelAddress}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {sejour.rooms.map((room, idx) => (
                    <div
                      key={`room-${idx}`}
                      className="bg-v3-surface border border-gray-200 p-4 rounded-sm flex justify-between items-center"
                    >
                      <div>
                        <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">
                          ROOM {room.roomNumber || idx + 1}
                        </span>
                        <span className="block text-xs font-semibold text-gray-900">
                          {room.roomType}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">
                          GUESTS
                        </span>
                        <span className="block text-xs font-medium text-gray-700">
                          {room.guestInfo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sejour.flights && sejour.flights.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">
                    Flight Itinerary
                  </h2>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Direction
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Airline
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Date
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Route
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase text-right">
                        PNR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sejour.flights.map((flight, idx) => (
                      <tr
                        key={`flight-${idx}`}
                        className="border-b border-gray-50"
                      >
                        <td className="py-3 font-medium">
                          {flight.type === "departure" ? "Gidiş" : "Dönüş"}
                        </td>
                        <td className="py-3">
                          {flight.airline} ({flight.flightNo})
                        </td>
                        <td className="py-3">
                          {flight.flightDate
                            ? new Date(flight.flightDate).toLocaleDateString(
                                "tr-TR",
                              )
                            : "-"}
                        </td>
                        <td className="py-3 font-medium">{flight.route}</td>
                        <td className="py-3 text-right">
                          <span className="block font-semibold">
                            {flight.pnr || "N/A"}
                          </span>
                          <span className="text-[9px] text-gray-600">
                            {flight.departureTime} - {flight.arrivalTime}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {sejour.transfers && sejour.transfers.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                  <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">
                    Transfer Services
                  </h2>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Direction
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Vehicle
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase">
                        Type
                      </th>
                      <th className="py-2 text-[8px] tracking-widest text-gray-600 uppercase text-right">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sejour.transfers.map((trans, idx) => (
                      <tr
                        key={`transfer-${idx}`}
                        className="border-b border-gray-50"
                      >
                        <td className="py-3 font-medium">
                          {trans.direction === "arrival"
                            ? "Varış"
                            : trans.direction === "return"
                              ? "Dönüş"
                              : "Ara"}
                        </td>
                        <td className="py-3">{trans.vehicle}</td>
                        <td className="py-3">
                          {trans.type === "private" ? "Özel" : "Ekonomik"}
                        </td>
                        <td className="py-3 font-semibold text-right">
                          {trans.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {sejour.notes && (
            <div className="mt-12 bg-v3-surface border border-gray-200 p-4">
              <h3 className="text-[9px] tracking-widest text-gray-900 font-bold uppercase mb-2">
                IMPORTANT NOTES
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed italic">
                {sejour.notes}
              </p>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm font-semibold tracking-wide mb-1">
                  {companyInfo.company_name}
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">
                  {companyInfo.company_address}
                </div>
                <div className="flex gap-4 text-[9px] font-medium text-gray-600">
                  {companyInfo.company_phone && (
                    <span>T: {companyInfo.company_phone}</span>
                  )}
                  <span>E: {companyInfo.company_email}</span>
                  <span>W: {companyInfo.company_website}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold tracking-[0.2em]">
                  {new Date().toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-v3-text">
            Sejour Detayı
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Voucher: {sejour.voucherNumber}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateVoucherPDF}
            disabled={isGeneratingPDF}
            className="bg-blue-500 hover:bg-blue-500/90 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70"
          >
            {isGeneratingPDF ? "HAZIRLANIYOR..." : "PDF VOUCHER İNDİR"}
          </button>

          <button
            onClick={() => {
              setShowLogsModal(true);
              fetchLogs();
            }}
            className="bg-purple-600 dark:bg-purple-500 text-white px-2 py-1 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-200 flex items-center text-xs font-bold gap-1"
            title="Log Kayıtları"
          >
            <ScrollText size={14} />
            Loglar
          </button>
          {canEdit(Module.SEJOUR) && (
            <Link
              href={`/sejour/${sejour.id}/edit`}
              className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Düzenle
            </Link>
          )}
          <Link
            href="/sejour"
            className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            Geri Dön
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sejour.status)}`}
        >
          {sejour.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-v3-surface rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-2">Temel Bilgiler</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Müşteri:</span>{" "}
              {sejour.customerName} (
              {sejour.customerType === "agency"
                ? `Acente: ${sejour.agencyName}`
                : "Bireysel"}
              )
            </p>
            <p>
              <span className="text-gray-500">Tarih:</span>{" "}
              {new Date(sejour.checkInDate).toLocaleDateString("tr-TR")} -{" "}
              {new Date(sejour.checkOutDate).toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
        <div className="bg-v3-surface rounded-lg shadow p-4">
          <h2 className="text-base font-semibold mb-2">Toplam Tutarlar</h2>
          <div className="space-y-1 text-sm font-semibold">
            {sejour.totals &&
              Object.entries(sejour.totals).map(([cur, amt]) => (
                <p key={cur}>
                  {Number(amt).toLocaleString()} {cur}
                </p>
              ))}
          </div>
        </div>
      </div>

      {sejour.rooms?.length > 0 && (
        <div className="bg-v3-surface rounded-lg shadow p-4 mb-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-2">Konaklama</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Oda</th>
                <th className="px-4 py-2 text-left">Otel</th>
                <th className="px-4 py-2 text-left">Tip</th>
                <th className="px-4 py-2 text-left">Misafir</th>
                <th className="px-4 py-2 text-left">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {sejour.rooms.map((room, i) => (
                <tr
                  key={`room-row-${i}`}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="px-4 py-2">{room.roomNumber}</td>
                  <td className="px-4 py-2">{room.hotelName || "-"}</td>
                  <td className="px-4 py-2">{room.roomType}</td>
                  <td className="px-4 py-2">{room.guestInfo}</td>
                  <td className="px-4 py-2">
                    {room.price} {room.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sejour.flights?.length > 0 && (
        <div className="bg-v3-surface rounded-lg shadow p-4 mb-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-2">Uçuşlar</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Tip</th>
                <th className="px-4 py-2 text-left">Havayolu</th>
                <th className="px-4 py-2 text-left">Rota</th>
                <th className="px-4 py-2 text-left">No</th>
                <th className="px-4 py-2 text-left">Saat</th>
                <th className="px-4 py-2 text-left">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {sejour.flights.map((f, i) => (
                <tr
                  key={`flight-row-${i}`}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="px-4 py-2">
                    {f.type === "departure" ? "Gidiş" : "Dönüş"}
                  </td>
                  <td className="px-4 py-2">{f.airline}</td>
                  <td className="px-4 py-2">{f.route}</td>
                  <td className="px-4 py-2">{f.flightNo}</td>
                  <td className="px-4 py-2">
                    {f.departureTime} - {f.arrivalTime}
                  </td>
                  <td className="px-4 py-2">
                    {f.price} {f.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sejour.transfers?.length > 0 && (
        <div className="bg-v3-surface rounded-lg shadow p-4 mb-4 overflow-x-auto">
          <h2 className="text-base font-semibold mb-2">Transferler</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Yön</th>
                <th className="px-4 py-2 text-left">Sağlayıcı</th>
                <th className="px-4 py-2 text-left">Tip</th>
                <th className="px-4 py-2 text-left">Araç</th>
                <th className="px-4 py-2 text-left">Saat</th>
                <th className="px-4 py-2 text-left">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {sejour.transfers.map((t, i) => (
                <tr
                  key={`transfer-row-${i}`}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="px-4 py-2">
                    {t.direction === "arrival"
                      ? "Varış"
                      : t.direction === "return"
                        ? "Dönüş"
                        : "Ara"}
                  </td>
                  <td className="px-4 py-2">{t.supplierName || "-"}</td>
                  <td className="px-4 py-2">
                    {t.type === "private" ? "Özel" : "Ekonomik"}
                  </td>
                  <td className="px-4 py-2">{t.vehicle}</td>
                  <td className="px-4 py-2">{t.time}</td>
                  <td className="px-4 py-2">
                    {t.price} {t.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sejour.notes && (
        <div className="bg-v3-surface rounded-lg shadow p-4 mb-4">
          <h2 className="text-base font-semibold mb-2">Notlar</h2>
          <p className="text-sm">{sejour.notes}</p>
        </div>
      )}

      {sejourInvoices.length > 0 && (
        <div className="bg-v3-surface rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-v3-text">Faturalar</h2>
              <p className="text-xs text-v3-text-muted">Bu rezervasyona ait tüm yapay zeka faturaları</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                Toplam: {sejourInvoices.length}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-v3-border bg-v3-surface">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-v3-bg text-v3-text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border w-16">Görsel</th>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border">Tedarikçi</th>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border">Fatura No</th>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border">Tarih</th>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border">Kategori</th>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border text-right">Tutar</th>
                  <th className="px-3 py-2.5 font-semibold text-xs border-b border-v3-border text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v3-border">
                {sejourInvoices.map((inv: any) => (
                  <tr 
                    key={inv.id} 
                    className="group hover:bg-v3-bg transition-colors cursor-pointer"
                    onDoubleClick={() => window.open(inv.file_url, '_blank')}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {inv.file_url ? (
                          <div 
                            className="w-8 h-8 rounded border border-v3-border overflow-hidden flex-shrink-0 relative group-hover:ring-2 ring-blue-500/50 transition-all cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); window.open(inv.file_url, '_blank'); }}
                          >
                            <img src={inv.file_url} alt="Fatura" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded border border-v3-border bg-gray-50 flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-gray-400">
                            Yok
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-v3-text max-w-[200px] truncate" title={inv.extracted_data?.supplier || "Bilinmeyen Tedarikçi"}>
                      {inv.extracted_data?.supplier || "Bilinmeyen Tedarikçi"}
                    </td>
                    <td className="px-3 py-2.5 text-v3-text font-mono text-xs">
                      {inv.extracted_data?.invoiceNo || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-v3-text-muted">
                      {inv.extracted_data?.date ? new Date(inv.extracted_data.date).toLocaleDateString('tr-TR') : "-"}
                    </td>
                    <td className="px-3 py-2.5">
                      {inv.category ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-v3-text truncate max-w-[120px]">{inv.category}</span>
                          <span className="text-[9px] text-v3-text-muted truncate max-w-[120px]">{inv.sub_category || "-"}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-v3-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-v3-text">
                      {Number(inv.extracted_data?.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} <span className="text-xs text-v3-text-muted">{inv.extracted_data?.currency || "TRY"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        inv.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                        inv.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status === 'APPROVED' ? 'ONAYLI' :
                         inv.status === 'PROCESSING' ? 'İŞLENİYOR' :
                         inv.status === 'CANCELLED' ? 'İPTAL' :
                         'BEKLİYOR'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      <Modal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        title="Sejour Log Kayıtları"
        maxWidth="max-w-4xl"
      >
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg max-h-[70vh] flex flex-col">
          <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full relative">
              <div className="min-h-[42px] px-3 py-1.5 flex flex-wrap gap-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-v3-surface focus-within:ring-2 focus-within:ring-blue-500">
                {logSearchTerms.map((term, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs"
                  >
                    <span>{term}</span>
                    <button
                      onClick={() =>
                        setLogSearchTerms((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder={
                    logSearchTerms.length === 0
                      ? "İşlem tipi, kullanıcı veya değer içinde ara (Enter'a basarak ekleyin)..."
                      : "Yeni kelime ekle..."
                  }
                  value={logSearchInput}
                  onChange={(e) => setLogSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && logSearchInput.trim()) {
                      e.preventDefault();
                      if (!logSearchTerms.includes(logSearchInput.trim())) {
                        setLogSearchTerms((prev) => [
                          ...prev,
                          logSearchInput.trim(),
                        ]);
                      }
                      setLogSearchInput("");
                    } else if (
                      e.key === "Backspace" &&
                      !logSearchInput &&
                      logSearchTerms.length > 0
                    ) {
                      setLogSearchTerms((prev) => prev.slice(0, -1));
                    }
                  }}
                  className="flex-1 min-w-[150px] bg-transparent text-sm text-v3-text outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <ResponsiveDateRangeField
                label="Tarih Aralığı"
                startValue={logStartDate}
                endValue={logEndDate}
                onStartChange={setLogStartDate}
                onEndChange={setLogEndDate}
                onApply={(start, end) => {
                  setLogStartDate(start || "");
                  setLogEndDate(end || "");
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingLogs ? (
              <div className="flex justify-center p-4">Yükleniyor...</div>
            ) : logsData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Bu sejour'a ait log kaydı bulunamadı.
              </div>
            ) : (
              <div className="space-y-4">
                {logsData
                  .filter((log) => {
                    let matchesSearch = true;
                    if (logSearchTerms.length > 0) {
                      const actionStr = (log.action || "").toLowerCase();
                      const userStr = (
                        log.user_name ||
                        log.user_id ||
                        ""
                      ).toLowerCase();
                      const moduleStr = (log.module || "").toLowerCase();
                      const beforeStr = log.before_data
                        ? JSON.stringify(log.before_data).toLowerCase()
                        : "";
                      const afterStr = log.after_data
                        ? JSON.stringify(log.after_data).toLowerCase()
                        : "";
                      matchesSearch = logSearchTerms.every((term) => {
                        const search = term.toLowerCase();
                        return (
                          actionStr.includes(search) ||
                          userStr.includes(search) ||
                          moduleStr.includes(search) ||
                          beforeStr.includes(search) ||
                          afterStr.includes(search)
                        );
                      });
                    }

                    let matchesDate = true;
                    if (logStartDate || logEndDate) {
                      const logDate = log.occurred_at
                        ? new Date(log.occurred_at)
                        : null;
                      if (logDate) {
                        logDate.setHours(0, 0, 0, 0);
                        if (logStartDate) {
                          const [d, m, y] = logStartDate.split(".");
                          if (d && m && y) {
                            const startD = new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d),
                            );
                            startD.setHours(0, 0, 0, 0);
                            if (logDate < startD) matchesDate = false;
                          }
                        }
                        if (logEndDate) {
                          const [d, m, y] = logEndDate.split(".");
                          if (d && m && y) {
                            const endD = new Date(
                              Number(y),
                              Number(m) - 1,
                              Number(d),
                            );
                            endD.setHours(0, 0, 0, 0);
                            if (logDate > endD) matchesDate = false;
                          }
                        }
                      } else {
                        matchesDate = false;
                      }
                    }
                    return matchesSearch && matchesDate;
                  })
                  .map((log) => (
                    <div
                      key={log.id}
                      className="bg-v3-surface p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-xs"
                    >
                      <div className="flex justify-between items-start mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                              log.action === "INSERT"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                : log.action === "UPDATE"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  : log.action === "DELETE"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-semibold text-v3-text">
                            {log.user_name ||
                              users.find((u) => u.id === log.user_id)?.name ||
                              users.find((u) => u.id === log.user_id)?.email ||
                              log.user_id ||
                              "Sistem / Anonim"}
                          </span>
                          <span className="text-v3-muted text-[10px]">
                            ({log.module})
                          </span>
                        </div>
                        <div className="text-gray-500 font-medium">
                          {log.occurred_at
                            ? new Date(log.occurred_at).toLocaleString("tr-TR")
                            : "-"}
                        </div>
                      </div>
                      {(() => {
                        const contextStr = getItemContext(log, uuidNameMap);
                        return contextStr ? (
                          <div className="mb-2 bg-black/5 dark:bg-white/5/50 p-2 rounded border border-v3-border text-[11px] text-v3-muted font-medium">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              Kayıt Detayı:
                            </span>{" "}
                            {contextStr}
                          </div>
                        ) : null;
                      })()}

                      <div className="mt-3">
                        {(() => {
                          const changes = getChanges(
                            log.before_data,
                            log.after_data,
                          );
                          if (changes.length === 0) {
                            return (
                              <div className="text-gray-500 italic text-[11px] py-1">
                                Görsel bir değişiklik tespit edilmedi.
                              </div>
                            );
                          }

                          return (
                            <div className="border border-v3-border rounded-md overflow-hidden">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-black/5 dark:bg-white/5 text-v3-muted text-[10px] uppercase tracking-wider">
                                    <th className="px-3 py-2 font-medium border-b border-v3-border w-1/3">
                                      Alan
                                    </th>
                                    {log.action !== "INSERT" && (
                                      <th className="px-3 py-2 font-medium border-b border-v3-border w-1/3 text-red-600 dark:text-red-400">
                                        Eski Değer
                                      </th>
                                    )}
                                    {log.action !== "DELETE" && (
                                      <th className="px-3 py-2 font-medium border-b border-v3-border w-1/3 text-green-600 dark:text-green-400">
                                        Yeni Değer
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {changes.map((change, idx) => (
                                    <tr
                                      key={idx}
                                      className="bg-v3-surface/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                      <td className="px-3 py-2 font-medium text-v3-text">
                                        {translateField(change.field)}
                                      </td>
                                      {log.action !== "INSERT" && (
                                        <td className="px-3 py-2 text-v3-muted line-through decoration-red-300 dark:decoration-red-800">
                                          {formatLogValue(
                                            change.oldVal,
                                            uuidNameMap,
                                          )}
                                        </td>
                                      )}
                                      {log.action !== "DELETE" && (
                                        <td className="px-3 py-2 text-v3-text font-medium">
                                          {formatLogValue(
                                            change.newVal,
                                            uuidNameMap,
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
