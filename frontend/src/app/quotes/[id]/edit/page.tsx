"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  agenciesService,
  hotelsService,
  categoriesService,
  usersService,
  quotesService,
  quoteItemsService,
  projectsService,
  projectSalesItemsService,
  projectPurchaseItemsService,
  projectUsersService,
} from "@/lib/supabaseService";
import QuoteServiceEditor from "@/components/QuoteServiceEditor";
import { usePermissions, Module } from "@/lib/permissions";
import LoadingSpinner from "@/components/LoadingSpinner";

// ─── NotificationModal ────────────────────────────────────────────────────────
interface NotificationModalProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

function NotificationModal({ message, type, onClose }: NotificationModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : type === "error"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            }`}
          >
            {type === "success" && (
              <svg
                className="w-8 h-8"
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
            )}
            {type === "error" && (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {type === "info" && (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-v3-text mb-2">
            {type === "success"
              ? "Başarılı"
              : type === "error"
                ? "Hata"
                : "Bilgi"}
          </h3>
          <p className="text-v3-muted text-sm leading-relaxed mb-6">
            {message}
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold text-v3-text transition-all active:scale-95 shadow-lg ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                : type === "error"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                  : "bg-blue-500 hover:bg-blue-500/90 shadow-blue-500/20"
            }`}
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}

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
interface Category {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
}
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface ServiceItem {
  id: string;
  main_category?: string;
  sub_category?: string;
  unit_quantity: number;
  sefer: number;
  unit_price: number;
  currency: string;
  total: number;
  total_try?: number;
  description?: string;
  vat?: number;
  fx?: number;
  isEditing?: boolean;
  hotel_id?: string;
}

interface SelectedHotel {
  id: string;
  hotel_id: string;
  hotel_concept: string;
  check_in_date: string;
  check_out_date: string;
  room_count: number;
  pax_count: number;
  option: string;
  option_date: string;
  is_confirmed?: boolean;
  hotel_status?: string;
}

// ─── SearchableSelect ─────────────────────────────────────────────────────────
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const selected = options.find((o) => o.id === value);
  const display = open ? query : selected?.name || "";
  const filtered = (
    query
      ? options.filter((o) =>
          o.name.toLowerCase().includes(query.toLowerCase()),
        )
      : options
  ).slice(0, 100);
  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };
  return (
    <div className="relative">
      <input
        type="text"
        disabled={disabled}
        value={display}
        onChange={(e) => {
          if (disabled) return;
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          if (disabled) return;
          setQuery("");
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
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
            if (opt) handleSelect(opt.id);
            e.preventDefault();
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        className="w-full px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-v3-text text-xs disabled:bg-gray-100 dark:disabled:bg-gray-800"
      />
      {open && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-v3-border rounded-md shadow-lg z-20">
          <div className="px-2 py-1 text-xs text-v3-muted">
            {filtered.length} sonuç
          </div>
          {filtered.map((opt, idx) => (
            <button
              type="button"
              key={opt.id}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => handleSelect(opt.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${idx === highlight ? "bg-blue-500/10 dark:bg-gray-700" : ""} text-v3-text`}
            >
              {opt.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-v3-muted">
              Sonuç yok
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function QuoteEditPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { canEdit, loading: permissionsLoading } = usePermissions();

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showOperationManagersDropdown, setShowOperationManagersDropdown] =
    useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<SelectedHotel[]>([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'details' ? 'details' : 'info';
  const [activeMainTab, setActiveMainTab] = useState<'info' | 'details'>(initialTab);
  const [showAddServiceRow, setShowAddServiceRow] = useState(false);
  const [hasLinkedProject, setHasLinkedProject] = useState(false);

  const [formData, setFormData] = useState({
    reference: "",
    agency_id: "",
    company_name: "",
    status: "TEKLİF",
    quote_type: "BİRİM",
    operation_managers: [] as string[],
    notes: "",
  });

  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);

  const [newServiceItem, setNewServiceItem] = useState<ServiceItem>({
    id: "",
    main_category: "",
    sub_category: "",
    unit_quantity: 1,
    sefer: 1,
    unit_price: 0,
    currency: "EUR",
    total: 0,
    total_try: 0,
    description: "",
    vat: 0,
    fx: 1,
    isEditing: false,
  });

  // Dropdown close-on-outside-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".operation-managers-dropdown")) {
        setShowOperationManagersDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    loadData();
  }, [quoteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agList, htList, catList, uList, projList] = await Promise.all([
        agenciesService.getAll(),
        hotelsService.getAll(),
        categoriesService.getAll(),
        usersService.getAll(),
        projectsService.getAll(),
      ]);

      setAgencies((agList as any) || []);
      setHotels((htList as any) || []);

      // Sort categories like create page
      const sortedCats = [...((catList as any[]) || [])].sort(
        (a: any, b: any) => {
          if (!a.parent_id && !b.parent_id)
            return (a.code || a.name || "").localeCompare(
              b.code || b.name || "",
              "tr",
              { numeric: true },
            );
          if (a.parent_id && b.parent_id) {
            const aO = a.sort_order ?? 999;
            const bO = b.sort_order ?? 999;
            return aO !== bO
              ? aO - bO
              : (a.name || "").localeCompare(b.name || "", "tr", {
                  numeric: true,
                });
          }
          return 0;
        },
      );
      setCategories(sortedCats);
      setUsers(((uList as any[]) || []).filter((u) => u.is_active));

      const linkedProjectExists = (projList || []).some(
        (p: any) => p.quote_id === quoteId,
      );
      setHasLinkedProject(linkedProjectExists);

      // Load quote
      const q = await quotesService.getById(quoteId);
      if (q) {
        setFormData({
          reference: (q as any).reference || "",
          agency_id: (q as any).agency_id || "",
          company_name: (q as any).company_name || "",
          status: (q as any).status || "TEKLİF",
          quote_type: (q as any).quote_type || "BİRİM",
          operation_managers: (q as any).operation_managers || [],
          notes: (q as any).notes || "",
        });

        const hData = (q as any).hotels_data;
        if (hData && Array.isArray(hData) && hData.length > 0) {
          const konfirme = hData.filter((h: any) => h.hotel_status === "KONFİRME" || h.is_confirmed);
          const others = hData.filter((h: any) => h.hotel_status !== "KONFİRME" && !h.is_confirmed);
          const sortedHData = [...konfirme, ...others];
          setSelectedHotels(sortedHData);
          setActiveHotelId(sortedHData[0].id);
        } else {
          const initialId =
            Date.now().toString() + Math.random().toString(36).slice(2, 7);
          setSelectedHotels([
            {
              id: initialId,
              hotel_id: (q as any).hotel_id || "",
              hotel_concept: (q as any).hotel_concept || "",
              check_in_date: (q as any).check_in_date || "",
              check_out_date: (q as any).check_out_date || "",
              room_count: (q as any).room_count || 1,
              pax_count: (q as any).pax_count || 1,
              option: (q as any).option || "1. OPSİYON",
              option_date: (q as any).option_date || "",
            },
          ]);
          setActiveHotelId(initialId);
        }

        const TAB_TAG_REGEX = /\[T:([^\]]+)\]/;
        const items = await quoteItemsService.getByQuoteId(quoteId);
        const fixedItems = (items || []).map((item: any) => {
          let uiHotelId = item.hotel_id;
          let cleanDescription = item.description || "";

          // Önce açıklamadan gizli Tab ID'sini ayıkla
          const match = cleanDescription.match(TAB_TAG_REGEX);
          if (match) {
            uiHotelId = match[1];
            cleanDescription = cleanDescription
              .replace(/\[T:[^\]]+\]/g, "")
              .trim();
          } else if (item.hotel_id && hData) {
            // Eğer etiket yoksa eski usul eşleme yap (Geriye dönük uyumluluk)
            const matched = hData.find(
              (h: any) =>
                h.hotel_id === item.hotel_id || h.id === item.hotel_id,
            );
            if (matched) uiHotelId = matched.id;
          }

          return {
            ...item,
            hotel_id: uiHotelId || "general",
            description: cleanDescription,
            isEditing: false,
          } as ServiceItem;
        });
        setServiceItems(fixedItems);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortHotels = (hotels: SelectedHotel[]) => {
    const konfirme = hotels.filter((h) => h.hotel_status === "KONFİRME" || h.is_confirmed);
    const others = hotels.filter((h) => h.hotel_status !== "KONFİRME" && !h.is_confirmed);
    return [...konfirme, ...others];
  };

  const handleHotelListChange = (
    id: string,
    field: keyof SelectedHotel,
    value: string | number | boolean,
  ) => {
    setSelectedHotels((prev) => {
      const updated = prev.map((h) => {
        if (h.id !== id) return h;
        if (field === "hotel_id") {
          const hotel = hotels.find((x) => x.id === value);
          return {
            ...h,
            hotel_id: value as string,
            hotel_concept: hotel ? hotel.concept : h.hotel_concept,
          };
        }
        if (field === "hotel_status") {
          const isConf = value === "KONFİRME";
          return { ...h, hotel_status: value as string, is_confirmed: isConf };
        }
        if (field === "room_count" || field === "pax_count")
          return { ...h, [field]: Number(value) };
        if (field === "is_confirmed")
          return {
            ...h,
            [field]: !!value,
            hotel_status: value ? "KONFİRME" : "BEKLEMEDE",
          };
        return { ...h, [field]: value as any };
      });
      if (field === "hotel_status" || field === "is_confirmed") {
        return sortHotels(updated);
      }
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (hasLinkedProject) return;
    e.dataTransfer.setData("tabIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (hasLinkedProject) return;
    const dragIndex = Number(e.dataTransfer.getData("tabIndex"));
    if (dragIndex === dropIndex || isNaN(dragIndex)) return;
    
    setSelectedHotels((prev) => {
      const newHotels = [...prev];
      const draggedItem = newHotels[dragIndex];
      newHotels.splice(dragIndex, 1);
      newHotels.splice(dropIndex, 0, draggedItem);
      return sortHotels(newHotels);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addHotelRow = () => {
    const newId = Date.now().toString() + Math.random().toString();
    setSelectedHotels((prev) => [
      ...prev,
      {
        id: newId,
        hotel_id: "",
        hotel_concept: "",
        check_in_date: "",
        check_out_date: "",
        room_count: 1,
        pax_count: 1,
        option: "1. OPSİYON",
        option_date: "",
        is_confirmed: false,
        hotel_status: "BEKLEMEDE",
      },
    ]);
    setActiveHotelId(newId);
  };

  const removeHotelRow = (id: string) => {
    setSelectedHotels((prev) => {
      const filtered = prev.filter((h) => h.id !== id);
      if (activeHotelId === id && filtered.length > 0)
        setActiveHotelId(filtered[0].id);
      return filtered;
    });
  };

  const copyHotel = (hotel: SelectedHotel) => {
    const newId = Date.now().toString() + Math.random().toString();
    setSelectedHotels((prev) => [...prev, { ...hotel, id: newId }]);
    const newItems = serviceItems
      .filter((i) => i.hotel_id === hotel.id)
      .map((i) => ({
        ...i,
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        hotel_id: newId,
      }));
    setServiceItems((prev) => [...prev, ...newItems]);
    setActiveHotelId(newId);
  };

  const handleAddItem = (hotelId: string) => {
    const newItem: ServiceItem = {
      id: `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: "",
      sub_category: "",
      unit_quantity: 1,
      sefer: 1,
      unit_price: 0,
      currency: "EUR",
      total: 0,
      total_try: 0,
      description: "",
      vat: 0,
      fx: 1,
      isEditing: true,
      hotel_id: hotelId,
    };
    setServiceItems((prev) => [...prev, newItem]);
  };

  const handleEditItem = (item: ServiceItem) => {
    setServiceItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...item, isEditing: true } : i)),
    );
  };

  const handleDeleteItem = (id: string) => {
    setServiceItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveItems = (updatedItems: ServiceItem[]) => {
    setServiceItems(updatedItems);
  };

  const handleAddBelowWithHotel = (itemId: string, hotelId: string) => {
    const idx = serviceItems.findIndex((i) => i.id === itemId);
    const newItem: ServiceItem = {
      id: `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: "",
      sub_category: "",
      unit_quantity: 1,
      sefer: 1,
      unit_price: 0,
      currency: "EUR",
      total: 0,
      total_try: 0,
      description: "",
      vat: 0,
      fx: 1,
      isEditing: true,
      hotel_id: hotelId,
    };
    if (idx === -1) {
      setServiceItems((prev) => [...prev, newItem]);
      return;
    }
    const updated = [...serviceItems];
    updated.splice(idx + 1, 0, newItem);
    setServiceItems(updated);
  };

  const createProjectFromQuote = async (
    quoteId: string,
    confirmedHotels: SelectedHotel[],
    itemsToTransfer: ServiceItem[],
  ) => {
    // Quote verilerini tekrar çekip en güncel halini alalım
    const q = await quotesService.getById(quoteId);
    if (!q || confirmedHotels.length === 0) {
      console.warn(
        "⚠️ Aktarım yapılamadı: Teklif bulunamadı veya konfirme otel yok.",
      );
      return;
    }

    console.log(
      "🚀 Proje aktarımı başlıyor. Toplam kalem sayısı:",
      itemsToTransfer.length,
    );
    console.log(
      "📦 Konfirme oteller:",
      confirmedHotels.map((h) => h.id),
    );

    // Proje başlığı ve detayları (ilk konfirme otel bilgilerini baz alabiliriz veya genel bir isim verebiliriz)
    const firstH = confirmedHotels[0];
    const hotelObj = hotels.find((ht) => ht.id === firstH.hotel_id);
    const hotelName = hotelObj ? hotelObj.name : firstH.hotel_id || "Otel";

    const title =
      confirmedHotels.length > 1
        ? `${q.reference} - Çoklu Konaklama (${confirmedHotels.length} Otel)`
        : `${q.reference} - ${hotelName}`;

    const description = `Konfirme edilen teklif: ${q.reference}`;
    const start_date =
      firstH.check_in_date ||
      q.check_in_date ||
      q.created_at ||
      new Date().toISOString().slice(0, 10);
    const end_date = firstH.check_out_date || q.check_out_date || start_date;

    // Konfirme edilen otellere ait kalemleri filtrele
    const confirmedHotelIds = confirmedHotels.map((h) => h.hotel_id);
    const confirmedTabIds = confirmedHotels.map((h) => h.id);

    // UI state'deki kalemleri kullan (DB'den çekme yarışı riskini önler)
    const relevantItems = itemsToTransfer.filter((item) => {
      return (
        confirmedTabIds.includes(item.hotel_id || "") ||
        confirmedHotelIds.includes(item.hotel_id || "") ||
        !item.hotel_id ||
        item.hotel_id === "general"
      );
    });

    console.log(
      "📑 Filtrelenmiş aktarılacak kalem sayısı:",
      relevantItems.length,
    );

    const budget = relevantItems.reduce(
      (sum, it) => sum + (Number(it.total) || 0),
      0,
    );

    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str,
      );
    const normalizedHotels = confirmedHotels.map((h) => ({
      ...h,
      id: crypto.randomUUID(), // Her tab için yeni ve benzersiz bir UUID oluştur
    }));

    console.log("🏗️ Proje kaydı oluşturuluyor...");
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
      hotel_id: firstH.hotel_id || null,
      quote_type: q.quote_type,
      room_count: firstH.room_count || q.room_count || 0,
      pax_count: firstH.pax_count || q.pax_count || 0,
      room_pax: `${firstH.room_count || 0} | ${firstH.pax_count || 0}`,
      confirmed_at:
        q.confirmed_at || q.updated_at || q.created_at || start_date,
      hotels_data: normalizedHotels as any,
    } as any);

    console.log("✅ Proje oluşturuldu, ID:", created.id);

    if (q.operation_managers && q.operation_managers.length > 0) {
      await projectUsersService.updateByProjectId(
        created.id,
        q.operation_managers,
      );
    }

    // Satış kalemleri
    console.log("📝 Satış kalemleri ekleniyor...");
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(
        (h) => h.id === item.hotel_id || h.hotel_id === item.hotel_id,
      );

      // Veritabanı FK kısıtlaması için gerçek Otel UUID'si
      const realHotelId =
        originalIndex !== -1 ? confirmedHotels[originalIndex].hotel_id : null;
      // UI tab ayrımı için bizim ürettiğimiz gölge Tab ID'si
      const tabUUID =
        originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      const payload = {
        project_id: created.id,
        reference: q.reference,
        category: item.main_category || "",
        sub_category: item.sub_category || "",
        // Gölge tag'i açıklamaya gizle
        description: tabUUID
          ? `${item.description || ""} [T:${tabUUID}]`
          : item.description || "",
        unit_quantity: Number(item.unit_quantity ?? 1),
        sefer: Number(item.sefer ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        total_price: Number(item.total ?? 0),
        currency: item.currency || "EUR",
        vat: Number(item.vat ?? 0),
        fx: Number(item.fx ?? 1),
        hotel_id: realHotelId,
      };

      await projectSalesItemsService.create(payload);
    }

    // Alış kalemleri
    console.log("📝 Alış kalemleri ekleniyor...");
    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(
        (h) => h.id === item.hotel_id || h.hotel_id === item.hotel_id,
      );

      const realHotelId =
        originalIndex !== -1 ? confirmedHotels[originalIndex].hotel_id : null;
      const tabUUID =
        originalIndex !== -1 ? normalizedHotels[originalIndex].id : null;

      const payload = {
        project_id: created.id,
        reference: q.reference,
        category: item.main_category || "",
        sub_category: item.sub_category || "",
        description: tabUUID
          ? `${item.description || ""} [T:${tabUUID}]`
          : item.description || "",
        unit_quantity: Number(item.unit_quantity ?? 1),
        sefer: Number(item.sefer ?? 1),
        unit_price: 0,
        total_price: 0,
        currency: item.currency || "EUR",
        vat: Number(item.vat ?? 0),
        fx: Number(item.fx ?? 1),
        hotel_id: realHotelId,
      };

      await projectPurchaseItemsService.create(payload);
    }
    console.log("✨ Aktarım tamamlandı.");

    return created;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (hasLinkedProject) {
      setNotification({
        message: "Bu teklif kilitlidir. Bağlı proje silinmeden güncellenemez.",
        type: "error",
      });
      return;
    }

    try {
      if (
        !formData.reference ||
        !formData.agency_id ||
        !formData.company_name
      ) {
        setActiveMainTab('info');
        setNotification({
          message:
            "Lütfen zorunlu alanları doldurunuz (KOD, Acente, Firma Adı).",
          type: "error",
        });
        setSubmitting(false);
        return;
      }
      const activeHotels = selectedHotels.filter(
        (h) => h.hotel_id && h.check_in_date && h.check_out_date,
      );
      if (activeHotels.length === 0) {
        setNotification({
          message: "Lütfen en az bir otel seçiniz ve tarihlerini doldurunuz.",
          type: "error",
        });
        setSubmitting(false);
        return;
      }

      const totalAmount = serviceItems.reduce(
        (sum, item) => sum + (item.total || 0),
        0,
      );
      const firstHotel = activeHotels[0];

      await quotesService.update(quoteId, {
        reference: formData.reference,
        agency_id: formData.agency_id,
        company_name: formData.company_name,
        check_in_date: firstHotel.check_in_date,
        check_out_date: firstHotel.check_out_date,
        hotel_id: firstHotel.hotel_id,
        hotel_concept: firstHotel.hotel_concept,
        hotels_data: activeHotels,
        room_count: Number(firstHotel.room_count || 0),
        pax_count: Number(firstHotel.pax_count || 0),
        option: firstHotel.option,
        option_date: firstHotel.option_date || null,
        status: formData.status,
        // KONFİRME'ye çekilen teklif otomatik kilitlensin
        locked: formData.status === "KONFİRME" ? true : undefined,
        quote_type: formData.quote_type,
        operation_managers: formData.operation_managers.filter((id) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id,
          ),
        ),
        notes: formData.notes,
        total_amount: totalAmount,
      } as any);

      await quoteItemsService.deleteByQuoteId(quoteId);
      for (const item of serviceItems) {
        // Otel eşleşmesini bul ve gerçek Hotel UUID'sini al
        const matchedHotel = selectedHotels.find((h) => h.id === item.hotel_id);
        const dbHotelId = matchedHotel ? matchedHotel.hotel_id : null;

        // Tab ID'sini açıklamanın sonuna gizli tag olarak ekle [T:tab_id]
        let saveDescription = item.description || "";
        if (
          item.hotel_id &&
          item.hotel_id !== "general" &&
          !saveDescription.includes(`[T:${item.hotel_id}]`)
        ) {
          saveDescription = `${saveDescription} [T:${item.hotel_id}]`.trim();
        }

        await quoteItemsService.create({
          quote_id: quoteId,
          reference: formData.reference,
          main_category: item.main_category || "",
          sub_category: item.sub_category || "",
          unit_quantity: Number(item.unit_quantity || 0),
          sefer: Number(item.sefer || 0),
          unit_price: Number(item.unit_price || 0),
          currency: item.currency || "EUR",
          total: Number(item.total || 0),
          total_price: Number(item.total || 0),
          total_try: Number(item.total_try || 0),
          description: saveDescription,
          vat: Number(item.vat || 0),
          fx: Number(item.fx || 1),
          hotel_id: dbHotelId,
        } as any);
      }

      // Sadece KONFİRME ise ve proje yoksa aktar
      if (formData.status === "KONFİRME") {
        try {
          const confirmedHotels = selectedHotels.filter(
            (h) => h.is_confirmed || h.hotel_status === "KONFİRME",
          );
          if (confirmedHotels.length > 0) {
            // Mevcut projeleri kontrol et ama aktarımı engelleme (test için veya güncelleme için izin veriyoruz)
            const existingProjects = await projectsService.getAll();
            const projectExists = existingProjects.some(
              (p) => p.quote_id === quoteId,
            );

            if (projectExists) {
              console.log(
                "ℹ️ Bu teklif için daha önce proje oluşturulmuş. Yeni bir tane daha oluşturuluyor...",
              );
            }

            await createProjectFromQuote(
              quoteId,
              confirmedHotels,
              serviceItems,
            );
            setNotification({
              message: "Teklif güncellendi ve proje oluşturuldu.",
              type: "success",
            });
          }
        } catch (err: any) {
          console.error("Proje aktarım hatası:", err);
          setNotification({
            message: `Proje aktarımı sırasında bir hata oluştu: ${err.message || "Bilinmeyen hata"}`,
            type: "error",
          });
        }
      } else {
        setNotification({
          message: "Teklif başarıyla güncellendi!",
          type: "success",
        });
      }

      router.push(`/quotes/${quoteId}?tab=${activeMainTab}`);
    } catch (error: any) {
      console.error("Error updating quote:", error);
      setNotification({
        message: `Hata: ${error?.message || "Bilinmeyen hata"}`,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Quotes düzenleme yetkisi kontrolü
  if (!canEdit(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Teklifi düzenlemek için yetkiniz bulunmuyor.
          </p>
          <Link
            href="/quotes"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Teklif Listesine Dön
          </Link>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto pb-32 scroll-pt-32 bg-transparent transition-colors duration-200 compact">
      {/* NEW: Sticky Main Tabs - Full Width Minimal */}
      <div className="sticky top-0 z-40 pb-2 pt-2 mb-6 border-b border-v3-border bg-slate-900/10 dark:bg-[#0a0f18]/90 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-4 flex justify-between items-center w-full">
          {/* Left Back Button */}
          <div className="w-[120px]">
            <Link
              href="/quotes"
              className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-v3-muted dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-v3-text dark:hover:text-v3-text transition-all duration-200 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              GERİ DÖN
            </Link>
          </div>
          
          {/* Center Tabs */}
          <div className="flex bg-transparent p-1 rounded-xl border border-v3-border w-full max-w-[350px]">
             <button 
               type="button"
               onClick={() => setActiveMainTab('info')} 
               className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'info' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-v3-muted hover:text-v3-text hover:bg-v3-border'}`}
             >
               TEKLİF BİLGİLERİ
             </button>
             <button 
               type="button"
               onClick={() => setActiveMainTab('details')} 
               className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'details' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-v3-muted hover:text-v3-text hover:bg-v3-border'}`}
             >
               TEKLİF DETAYLARI
             </button>
          </div>
          
          {/* Right Actions */}
          <div className="w-[150px] flex justify-end gap-2">
            <Link
              href={`/quotes/${quoteId}?tab=${activeMainTab}`}
              className="px-3 py-1.5 bg-black/5 dark:bg-white/50/10 hover:bg-black/5 dark:bg-white/50/20 text-v3-muted hover:text-v3-text rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors border border-gray-500/20"
            >
              Vazgeç
            </Link>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById("quote-edit-form") as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              disabled={submitting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors border border-blue-500/50 flex items-center disabled:opacity-50"
            >
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">

        {hasLinkedProject && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <svg
                className="w-4 h-4 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                TEKLİF KİLİTLİ
              </h4>
              <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                Bu teklif konfirme edilip projeye aktarılmıştır. Teklif üzerinde
                düzenleme yapabilmek için önce bağlı olan projeyi silmelisiniz.
              </p>
            </div>
          </div>
        )}

        <form id="quote-edit-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Teklif Bilgileri */}
          <div className={activeMainTab === 'info' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-v3-border p-6 transition-colors duration-200 mb-6">
            <h2 className="text-lg font-semibold text-v3-text mb-4">
              Teklif Bilgileri
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Temel Bilgiler */}
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md border border-v3-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative z-[60] group hover:border-blue-500/30 transition-all duration-300">
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    KOD *
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    disabled={hasLinkedProject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    placeholder="Teklif kodu giriniz..."
                    className="w-full text-base font-bold text-v3-text bg-transparent border-none outline-none focus:ring-0 disabled:text-v3-muted"
                  />
                </div>
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    DURUM *
                  </label>
                  <select
                    value={formData.status}
                    disabled={hasLinkedProject}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full text-xs font-semibold text-v3-text bg-transparent border-none outline-none focus:ring-0 disabled:text-v3-muted"
                  >
                    <option value="TEKLİF">TEKLİF</option>
                    <option value="BEKLEMEDE">BEKLEMEDE</option>
                    <option value="KONFİRME">KONFİRME</option>
                    <option value="İPTAL">İPTAL</option>
                  </select>
                </div>
              </div>

              {/* Card 2: Firma & Paydaşlar */}
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md border border-v3-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative z-[50] group hover:border-purple-500/30 transition-all duration-300">
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    FİRMA ADI *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    disabled={hasLinkedProject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        company_name: e.target.value,
                      }))
                    }
                    placeholder="Firma adını giriniz..."
                    className="w-full text-base font-bold text-v3-text bg-transparent border-none outline-none focus:ring-0 disabled:text-v3-muted"
                  />
                </div>
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    ACENTE *
                  </label>
                  <SearchableSelect
                    options={agencies}
                    value={formData.agency_id}
                    disabled={hasLinkedProject}
                    onChange={(id) =>
                      setFormData((prev) => ({ ...prev, agency_id: id }))
                    }
                    placeholder="Acente seç / ara..."
                  />
                </div>
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    OPERASYON SORUMLULARI
                  </label>
                  <div className="relative z-50 operation-managers-dropdown">
                    <button
                      type="button"
                      disabled={hasLinkedProject}
                      onClick={() =>
                        !hasLinkedProject &&
                        setShowOperationManagersDropdown(!showOperationManagersDropdown)
                      }
                      className="w-full text-left text-xs font-semibold text-v3-text bg-transparent border-none outline-none focus:ring-0 flex justify-between items-center disabled:text-v3-muted"
                    >
                      <span className="flex-1 overflow-hidden">
                        {formData.operation_managers.length > 0 ? (
                          <div className="flex gap-1 overflow-hidden whitespace-nowrap items-center h-full">
                            {formData.operation_managers.map((id, index) => {
                              const u = users.find(x => x.id === id);
                              if (!u) return null;
                              if (index < 2) {
                                return <span key={id} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1 py-0.5 rounded text-[10px] leading-none truncate max-w-[65px]">{u.first_name}</span>;
                              }
                              if (index === 2) {
                                return <span key="more" className="bg-gray-100 dark:bg-gray-600 text-v3-text text-v3-muted px-1 py-0.5 rounded text-[10px] leading-none font-medium">+{formData.operation_managers.length - 2}</span>;
                              }
                              return null;
                            })}
                          </div>
                        ) : "Kullanıcı seçin..."}
                      </span>
                      <svg className="w-4 h-4 text-v3-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showOperationManagersDropdown && (
                      <div className="absolute z-[9999] w-full mt-2 bg-v3-surface backdrop-blur-xl border border-v3-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto">
                        {users.map((user) => (
                          <label key={user.id} className="flex items-center px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer border-b border-v3-border last:border-0 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.operation_managers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    operation_managers: [...prev.operation_managers, user.id],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    operation_managers: prev.operation_managers.filter((id) => id !== user.id),
                                  }));
                                }
                              }}
                              className="mr-3 text-blue-600 focus:ring-blue-500 rounded border-v3-border bg-v3-surface"
                            />
                            <span className="text-xs font-semibold text-v3-text">
                              {user.first_name} {user.last_name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Teklif Bilgileri */}
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md border border-v3-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors flex-1 flex flex-col min-h-[100px] overflow-hidden">
                  <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      OTELLER VE KONAKLAMA TARİHLERİ
                    </p>
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {/* Mevcut Oteller */}
                    <div className="flex flex-col gap-2">
                      {selectedHotels && selectedHotels.length > 0 ? (
                        selectedHotels.map((h: any, idx: number) => {
                          return (
                            <div key={idx} className="flex flex-wrap lg:flex-nowrap items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-v3-border">
                              <div className="flex-1 min-w-[150px]">
                                <select
                                  value={h.hotel_id || ""}
                                  disabled={hasLinkedProject}
                                  onChange={(e) => handleHotelListChange(h.id, 'hotel_id', e.target.value)}
                                  className="w-full bg-v3-surface text-v3-text text-[11px] font-bold border border-v3-border rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 transition-colors"
                                >
                                  <option value="">Otel Seçiniz</option>
                                  {hotels?.map((mh: any) => (
                                    <option key={mh.id} value={mh.id}>{mh.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="date"
                                  value={h.check_in_date ? h.check_in_date.substring(0, 10) : ""}
                                  disabled={hasLinkedProject}
                                  onChange={(e) => handleHotelListChange(h.id, 'check_in_date', e.target.value)}
                                  className="bg-v3-surface text-v3-text text-[10px] font-bold border border-v3-border rounded-lg px-2 py-1.5 w-[115px] outline-none focus:border-blue-500 transition-colors"
                                  title="Giriş Tarihi"
                                />
                                <span className="text-v3-muted font-bold">-</span>
                                <input
                                  type="date"
                                  value={h.check_out_date ? h.check_out_date.substring(0, 10) : ""}
                                  disabled={hasLinkedProject}
                                  onChange={(e) => handleHotelListChange(h.id, 'check_out_date', e.target.value)}
                                  className="bg-v3-surface text-v3-text text-[10px] font-bold border border-v3-border rounded-lg px-2 py-1.5 w-[115px] outline-none focus:border-blue-500 transition-colors"
                                  title="Çıkış Tarihi"
                                />
                                {!hasLinkedProject && (
                                  <button
                                    type="button"
                                    onClick={() => removeHotelRow(h.id)}
                                    className="p-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors"
                                    title="Oteli Kaldır"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[10px] text-v3-muted italic">Otel eklenmemiş.</div>
                      )}
                    </div>
                    
                    {!hasLinkedProject && (
                      <button
                        type="button"
                        onClick={addHotelRow}
                        className="w-full mt-2 py-2 bg-v3-surface hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-dashed border-v3-border hover:border-blue-500/50 transition-colors flex justify-center items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Yeni Otel Satırı Ekle
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      ODA | PAX
                    </p>
                    <p className="text-base font-bold text-v3-text leading-tight">
                      {selectedHotels.reduce((acc, h) => acc + (Number(h.room_count) || 0), 0)} | {selectedHotels.reduce((acc, h) => acc + (Number(h.pax_count) || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      TEKLİF TÜRÜ *
                    </p>
                    <select
                      value={formData.quote_type}
                      disabled={hasLinkedProject}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quote_type: e.target.value,
                        }))
                      }
                      className="w-full text-base font-bold text-v3-text bg-transparent border-none outline-none focus:ring-0 disabled:text-v3-muted p-0"
                    >
                      <option value="BİRİM">BİRİM</option>
                      <option value="PAKET">PAKET</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tam Genişlik: Notlar */}
            <div className="mt-6 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-v3-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative z-[40] group hover:border-emerald-500/30 transition-all duration-300">
              <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors flex flex-col">
                <label className="block text-[10px] font-black text-emerald-500/80 dark:text-emerald-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  NOTLAR
                </label>
                <textarea
                  value={formData.notes}
                  disabled={hasLinkedProject}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full min-h-[120px] text-xs font-semibold text-v3-text bg-transparent border-none outline-none focus:ring-0 resize-y disabled:text-v3-muted"
                  placeholder="Teklif notlarını buraya yazın..."
                />
              </div>
            </div>
          </div>
          </div>

          {/* ─── DETAYLAR TAB ─── */}
          <div className={activeMainTab === 'details' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
              {/* ─── Çoklu Otel Seçimi ─── */}
              <div className="md:col-span-6 space-y-4 bg-v3-surface p-4 rounded-xl border border-v3-border mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-v3-text dark:text-gray-200">
                    Otel &amp; Konaklama Seçimleri
                  </h3>

                </div>

                {/* Tab Bar */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 bg-gray-50 dark:bg-v3-surface dark:backdrop-blur-md p-1.5 rounded-xl border border-gray-100 dark:border-v3-border shadow-sm">
                  {selectedHotels.map((h, index) => (
                    <div
                      key={h.id}
                      draggable={!hasLinkedProject}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={handleDragOver}
                      onClick={() => setActiveHotelId(h.id)}
                      className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap group ${
                        activeHotelId === h.id
                          ? "bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                          : "bg-black/5 dark:bg-white/5 text-v3-muted hover:text-v3-text hover:bg-black/10 dark:hover:bg-v3-surface/10"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">
                        {hotels.find((x) => x.id === h.hotel_id)?.name
                          ? hotels.find((x) => x.id === h.hotel_id)!.name.length > 15
                            ? hotels.find((x) => x.id === h.hotel_id)!.name.substring(0, 15) + "..."
                            : hotels.find((x) => x.id === h.hotel_id)!.name
                          : "Otel Seçin"}
                      </span>
                      <span className="ml-2 text-[9px] opacity-60 font-mono bg-black/20 px-1.5 py-0.5 rounded">
                        {h.check_in_date ? new Date(h.check_in_date).toLocaleDateString('tr-TR', {day: '2-digit', month:'2-digit'}) : ''}
                        {h.check_out_date ? '-' + new Date(h.check_out_date).toLocaleDateString('tr-TR', {day: '2-digit', month:'2-digit'}) : ''}
                      </span>
                      {!hasLinkedProject && (
                        <div className="flex items-center ml-3 space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyHotel(h);
                            }}
                            className="p-1 hover:bg-v3-surface/20 rounded"
                            title="Kopyala"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                              />
                            </svg>
                          </button>
                          {selectedHotels.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHotelRow(h.id);
                              }}
                              className="p-1 hover:bg-red-500 rounded"
                              title="Sil"
                            >
                              <svg
                                className="w-3.5 h-3.5"
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
                      )}
                    </div>
                  ))}

                  <div
                    onClick={() => setActiveHotelId("general")}
                    className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap ${
                      activeHotelId === "general"
                        ? "bg-indigo-600/90 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                        : "bg-black/5 dark:bg-white/5 text-v3-muted hover:text-v3-text hover:bg-black/10 dark:hover:bg-v3-surface/10"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      GENEL HİZMETLER
                    </span>
                  </div>

                  {!hasLinkedProject && (
                    <button
                      type="button"
                      onClick={addHotelRow}
                      className="flex items-center px-3 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                      title="Yeni Otel Ekle"
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
                          d="M12 6v12m6-6H6"
                        />
                      </svg>
                      <span className="ml-1 text-xs font-bold uppercase">
                        Yeni Otel
                      </span>
                    </button>
                  )}
                </div>

                {/* Tab Content – Hotel */}
                {activeHotelId !== "general" &&
                  selectedHotels.map(
                    (h) =>
                      activeHotelId === h.id && (
                        <div
                          key={h.id}
                          className="p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-blue-500 ring-2 ring-blue-500/10 shadow-sm space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.8fr_0.8fr_1fr_1fr_1.2fr] gap-3 items-end animate-in fade-in duration-300">
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                Otel *
                              </label>
                              <SearchableSelect
                                options={hotels}
                                value={h.hotel_id}
                                disabled={hasLinkedProject}
                                onChange={(val) =>
                                  handleHotelListChange(h.id, "hotel_id", val)
                                }
                                placeholder="Otel seç..."
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                Otel Konsepti
                              </label>
                              <input
                                type="text"
                                value={h.hotel_concept}
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "hotel_concept",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                                placeholder="Konsept..."
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                C/IN Tarihi *
                              </label>
                              <input
                                type="date"
                                value={h.check_in_date}
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "check_in_date",
                                    e.target.value,
                                  )
                                }
                                required
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                C/OUT Tarihi *
                              </label>
                              <input
                                type="date"
                                value={h.check_out_date}
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "check_out_date",
                                    e.target.value,
                                  )
                                }
                                required
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                              />
                            </div>
                          
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                Oda Sayısı
                              </label>
                              <input
                                type="number"
                                value={h.room_count}
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "room_count",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                min="1"
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                Pax Sayısı
                              </label>
                              <input
                                type="number"
                                value={h.pax_count}
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "pax_count",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                min="1"
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-yellow-500/90 uppercase tracking-widest mb-1.5">
                                Opsiyon
                              </label>
                              <select
                                value={h.option}
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "option",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                              >
                                <option value="1. OPSİYON">1. OPSİYON</option>
                                <option value="2. OPSİYON">2. OPSİYON</option>
                                <option value="SOR-SAT">SOR-SAT</option>
                              </select>
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-yellow-500/90 uppercase tracking-widest mb-1.5">
                                Opsiyon Tarihi
                              </label>
                              <input
                                type="date"
                                value={h.option_date}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "option_date",
                                    e.target.value,
                                  )
                                }
                                disabled={
                                  h.option === "SOR-SAT" || hasLinkedProject
                                }
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-200 dark:disabled:bg-gray-800"
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">
                                Durum
                              </label>
                              <select
                                value={
                                  h.hotel_status ||
                                  (h.is_confirmed ? "KONFİRME" : "BEKLEMEDE")
                                }
                                disabled={hasLinkedProject}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "hotel_status" as any,
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text font-bold disabled:bg-gray-100 dark:disabled:bg-gray-800"
                              >
                                <option value="BEKLEMEDE">BEKLEMEDE</option>
                                <option value="KONFİRME">KONFİRME</option>
                                <option value="İPTAL">İPTAL</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-6 pt-2">
                              <QuoteServiceEditor
                              title={
                              <h3 className="text-sm font-bold text-v3-text dark:text-gray-200 uppercase flex items-center m-0">
                                <svg
                                  className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 011-1h2a1 1 0 011 1v3M12 7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                                Otel Bazlı Hizmet Kalemleri
                              </h3>
                            }
                              items={serviceItems.filter(
                                (item) => item.hotel_id === h.id,
                              )}
                              disabled={hasLinkedProject}
                              onAdd={() => handleAddItem(h.id)}
                              onEdit={handleEditItem}
                              onDelete={handleDeleteItem}
                              onSave={(updatedItems) => {
                                const otherItems = serviceItems.filter(
                                  (item) => item.hotel_id !== h.id,
                                );
                                handleSaveItems([
                                  ...otherItems,
                                  ...updatedItems,
                                ]);
                              }}
                              onAddBelow={(itemId) =>
                                handleAddBelowWithHotel(itemId, h.id)
                              }
                              categories={categories}
                              currencies={["EUR", "USD", "TL", "GBP"]}
                              showAddRow={showAddServiceRow}
                              setShowAddRow={setShowAddServiceRow}
                              newItem={newServiceItem}
                              setNewItem={setNewServiceItem}
                              hotels={selectedHotels.map((sh) => ({
                                ...sh,
                                name:
                                  hotels.find((x) => x.id === sh.hotel_id)
                                    ?.name ||
                                  (sh.hotel_id ? "Otel" : "Otel Seçilmedi"),
                              }))}
                              hotelId={h.id}
                            />
                          </div>
                        </div>
                      ),
                  )}

                {/* Tab Content – General */}
                {activeHotelId === "general" && (
                  <div className="p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-v3-text dark:text-gray-200 mb-4 uppercase flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Genel Hizmet Kalemleri (Uçak, Transfer vb.)
                    </h3>
                    <QuoteServiceEditor
                      items={serviceItems.filter(
                        (item) => !item.hotel_id || item.hotel_id === "general",
                      )}
                      disabled={hasLinkedProject}
                      onAdd={() => handleAddItem("general")}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      onSave={(updatedItems) => {
                        const otherItems = serviceItems.filter(
                          (item) =>
                            item.hotel_id && item.hotel_id !== "general",
                        );
                        handleSaveItems([...otherItems, ...updatedItems]);
                      }}
                      onAddBelow={(itemId) =>
                        handleAddBelowWithHotel(itemId, "general")
                      }
                      categories={categories}
                      currencies={["EUR", "USD", "TL", "GBP"]}
                      showAddRow={showAddServiceRow}
                      setShowAddRow={setShowAddServiceRow}
                      newItem={newServiceItem}
                      setNewItem={setNewServiceItem}
                      hotels={selectedHotels.map((sh) => ({
                        ...sh,
                        name:
                          hotels.find((x) => x.id === sh.hotel_id)?.name ||
                          (sh.hotel_id ? "Otel" : "Otel Seçilmedi"),
                      }))}
                      hotelId="general"
                    />
                  </div>
                )}
              </div>
            </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/quotes"
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-v3-muted text-v3-muted bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-v3-text dark:hover:text-v3-text transition-all duration-200 shadow-sm"
            >
              İPTAL
            </Link>
            {!hasLinkedProject && (
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold text-v3-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                TEKLİFİ GÜNCELLE
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
