"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatNumber } from "@/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
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
import { supabase } from "@/lib/supabase";
import QuoteServiceEditor from "@/components/QuoteServiceEditor";
import { usePermissions, Module } from "@/lib/permissions";
import ResponsiveDateRangeField from "@/components/ResponsiveDateRangeField";
import LoadingSpinner from "@/components/LoadingSpinner";
import CongressMasterBudget from "./CongressMasterBudget";

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
}

interface SubCategory {
  id: string;
  name: string;
  main_category_id: string;
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
  hotel_id?: string; // Hangi otele ait olduğu (CAT_001/CAT_002 için)
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
  hotel_status: string;
}

interface Quote {
  id: string;
  reference: string;
  agency_id: string;
  company_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_id: string;
  hotel_concept: string;
  hotels_data?: any[];
  room_count: number;
  pax_count: number;
  option: string;
  status: string;
  quote_type: string;
  operation_managers: string[]; // Operasyon sorumluları
  notes: string;
  items: ServiceItem[];
  total_amount: number;
  currency?: string;
  created_at: string;
}

  // Lightweight inline searchable select for simple lists
  const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
  }: {
    options: { id: string; name: string }[];
    value: string;
    onChange: (id: string) => void;
    placeholder: string;
  }) => {
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
            if (e.key === "Tab") {
              if (open && filtered[highlight]) {
                handleSelect(filtered[highlight].id);
              }
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
          className="w-full px-3 h-8 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text"
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
  };

export default function CreateQuotePage() {
  const router = useRouter();
  const { canCreate, loading: permissionsLoading } = usePermissions();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showOperationManagersDropdown, setShowOperationManagersDropdown] =
    useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<'info' | 'details'>('info');
  const [agencySearch, setAgencySearch] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");
  const [showAddServiceRow, setShowAddServiceRow] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    reference: "",
    agency_id: "",
    company_name: "",
    status: "TEKLİF",
    quote_type: "BİRİM",
    operation_managers: [] as string[], // Operasyon sorumluları
    notes: `FİYATLAR, NET & KOMİSYONSUZ & KDV DAHİLDİR.
ALINMASI HENÜZ KESİNLEŞMEYEN SERVİSLER İÇİN BİRİM/ ADET veya SEFER/TEKRAR ÇARPANI "0" (SIFIR) OLARAK GÜNCELLENMİŞTİR.
OTELE GİRİŞ GÜNÜ KONAKLAMA ÖĞLE YEMEĞİ İLE BAŞLAR, OTELDEN ÇIKIŞ GÜNÜ KONAKLAMA SABAH KAHVALTISI İLE SON BULUR.
OTELE GİRİŞ GÜNÜ SABAH KAHVALTISI, OTELDEN ÇIKIŞ GÜNÜ ÖĞLE YEMEĞİ EKSTRA OLARAK ÜCRETLENDİRİLİR.`,
    room_count: 0,
    pax_count: 0,
    budget_currency: "EUR",
    forecast_revenue: 0,
    forecast_cost: 0,
    management_fee_percentage: 0,
    association_share_percentage: 0,
  });

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [selectedHotels, setSelectedHotels] = useState<SelectedHotel[]>([]);

  // Veri yüklendiğinde veya ilk renderda bir otel oluştur
  useEffect(() => {
    if (selectedHotels.length === 0) {
      const initialId =
        Date.now().toString() + Math.random().toString(36).slice(2, 7);
      setSelectedHotels([
        {
          id: initialId,
          hotel_id: "",
          hotel_concept: "",
          check_in_date: "",
          check_out_date: "",
          room_count: 1,
          pax_count: 1,
          option: "1. OPSİYON",
          option_date: "",
          hotel_status: "BEKLEMEDE",
        },
      ]);
      setActiveHotelId(initialId);
    }
  }, [selectedHotels.length]);

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
        if (h.id === id) {
          if (field === "hotel_id") {
            const hotel = hotels.find((x) => x.id === value);
            return {
              ...h,
              hotel_id: value as string,
              hotel_concept: hotel ? hotel.concept : "",
            };
          }
          if (field === "room_count" || field === "pax_count") {
            return { ...h, [field]: Number(value) };
          }
          if (
            field === "option" &&
            value !== "1. OPSİYON" &&
            value !== "2. OPSİYON"
          ) {
            return { ...h, [field]: value as string, option_date: "" };
          }
          if (field === "hotel_status") {
            const isConf = value === "KONFİRME";
            return { ...h, hotel_status: value as string, is_confirmed: isConf };
          }
          if (field === "is_confirmed") {
            return {
              ...h,
              [field]: !!value,
              hotel_status: value ? "KONFİRME" : "BEKLEMEDE",
            };
          }
          return { ...h, [field]: value as any };
        }
        return h;
      });
      if (field === "hotel_status" || field === "is_confirmed") {
        return sortHotels(updated);
      }
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("tabIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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
        hotel_status: "BEKLEMEDE",
      },
    ]);
    setActiveHotelId(newId);
  };

  const removeHotelRow = (id: string) => {
    setSelectedHotels((prev) => {
      const filtered = prev.filter((h) => h.id !== id);
      if (activeHotelId === id && filtered.length > 0) {
        setActiveHotelId(filtered[0].id);
      }
      return filtered;
    });
  };

  const copyHotel = (hotel: SelectedHotel) => {
    const newId = Date.now().toString() + Math.random().toString();
    const copiedHotel = { ...hotel, id: newId };
    setSelectedHotels((prev) => [...prev, copiedHotel]);

    // O otele bağlı servis kalemlerini de kopyala
    const itemsToCopy = serviceItems.filter(
      (item) => item.hotel_id === hotel.id,
    );
    const newItems = itemsToCopy.map((item) => ({
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      hotel_id: newId,
    }));

    setServiceItems((prev) => [...prev, ...newItems]);
    setActiveHotelId(newId);
  };

  // New service item form
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

  useEffect(() => {
    loadData();
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".operation-managers-dropdown")) {
        setShowOperationManagersDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    try {
      // Agencies: Supabase
      try {
        const list = await agenciesService.getAll();
        setAgencies((list || []) as any);
      } catch {
        setAgencies([]);
      }

      // Hotels: Supabase
      try {
        const list = await hotelsService.getAll();
        setHotels((list || []) as any);
      } catch {
        setHotels([]);
      }

      // Categories: strictly from Supabase service
      try {
        const cats = await categoriesService.getAll();
        if (cats && cats.length) {
          // Kategorileri /categories sayfasındaki sıralama ile sırala
          const sortedCats = [...cats].sort((a: any, b: any) => {
            // Ana kategoriler için code ya da name'e göre sırala
            if (!a.parent_id && !b.parent_id) {
              const aKey = (a.code || a.name || "").toString();
              const bKey = (b.code || b.name || "").toString();
              return aKey.localeCompare(bKey, "tr", {
                numeric: true,
                sensitivity: "base",
              });
            }
            // Alt kategoriler için sort_order'a göre sırala, yoksa name'e göre
            if (a.parent_id && b.parent_id) {
              const aOrder = a.sort_order ?? 999;
              const bOrder = b.sort_order ?? 999;
              if (aOrder !== bOrder) {
                return aOrder - bOrder;
              }
              return (a.name || "").localeCompare(b.name || "", "tr", {
                numeric: true,
                sensitivity: "base",
              });
            }
            return 0;
          });
          setCategories(sortedCats);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Kategori yükleme hatası:", error);
        setCategories([]);
      }

      // Users: Supabase
      try {
        const u = await usersService.getAll();
        const active = (u as any[]).filter(
          (user: any) => user.is_active !== false,
        );
        setUsers(active as any);
      } catch {
        setUsers([]);
      }

      // Automatically add current user to operation_managers
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setFormData((prev) => ({
            ...prev,
            operation_managers: prev.operation_managers.length > 0 ? prev.operation_managers : [session.user.id]
          }));
        }
      } catch (err) {
        console.error("Oturum bilgisi alınırken hata:", err);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "option") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        option_date: "", // OPSİYON değiştiğinde tarihi temizle
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // SearchableSelect için özel handler
  const handleAgencySelect = (id: string) => {
    console.log(
      "Acente seçildi:",
      id,
      "UUID formatı:",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
    );
    setFormData((prev) => ({
      ...prev,
      agency_id: id,
    }));
  };

  // handleHotelSelect is handled dynamically in handleHotelListChange

  const handleServiceItemChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setNewServiceItem((prev) => ({
      ...prev,
      [name]:
        name === "unit_quantity" || name === "unit_price" || name === "sefer"
          ? Number(value)
          : value,
    }));
  };

  const handleAddItem = (hotelId?: string) => {
    // Proje detay sayfasındaki gibi sadece ana kategori kontrolü
    if (!newServiceItem.main_category) return;

    console.log(
      "handleAddItem çağrıldı - Ana kategori seçildi, satır oluşturuluyor",
    );

    const item: ServiceItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: newServiceItem.main_category || "",
      sub_category: "", // Boş bırakılacak, düzenleme ile seçilecek
      unit_quantity: 1,
      sefer: 1,
      unit_price: 0,
      currency: "EUR",
      total: 0,
      total_try: 0,
      description: "",
      vat: 0,
      fx: 1,
      isEditing: true, // Düzenleme modunda açılacak
      hotel_id: hotelId === "general" ? "general" : hotelId,
    };

    setServiceItems((prev) => [...prev, item]);

    // Reset form
    setNewServiceItem({
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
  };

  const handleRemoveItem = (id: string) => {
    setServiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddBelow = (itemId: string) => {
    console.log("handleAddBelow çağrıldı - itemId:", itemId);
    // Tıklanan item'ı bul
    const clickedItem = serviceItems.find((item) => item.id === itemId);
    if (!clickedItem) {
      console.log("clickedItem bulunamadı");
      return;
    }
    console.log("clickedItem bulundu:", clickedItem);

    // Proje detay sayfasındaki gibi sadece ana kategoriyi koru, diğer alanları varsayılan değerlerle doldur
    const newItem: ServiceItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: clickedItem.main_category || "", // Tıklanan item'ın ana kategorisini kullan
      sub_category: "", // Boş bırakılacak, düzenleme ile seçilecek
      unit_quantity: 1,
      sefer: 1,
      unit_price: 0,
      currency: clickedItem.currency || "EUR", // Tıklanan item'ın dövizini kullan
      total: 0,
      total_try: 0,
      description: "",
      vat: 0,
      fx: 1,
      isEditing: true, // Yeni eklenen satır otomatik düzenleme modu
      hotel_id: clickedItem.hotel_id,
    };

    // Aynı ana kategorideki son item'ı bul ve onun altına ekle
    const sameCategoryItems = serviceItems.filter(
      (item) => item.main_category === clickedItem.main_category,
    );
    const lastItemInCategory = sameCategoryItems[sameCategoryItems.length - 1];

    if (lastItemInCategory) {
      const lastItemIndex = serviceItems.findIndex(
        (item) => item.id === lastItemInCategory.id,
      );
      setServiceItems((prev) => {
        const newItems = [...prev];
        newItems.splice(lastItemIndex + 1, 0, newItem);
        return newItems;
      });
    } else {
      // Eğer aynı kategoride başka item yoksa en sona ekle
      setServiceItems((prev) => [...prev, newItem]);
    }
  };

  const handleAddBelowWithHotel = (itemId: string, hotelId: string) => {
    console.log(
      "handleAddBelowWithHotel çağrıldı - itemId:",
      itemId,
      "hotelId:",
      hotelId,
    );
    // Tıklanan item'ı bul
    const clickedItem = serviceItems.find((item) => item.id === itemId);
    if (!clickedItem) return;

    const newItem: ServiceItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      main_category: clickedItem.main_category || "",
      sub_category: "",
      unit_quantity: 1,
      sefer: 1,
      unit_price: 0,
      currency: clickedItem.currency || "EUR",
      total: 0,
      total_try: 0,
      description: "",
      vat: 0,
      fx: 1,
      isEditing: true,
      hotel_id: hotelId === "general" ? "general" : hotelId,
    };

    // Aynı ana kategorideki ve aynı oteldeki son item'ı bul
    const sameCategoryItems = serviceItems.filter(
      (item) =>
        item.main_category === clickedItem.main_category &&
        (hotelId === "general"
          ? !item.hotel_id || item.hotel_id === "general"
          : item.hotel_id === hotelId),
    );
    const lastItemInCategory = sameCategoryItems[sameCategoryItems.length - 1];

    if (lastItemInCategory) {
      const lastItemIndex = serviceItems.findIndex(
        (item) => item.id === lastItemInCategory.id,
      );
      setServiceItems((prev) => {
        const newItems = [...prev];
        newItems.splice(lastItemIndex + 1, 0, newItem);
        return newItems;
      });
    } else {
      setServiceItems((prev) => [...prev, newItem]);
    }
  };

  const createProjectFromQuote = async (
    quoteId: string,
    confirmedHotels: SelectedHotel[],
  ) => {
    const q = await quotesService.getById(quoteId);
    if (!q || confirmedHotels.length === 0) return;

    const getCategoryName = (id: string) => {
      if (!id) return "";
      const cat = categories.find((c) => c.id === id);
      return cat ? cat.name || id : id;
    };

    // Proje başlığı ve detayları
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

    const allItems = await quoteItemsService.getByQuoteId(quoteId);
    const confirmedHotelIds = confirmedHotels.map((h) => h.hotel_id);
    const confirmedTabIds = confirmedHotels.map((h) => h.id);

    const relevantItems = allItems.filter(
      (item) =>
        confirmedTabIds.includes(item.hotel_id || "") ||
        confirmedHotelIds.includes(item.hotel_id || "") ||
        !item.hotel_id ||
        item.hotel_id === "general",
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
      id: h.id && isUUID(h.id) ? h.id : crypto.randomUUID(),
    }));

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
      agency_id: q.agency_id || null, // UUID bekleyen alanlar null olmalı
      hotel_id: firstH.hotel_id || null, // UUID bekleyen alanlar null olmalı
      quote_type: q.quote_type,
      room_count: firstH.room_count || q.room_count || 0,
      pax_count: firstH.pax_count || q.pax_count || 0,
      room_pax: `${firstH.room_count || 0} | ${firstH.pax_count || 0}`,
      confirmed_at:
        q.confirmed_at || q.updated_at || q.created_at || start_date,
      hotels_data: normalizedHotels as any,
    } as any);

    if (q.operation_managers && q.operation_managers.length > 0) {
      await projectUsersService.updateByProjectId(
        created.id,
        q.operation_managers,
      );
    }

    for (const item of relevantItems) {
      // Orijinal dizide indexi bul, böylece yeni atanan UUID'ye güvenle ulaş
      const originalIndex = confirmedHotels.findIndex(
        (h) => h.id === item.hotel_id || h.hotel_id === item.hotel_id,
      );
      const dbHotelId =
        originalIndex !== -1
          ? normalizedHotels[originalIndex].id
          : !item.hotel_id || item.hotel_id === "general"
            ? null
            : null;

      await projectSalesItemsService.create({
        project_id: created.id,
        category: getCategoryName(item.main_category || "") || "",
        sub_category: getCategoryName(item.sub_category || "") || "",
        description: item.description || "",
        unit_quantity: item.unit_quantity ?? 1,
        sefer: item.sefer ?? 1,
        unit_price: item.unit_price ?? 0,
        total_price: item.total ?? 0,
        currency: item.currency || "EUR",
        vat: item.vat ?? 0,
        fx: item.fx ?? 1,
        hotel_id: dbHotelId,
      });
    }

    for (const item of relevantItems) {
      const originalIndex = confirmedHotels.findIndex(
        (h) => h.id === item.hotel_id || h.hotel_id === item.hotel_id,
      );
      const dbHotelId =
        originalIndex !== -1
          ? normalizedHotels[originalIndex].id
          : !item.hotel_id || item.hotel_id === "general"
            ? null
            : null;

      await projectPurchaseItemsService.create({
        project_id: created.id,
        category: getCategoryName(item.main_category || "") || "",
        sub_category: getCategoryName(item.sub_category || "") || "",
        description: item.description || "",
        unit_quantity: item.unit_quantity ?? 1,
        sefer: item.sefer ?? 1,
        unit_price: 0,
        total_price: 0,
        currency: item.currency || "EUR",
        vat: item.vat ?? 0,
        fx: item.fx ?? 1,
        hotel_id: dbHotelId,
      });
    }

    return created;
  };

  const handleEditItem = (item: ServiceItem) => {
    const updatedItems = serviceItems.map((i) =>
      i.id === item.id ? { ...item, isEditing: true } : i,
    );
    setServiceItems(updatedItems);
  };

  const handleSaveItems = (items: ServiceItem[]) => {
    console.log("handleSaveItems çağrıldı - items:", items);
    setServiceItems(items);
  };

  const handleDeleteItem = (id: string) => {
    setServiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit çağrıldı - teklif kaydediliyor");

    if (formData.quote_type !== "KONGRE" && serviceItems.length === 0) {
      setShowAddServiceRow(true);
      return;
    }

    try {
      const totalAmount = serviceItems.reduce(
        (sum, item) => sum + (item.total || 0),
        0,
      );

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
        return;
      }

      const activeHotels = selectedHotels.filter(
        (h) => h.hotel_id && h.check_in_date && h.check_out_date,
      );
      if (activeHotels.length === 0) {
        setNotification({
          message:
            "Lütfen en az bir otel seçiniz ve C/IN, C/OUT tarihlerini doldurunuz.",
          type: "error",
        });
        return;
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validOperationManagers = formData.operation_managers.filter((id) =>
        uuidRegex.test(id),
      );
      const currency =
        serviceItems.length > 0 ? serviceItems[0].currency : (formData.budget_currency || "EUR");
      const firstHotel: any = activeHotels[0] || {};

      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      const createdQuote = await quotesService.create({
        quote_number: formData.reference,
        client_name: formData.company_name,
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
        quote_type: formData.quote_type,
        operation_managers: validOperationManagers,
        notes: formData.notes,
        total_amount: totalAmount,
        currency: currency,
        created_by: currentUser?.id || null,
        budget_currency: formData.budget_currency || 'EUR',
        forecast_revenue: Number(formData.forecast_revenue || 0),
        forecast_cost: Number(formData.forecast_cost || 0),
        management_fee_percentage: Number(formData.management_fee_percentage || 0),
        association_share_percentage: Number(formData.association_share_percentage || 0),
      } as any);

      for (const item of serviceItems) {
        const matchedHotel = selectedHotels.find(
          (sh) => sh.id === item.hotel_id,
        );
        const dbHotelId = matchedHotel ? matchedHotel.hotel_id : null;

        let saveDescription = item.description || "";
        if (
          item.hotel_id &&
          item.hotel_id !== "general" &&
          !saveDescription.includes(`[T:${item.hotel_id}]`)
        ) {
          saveDescription = `${saveDescription} [T:${item.hotel_id}]`.trim();
        }
        const isValidUUID = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        await quoteItemsService.create({
          quote_id: createdQuote.id,
          reference: createdQuote.reference,
          main_category: isValidUUID(item.main_category) ? item.main_category : null,
          sub_category: isValidUUID(item.sub_category) ? item.sub_category : null,
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
          hotel_id: isValidUUID(dbHotelId) ? dbHotelId : null,
        } as any);
      }

      if (formData.status === "KONFİRME") {
        try {
          await createProjectFromQuote(createdQuote.id, activeHotels);
          setNotification({
            message: "Teklif oluşturuldu ve projelere aktarıldı.",
            type: "success",
          });
        } catch (err) {
          console.error("Proje aktarım hatası:", err);
          setNotification({
            message:
              "Teklif oluşturuldu ancak projelere aktarılırken hata oluştu.",
            type: "error",
          });
        }
      } else {
        setNotification({
          message: "Teklif başarıyla oluşturuldu!",
          type: "success",
        });
      }
    } catch (error: any) {
      console.error("Error creating quote:", error);
      setNotification({
        message: `Teklif oluşturulurken bir hata oluştu: ${error?.message || "Bilinmeyen hata"}`,
        type: "error",
      });
    }
  };

  const getSubCategories = (mainCategoryId?: string) => {
    if (!mainCategoryId) return [];
    return categories.filter((cat) => cat.parent_id === mainCategoryId);
  };

  const getTotalsByCurrency = () => {
    const totals: { [key: string]: number } = {};
    serviceItems.forEach((item) => {
      totals[item.currency] = (totals[item.currency] || 0) + item.total;
    });
    return totals;
  };


  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Quotes ekleme yetkisi kontrolü
  if (!canCreate(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Yeni teklif oluşturmak için yetkiniz bulunmuyor.
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
      <div className="min-h-screen bg-transparent p-6 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6 transition-colors duration-200"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2 transition-colors duration-200"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 transition-colors duration-200"></div>
                </div>
              ))}
            </div>
          </div>
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
          
          {/* Right Placeholder */}
          <div className="w-[120px] flex justify-end">
            <h1 className="text-sm font-bold text-v3-text truncate">Yeni Teklif</h1>
          </div>
        </div>
      </div>
      <div className="p-4">

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teklif Bilgileri */}
          <div className={activeMainTab === 'info' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-v3-border p-6 transition-colors duration-200 mb-6">
            <h2 className="text-lg font-semibold text-v3-text mb-4 transition-colors duration-200">
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
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Teklif kodu giriniz..."
                    className="w-full text-base font-bold text-v3-text bg-transparent border-none outline-none focus:ring-0"
                  />
                </div>
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    DURUM *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold text-v3-text bg-transparent border-none outline-none focus:ring-0"
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
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Firma adını giriniz..."
                    className="w-full text-base font-bold text-v3-text bg-transparent border-none outline-none focus:ring-0"
                  />
                </div>
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors relative z-[60]">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    ACENTE *
                  </label>
                  <SearchableSelect
                    options={agencies}
                    value={formData.agency_id}
                    onChange={handleAgencySelect}
                    placeholder="Acente seç / ara..."
                  />
                </div>
                <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors relative z-[50]">
                  <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    OPERASYON SORUMLULARI
                  </label>
                  <div className="relative z-50 operation-managers-dropdown">
                    <button
                      type="button"
                      onClick={() =>
                        setShowOperationManagersDropdown(!showOperationManagersDropdown)
                      }
                      className="w-full text-left text-xs font-semibold text-v3-text bg-transparent border-none outline-none focus:ring-0 flex justify-between items-center"
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
                          const hotelName = hotels?.find((mh: any) => mh.id === h.hotel_id)?.name || "Otel Seçilmedi";
                          const ciDate = h.check_in_date ? new Date(h.check_in_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";
                          const coDate = h.check_out_date ? new Date(h.check_out_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";
                          return (
                            <div key={idx} className="flex flex-wrap lg:flex-nowrap items-center gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-v3-border">
                              <div className="flex-1 min-w-[150px]">
                                <span className="text-xs font-bold text-v3-text">{hotelName}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-medium text-v3-muted">{ciDate}</span>
                                <span className="text-v3-muted font-bold">-</span>
                                <span className="text-[11px] font-medium text-v3-muted">{coDate}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-v3-muted text-center py-4 bg-black/5 dark:bg-white/5 rounded-xl border border-dashed border-v3-border">
                          Henüz bir otel seçilmedi. (Teklif Detayları sekmesinden ekleyebilirsiniz)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      ODA | PAX
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="room_count"
                        value={formData.room_count || ""}
                        onChange={handleInputChange}
                        className="w-16 text-base font-bold text-v3-text bg-transparent border-b border-dashed border-v3-border outline-none focus:border-blue-500 p-0 text-center"
                        placeholder="0"
                      />
                      <span className="text-v3-muted font-bold">|</span>
                      <input
                        type="number"
                        name="pax_count"
                        value={formData.pax_count || ""}
                        onChange={handleInputChange}
                        className="w-16 text-base font-bold text-v3-text bg-transparent border-b border-dashed border-v3-border outline-none focus:border-blue-500 p-0 text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="bg-v3-surface rounded-xl p-4 border border-v3-border hover:bg-v3-surface transition-colors">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      TEKLİF TÜRÜ *
                    </p>
                    <select
                      name="quote_type"
                      value={formData.quote_type}
                      onChange={handleInputChange}
                      className="w-full text-base font-bold text-v3-text bg-transparent border-none outline-none focus:ring-0 p-0"
                    >
                      <option value="BİRİM">BİRİM</option>
                      <option value="PAKET">PAKET</option>
                      <option value="KONGRE">KONGRE</option>
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
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full min-h-[120px] text-xs font-semibold text-v3-text bg-transparent border-none outline-none focus:ring-0 resize-y"
                  placeholder="Teklif notlarını buraya yazın..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── DETAYLAR TAB ─── */}
        <div className={activeMainTab === 'details' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
          {formData.quote_type === "KONGRE" && (
            <div className="mb-8">
              <CongressMasterBudget formData={formData} setFormData={setFormData} />
            </div>
          )}
              {/* Çoklu Otel Seçimi Başlangıcı */}
              <div className="w-full space-y-4 bg-v3-surface p-4 rounded-xl border border-v3-border mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-v3-text dark:text-gray-200">
                    Otel & Konaklama Seçimleri
                  </h3>
                  
                </div>
                {/* Tab Bar for Hotels */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 bg-gray-50 dark:bg-v3-surface dark:backdrop-blur-md p-1.5 rounded-xl border border-gray-100 dark:border-v3-border shadow-sm">
                  {selectedHotels.map((h, index) => (
                    <div
                      key={h.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={handleDragOver}
                      onClick={() => setActiveHotelId(h.id)}
                      className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap group ${
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

                      <div className="flex items-center ml-3 space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyHotel(h);
                          }}
                          className="p-1 hover:bg-v3-surface/20 rounded transition-colors"
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
                            className="p-1 hover:bg-red-500 rounded transition-colors"
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
                    </div>
                  ))}

                  {/* General Services Tab */}
                  <div
                    onClick={() => setActiveHotelId("general")}
                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap group ${
                      activeHotelId === "general"
                        ? "bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        : "bg-black/5 dark:bg-white/5 text-v3-muted hover:text-v3-text hover:bg-black/10 dark:hover:bg-v3-surface/10"
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      GENEL HİZMETLER
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={addHotelRow}
                    className="flex items-center px-3 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                    title="Yeni Otel Ekle"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                    <span className="ml-1 text-xs font-bold uppercase">Yeni Otel</span>
                  </button>
                </div>

                {/* Tab Content for Selected Hotel */}
                {activeHotelId !== "general" &&
                  selectedHotels.map(
                    (h) =>
                      activeHotelId === h.id && (
                        <div
                          key={h.id}
                          className="p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-blue-500 ring-2 ring-blue-500/10 shadow-sm relative group space-y-4"
                        >
                          <div className="grid grid-cols-1 hotel-grid-layout gap-3 items-end">
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
                                Otel *
                              </label>
                              <SearchableSelect
                                options={hotels}
                                value={h.hotel_id}
                                onChange={(val) =>
                                  handleHotelListChange(h.id, "hotel_id", val)
                                }
                                placeholder="Otel seç..."
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
                                Otel Konsepti
                              </label>
                              <input
                                type="text"
                                value={h.hotel_concept}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "hotel_concept",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text"
                                placeholder="Konsept..."
                              />
                            </div>
                            <div className="w-full">
                              <ResponsiveDateRangeField
                                label="C/IN - C/OUT Tarihi *"
                                startValue={h.check_in_date || ""}
                                endValue={h.check_out_date || ""}
                                onStartChange={(val) => handleHotelListChange(h.id, "check_in_date", val)}
                                onEndChange={(val) => handleHotelListChange(h.id, "check_out_date", val)}
                                onApply={() => {}}
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
                                Oda Sayısı
                              </label>
                              <input
                                type="number"
                                value={h.room_count === 0 ? "" : h.room_count}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "room_count",
                                    e.target.value === "" ? 0 : (parseInt(e.target.value) || 0) as any,
                                  )
                                }
                                min="1"
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text"
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
                                Pax Sayısı
                              </label>
                              <input
                                type="number"
                                value={h.pax_count === 0 ? "" : h.pax_count}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "pax_count",
                                    e.target.value === "" ? 0 : (parseInt(e.target.value) || 0) as any,
                                  )
                                }
                                min="1"
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text"
                              />
                            </div>
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
                                Opsiyon
                              </label>
                              <select
                                value={h.option}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "option",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text"
                              >
                                <option value="1. OPSİYON">1. OPSİYON</option>
                                <option value="2. OPSİYON">2. OPSİYON</option>
                                <option value="SOR-SAT">SOR-SAT</option>
                              </select>
                            </div>
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
                                Otel Durumu
                              </label>
                              <select
                                value={h.hotel_status || "BEKLEMEDE"}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "hotel_status",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text"
                              >
                                <option value="BEKLEMEDE">BEKLEMEDE</option>
                                <option value="KONFİRME">KONFİRME</option>
                                <option value="İPTAL">İPTAL</option>
                              </select>
                            </div>
                            <div className="w-full">
                              <label className="block text-[9px] font-bold text-v3-muted mb-1 uppercase">
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
                                disabled={h.option === "SOR-SAT"}
                                className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-v3-text disabled:bg-gray-100 dark:disabled:bg-gray-800"
                              />
                            </div>
                          </div>

                          <div className="mt-6 border-t border-gray-100 dark:border-v3-border pt-6">
                            
                            <QuoteServiceEditor
                              title={
                                <h3 className="text-sm font-bold text-v3-text dark:text-gray-200 uppercase flex items-center m-0">
                                  <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 011-1h2a1 1 0 011 1v3M12 7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                  Otel Bazlı Hizmet Kalemleri
                                </h3>
                              }
                              items={serviceItems.filter(
                                (item) => item.hotel_id === h.id,
                              )}
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

                {/* Tab Content for General Services */}
                {activeHotelId === "general" && (
                  <div className="p-4 bg-white dark:bg-gray-800/80 rounded-lg border border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm relative group space-y-4">
                    
                    <QuoteServiceEditor
                              title={
                                <h3 className="text-sm font-bold text-v3-text dark:text-gray-200 uppercase flex items-center m-0">
                                  <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                  Genel Hizmet Kalemleri (Uçak, Transfer vb.)
                                </h3>
                              }
                      items={serviceItems.filter(
                        (item) => !item.hotel_id || item.hotel_id === "general",
                      )}
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

        {/* Submit Button */}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/quotes"
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-v3-muted text-v3-muted bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-v3-text dark:hover:text-v3-text transition-all duration-200 shadow-sm"
            >
              İPTAL
            </Link>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold text-v3-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              TEKLİFİ KAYDET
            </button>
          </div>
        </form>

        {/* Notification Modal */}
        <AnimatePresence>
          {notification && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl border border-gray-200 dark:border-gray-800"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    notification.type === "success"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {notification.type === "success" ? (
                    <svg
                      className="w-10 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-10 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-black text-v3-text mb-2">
                  {notification.type === "success" ? "Başarılı!" : "Hata!"}
                </h3>
                <p className="text-sm font-bold text-v3-muted mb-8 leading-relaxed">
                  {notification.message}
                </p>
                <button
                  onClick={() => {
                    const isSuccess = notification.type === "success";
                    setNotification(null);
                    if (isSuccess) router.push("/quotes");
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl ${
                    notification.type === "success"
                      ? "bg-gray-900 dark:bg-white text-v3-text text-v3-text shadow-gray-900/20 dark:shadow-white/10"
                      : "bg-red-600 text-white shadow-red-500/20"
                  }`}
                >
                  {notification.type === "success" ? "TAMAM" : "KAPAT"}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
