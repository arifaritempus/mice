"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { storage } from "@/utils/safeStorage";

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

interface Quote {
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
  status: string;
  notes?: string;
  note?: string; // For backward compatibility
  room_pax?: string; // For backward compatibility
  items: QuoteItem[];
  total_amount: number;
  created_at: string;
  updated_at?: string;
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
  sub_categories: string[];
}

export default function QuoteEditPage() {
  const { isDark } = useTheme();
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    reference: "",
    agency_id: "",
    company_name: "",
    check_in_date: "",
    check_out_date: "",
    hotel_id: "",
    quote_type: "BİRİM",
    room_count: 0,
    pax_count: 0,
    option: "SOR - SAT",
    status: "TEKLİF",
    notes: "",
    file_manager: "", // Added for file manager
  });

  // New item for adding
  const [newItem, setNewItem] = useState({
    main_category: "",
    sub_category: "",
    service_name: "",
    unit_price: 0,
    currency: "EUR",
    quantity: 1,
    repeat_frequency: 1,
    total_price: 0,
  });

  useEffect(() => {
    if (params.id) {
      loadQuote(params.id as string);
    }
  }, [params.id]);

  const loadQuote = async (quoteId: string) => {
    try {
      // Load from localStorage for now
      const storedQuotes = storage.getItem("quotes");
      if (storedQuotes) {
        const quotes = JSON.parse(storedQuotes);
        const foundQuote = quotes.find((q: Quote) => q.id === quoteId);

        if (foundQuote) {
          setQuote(foundQuote);
          setFormData({
            reference: foundQuote.reference || "",
            agency_id: foundQuote.agency_id || "",
            company_name: foundQuote.company_name || "",
            check_in_date: foundQuote.check_in_date || "",
            check_out_date: foundQuote.check_out_date || "",
            hotel_id: foundQuote.hotel_id || "",
            quote_type: foundQuote.quote_type || "BİRİM",
            room_count: foundQuote.room_count || 0,
            pax_count: foundQuote.pax_count || 0,
            option: foundQuote.option || "SOR - SAT",
            status: foundQuote.status || "TEKLİF",
            notes: foundQuote.notes || foundQuote.note || "",
            file_manager: foundQuote.file_manager || "", // Load file manager
          });
        } else {
          setError("Teklif bulunamadı");
        }
      } else {
        setError("Teklif bulunamadı");
      }
    } catch (error) {
      console.error("Error loading quote:", error);
      setError("Teklif yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = () => {
    try {
      const storedAgencies = storage.getItem("agencies");
      if (storedAgencies) {
        setAgencies(JSON.parse(storedAgencies));
      }
    } catch (error) {
      console.error("Error loading agencies:", error);
    }
  };

  const loadHotels = () => {
    try {
      const storedHotels = storage.getItem("hotels");
      if (storedHotels) {
        setHotels(JSON.parse(storedHotels));
      }
    } catch (error) {
      console.error("Error loading hotels:", error);
    }
  };

  const loadUsers = () => {
    try {
      const savedUsers = storage.getItem("users");
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        console.log("Users loaded from users page:", parsedUsers);
        setUsers(parsedUsers);
      } else {
        console.log("No users found, using default users");
        const defaultUsers = [
          {
            id: "1",
            first_name: "Arif",
            last_name: "Ari",
            email: "arif.ari@firma.com",
          },
          {
            id: "2",
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@firma.com",
          },
        ];
        setUsers(defaultUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadCategories = () => {
    try {
      const savedCategories = storage.getItem("categories");
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        console.log("Raw categories from categories page:", parsedCategories);

        // Ana kategorileri ve alt kategorilerini grupla
        const mainCategories = parsedCategories.filter(
          (cat: any) => cat.type === "main",
        );
        const subCategories = parsedCategories.filter(
          (cat: any) => cat.type === "sub",
        );

        console.log("Main categories found:", mainCategories.length);
        console.log("Sub categories found:", subCategories.length);

        const categoriesWithSubs = mainCategories.map((mainCat: any) => {
          const relatedSubs = subCategories.filter(
            (subCat: any) => subCat.parent_id === mainCat.id,
          );
          console.log(
            `Main category "${mainCat.name}" has ${relatedSubs.length} sub categories:`,
            relatedSubs,
          );

          return {
            id: mainCat.id,
            name: mainCat.name,
            sub_categories: relatedSubs.map((subCat: any) => subCat.name),
          };
        });

        console.log("Final categories with subs:", categoriesWithSubs);
        setCategories(categoriesWithSubs);
      } else {
        console.log("No categories found, using default categories");
        const defaultCategories = [
          {
            id: "1",
            name: "OTEL | KONAKLAMA",
            sub_categories: [
              "DOUBLE ODA KİŞİ BAŞI",
              "SINGLE ODA",
              "TRIPLE ODA",
            ],
          },
          {
            id: "2",
            name: "TOPLANTI SALONU",
            sub_categories: [
              "TOPLANTI SALONU KULLANIMI",
              "KAHVE MOLASI",
              "ÖĞLE YEMEĞİ",
            ],
          },
        ];
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  useEffect(() => {
    loadAgencies();
    loadHotels();
    loadCategories();
    loadUsers();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addItem = () => {
    if (
      !newItem.main_category ||
      !newItem.sub_category ||
      !newItem.service_name ||
      newItem.unit_price <= 0
    ) {
      alert("Lütfen gerekli alanları doldurun");
      return;
    }

    if (!quote) return;

    const item: QuoteItem = {
      id: Date.now().toString(),
      quote_id: quote.id,
      main_category: newItem.main_category,
      sub_category: newItem.sub_category,
      unit_quantity: newItem.quantity,
      repeat_frequency: newItem.repeat_frequency,
      unit_price: newItem.unit_price,
      currency: newItem.currency,
      total_price: newItem.total_price,
      description: newItem.service_name,
      total: newItem.total_price,
      sefer: newItem.repeat_frequency,
      created_at: new Date().toISOString(),
    };

    const updatedQuote = {
      ...quote,
      items: [...quote.items, item],
      total_amount: quote.total_amount + newItem.total_price,
    };

    setQuote(updatedQuote);
    setNewItem({
      main_category: "",
      sub_category: "",
      service_name: "",
      unit_price: 0,
      currency: "EUR",
      quantity: 1,
      repeat_frequency: 1,
      total_price: 0,
    });
  };

  const removeItem = (itemId: string) => {
    if (!quote) return;

    const itemToRemove = quote.items.find((item) => item.id === itemId);
    if (!itemToRemove) return;

    const updatedQuote = {
      ...quote,
      items: quote.items.filter((item) => item.id !== itemId),
      total_amount: quote.total_amount - (itemToRemove.total_price || 0),
    };

    setQuote(updatedQuote);
  };

  const editItem = (itemId: string) => {
    if (!quote) return;

    const itemToEdit = quote.items.find((item) => item.id === itemId);
    if (!itemToEdit) return;

    // Set newItem state with the item to edit
    setNewItem({
      main_category: itemToEdit.main_category || "",
      sub_category: itemToEdit.sub_category || "",
      service_name: itemToEdit.description || "",
      unit_price: itemToEdit.unit_price || 0,
      currency: itemToEdit.currency || "EUR",
      quantity: itemToEdit.unit_quantity || 1,
      repeat_frequency: itemToEdit.repeat_frequency || 1,
      total_price: itemToEdit.total_price || 0,
    });

    // Remove the item from the quote
    removeItem(itemId);
  };

  // Eski ID formatını yeni ID formatına çevir
  const convertOldIdToNew = (oldId: string) => {
    if (!oldId) return oldId;

    // Eğer zaten yeni format ise (CAT_ ile başlıyorsa) direkt döndür
    if (oldId.startsWith("CAT_")) {
      return oldId;
    }

    // Eski formatı yeni formata çevir
    if (oldId === "1") return "CAT_001";
    if (oldId === "2") return "CAT_002";
    if (oldId === "3") return "CAT_003";
    if (oldId === "4") return "CAT_004";
    if (oldId === "5") return "CAT_005";

    // Alt kategoriler için
    if (oldId === "1-1") return "CAT_006";
    if (oldId === "1-2") return "CAT_007";
    if (oldId === "2-1") return "CAT_008";
    if (oldId === "2-2") return "CAT_009";
    if (oldId === "3-1") return "CAT_010";
    if (oldId === "3-2") return "CAT_011";

    return oldId;
  };

  // Kategori adını ID'den bul
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "";

    // Eski ID formatını yeni formata çevir
    const newId = convertOldIdToNew(categoryId);

    // Kategoriler listesinde ara
    const category = categories.find((cat) => cat.id === newId);
    if (category) {
      return category.name;
    }

    // Alt kategorilerde de ara
    const subCategory = categories.find((cat) =>
      cat.sub_categories?.includes(newId),
    );
    if (subCategory) {
      return newId; // Alt kategori ismini döndür
    }

    return categoryId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!quote) {
        setError("Teklif bulunamadı");
        return;
      }

      const updatedQuote = {
        ...quote,
        ...formData,
        items: quote.items,
        total_amount: quote.total_amount,
        updated_at: new Date().toISOString(),
      };

      // Update in localStorage
      const storedQuotes = storage.getItem("quotes");
      if (storedQuotes) {
        const quotes = JSON.parse(storedQuotes);
        const updatedQuotes = quotes.map((q: Quote) =>
          q.id === quote.id ? updatedQuote : q,
        );
        storage.setItem("quotes", JSON.stringify(updatedQuotes));
      }

      setSuccess("Teklif başarıyla güncellendi!");
      setTimeout(() => {
        router.push("/quotes");
      }, 1500);
    } catch (error) {
      console.error("Error updating quote:", error);
      setError("Teklif güncellenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent transition-colors duration-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-transparent transition-colors duration-200">
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error || "Teklif bulunamadı"}
          </div>
          <Link
            href="/quotes"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-600 dark:text-blue-300 font-medium"
          >
            ← Tekliflere Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-v3-text transition-colors duration-200">
                Teklif Düzenle
              </h1>
              <p className="text-v3-muted mt-2 transition-colors duration-200">
                Referans: {quote.reference} |{" "}
                {new Date(quote.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/quotes/${quote.id}`}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
              >
                Önizle
              </Link>
              <Link
                href="/quotes"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-v3-text rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Tekliflere Dön
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Header Information - ${typeof document !== "undefined" ? document.title.split("-")[0].trim() : "MICE"} Style */}
            <div className="border-b border-gray-200 dark:border-v3-border pb-6 transition-colors duration-200">
              <h3 className="text-lg font-medium text-v3-text mb-4 transition-colors duration-200">
                Teklif Bilgileri
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {/* 1. Referans - Tek Bölüm Tam Genişlik */}
                <div>
                  <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                    REFERANS *
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Referans numarası girin"
                  />
                </div>

                {/* 2. Acente + Firma - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      ACENTE *
                    </label>
                    <select
                      name="agency_id"
                      value={formData.agency_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="">Acente seçin</option>
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      FİRMA *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      placeholder="Firma adını girin"
                    />
                  </div>
                </div>

                {/* 3. C-IN + C-OUT - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      C/IN TARİHİ *
                    </label>
                    <input
                      type="date"
                      name="check_in_date"
                      value={formData.check_in_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      C/OUT TARİHİ *
                    </label>
                    <input
                      type="date"
                      name="check_out_date"
                      value={formData.check_out_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    />
                  </div>
                </div>

                {/* 5. Otel + Otel Konsepti - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      OTEL *
                    </label>
                    <select
                      name="hotel_id"
                      value={formData.hotel_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="">Otel seçin</option>
                      {hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      OTEL KONSEPTİ
                    </label>
                    <input
                      type="text"
                      value={
                        hotels.find((h) => h.id === formData.hotel_id)
                          ?.concept || ""
                      }
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-v3-muted transition-colors duration-200"
                      placeholder="Otel seçildiğinde otomatik doldurulur"
                    />
                  </div>
                </div>

                {/* 6. Oda + Pax Sayısı - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      ODA SAYISI
                    </label>
                    <input
                      type="number"
                      name="room_count"
                      value={formData.room_count}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                      placeholder="200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      PAX SAYISI
                    </label>
                    <input
                      type="number"
                      name="pax_count"
                      value={formData.pax_count}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                      placeholder="350"
                    />
                  </div>
                </div>

                {/* 7. Teklif Türü + Opsiyon - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      TEKLİF TÜRÜ
                    </label>
                    <select
                      name="quote_type"
                      value={formData.quote_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="BİRİM">BİRİM</option>
                      <option value="PAKET">PAKET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      OPSİYON
                    </label>
                    <select
                      name="option"
                      value={formData.option}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="SOR - SAT">SOR - SAT</option>
                      <option value="1. OPSİYON">1. OPSİYON</option>
                      <option value="2. OPSİYON">2. OPSİYON</option>
                    </select>
                  </div>
                </div>

                {/* 8. Durum + Dosya Sorumlusu - 2 Bölüm Yan Yana */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      DURUM
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="TEKLİF">TEKLİF</option>
                      <option value="KONFİRME">KONFİRME</option>
                      <option value="İPTAL">İPTAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      DOSYA SORUMLUSU
                    </label>
                    <select
                      name="file_manager"
                      value={formData.file_manager || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="">Kullanıcı seçin</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 9. Not - Tek Bölüm Tam Genişlik */}
                <div>
                  <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                    NOT
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Teklif notları..."
                  />
                </div>
              </div>
            </div>

            {/* Success and Error Messages */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6 transition-colors duration-200">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 transition-colors duration-200">
                {error}
              </div>
            )}

            {/* Add New Item */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-6 mb-6 transition-colors duration-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-v3-text mb-6 transition-colors duration-200">
                  Yeni Hizmet Ekle
                </h2>

                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Ana Kategori
                    </label>
                    <select
                      value={newItem.main_category}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          main_category: e.target.value,
                          sub_category: "",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="">Seçin</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Alt Kategori
                    </label>
                    <select
                      value={newItem.sub_category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, sub_category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="">Seçin</option>
                      {categories
                        .find((c) => c.id === newItem.main_category)
                        ?.sub_categories?.map((subCat) => (
                          <option key={subCat} value={subCat}>
                            {subCat}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Adet
                    </label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        setNewItem({
                          ...newItem,
                          quantity: qty,
                          total_price:
                            newItem.unit_price * qty * newItem.repeat_frequency,
                        });
                      }}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Tekrar
                    </label>
                    <input
                      type="number"
                      value={newItem.repeat_frequency}
                      onChange={(e) => {
                        const repeat = parseInt(e.target.value) || 1;
                        setNewItem({
                          ...newItem,
                          repeat_frequency: repeat,
                          total_price:
                            newItem.unit_price * newItem.quantity * repeat,
                        });
                      }}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Birim Fiyat
                    </label>
                    <input
                      type="number"
                      value={newItem.unit_price}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        setNewItem({
                          ...newItem,
                          unit_price: price,
                          total_price:
                            price * newItem.quantity * newItem.repeat_frequency,
                        });
                      }}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Döviz
                    </label>
                    <select
                      value={newItem.currency}
                      onChange={(e) =>
                        setNewItem({ ...newItem, currency: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text transition-colors duration-200"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="TRY">TRY</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={newItem.service_name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, service_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-v3-text placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                      placeholder="Hizmet açıklaması girin"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={
                      !newItem.main_category ||
                      !newItem.sub_category ||
                      !newItem.service_name ||
                      newItem.unit_price <= 0
                    }
                    className="px-4 py-2 bg-blue-500 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hizmet Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* Quote Items */}
            {quote.items && quote.items.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-6 mb-6 transition-colors duration-200">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-v3-text mb-6 transition-colors duration-200">
                    Teklif Kalemleri
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Kategori
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Alt Kategori
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Açıklama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Adet
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Tekrar
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Birim Fiyat
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Döviz
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            Toplam
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-v3-muted uppercase tracking-wider transition-colors duration-200">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {quote.items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {getCategoryName(
                                item.main_category || item.category_id || "",
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {getCategoryName(
                                item.sub_category || item.sub_category_id || "",
                              ) || "Bilinmiyor"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {item.description ||
                                item.detail_description ||
                                "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {item.unit_quantity || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {item.repeat_frequency || item.sefer || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {item.unit_price?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-v3-text transition-colors duration-200">
                              {item.currency || "EUR"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-v3-text transition-colors duration-200">
                              {item.currency || "EUR"}{" "}
                              {item.total_price?.toFixed(2) ||
                                item.total?.toFixed(2) ||
                                "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => editItem(item.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-600 dark:text-blue-300 transition-colors duration-200"
                                  title="Düzenle"
                                >
                                  <svg
                                    className="w-5 h-5"
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
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
                                  title="Sil"
                                >
                                  <svg
                                    className="w-5 h-5"
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="mt-6 text-right">
                    <div className="text-2xl font-bold text-v3-text transition-colors duration-200">
                      TOPLAM: {quote.total_amount?.toFixed(2) || "0.00"} EUR
                    </div>
                    <div className="text-sm text-v3-muted transition-colors duration-200">
                      KDV DAHİL
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Güncelleniyor..." : "Teklifi Güncelle"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
