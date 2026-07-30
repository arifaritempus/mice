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
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import PaginationControls from "@/components/PaginationControls";
import {
  format as formatDateFns,
  parse as parseDateFns,
  isValid as isValidDate,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { formatNumber, formatDate, getDayNameShort } from "@/utils/formatters";
import { ExcelUtils } from "@/utils/excelUtils";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import {
  projectsService,
  quotesService,
  agenciesService,
  hotelsService,
  quoteItemsService,
  projectSalesItemsService,
  projectPurchaseItemsService,
  projectUsersService,
} from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";
import { toast } from "react-hot-toast";
import { Trash2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
// import { loadTeklifler } from '../../../../src/supabaseClient';

// async function fetchData() {
//   const teklifler = await loadTeklifler();
//   console.log(teklifler);
// }

// fetchData();

interface Agency {
  id: string;
  name: string;
  company_name: string;
}

interface Hotel {
  id: string;
  name: string;
  concept: string;
}

interface QuoteItem {
  id: string;
  quote_id: string;
  main_category?: string;
  sub_category?: string;
  unit_quantity: number;
  sefer: number;
  unit_price: number;
  currency: string;
  total: number;
  description?: string;
  created_at: string;
  // Backward compatibility fields
  category_id?: string;
  sub_category_id?: string;
  repeat_frequency?: number;
  total_price?: number;
  detail_description?: string;
}

type Quote = import("@/lib/supabase").Quote & {
  id: string;
  reference: string;
  agency_id: string;
  company_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_id: string;
  hotel_concept?: string;
  quote_type: string;
  room_count?: number;
  pax_count?: number;
  option: string;
  option_date?: string; // OPSİYON TARİHİ field'ı eklendi
  status: string;
  notes?: string;
  hotels_data?: any[];
  note?: string; // For backward compatibility
  room_pax?: string; // For backward compatibility
  items?: QuoteItem[];
};

interface DateRangeFieldProps {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onApply?: (start?: string, end?: string) => void;
}

export default function QuotesPage() {
  const router = useRouter();
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalTokens, setGlobalTokens] = useState<string[]>([]);
  const [globalInput, setGlobalInput] = useState("");
  const [appliedGlobalTokens, setAppliedGlobalTokens] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [showGeneralConfirm, setShowGeneralConfirm] = useState(false);
  const [generalConfirmConfig, setGeneralConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  // Yeni tarih filtreleri
  const todayStr = new Date().toISOString().split("T")[0];
  const [quoteDateStart, setQuoteDateStart] = useState(todayStr);
  const [quoteDateEnd, setQuoteDateEnd] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [optionStart, setOptionStart] = useState("");
  const [optionEnd, setOptionEnd] = useState("");
  const [appliedQuoteDateStart, setAppliedQuoteDateStart] = useState(todayStr);
  const [appliedQuoteDateEnd, setAppliedQuoteDateEnd] = useState("");
  const [appliedCheckInDate, setAppliedCheckInDate] = useState("");
  const [appliedCheckOutDate, setAppliedCheckOutDate] = useState("");
  const [appliedOptionStart, setAppliedOptionStart] = useState("");
  const [appliedOptionEnd, setAppliedOptionEnd] = useState("");

  // Opsiyon türü filtresi
  const [optionFilter, setOptionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lockUpdatingId, setLockUpdatingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quoteToConfirm, setQuoteToConfirm] = useState<Quote | null>(null);
  const [selectedHotels, setSelectedHotels] = useState<Record<string, boolean>>(
    {},
  );

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesService.getPage({
        page,
        pageSize,
        filter,
        searchTerm,
        quoteDateStart: appliedQuoteDateStart,
        quoteDateEnd: appliedQuoteDateEnd,
        checkInDate: appliedCheckInDate,
        checkOutDate: appliedCheckOutDate,
        optionStart: appliedOptionStart,
        optionEnd: appliedOptionEnd,
        optionFilter,
        sortField,
        sortDirection,
      });
      setQuotes(
        (response.data || []).map((q: any) => ({
          ...q,
          locked:
            q.locked === null ? q.status === "KONFİRME" : Boolean(q.locked),
        })),
      );
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading quotes from Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const list = await agenciesService.getAll();
      setAgencies(list as any);
    } catch (error) {
      console.error("Error loading agencies from Supabase:", error);
    }
  };

  const loadHotels = async () => {
    try {
      const list = await hotelsService.getAll();
      setHotels(list as any);
    } catch (error) {
      console.error("Error loading hotels from Supabase:", error);
    }
  };

  const isQuoteLocked = (quote: Quote) => {
    // Super admin her zaman kilit durumunu değiştirebilir, ama canEdit canDelete isQuoteLocked sonucuna bakar
    // Bu yüzden state'deki locked değerini dönüyoruz
    return Boolean((quote as any).locked);
  };

  const toggleLock = async (quote: Quote) => {
    if (!isSuperAdmin) return;
    if (lockUpdatingId) return;
    try {
      setLockUpdatingId(quote.id);
      const newStatus = !quote.locked;
      await quotesService.update(quote.id, { locked: newStatus } as any);
      toast.success(newStatus ? "Teklif kilitlendi" : "Teklif kilidi açıldı");
      loadQuotes();
    } catch (err) {
      console.error("Kilit hatası:", err);
      toast.error("Teklif kilidi güncellenirken bir hata oluştu.");
    } finally {
      setLockUpdatingId(null);
    }
  };

  const addNewQuote = (newQuote: Quote) => {
    const updatedQuotes = [...quotes, newQuote];
    setQuotes(updatedQuotes);
  };

  const searchQuotes = (items: Quote[], term: string) => {
    if (!term.trim()) return items;
    const s = term.toLowerCase().trim();
    return items.filter(
      (q) =>
        (q.reference || "").toLowerCase().includes(s) ||
        (q.company_name || "").toLowerCase().includes(s) ||
        (q.status || "").toLowerCase().includes(s) ||
        (q.quote_type || "").toLowerCase().includes(s) ||
        (q.option || "").toLowerCase().includes(s) ||
        (q.room_pax || "").toLowerCase().includes(s) ||
        (q.notes || "").toLowerCase().includes(s),
    );
  };

  const filterQuotesByDatesAndOptions = (items: Quote[]) => {
    return items.filter((q) => {
      // Status filter already applied before
      if (optionFilter !== "all" && q.option !== optionFilter) return false;

      if (appliedQuoteDateStart && q.created_at < appliedQuoteDateStart)
        return false;
      if (
        appliedQuoteDateEnd &&
        q.created_at > `${appliedQuoteDateEnd}T23:59:59`
      )
        return false;

      if (appliedCheckInDate && q.check_in_date < appliedCheckInDate)
        return false;
      if (appliedCheckOutDate && q.check_out_date > appliedCheckOutDate)
        return false;

      if (appliedOptionStart && (q as any).option_date < appliedOptionStart)
        return false;
      if (appliedOptionEnd && (q as any).option_date > appliedOptionEnd)
        return false;

      return true;
    });
  };

  const sortQuotes = (
    items: Quote[],
    field: string,
    direction: "asc" | "desc",
  ) => {
    const sorted = [...items].sort((a, b) => {
      let aVal: any = (a as any)[field];
      let bVal: any = (b as any)[field];

      if (field === "date") {
        aVal = a.check_in_date;
        bVal = b.check_in_date;
      } else if (field === "agency") {
        aVal = getAgencyName(a.agency_id);
        bVal = getAgencyName(b.agency_id);
      } else if (field === "hotel") {
        aVal = getHotelName(a.hotel_id);
        bVal = getHotelName(b.hotel_id);
      }

      if (!aVal) return 1;
      if (!bVal) return -1;

      if (typeof aVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "KONFİRME":
        return "bg-green-100 text-green-800";
      case "İPTAL":
        return "bg-red-100 text-red-800";
      case "TEKLİF":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCurrencyDisplay = (currency: string) => {
    switch (currency) {
      case "EUR":
        return "EUR";
      case "USD":
        return "USD";
      case "GBP":
        return "GBP";
      case "TL":
        return "TL";
      default:
        return currency;
    }
  };

  const getAgencyName = (agencyId: string) => {
    return agencies.find((agency) => agency.id === agencyId)?.name || "";
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find((hotel) => hotel.id === hotelId)?.name || "";
  };

  useEffect(() => {
    loadAgencies();
    loadHotels();
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [
    page,
    pageSize,
    filter,
    optionFilter,
    sortField,
    sortDirection,
    appliedQuoteDateStart,
    appliedQuoteDateEnd,
    appliedCheckInDate,
    appliedCheckOutDate,
    appliedOptionStart,
    appliedOptionEnd,
  ]);

  useEffect(() => {
    (window as any).addNewQuote = addNewQuote;
    return () => {
      delete (window as any).addNewQuote;
    };
  }, []);

  useEffect(() => {
    setAppliedGlobalTokens(globalTokens);
    setPage(1);
  }, [globalTokens]);

  const handleApplyQuoteDates = (start?: string, end?: string) => {
    setAppliedQuoteDateStart(start !== undefined ? start : quoteDateStart);
    setAppliedQuoteDateEnd(end !== undefined ? end : quoteDateEnd);
    setPage(1);
  };

  const handleApplyCheckInDates = (start?: string, end?: string) => {
    setAppliedCheckInDate(start !== undefined ? start : checkInDate);
    setAppliedCheckOutDate(end !== undefined ? end : checkOutDate);
    setPage(1);
  };

  const handleApplyOptionDates = (start?: string, end?: string) => {
    setAppliedOptionStart(start !== undefined ? start : optionStart);
    setAppliedOptionEnd(end !== undefined ? end : optionEnd);
    setPage(1);
  };

  const clearAllFilters = () => {
    setQuoteDateStart("");
    setQuoteDateEnd("");
    setCheckInDate("");
    setCheckOutDate("");
    setOptionStart("");
    setOptionFilter("all");
    setFilter("all");
    setSearchTerm("");
    setGlobalTokens([]);
    setGlobalInput("");
    setAppliedGlobalTokens([]);
    setAppliedQuoteDateStart("");
    setAppliedQuoteDateEnd("");
    setAppliedCheckInDate("");
    setAppliedCheckOutDate("");
    setAppliedOptionStart("");
    setAppliedOptionEnd("");
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDeleteQuote = (quote: Quote) => {
    if (quote.status === "KONFİRME") {
      toast.error("Konfirme durumundaki teklifler silinemez. Lütfen önce durumunu değiştirin.");
      return;
    }
    setQuoteToDelete(quote.id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    try {
      setLoading(true);
      await quotesService.delete(quoteToDelete);
      toast.success("Teklif başarıyla silindi!");
      loadQuotes();
    } catch (err) {
      console.error("Silme hatası:", err);
      toast.error("Teklif silinirken hata oluştu");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setQuoteToDelete(null);
    }
  };

  const handleCopyQuote = async (quote: Quote) => {
    try {
      const created = await quotesService.create({
        reference: `${quote.reference}-COPY`,
        quote_number: `${quote.reference}-COPY`,
        agency_id: quote.agency_id,
        company_name: quote.company_name,
        client_name: quote.company_name,
        check_in_date: quote.check_in_date,
        check_out_date: quote.check_out_date,
        hotel_id: quote.hotel_id,
        hotel_concept: quote.hotel_concept || "",
        hotels_data: (quote as any).hotels_data || [],
        room_count: quote.room_count || 0,
        pax_count: quote.pax_count || 0,
        option: quote.option,
        option_date: (quote as any).option_date || null,
        status: "TEKLİF",
        quote_type: quote.quote_type,
        operation_managers: (quote as any).operation_managers || [],
        notes: quote.notes || "",
        total_amount: quote.total_amount || 0,
        currency: (quote as any).currency || "EUR",
      } as any);

      try {
        const fullItems = await quoteItemsService.getByQuoteId(quote.id);
        const isValidUUID = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        for (const item of fullItems) {
          await quoteItemsService.create({
            quote_id: (created as any).id,
            main_category: isValidUUID((item as any).main_category) ? (item as any).main_category : (isValidUUID((item as any).category_id) ? (item as any).category_id : null),
            sub_category: isValidUUID((item as any).sub_category) ? (item as any).sub_category : (isValidUUID((item as any).sub_category_id) ? (item as any).sub_category_id : null),
            unit_quantity: Number((item as any).unit_quantity || 0),
            sefer: Number((item as any).sefer || (item as any).repeat_frequency || 0),
            unit_price: Number((item as any).unit_price || 0),
            currency: (item as any).currency || "EUR",
            total: Number((item as any).total || (item as any).total_price || 0),
            total_price: Number((item as any).total_price || (item as any).total || 0),
            total_try: Number((item as any).total_try || 0),
            vat: Number((item as any).vat || 0),
            fx: Number((item as any).fx || 1),
            description: (item as any).description || (item as any).detail_description || "",
            hotel_id: isValidUUID((item as any).hotel_id) ? (item as any).hotel_id : null,
          } as any);
        }
      } catch (err) {
        console.error("Kalem kopyalama hatası:", err);
      }

      setQuotes((prev) => [created as any, ...prev]);
      toast.success("Teklif başarıyla kopyalandı!");
      loadQuotes();
    } catch (err) {
      console.error("Kopyalama hatası:", err);
      toast.error("Kopyalama sırasında hata oluştu.");
    }
  };

  const transferConfirmedToProjects = async () => {
    try {
      setTransferring(true);
      const existingProjects = await projectsService.getAll();
      const existingByQuote = new Set(
        existingProjects.map((p) => p.quote_id).filter(Boolean) as string[],
      );

      const pendingQuotes = quotes.filter(
        (q) => q.status === "KONFİRME" && !existingByQuote.has(q.id),
      );

      if (pendingQuotes.length === 0) {
        toast.error("Aktarılacak yeni konfirme teklif bulunamadı.");
        return;
      }

      setGeneralConfirmConfig({
        title: "PROJEYE AKTAR",
        message: `Henüz aktarılmamış ${pendingQuotes.length} teklif kontrol ediliyor. Bu işlem seçili otelleri projeye dönüştürecektir. Devam edilsin mi?`,
        onConfirm: () => executeTransfer(pendingQuotes),
        confirmText: "AKTARIMI BAŞLAT",
        cancelText: "İPTAL",
      });
      setShowGeneralConfirm(true);
    } catch (err) {
      console.error("Aktarım hatası:", err);
      toast.error("Aktarım başlatılırken bir hata oluştu.");
    } finally {
      setTransferring(false);
    }
  };

  const executeTransfer = async (pendingQuotes: Quote[]) => {
    setShowGeneralConfirm(false);
    setTransferring(true);
    let createdCount = 0;
    try {
      for (const q of pendingQuotes) {
        try {
          const hotelsData = (q as any).hotels_data || [];
          const confirmedHotels = Array.isArray(hotelsData)
            ? hotelsData.filter((h) => h.is_confirmed === true)
            : [];

          // Eğer is_confirmed işaretli otel yoksa ama hotels_data boşsa veya
          // is_confirmed alanı hiç yoksa (eski veriler), ana hotel_id'yi baz al
          if (confirmedHotels.length === 0) {
            // Sadece ana hotel_id varsa onu konfirme say
            if (q.hotel_id) {
              await createProjectFromQuote(q, []);
              createdCount++;
            }
            continue;
          }

          // Çoklu otelli sistem: Tüm konfirme otelleri tek projede birleştir
          await createProjectFromQuote(q, confirmedHotels);
          createdCount++;
        } catch (e) {
          console.error(`${q.reference} aktarılırken hata:`, e);
        }
      }

      loadQuotes();
      toast.success(`${createdCount} yeni proje oluşturuldu.`);
    } finally {
      setTransferring(false);
    }
  };

  const createProjectFromQuote = async (
    quote: Quote,
    confirmedHotels: any[],
  ) => {
    const q = quote as any;

    // Her otel sekmesinin kararlı bir UUID .id'si olduğundan emin ol.
    // Eğer .id yoksa veya geçersizse yeni UUID üret.
    // Bu sayede project_sales_items.hotel_id ile hotels_data[n].id her zaman eşleşir.
    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str,
      );
    const normalizedHotels = confirmedHotels.map((h) => ({
      ...h,
      id: h.id && isUUID(h.id) ? h.id : crypto.randomUUID(),
    }));

    // Değerleri belirle
    const firstH = normalizedHotels.length > 0 ? normalizedHotels[0] : null;
    const hotelId = firstH?.hotel_id || q.hotel_id;
    const hotelObj = hotels.find((ht) => ht.id === hotelId);
    const hotelName = hotelObj ? hotelObj.name : hotelId || "Otel";

    const title =
      normalizedHotels.length > 1
        ? `${q.reference} - Çoklu Konaklama (${normalizedHotels.length} Otel)`
        : `${q.reference} - ${hotelName}`;

    const description = `Konfirme edilen teklif: ${q.reference}`;
    const start_date =
      firstH?.check_in_date ||
      q.check_in_date ||
      q.created_at ||
      new Date().toISOString().slice(0, 10);
    const end_date = firstH?.check_out_date || q.check_out_date || start_date;

    const quoteItems = await quoteItemsService.getByQuoteId(q.id);

    // Konfirme otellere ait kalemleri filtrele
    const confirmedHotelIds = normalizedHotels.map((h) => h.hotel_id);
    const confirmedTabIds = normalizedHotels.map((h) => h.id);

    const relevantItemsRaw =
      normalizedHotels.length > 0
        ? quoteItems.filter(
            (item) =>
              confirmedTabIds.includes(item.hotel_id || "") ||
              confirmedHotelIds.includes(item.hotel_id || "") ||
              !item.hotel_id ||
              item.hotel_id === "general",
          )
        : quoteItems;

    // Mükerrer kalemleri (tamamen aynı olanlar) temizle
    const seen = new Set<string>();
    const relevantItems = relevantItemsRaw.filter((it) => {
      const key = `${it.main_category}|${it.sub_category}|${it.description}|${it.hotel_id}|${it.unit_price}|${it.unit_quantity}|${it.sefer}|${it.vat}|${it.fx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const budget = relevantItems.reduce(
      (sum, it) => sum + (Number(it.total) || 0),
      0,
    );

    const created = await projectsService.create({
      title,
      description,
      status: "active",
      priority: "medium",
      start_date,
      end_date,
      budget,
      progress: 0,
      team_members: q.operation_managers?.length || 0,
      quote_id: q.id,
      reference: q.reference,
      company_name: q.company_name,
      agency_id: q.agency_id || null,
      hotel_id: hotelId || null,
      quote_type: q.quote_type,
      room_count: firstH?.room_count || q.room_count || 0,
      pax_count: firstH?.pax_count || q.pax_count || 0,
      room_pax: `${firstH?.room_count || 0} | ${firstH?.pax_count || 0}`,
      confirmed_at:
        q.confirmed_at || q.updated_at || q.created_at || start_date,
      // normalizedHotels kullan: her sekmenin kararlı UUID .id'si var
      hotels_data:
        normalizedHotels.length > 0
          ? normalizedHotels
          : q.hotel_id
            ? [
                {
                  id: crypto.randomUUID(),
                  hotel_id: q.hotel_id,
                  room_count: q.room_count,
                  pax_count: q.pax_count,
                  check_in_date: q.check_in_date,
                  check_out_date: q.check_out_date,
                  is_confirmed: true,
                },
              ]
            : [],
    } as any);

    if (q.operation_managers && q.operation_managers.length > 0) {
      await projectUsersService.updateByProjectId(
        created.id,
        q.operation_managers,
      );
    }

    const withTabTag = (desc: string, tabId: string | null) => {
      const cleanDesc = String(desc || "")
        .replace(/\s*\[T:[^\]]+\]\s*/g, " ")
        .trim();
      if (!tabId) return cleanDesc;
      return `${cleanDesc}${cleanDesc ? " " : ""}[T:${tabId}]`;
    };

    // Satış kalemlerini oluştur (hotel_id için gerçek otel UUID, tab için [T:...] etiketi)
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(
        (h) => h.id === item.hotel_id || h.hotel_id === item.hotel_id,
      );
      const realHotelId =
        originalIndex !== -1
          ? confirmedHotels[originalIndex].hotel_id || null
          : null;
      const tabUUID =
        originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      await projectSalesItemsService.create({
        project_id: created.id,
        category: item.main_category || "",
        sub_category: item.sub_category || "",
        description: withTabTag(item.description || "", tabUUID),
        unit_quantity: item.unit_quantity ?? 1,
        sefer: item.sefer ?? 1,
        unit_price: item.unit_price ?? 0,
        total_price: item.total ?? 0,
        currency: item.currency || "EUR",
        vat: item.vat ?? 0,
        fx: item.fx ?? 1,
        hotel_id: realHotelId,
      });
    }

    // Alış kalemleri (satış kalemlerinden fiyatsız kopya)
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(
        (h) => h.id === item.hotel_id || h.hotel_id === item.hotel_id,
      );
      const realHotelId =
        originalIndex !== -1
          ? confirmedHotels[originalIndex].hotel_id || null
          : null;
      const tabUUID =
        originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      await projectPurchaseItemsService.create({
        project_id: created.id,
        category: item.main_category || "",
        sub_category: item.sub_category || "",
        description: withTabTag(item.description || "", tabUUID),
        unit_quantity: item.unit_quantity ?? 1,
        sefer: item.sefer ?? 1,
        unit_price: 0,
        total_price: 0,
        currency: item.currency || "EUR",
        vat: item.vat ?? 0,
        fx: item.fx ?? 1,
        hotel_id: realHotelId,
      });
    }
  };

  // Excel Export Fonksiyonu - Tüm filtreleri uygular
  const exportToExcel = async () => {
    setExporting(true);

    try {
      // Tüm filtreleri uygula (arama, tarih, durum, opsiyon)
      const fullyFilteredQuotes = sortQuotes(
        filterQuotesByDatesAndOptions(
          searchQuotes(
            filter === "all"
              ? quotes
              : quotes.filter((q) => q.status === filter),
            searchTerm,
          ),
        ),
        sortField,
        sortDirection,
      );

      console.log("Export edilecek teklif sayısı:", fullyFilteredQuotes.length);
      console.log("Uygulanan filtreler:", {
        statusFilter: filter,
        searchTerm,
        quoteDateStart,
        quoteDateEnd,
        checkInDate,
        checkOutDate,
        optionStart,
        optionEnd,
        optionFilter,
      });

      await ExcelUtils.exportQuotes(fullyFilteredQuotes, agencies, hotels);
      toast.success(
        `Excel dosyası başarıyla indirildi! (${fullyFilteredQuotes.length} teklif)`,
      );
    } catch (error) {
      console.error("Excel export hatası:", error);
      toast.error("Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filter, optionFilter, sortField, sortDirection]);

  // Calculate counts based on current filtered data
  // İstatistik kartları - Filtrelenmiş verilere göre hesapla
  const beklemedeCount = quotes.filter(
    (q) => q.status === "BEKLEMEDE" || q.status === "TEKLİF",
  ).length;
  const konfirmeCount = quotes.filter((q) => q.status === "KONFİRME").length;
  const iptalCount = quotes.filter((q) => q.status === "İPTAL").length;
  const option1Count = quotes.filter((q) => q.option === "1. OPSİYON").length;
  const option2Count = quotes.filter((q) => q.option === "2. OPSİYON").length;
  const sorSatCount = quotes.filter((q) => q.option === "SOR-SAT").length;

  const includesByTokens = (value: string, tokens: string[]) => {
    if (tokens.length === 0) return true;
    const normalized = (value || "").toLowerCase();
    // Aynı input içinde birden fazla token varsa OR mantığı kullan:
    // kayıt, token'lardan en az birini içeriyorsa eşleşmiş sayılır.
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
      if (
        prev.some((item) => item.toLowerCase() === normalized.toLowerCase())
      ) {
        return prev;
      }
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

  const globalSuggestions = useMemo(() => {
    const refs = quotes.map((q) => (q.reference || "").trim());
    const comps = quotes.map((q) => (q.company_name || "").trim());
    const agns = quotes.map((q) => (getAgencyName(q.agency_id) || "").trim());
    const stats = quotes.map((q) => (q.status || "").trim());
    return Array.from(
      new Set([
        ...refs,
        ...comps,
        ...agns,
        ...stats,
        "TEKLİF",
        "BEKLEMEDE",
        "KONFİRME",
        "İPTAL",
      ]),
    ).filter(Boolean);
  }, [quotes, agencies]);

  const totalOffersLabel = totalCount;

  const visibleQuotes = quotes.filter((quote) => {
    const agencyName = getAgencyName(quote.agency_id);

    const searchTerms = [...appliedGlobalTokens, globalInput.trim()].filter(
      Boolean,
    );
    if (searchTerms.length > 0) {
      const match = searchTerms.every((token) => {
        const t = token.toLowerCase();
        return (
          (quote.reference || "").toLowerCase().includes(t) ||
          (quote.company_name || "").toLowerCase().includes(t) ||
          (agencyName || "").toLowerCase().includes(t) ||
          (quote.status || "").toLowerCase().includes(t) ||
          (quote.quote_type || "").toLowerCase().includes(t)
        );
      });
      if (!match) return false;
    }

    return true;
  });

  // Toplam teklif sayısı (filtrelenmiş)
  const totalFilteredCount = totalCount;
  const tableColumnCount = isSuperAdmin ? 16 : 15;

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Quotes görüntüleme yetkisi kontrolü
  if (!canView(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Teklifler sayfasına erişim için yetkiniz bulunmuyor.
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

  if (loading) {
    return <LoadingSpinner message="Teklifler yükleniyor..." />;
  }

  return (
    <div className="flex-1 min-h-0 w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col">
        {/* Unified Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
          {/* Left: Title */}
          <div className="shrink-0 mr-4">
            <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
              Teklifler
            </h1>
            <p className="text-xs text-v3-muted mt-1">
              Müşteri tekliflerini yönetin
            </p>
          </div>

          {/* Right: All Filters and Actions */}
          <div className="flex flex-wrap items-end gap-3 flex-1 xl:justify-end">
            {/* Dates */}
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="Teklif Tarihi"
                startValue={quoteDateStart}
                endValue={quoteDateEnd}
                onStartChange={setQuoteDateStart}
                onEndChange={setQuoteDateEnd}
                onApply={handleApplyQuoteDates}
              />
            </div>
            <div className="w-[240px] shrink-0">
              <ResponsiveDateRangeField
                label="C-IN C-OUT Tarihi"
                startValue={checkInDate}
                endValue={checkOutDate}
                onStartChange={setCheckInDate}
                onEndChange={setCheckOutDate}
                onApply={handleApplyCheckInDates}
              />
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <MultiTokenFilterInput
                label="Genel Arama (Firma, Acente, Referans...)"
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
                disabled={exporting}
                className="bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 text-v3-text"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </button>
              {canCreate(Module.QUOTES) && (
                <Link
                  href="/quotes/create"
                  className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] px-4 h-10 rounded-xl transition-all duration-300 text-xs font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Yeni Teklif
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-2 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          {/* Durum Filters */}
          <div className="flex flex-wrap items-center gap-1.5 border-r border-v3-border pr-3">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1">
              Durum:
            </span>

            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "all" ? "bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Tümü
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {totalFilteredCount}
              </span>
            </button>

            <button
              onClick={() => setFilter("BEKLEMEDE")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "BEKLEMEDE" ? "bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Beklemede
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {beklemedeCount}
              </span>
            </button>

            <button
              onClick={() => setFilter("KONFİRME")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "KONFİRME" ? "bg-teal-500/20 border-teal-500/50 text-teal-600 dark:text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Konfirme
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {konfirmeCount}
              </span>
            </button>

            <button
              onClick={() => setFilter("İPTAL")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${filter === "İPTAL" ? "bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                İptal
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {iptalCount}
              </span>
            </button>
          </div>

          {/* Opsiyon Filters */}
          <div className="flex flex-wrap items-center gap-1.5 pl-2">
            <span className="text-[10px] uppercase font-semibold text-v3-muted mr-1">
              Opsiyon:
            </span>

            <button
              onClick={() => setOptionFilter("all")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${optionFilter === "all" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Tümü
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {quotes.length}
              </span>
            </button>

            <button
              onClick={() => setOptionFilter("1. OPSİYON")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${optionFilter === "1. OPSİYON" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                1. Opsiyon
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {option1Count}
              </span>
            </button>

            <button
              onClick={() => setOptionFilter("2. OPSİYON")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${optionFilter === "2. OPSİYON" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                2. Opsiyon
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {option2Count}
              </span>
            </button>

            <button
              onClick={() => setOptionFilter("SOR-SAT")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 ${optionFilter === "SOR-SAT" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" : "bg-transparent border-transparent hover:bg-v3-border text-v3-text"}`}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Sor-Sat
              </span>
              <span className="font-bold text-xs bg-black/20 px-1.5 py-0.5 rounded-md">
                {sorSatCount}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 min-h-0 flex-1 flex flex-col relative overflow-hidden">
          <div className="w-full flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-surface sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-v3-border">
                <tr>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        Teklif
                        <br />
                        Tarihi
                      </span>
                      {sortField === "created_at" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("reference")}
                  >
                    <div className="flex items-center">
                      Referans
                      {sortField === "reference" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        C-IN C-OUT
                        <br />
                        Tarihi
                      </span>
                      {sortField === "date" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("company_name")}
                  >
                    <div className="flex items-center">
                      Firma Adı
                      {sortField === "company_name" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("agency")}
                  >
                    <div className="flex items-center">
                      Acente
                      {sortField === "agency" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("hotel")}
                  >
                    <div className="flex items-center">
                      Otel
                      {sortField === "hotel" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("quote_type")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        Teklif
                        <br />
                        Türü
                      </span>
                      {sortField === "quote_type" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("option")}
                  >
                    <div className="flex items-center">
                      OPSİYON
                      {sortField === "option" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("option_date")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        Opsiyon
                        <br />
                        Tarihi
                      </span>
                      {sortField === "option_date" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("room_pax")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        ODA |<br />
                        PAX
                      </span>
                      {sortField === "room_pax" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("total_amount")}
                  >
                    <div className="flex items-center leading-tight">
                      <span>
                        Toplam
                        <br />
                        Tutar
                      </span>
                      {sortField === "total_amount" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("currency")}
                  >
                    <div className="flex items-center">
                      Döviz
                      {sortField === "currency" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-surface transition-colors border-b border-v3-border"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Durum
                      {sortField === "status" && (
                        <svg
                          className={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  {/* Kilit durumu (sadece süper admin için) */}
                  {isSuperAdmin && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kilit
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                    onDoubleClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text">
                      {formatDate(quote.created_at)}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text">
                      {quote.reference}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      <div className="leading-tight flex flex-col gap-0.5">
                        <div className="flex items-center">
                          <span>{formatDate(quote.check_in_date)}</span>
                          <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">
                            , {getDayNameShort(quote.check_in_date)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>{formatDate(quote.check_out_date)}</span>
                          <span className="text-v3-muted ml-1 text-[10px] uppercase font-medium tracking-wider">
                            , {getDayNameShort(quote.check_out_date)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text max-w-[180px]">
                      <span
                        className="block truncate"
                        title={quote.company_name || "-"}
                      >
                        {quote.company_name}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text max-w-[160px]">
                      <span
                        className="block truncate"
                        title={getAgencyName(quote.agency_id) || "-"}
                      >
                        {getAgencyName(quote.agency_id)}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text max-w-[160px]">
                      {(() => {
                        let tooltipNames: string[] = [];
                        let firstHotelName = "";
                        
                        if (quote.hotels_data && Array.isArray(quote.hotels_data) && quote.hotels_data.length > 0) {
                          firstHotelName = getHotelName(quote.hotels_data[0].hotel_id) || quote.hotels_data[0].hotel_name || "Bilinmeyen Otel";
                          tooltipNames = quote.hotels_data.map((h: any) => {
                            const name = getHotelName(h.hotel_id) || h.hotel_name || "Bilinmeyen Otel";
                            const inDate = h.check_in_date ? formatDate(h.check_in_date) : "";
                            const outDate = h.check_out_date ? formatDate(h.check_out_date) : "";
                            let text = name;
                            if (inDate && outDate) text = `${name} (${inDate} - ${outDate})`;
                            return text.replace(/ /g, "\u00A0").replace(/-/g, "\u2011");
                          });
                        } else if (quote.hotel_id) {
                          firstHotelName = getHotelName(quote.hotel_id) || "Bilinmeyen Otel";
                          const inDate = quote.check_in_date ? formatDate(quote.check_in_date) : "";
                          const outDate = quote.check_out_date ? formatDate(quote.check_out_date) : "";
                          let text = firstHotelName;
                          if (inDate && outDate) {
                            text = `${firstHotelName} (${inDate} - ${outDate})`;
                          }
                          tooltipNames = [text.replace(/ /g, "\u00A0").replace(/-/g, "\u2011")];
                        }
                        
                        if (tooltipNames.length === 0) return <span>-</span>;
                        
                        const additionalCount = tooltipNames.length - 1;
                        const allHotelsText = tooltipNames.join("\n");
                        
                        return (
                          <div className="flex items-center gap-1 group" title={allHotelsText}>
                            <span className="truncate block max-w-[120px] cursor-help">{firstHotelName}</span>
                            {additionalCount > 0 && (
                              <span className="text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded cursor-help whitespace-nowrap flex-shrink-0">
                                +{additionalCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {quote.quote_type}
                    </td>

                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {quote.option}
                    </td>

                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {quote.option_date ? formatDate(quote.option_date) : "-"}
                    </td>

                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {quote.room_count && quote.pax_count
                        ? `${quote.room_count} | ${quote.pax_count}`
                        : quote.room_pax || "N/A"}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text">
                      {formatNumber(quote.total_amount || 0)}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-v3-text">
                      {getCurrencyDisplay(quote.items?.[0]?.currency || "EUR")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    {/* Kilit sütunu */}
                    {isSuperAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => toggleLock(quote)}
                          disabled={!!lockUpdatingId}
                          className={`p-1 rounded border text-xs inline-flex items-center justify-center ${
                            isQuoteLocked(quote)
                              ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200"
                              : "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200"
                          } ${lockUpdatingId ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
                          title={isQuoteLocked(quote) ? "Kilidi Aç" : "Kilitle"}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {isQuoteLocked(quote) ? (
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
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/quotes/${quote.id}`)
                          }
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                        </button>
                        {canEdit(Module.QUOTES) && !isQuoteLocked(quote) && (
                          <button
                            onClick={() =>
                              (window.location.href = `/quotes/${quote.id}/edit`)
                            }
                            className="text-green-400 hover:text-green-300 p-1.5 rounded-lg hover:bg-green-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyQuote(quote)}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-600 dark:text-orange-300 p-1.5 rounded-lg hover:bg-orange-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                          title="Kopyala"
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>

                        {canDelete(Module.QUOTES) && !isQuoteLocked(quote) && quote.status !== "KONFİRME" && (
                          <button
                            onClick={() => handleDeleteQuote(quote)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                        {quote.status === "TEKLİF" && (
                          <button
                            onClick={() => {
                              setQuoteToConfirm(quote);
                              const hotelsData =
                                (quote as any).hotels_data || [];
                              const initialSelected: Record<string, boolean> =
                                {};
                              hotelsData.forEach((h: any) => {
                                initialSelected[h.id] = h.is_confirmed || false;
                              });
                              setSelectedHotels(initialSelected);
                              setShowConfirmModal(true);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
                            title="Konfirme Et"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleQuotes.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableColumnCount}
                      className="px-4 py-8 text-center text-sm text-v3-muted"
                    >
                      Filtrelere uygun kayıt bulunamadı.
                    </td>
                  </tr>
                )}
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
            preferenceKey="quotes_page_size"
          />
        </div>

        <Modal
          isOpen={showConfirmModal && !!quoteToConfirm}
          onClose={() => setShowConfirmModal(false)}
          title="TEKLİF KONFİRME ET"
          maxWidth="max-w-2xl"
        >
          {quoteToConfirm && (
            <div className="flex flex-col space-y-6 text-v3-text p-6">
              <p className="text-sm text-v3-text">
                <span className="font-semibold text-v3-text uppercase tracking-tight">
                  {quoteToConfirm.reference}
                </span>{" "}
                referanslı teklif için konfirme edilecek otelleri seçin:
              </p>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {((quoteToConfirm as any).hotels_data || []).map(
                  (h: any, idx: number) => {
                    const hotelObj = hotels.find((ht) => ht.id === h.hotel_id);
                    const isSelected = selectedHotels[h.id] || false;
                    return (
                      <label
                        key={h.id}
                        className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500/50 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "border-v3-border bg-v3-surface hover:bg-v3-border backdrop-blur-md"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? "bg-blue-500 border-blue-500" : "border-white/30"}`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3.5 h-3.5 text-v3-text"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              setSelectedHotels((prev) => ({
                                ...prev,
                                [h.id]: e.target.checked,
                              }))
                            }
                            className="sr-only"
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-v3-text tracking-tight">
                              {idx + 1}. {hotelObj?.name || "Otel Bilgisi Yok"}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 uppercase tracking-widest">
                              {h.option}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-v3-muted mt-1">
                            {formatDate(h.check_in_date)} -{" "}
                            {formatDate(h.check_out_date)} • {h.room_count} Oda,{" "}
                            {h.pax_count} Pax
                          </div>
                        </div>
                      </label>
                    );
                  },
                )}

                {(!(quoteToConfirm as any).hotels_data ||
                  (quoteToConfirm as any).hotels_data.length === 0) && (
                  <div className="text-center py-12 bg-v3-border rounded-xl border border-dashed border-v3-border">
                    <p className="text-sm font-semibold text-v3-muted uppercase tracking-widest">
                      Otel verisi bulunamadı.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3 backdrop-blur-sm">
                <div className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-300 leading-relaxed pt-0.5">
                  Seçilen tüm oteller TEK BİR PROJE içerisinde birleştirilerek
                  aktarılacaktır.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-v3-border">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-2 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors uppercase disabled:opacity-50"
                  disabled={transferring}
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    if (!quoteToConfirm) return;
                    try {
                      setTransferring(true);
                      const updatedHotelsData = (
                        (quoteToConfirm as any).hotels_data || []
                      ).map((h: any) => ({
                        ...h,
                        is_confirmed: selectedHotels[h.id] || false,
                        hotel_status: selectedHotels[h.id] ? "KONFİRME" : h.hotel_status,
                      }));
                      const updatedQuote = {
                        ...quoteToConfirm,
                        status: "KONFİRME",
                        locked: true,
                        hotels_data: updatedHotelsData,
                      } as Quote;

                      await quotesService.update(quoteToConfirm.id, {
                        status: "KONFİRME",
                        locked: true,
                        hotels_data: updatedHotelsData,
                      } as any);

                      setQuotes((prev) =>
                        prev.map((q) => (q.id === quoteToConfirm.id ? updatedQuote : q)),
                      );
                      setShowConfirmModal(false);
                      await executeTransfer([updatedQuote]);
                      
                      // Notify via email
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        await fetch("/api/notifications/quote-confirmed", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            quoteId: quoteToConfirm.id,
                            confirmedBy: { 
                              name: user?.user_metadata?.first_name ? 
                                `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : 
                                "Sistem Kullanıcısı" 
                            }
                          })
                        });
                      } catch (err) {
                        console.error("Failed to send quote confirmed notification:", err);
                      }
                    } catch (err) {
                      console.error("Konfirme hatası:", err);
                      toast.error("Konfirme işlemi sırasında bir hata oluştu.");
                    } finally {
                      setTransferring(false);
                    }
                  }}
                  disabled={
                    transferring ||
                    !Object.values(selectedHotels).some((v) => v)
                  }
                  className="px-6 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] uppercase flex items-center gap-2 disabled:opacity-60"
                >
                  {transferring ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      İşleniyor...
                    </>
                  ) : (
                    "Konfirme Et ve Aktar"
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modern Confirmation Modals */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="SİLMEYİ ONAYLA"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center space-y-6 p-6 text-v3-text">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] border border-red-500/30">
              <Trash2 size={32} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-light text-v3-text glow-text tracking-tight">
                Emin misiniz?
              </p>
              <p className="text-sm font-medium text-v3-muted">
                Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz.
              </p>
            </div>
            <div className="flex justify-center gap-3 w-full pt-4 border-t border-v3-border mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-8 py-2.5 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors uppercase"
              >
                İPTAL
              </button>
              <button
                onClick={confirmDelete}
                className="px-8 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] uppercase"
              >
                SİL
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showGeneralConfirm && !!generalConfirmConfig}
          onClose={() => setShowGeneralConfirm(false)}
          title={generalConfirmConfig?.title || "ONAYLA"}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center space-y-6 p-6 text-v3-text">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-500/30">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-v3-text leading-relaxed">
                {generalConfirmConfig?.message}
              </p>
            </div>
            <div className="flex justify-center gap-3 w-full pt-4 border-t border-v3-border mt-6">
              <button
                onClick={() => setShowGeneralConfirm(false)}
                className="px-8 py-2.5 text-xs font-semibold text-v3-text hover:text-v3-text transition-colors uppercase"
              >
                {generalConfirmConfig?.cancelText || "İPTAL"}
              </button>
              <button
                onClick={() => generalConfirmConfig?.onConfirm()}
                className="px-8 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] uppercase"
              >
                {generalConfirmConfig?.confirmText || "ONAYLA"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
