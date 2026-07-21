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

export default function QuotePreviewPage() {
  const { isDark } = useTheme();
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      loadQuote(params.id as string);
      loadCategories();
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

  useEffect(() => {
    loadAgencies();
    loadHotels();
  }, []);

  const getAgencyName = (agencyId: string) => {
    return (
      agencies.find((agency) => agency.id === agencyId)?.name || "Bilinmiyor"
    );
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find((hotel) => hotel.id === hotelId)?.name || "Bilinmiyor";
  };

  const getHotelConcept = (hotelId: string) => {
    return (
      hotels.find((hotel) => hotel.id === hotelId)?.concept || "Bilinmiyor"
    );
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
                Teklif Önizleme
              </h1>
              <p className="text-v3-muted mt-2 transition-colors duration-200">
                Referans: {quote.reference} |{" "}
                {new Date(quote.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/quotes/${quote.id}/edit`}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200"
              >
                Düzenle
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

        {/* Quote Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-6 mb-6 transition-colors duration-200">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-v3-text mb-6 transition-colors duration-200">
              Teklif Bilgileri
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Referans
                </label>
                <p className="text-lg font-semibold text-v3-text transition-colors duration-200">
                  {quote.reference}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Durum
                </label>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    quote.status === "KONFİRME"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : quote.status === "BEKLEMEDE"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  } transition-colors duration-200`}
                >
                  {quote.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Acente
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {getAgencyName(quote.agency_id)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Firma
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {quote.company_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Otel
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {getHotelName(quote.hotel_id)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Otel Konsepti
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {getHotelConcept(quote.hotel_id)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Giriş Tarihi
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {new Date(quote.check_in_date).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Çıkış Tarihi
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {new Date(quote.check_out_date).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Oda Sayısı
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {quote.room_count || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Pax Sayısı
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {quote.pax_count || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Teklif Türü
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {quote.quote_type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Opsiyon
                </label>
                <p className="text-lg text-v3-text transition-colors duration-200">
                  {quote.option}
                </p>
              </div>
            </div>

            {quote.notes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-v3-text mb-2 transition-colors duration-200">
                  Notlar
                </label>
                <p className="text-v3-text transition-colors duration-200">
                  {quote.notes}
                </p>
              </div>
            )}
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
                          {item.description || item.detail_description || "-"}
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
      </div>
    </div>
  );
}
