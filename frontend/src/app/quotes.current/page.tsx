"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatNumber } from "@/utils/formatters";
import {
  quotesService,
  quoteItemsService,
  agenciesService,
  hotelsService,
} from "@/lib/supabaseService";
import { useTheme } from "@/components/providers/ThemeProvider";
import { storage } from "@/utils/safeStorage";

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
  vat?: number;
  fx?: number;
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
  hotels_data?: any[];
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

export default function QuotesPage() {
  const { isDark } = useTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    loadQuotes();
    loadAgencies();
    loadHotels();
  }, []);

  const loadQuotes = async () => {
    try {
      // Load from Supabase
      const supabaseQuotes = await quotesService.getAll();

      // If Supabase is empty, migrate from localStorage
      if (supabaseQuotes.length === 0) {
        await migrateFromLocalStorage();
        // Reload from Supabase after migration
        const migratedQuotes = await quotesService.getAll();
        if (migratedQuotes.length > 0) {
          const quotesWithItems = await Promise.all(
            migratedQuotes.map(async (quote) => {
              const items = await quoteItemsService.getByQuoteId(quote.id);

              // Map items to include backward compatibility fields
              const mappedItems = items.map((item) => ({
                ...item,
                category_id: item.main_category || "",
                sub_category_id: item.sub_category || "",
                repeat_frequency: item.sefer || 0,
                total_price: item.total || 0,
                detail_description: item.description || "",
              }));

              return {
                ...quote,
                items: mappedItems,
                // Add backward compatibility fields
                note: quote.notes || "",
                room_pax: `${quote.room_count || 0} ODA - ${quote.pax_count || 0} PAX`,
              };
            }),
          );

          setQuotes(quotesWithItems);
          storage.setItem("quotes", JSON.stringify(quotesWithItems));
          return;
        }
      }

      // Load quote items for each quote
      const quotesWithItems = await Promise.all(
        supabaseQuotes.map(async (quote) => {
          const items = await quoteItemsService.getByQuoteId(quote.id);

          // Map items to include backward compatibility fields
          const mappedItems = items.map((item) => ({
            ...item,
            category_id: item.main_category || "",
            sub_category_id: item.sub_category || "",
            repeat_frequency: item.sefer || 0,
            total_price: item.total || 0,
            detail_description: item.description || "",
          }));

          return {
            ...quote,
            items: mappedItems,
            // Add backward compatibility fields
            note: quote.notes || "",
            room_pax: `${quote.room_count || 0} ODA - ${quote.pax_count || 0} PAX`,
          };
        }),
      );

      setQuotes(quotesWithItems);

      // Also save to localStorage for backward compatibility
      storage.setItem("quotes", JSON.stringify(quotesWithItems));
    } catch (error) {
      console.error("Error loading quotes from Supabase:", error);

      // Fallback to localStorage
      const savedQuotes = storage.getItem("quotes");
      if (savedQuotes) {
        setQuotes(JSON.parse(savedQuotes));
      }
    } finally {
      setLoading(false);
    }
  };

  // Migrate data from localStorage to Supabase
  const migrateFromLocalStorage = async () => {
    try {
      console.log("Migrating data from localStorage to Supabase...");

      const savedQuotes = storage.getItem("quotes");
      if (!savedQuotes) {
        console.log("No quotes found in localStorage");
        return;
      }

      const quotes = JSON.parse(savedQuotes);
      console.log(`Found ${quotes.length} quotes to migrate`);

      for (const quote of quotes) {
        try {
          // Create quote in Supabase
          const quoteData = {
            reference: quote.reference,
            agency_id: quote.agency_id,
            company_name: quote.company_name,
            check_in_date: quote.check_in_date,
            check_out_date: quote.check_out_date,
            hotel_id: quote.hotel_id,
            hotel_concept: quote.hotel_concept || "",
            room_count: quote.room_count || 1,
            pax_count: quote.pax_count || 1,
            option: quote.option,
            status: quote.status,
            quote_type: quote.quote_type,
            notes: quote.notes || quote.note || "",
            total_amount: quote.total_amount,
          };

          const newQuote = await quotesService.create(quoteData);

          // Create quote items in Supabase
          if (quote.items && quote.items.length > 0) {
            for (const item of quote.items) {
              await quoteItemsService.create({
                quote_id: newQuote.id,
                main_category: item.main_category || item.category_id,
                sub_category: item.sub_category || item.sub_category_id,
                unit_quantity: item.unit_quantity,
                sefer: item.sefer || item.repeat_frequency || 1,
                unit_price: item.unit_price,
                currency: item.currency,
                total: item.total || item.total_price,
                vat: item.vat || 0,
                fx: item.fx || 1,
                description: item.description || item.detail_description || "",
              });
            }
          }

          console.log(`Migrated quote: ${quote.reference}`);
        } catch (error) {
          console.error(`Error migrating quote ${quote.reference}:`, error);
        }
      }

      console.log("Migration completed successfully!");
    } catch (error) {
      console.error("Error during migration:", error);
    }
  };

  const loadAgencies = async () => {
    try {
      const supabaseAgencies = await agenciesService.getAll();

      // If Supabase is empty, migrate from localStorage
      if (supabaseAgencies.length === 0) {
        await migrateAgenciesFromLocalStorage();
        const migratedAgencies = await agenciesService.getAll();
        setAgencies(migratedAgencies);
        storage.setItem("agencies", JSON.stringify(migratedAgencies));
        return;
      }

      setAgencies(supabaseAgencies);

      // Also save to localStorage for backward compatibility
      storage.setItem("agencies", JSON.stringify(supabaseAgencies));
    } catch (error) {
      console.error("Error loading agencies from Supabase:", error);

      // Fallback to localStorage
      const savedAgencies = storage.getItem("agencies");
      if (savedAgencies) {
        setAgencies(JSON.parse(savedAgencies));
      }
    }
  };

  const loadHotels = async () => {
    try {
      const supabaseHotels = await hotelsService.getAll();

      // If Supabase is empty, migrate from localStorage
      if (supabaseHotels.length === 0) {
        await migrateHotelsFromLocalStorage();
        const migratedHotels = await hotelsService.getAll();
        setHotels(migratedHotels);
        storage.setItem("hotels", JSON.stringify(migratedHotels));
        return;
      }

      setHotels(supabaseHotels);

      // Also save to localStorage for backward compatibility
      storage.setItem("hotels", JSON.stringify(supabaseHotels));
    } catch (error) {
      console.error("Error loading hotels from Supabase:", error);

      // Fallback to localStorage
      const savedHotels = storage.getItem("hotels");
      if (savedHotels) {
        setHotels(JSON.parse(savedHotels));
      }
    }
  };

  // Migrate agencies from localStorage to Supabase
  const migrateAgenciesFromLocalStorage = async () => {
    try {
      console.log("Migrating agencies from localStorage to Supabase...");

      const savedAgencies = storage.getItem("agencies");
      if (!savedAgencies) {
        console.log("No agencies found in localStorage");
        return;
      }

      const agencies = JSON.parse(savedAgencies);
      console.log(`Found ${agencies.length} agencies to migrate`);

      for (const agency of agencies) {
        try {
          await agenciesService.create({
            name: agency.name,
            company_name: agency.company_name,
          });
          console.log(`Migrated agency: ${agency.name}`);
        } catch (error) {
          console.error(`Error migrating agency ${agency.name}:`, error);
        }
      }

      console.log("Agencies migration completed successfully!");
    } catch (error) {
      console.error("Error during agencies migration:", error);
    }
  };

  // Migrate hotels from localStorage to Supabase
  const migrateHotelsFromLocalStorage = async () => {
    try {
      console.log("Migrating hotels from localStorage to Supabase...");

      const savedHotels = storage.getItem("hotels");
      if (!savedHotels) {
        console.log("No hotels found in localStorage");
        return;
      }

      const hotels = JSON.parse(savedHotels);
      console.log(`Found ${hotels.length} hotels to migrate`);

      for (const hotel of hotels) {
        try {
          await hotelsService.create({
            name: hotel.name,
            concept: hotel.concept || "",
          });
          console.log(`Migrated hotel: ${hotel.name}`);
        } catch (error) {
          console.error(`Error migrating hotel ${hotel.name}:`, error);
        }
      }

      console.log("Hotels migration completed successfully!");
    } catch (error) {
      console.error("Error during hotels migration:", error);
    }
  };

  // Global fonksiyon olarak ekle
  useEffect(() => {
    (window as any).addNewQuote = addNewQuote;
    return () => {
      delete (window as any).addNewQuote;
    };
  }, []);

  const addNewQuote = (newQuote: Quote) => {
    const updatedQuotes = [...quotes, newQuote];
    setQuotes(updatedQuotes);
    storage.setItem("quotes", JSON.stringify(updatedQuotes));
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

  const getAgencyName = (agencyId: string) => {
    return agencies.find((agency) => agency.id === agencyId)?.name || "";
  };

  const getHotelName = (hotelId: string) => {
    return hotels.find((hotel) => hotel.id === hotelId)?.name || "";
  };

  const searchQuotes = (quotes: Quote[], searchTerm: string) => {
    if (!searchTerm.trim()) return quotes;

    const searchLower = searchTerm.toLowerCase();

    return quotes.filter((quote) => {
      // Referans numarası
      if (quote.reference?.toLowerCase().includes(searchLower)) return true;

      // Acente adı
      const agencyName = getAgencyName(quote.agency_id)?.toLowerCase() || "";
      if (agencyName.includes(searchLower)) return true;

      // Firma adı
      if (quote.company_name?.toLowerCase().includes(searchLower)) return true;

      // Otel adı
      const hotelName = getHotelName(quote.hotel_id)?.toLowerCase() || "";
      if (hotelName.includes(searchLower)) return true;

      // Tarihler (organizasyon tarihleri)
      const checkInDate = quote.check_in_date
        ? new Date(quote.check_in_date).toLocaleDateString("tr-TR")
        : "";
      const checkOutDate = quote.check_out_date
        ? new Date(quote.check_out_date).toLocaleDateString("tr-TR")
        : "";
      if (
        checkInDate.includes(searchLower) ||
        checkOutDate.includes(searchLower)
      )
        return true;

      // Oluşturulma tarihi
      const createdDate = quote.created_at
        ? new Date(quote.created_at).toLocaleDateString("tr-TR")
        : "";
      if (createdDate.includes(searchLower)) return true;

      // Durum
      if (quote.status?.toLowerCase().includes(searchLower)) return true;

      // Teklif türü
      if (quote.quote_type?.toLowerCase().includes(searchLower)) return true;

      // Oda/Pax bilgisi
      if (quote.room_pax?.toLowerCase().includes(searchLower)) return true;

      // Not
      if (quote.note?.toLowerCase().includes(searchLower)) return true;

      // Toplam tutar
      const totalAmount = quote.total_amount?.toString() || "";
      if (totalAmount.includes(searchLower)) return true;

      return false;
    });
  };

  const sortQuotes = (
    quotes: Quote[],
    field: string,
    direction: "asc" | "desc",
  ) => {
    if (!field) return quotes;

    return [...quotes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case "created_at":
          aValue = new Date(a.created_at || "").getTime();
          bValue = new Date(b.created_at || "").getTime();
          break;
        case "reference":
          aValue = a.reference || "";
          bValue = b.reference || "";
          break;
        case "agency":
          aValue = getAgencyName(a.agency_id) || "";
          bValue = getAgencyName(b.agency_id) || "";
          break;
        case "company_name":
          aValue = a.company_name || "";
          bValue = b.company_name || "";
          break;
        case "hotel":
          aValue = getHotelName(a.hotel_id) || "";
          bValue = getHotelName(b.hotel_id) || "";
          break;
        case "date":
          aValue = new Date(a.check_in_date || "").getTime();
          bValue = new Date(b.check_in_date || "").getTime();
          break;
        case "total_amount":
          aValue = a.total_amount || 0;
          bValue = b.total_amount || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          return 0;
      }

      if (direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleConvertToProject = (quote: Quote) => {
    // Yeni proje oluştur
    const newProject = {
      id: Date.now().toString(),
      title: `Proje - ${quote.reference}`,
      description: `${quote.company_name} için ${quote.quote_type} projesi`,
      status: "active",
      priority: "medium",
      start_date: quote.check_in_date,
      end_date: quote.check_out_date,
      budget: quote.total_amount || 0,
      progress: 0,
      team_members: 5,
      quote_id: quote.id,
      created_at: new Date().toISOString(),
    };

    // Projeyi kaydet
    const savedProjects = storage.getItem("projects");
    const projects = savedProjects ? JSON.parse(savedProjects) : [];
    const updatedProjects = [...projects, newProject];
    storage.setItem("projects", JSON.stringify(updatedProjects));

    // Teklifi güncelle
    const updatedQuotes = quotes.map((q) =>
      q.id === quote.id ? { ...q, status: "KONFİRME" } : q,
    );
    setQuotes(updatedQuotes);
    storage.setItem("quotes", JSON.stringify(updatedQuotes));

    alert("Teklif başarıyla projeye dönüştürüldü!");
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (confirm("Bu teklifi silmek istediğinizden emin misiniz?")) {
      const updatedQuotes = quotes.filter((q) => q.id !== quoteId);
      setQuotes(updatedQuotes);
      storage.setItem("quotes", JSON.stringify(updatedQuotes));
      alert("Teklif başarıyla silindi!");
    }
  };

  const handleCopyQuote = (quote: Quote) => {
    // Teklifi kopyala ve yeni ID ile kaydet
    const copiedQuote: Quote = {
      ...quote,
      id: Date.now().toString(),
      reference: `${quote.reference}-COPY`,
      status: "TEKLİF",
      created_at: new Date().toISOString(),
    };
    const updatedQuotes = [...quotes, copiedQuote];
    setQuotes(updatedQuotes);
    storage.setItem("quotes", JSON.stringify(updatedQuotes));
    alert("Teklif başarıyla kopyalandı!");
  };

  // Excel Export Fonksiyonu
  const exportToExcel = () => {
    setExporting(true);

    try {
      const filteredQuotes =
        filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

      const exportData = filteredQuotes.map((quote) => ({
        Referans: quote.reference,
        Acente: getAgencyName(quote.agency_id),
        "Firma Adı": quote.company_name,
        Otel: getHotelName(quote.hotel_id),
        "Check-in": new Date(quote.check_in_date).toLocaleDateString("tr-TR"),
        "Check-out": new Date(quote.check_out_date).toLocaleDateString("tr-TR"),
        "Teklif Türü": quote.quote_type,
        "Oda/Pax": quote.room_pax,
        Opsiyon: quote.option,
        Durum: quote.status,
        "Toplam Tutar": `${formatNumber(quote.total_amount || 0)} €`,
        "Oluşturulma Tarihi": new Date(quote.created_at).toLocaleDateString(
          "tr-TR",
        ),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Teklifler");

      // Sütun genişliklerini ayarla
      const colWidths = [
        { wch: 15 }, // Referans
        { wch: 20 }, // Acente
        { wch: 25 }, // Firma Adı
        { wch: 20 }, // Otel
        { wch: 12 }, // Check-in
        { wch: 12 }, // Check-out
        { wch: 12 }, // Teklif Türü
        { wch: 30 }, // Oda/Pax
        { wch: 15 }, // Opsiyon
        { wch: 12 }, // Durum
        { wch: 15 }, // Toplam Tutar
        { wch: 15 }, // Oluşturulma Tarihi
      ];
      ws["!cols"] = colWidths;

      const fileName = `Teklifler_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      alert("Excel dosyası başarıyla indirildi!");
    } catch (error) {
      console.error("Excel export hatası:", error);
      alert("Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  // PDF Export Fonksiyonu
  const exportToPDF = async () => {
    setExporting(true);

    try {
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const tableWidth = pageWidth - 2 * margin;

      // Başlık
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("TEKLİFLER RAPORU", pageWidth / 2, 20, { align: "center" });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Oluşturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")}`,
        pageWidth / 2,
        30,
        { align: "center" },
      );

      // Tablo başlıkları
      const headers = [
        "Referans",
        "Acente",
        "Firma",
        "Otel",
        "Tarih",
        "Tür",
        "Durum",
        "Tutar",
      ];

      const colWidths = [25, 30, 35, 30, 25, 20, 20, 25];
      let currentY = 45;

      // Başlık satırı
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, currentY - 5, tableWidth, 8, "F");

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      let currentX = margin;
      headers.forEach((header, index) => {
        pdf.text(header, currentX + 2, currentY);
        currentX += colWidths[index];
      });

      currentY += 10;

      // Veri satırları
      const filteredQuotes =
        filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");

      filteredQuotes.forEach((quote, index) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }

        const rowData = [
          quote.reference,
          getAgencyName(quote.agency_id),
          quote.company_name.substring(0, 20),
          getHotelName(quote.hotel_id).substring(0, 20),
          `${new Date(quote.check_in_date).toLocaleDateString("tr-TR")} - ${new Date(quote.check_out_date).toLocaleDateString("tr-TR")}`,
          quote.quote_type,
          quote.status,
          `${formatNumber(quote.total_amount || 0)} €`,
        ];

        currentX = margin;
        rowData.forEach((cell, cellIndex) => {
          pdf.text(cell, currentX + 1, currentY);
          currentX += colWidths[cellIndex];
        });

        currentY += 6;
      });

      const fileName = `Teklifler_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      alert("PDF dosyası başarıyla indirildi!");
    } catch (error) {
      console.error("PDF export hatası:", error);
      alert("PDF dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  const filteredQuotes = sortQuotes(
    searchQuotes(
      filter === "all" ? quotes : quotes.filter((q) => q.status === filter),
      searchTerm,
    ),
    sortField,
    sortDirection,
  );

  // Calculate counts based on current filtered data
  const filteredQuotesForCounts =
    filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  const konfirmeCount = quotes.filter((q) => q.status === "KONFİRME").length;
  const teklifCount = quotes.filter((q) => q.status === "TEKLİF").length;
  const iptalCount = quotes.filter((q) => q.status === "İPTAL").length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6 transition-colors duration-200"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
            Teklifler
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-200">
            Müşteri tekliflerini yönetin
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {exporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                İşleniyor...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
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
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {exporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                İşleniyor...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                PDF
              </>
            )}
          </button>
          <Link
            href="/quotes/create"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 transition-colors"
          >
            Yeni Teklif
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
                Toplam Teklif
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                {quotes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
                Konfirme
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                {konfirmeCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
                Bekleyen
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                {teklifCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 transition-colors duration-200">
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-500 dark:bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Tümü ({quotes.length})
            </button>
            <button
              onClick={() => setFilter("TEKLİF")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "TEKLİF"
                  ? "bg-blue-500 dark:bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Teklif ({teklifCount})
            </button>
            <button
              onClick={() => setFilter("KONFİRME")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "KONFİRME"
                  ? "bg-blue-500 dark:bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Konfirme ({konfirmeCount})
            </button>
            <button
              onClick={() => setFilter("İPTAL")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "İPTAL"
                  ? "bg-blue-500 dark:bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              İptal ({iptalCount})
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Moved above table */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Referans, Acente, Firma, Otel, Organizasyon Tarihi, Oluşturulma Tarihi, Durum, Tutar... herhangi bir şey arayın"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
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
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
            <span className="font-medium">{filteredQuotes.length}</span> sonuç
            bulundu
            {filteredQuotes.length !== quotes.length && (
              <span className="ml-2">({quotes.length} toplam teklif)</span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center">
                    Oluşturulma Tarihi
                    {sortField === "created_at" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("reference")}
                >
                  <div className="flex items-center">
                    Referans
                    {sortField === "reference" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("agency")}
                >
                  <div className="flex items-center">
                    Acente
                    {sortField === "agency" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("company_name")}
                >
                  <div className="flex items-center">
                    Firma Adı
                    {sortField === "company_name" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("hotel")}
                >
                  <div className="flex items-center">
                    Otel
                    {sortField === "hotel" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Organizasyon Tarihi
                    {sortField === "date" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("total_amount")}
                >
                  <div className="flex items-center">
                    Toplam Tutar
                    {sortField === "total_amount" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Durum
                    {sortField === "status" && (
                      <svg
                        className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {new Date(quote.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                    {getAgencyName(quote.agency_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                    {quote.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                    {getHotelName(quote.hotel_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                    {new Date(quote.check_in_date).toLocaleDateString("tr-TR")}{" "}
                    -{" "}
                    {new Date(quote.check_out_date).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    €{formatNumber(quote.total_amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                    {new Date(quote.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          window.open(`/quotes/${quote.id}`, "_blank")
                        }
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-500/10 dark:hover:bg-blue-900/30 transition-colors duration-200"
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
                      <button
                        onClick={() =>
                          window.open(`/quotes/${quote.id}/edit`, "_blank")
                        }
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200"
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
                      <button
                        onClick={() => handleCopyQuote(quote)}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 p-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200"
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
                      {quote.status !== "KONFİRME" && (
                        <button
                          onClick={() => handleConvertToProject(quote)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-200"
                          title="Projeye Dönüştür"
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
