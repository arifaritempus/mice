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
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {type === "success"
              ? "Başarılı"
              : type === "error"
                ? "Hata"
                : "Bilgi"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 shadow-lg ${
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

  const handleHotelListChange = (
    id: string,
    field: keyof SelectedHotel,
    value: string | number,
  ) => {
    setSelectedHotels((prev) =>
      prev.map((h) => {
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
          return { ...h, [field]: value as any };
        }
        return h;
      }),
    );
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

    if (serviceItems.length === 0) {
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
        setNotification({
          message:
            "Lütfen zorunlu alanları doldurunuz (Reference, Acente, Firma).",
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
        serviceItems.length > 0 ? serviceItems[0].currency : "EUR";
      const firstHotel = activeHotels[0];

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
      } as any);

      for (const item of serviceItems) {
        const matchedHotel = selectedHotels.find(
          (sh) => sh.id === item.hotel_id,
        );
        const dbHotelId = matchedHotel ? matchedHotel.hotel_id : null;

        await quoteItemsService.create({
          quote_id: createdQuote.id,
          reference: createdQuote.reference,
          main_category: item.main_category || "",
          sub_category: item.sub_category || "",
          unit_quantity: Number(item.unit_quantity || 0),
          sefer: Number(item.sefer || 0),
          unit_price: Number(item.unit_price || 0),
          currency: item.currency || "EUR",
          total: Number(item.total || 0),
          total_price: Number(item.total || 0),
          total_try: Number(item.total_try || 0),
          description: item.description || "",
          vat: Number(item.vat || 0),
          fx: Number(item.fx || 1),
          hotel_id: dbHotelId,
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
          className="w-full px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {open && (
          <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
            <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
              {filtered.length} sonuç
            </div>
            {filtered.map((opt, idx) => (
              <button
                type="button"
                key={opt.id}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${idx === highlight ? "bg-blue-500/10 dark:bg-gray-700" : ""} text-gray-900 dark:text-white`}
              >
                {opt.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Sonuç yok
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Quotes ekleme yetkisi kontrolü
  if (!canCreate(Module.QUOTES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
    <div className="min-h-screen bg-transparent transition-colors duration-200 compact">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              Yeni Teklif Oluştur
            </h1>
          </div>
          <Link
            href="/quotes"
            className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Geri Dön
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teklif Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
              Teklif Bilgileri
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reference & Custom Codes */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    KOD *
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    required
                    placeholder="Teklif kodu giriniz..."
                    className="w-full px-4 h-10 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Agency */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  ACENTE *
                </label>
                <SearchableSelect
                  options={agencies}
                  value={formData.agency_id}
                  onChange={handleAgencySelect}
                  placeholder="Acente seç / ara..."
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  FİRMA ADI *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                />
              </div>

              {/* Global status and type remain */}

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  DURUM *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                >
                  <option value="TEKLİF">TEKLİF</option>
                  <option value="KONFİRME">KONFİRME</option>
                  <option value="İPTAL">İPTAL</option>
                </select>
              </div>

              {/* Teklif Türü */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  TEKLİF TÜRÜ *
                </label>
                <select
                  name="quote_type"
                  value={formData.quote_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                >
                  <option value="BİRİM">BİRİM</option>
                  <option value="PAKET">PAKET</option>
                </select>
              </div>

              {/* Operasyon Sorumluları */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  OPERASYON SORUMLULARI
                </label>
                <div className="relative operation-managers-dropdown">
                  <button
                    type="button"
                    onClick={() =>
                      setShowOperationManagersDropdown(
                        !showOperationManagersDropdown,
                      )
                    }
                    className="w-full px-3 h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex justify-between items-center transition-colors duration-200"
                  >
                    <span>
                      {formData.operation_managers.length > 0
                        ? `${formData.operation_managers.length} kullanıcı seçildi`
                        : "Kullanıcı seçin..."}
                    </span>
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showOperationManagersDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.operation_managers.includes(
                              user.id,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  operation_managers: [
                                    ...prev.operation_managers,
                                    user.id,
                                  ],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  operation_managers:
                                    prev.operation_managers.filter(
                                      (id) => id !== user.id,
                                    ),
                                }));
                              }
                            }}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name} ({user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seçilen kullanıcıları göster */}
                {formData.operation_managers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.operation_managers.map((managerId) => {
                      const user = users.find((u) => u.id === managerId);
                      return (
                        <span
                          key={managerId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:text-gray-200 dark:bg-blue-900/30 dark:text-blue-200"
                        >
                          {user
                            ? `${user.first_name} ${user.last_name}`
                            : managerId}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                operation_managers:
                                  prev.operation_managers.filter(
                                    (id) => id !== managerId,
                                  ),
                              }));
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                  NOTLAR
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 h-24 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                  placeholder="Teklif notlarını buraya yazın..."
                />
              </div>

              {/* Çoklu Otel Seçimi Başlangıcı */}
              <div className="md:col-span-2 space-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Otel & Konaklama Seçimleri
                  </h3>
                  <button
                    type="button"
                    onClick={addHotelRow}
                    className="text-xs font-medium bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded transition-colors"
                  >
                    + OTEL EKLE
                  </button>
                </div>
                {/* Tab Bar for Hotels */}
                <div className="flex bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 space-x-2 overflow-x-auto">
                  {selectedHotels.map((h, index) => (
                    <div
                      key={h.id}
                      onClick={() => setActiveHotelId(h.id)}
                      className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap group ${
                        activeHotelId === h.id
                          ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="text-xs font-semibold mr-2">
                        {index + 1}. OTEL
                      </span>
                      <span className="text-[10px] opacity-80 max-w-[100px] truncate">
                        {hotels.find((x) => x.id === h.hotel_id)?.name ||
                          "Otel Seçin"}
                      </span>

                      <div className="flex items-center ml-3 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyHotel(h);
                          }}
                          className="p-1 hover:bg-white/20 rounded transition-colors"
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
                    className={`flex items-center px-4 py-2 rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap group ${
                      activeHotelId === "general"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
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
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
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
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Konsept..."
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                                C/IN Tarihi *
                              </label>
                              <input
                                type="date"
                                value={h.check_in_date}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "check_in_date",
                                    e.target.value,
                                  )
                                }
                                required
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                                C/OUT Tarihi *
                              </label>
                              <input
                                type="date"
                                value={h.check_out_date}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "check_out_date",
                                    e.target.value,
                                  )
                                }
                                required
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-t border-gray-50 dark:border-gray-700/50 pt-3">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                                Oda Sayısı
                              </label>
                              <input
                                type="number"
                                value={h.room_count}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "room_count",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                min="1"
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
                                Pax Sayısı
                              </label>
                              <input
                                type="number"
                                value={h.pax_count}
                                onChange={(e) =>
                                  handleHotelListChange(
                                    h.id,
                                    "pax_count",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                min="1"
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
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
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="1. OPSİYON">1. OPSİYON</option>
                                <option value="2. OPSİYON">2. OPSİYON</option>
                                <option value="SOR-SAT">SOR-SAT</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
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
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="BEKLEMEDE">BEKLEMEDE</option>
                                <option value="KONFİRME">KONFİRME</option>
                                <option value="İPTAL">İPTAL</option>
                              </select>
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase">
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
                                className="w-full px-2 py-1 h-10 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                              />
                            </div>
                          </div>

                          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase flex items-center">
                              <svg
                                className="w-4 h-4 mr-2 text-blue-400"
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
                            <QuoteServiceEditor
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
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase flex items-center">
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
          </div>

          {/* Submit Button */}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 p-4">
            <Link
              href="/quotes"
              className="bg-gray-500 dark:bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              İptal
            </Link>
            <button
              type="submit"
              className="bg-green-600 dark:bg-green-700 text-white px-2 py-1 rounded text-xs hover:bg-green-700 dark:hover:bg-green-800 transition-colors duration-200"
            >
              Teklifi Kaydet
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
                      className="w-10 h-10"
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
                      className="w-10 h-10"
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
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                  {notification.type === "success" ? "Başarılı!" : "Hata!"}
                </h3>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
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
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-gray-900/20 dark:shadow-white/10"
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
