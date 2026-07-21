"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PaginationControls from "@/components/PaginationControls";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import { ExcelUtils } from "@/utils/excelUtils";
import { formatDate } from "@/utils/formatters";
import { hotelsService } from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "react-hot-toast";
import {
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  FileText,
  Plus,
  Pencil,
  Save,
  AlertCircle,
} from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  company_name?: string;
  location?: string;
  concept: string;
  rating?: number;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
  accounting_link_codes?: {
    TL?: string;
    EUR?: string;
    USD?: string;
    GBP?: string;
  };
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function HotelsPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    loading: permissionsLoading,
  } = usePermissions();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [hotelToDelete, setHotelToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    location: "",
    concept: "",
    rating: 5,
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_number: "",
    tax_office: "",
    accounting_link_codes: {
      TL: "",
      EUR: "",
      USD: "",
      GBP: "",
    },
  });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const companyNameInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const conceptInputRef = useRef<HTMLInputElement>(null);
  const contactPersonInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const taxNumberInputRef = useRef<HTMLInputElement>(null);
  const taxOfficeInputRef = useRef<HTMLInputElement>(null);
  const tlCodeInputRef = useRef<HTMLInputElement>(null);
  const eurCodeInputRef = useRef<HTMLInputElement>(null);
  const usdCodeInputRef = useRef<HTMLInputElement>(null);
  const gbpCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      // Supabase'ten yükle (tek kaynak)
      const supaHotels = await hotelsService.getAll();
      if (supaHotels && supaHotels.length > 0) {
        // Supabase şeması camelCase olmayabilir; alanları eşleştir
        const normalized: Hotel[] = supaHotels.map((h: any) => ({
          id: h.id || h.uuid || "",
          name: h.name,
          company_name: h.company_name || "",
          location: h.location || h.city || "",
          concept: h.concept || "",
          rating: h.rating || 0,
          contact_person: h.contact_person || "",
          phone: h.phone || "",
          email: h.email || "",
          address: h.address || "",
          tax_number: h.tax_number || "",
          tax_office: h.tax_office || "",
          accounting_link_codes: h.accounting_link_codes || {},
          is_active: h.is_active,
          created_at: h.created_at,
          updated_at: h.updated_at,
        }));
        setHotels(normalized);
        (window as any).globalHotels = normalized;
        window.dispatchEvent(
          new CustomEvent("hotelsUpdated", { detail: normalized }),
        );
      } else {
        setHotels([]);
      }
    } catch (error) {
      console.error("Hotels yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ref'lerden değerleri al
    const nameValue = nameInputRef.current?.value || "";
    const companyNameValue = companyNameInputRef.current?.value || "";
    const locationValue = locationInputRef.current?.value || "";
    const conceptValue = conceptInputRef.current?.value || "";
    const contactPersonValue = contactPersonInputRef.current?.value || "";
    const phoneValue = phoneInputRef.current?.value || "";
    const emailValue = emailInputRef.current?.value || "";
    const addressValue = addressInputRef.current?.value || "";
    const taxNumberValue = taxNumberInputRef.current?.value || "";
    const taxOfficeValue = taxOfficeInputRef.current?.value || "";
    const tlCodeValue = tlCodeInputRef.current?.value || "";
    const eurCodeValue = eurCodeInputRef.current?.value || "";
    const usdCodeValue = usdCodeInputRef.current?.value || "";
    const gbpCodeValue = gbpCodeInputRef.current?.value || "";

    try {
      if (editingHotel) {
        // Mevcut oteli güncelle
        try {
          await hotelsService.update(editingHotel.id, {
            name: nameValue,
            company_name: companyNameValue,
            location: locationValue,
            concept: conceptValue,
            rating: formData.rating,
            contact_person: contactPersonValue,
            phone: phoneValue,
            email: emailValue,
            address: addressValue,
            tax_number: taxNumberValue,
            tax_office: taxOfficeValue,
            accounting_link_codes: {
              TL: tlCodeValue,
              EUR: eurCodeValue,
              USD: usdCodeValue,
              GBP: gbpCodeValue,
            },
            is_active:
              hotels.find((h) => h.id === editingHotel.id)?.is_active ?? true,
          } as any);
          await loadHotels();
          toast.success("Otel başarıyla güncellendi!");
        } catch (e: any) {
          toast.error(`Supabase güncelleme hatası: ${e?.message || e}`);
        }
      } else {
        try {
          await hotelsService.create({
            name: nameValue,
            company_name: companyNameValue,
            location: locationValue,
            concept: conceptValue,
            rating: formData.rating,
            contact_person: contactPersonValue,
            phone: phoneValue,
            email: emailValue,
            address: addressValue,
            tax_number: taxNumberValue,
            tax_office: taxOfficeValue,
            accounting_link_codes: {
              TL: tlCodeValue,
              EUR: eurCodeValue,
              USD: usdCodeValue,
              GBP: gbpCodeValue,
            },
            is_active: true,
          } as any);
          await loadHotels();
          toast.success("Otel başarıyla oluşturuldu!");
        } catch (e: any) {
          toast.error(`Supabase kayıt hatası: ${e?.message || e}`);
        }
      }

      // Formu sıfırla ve modalı kapat
      setFormData({
        name: "",
        company_name: "",
        location: "",
        concept: "",
        rating: 5,
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        tax_number: "",
        tax_office: "",
        accounting_link_codes: {
          TL: "",
          EUR: "",
          USD: "",
          GBP: "",
        },
      });
      setEditingHotel(null);
      setShowAddModal(false);
    } catch (error) {
      console.error("Otel kaydedilirken hata:", error);
      toast.error("Otel kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      company_name: hotel.company_name || "",
      location: hotel.location || "",
      concept: hotel.concept,
      rating: hotel.rating || 5,
      contact_person: hotel.contact_person || "",
      phone: hotel.phone || "",
      email: hotel.email || "",
      address: hotel.address || "",
      tax_number: hotel.tax_number || "",
      tax_office: hotel.tax_office || "",
      accounting_link_codes: {
        TL: hotel.accounting_link_codes?.TL || "",
        EUR: hotel.accounting_link_codes?.EUR || "",
        USD: hotel.accounting_link_codes?.USD || "",
        GBP: hotel.accounting_link_codes?.GBP || "",
      },
    });
    setShowAddModal(true);

    // Ref'lere değerleri set et
    setTimeout(() => {
      if (nameInputRef.current) nameInputRef.current.value = hotel.name || "";
      if (companyNameInputRef.current)
        companyNameInputRef.current.value = hotel.company_name || "";
      if (locationInputRef.current)
        locationInputRef.current.value = hotel.location || "";
      if (conceptInputRef.current)
        conceptInputRef.current.value = hotel.concept || "";
      if (contactPersonInputRef.current)
        contactPersonInputRef.current.value = hotel.contact_person || "";
      if (phoneInputRef.current)
        phoneInputRef.current.value = hotel.phone || "";
      if (emailInputRef.current)
        emailInputRef.current.value = hotel.email || "";
      if (addressInputRef.current)
        addressInputRef.current.value = hotel.address || "";
      if (taxNumberInputRef.current)
        taxNumberInputRef.current.value = hotel.tax_number || "";
      if (taxOfficeInputRef.current)
        taxOfficeInputRef.current.value = hotel.tax_office || "";
      if (tlCodeInputRef.current)
        tlCodeInputRef.current.value = hotel.accounting_link_codes?.TL || "";
      if (eurCodeInputRef.current)
        eurCodeInputRef.current.value = hotel.accounting_link_codes?.EUR || "";
      if (usdCodeInputRef.current)
        usdCodeInputRef.current.value = hotel.accounting_link_codes?.USD || "";
      if (gbpCodeInputRef.current)
        gbpCodeInputRef.current.value = hotel.accounting_link_codes?.GBP || "";
    }, 100);
  };

  const handleDelete = async (hotelId: string) => {
    try {
      await hotelsService.delete(hotelId);
      await loadHotels();
      setSuccess("Otel başarıyla silindi!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Otel silinirken hata:", error);
      setError("Otel silinirken bir hata oluştu.");
    } finally {
      setHotelToDelete(null);
    }
  };

  const exportHotelsToExcel = async () => {
    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const workbook = await ExcelUtils.createWorkbook();
      const worksheet = workbook.addWorksheet("Oteller");

      // Başlık satırı
      const headers = [
        "Otel Adı",
        "Firma Adı",
        "Konum",
        "Konsept",
        "Yıldız",
        "İletişim Kişisi",
        "Telefon",
        "E-posta",
        "Adres",
        "Vergi Numarası",
        "Vergi Dairesi",
        "TL Kodu",
        "EUR Kodu",
        "USD Kodu",
        "GBP Kodu",
        "Durum",
        "Oluşturulma Tarihi",
      ];

      worksheet.addRow(headers);

      // Veri satırları
      filteredHotels.forEach((hotel) => {
        worksheet.addRow([
          hotel.name,
          hotel.company_name || "",
          hotel.location || "",
          hotel.concept,
          hotel.rating || "",
          hotel.contact_person || "",
          hotel.phone || "",
          hotel.email || "",
          hotel.address || "",
          hotel.tax_number || "",
          hotel.tax_office || "",
          hotel.accounting_link_codes?.TL || "",
          hotel.accounting_link_codes?.EUR || "",
          hotel.accounting_link_codes?.USD || "",
          hotel.accounting_link_codes?.GBP || "",
          hotel.is_active ? "Aktif" : "Pasif",
          formatDate(hotel.created_at),
        ]);
      });

      // Stil uygula
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E3440" },
      };
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.alignment = { horizontal: "center" };

      // Sütun genişliklerini ayarla
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      // Dosyayı indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `oteller_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess("Oteller başarıyla Excel dosyasına aktarıldı!");
    } catch (error) {
      console.error("Excel export hatası:", error);
      setError("Excel dosyası oluşturulurken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError("");
      setSuccess("");

      const data = await ExcelUtils.readExcelFile(file);

      if (!data || data.length === 0) {
        setError("Excel dosyasında veri bulunamadı.");
        return;
      }

      const importedHotels: Hotel[] = data.map((row: any, index: number) => ({
        id: Date.now().toString() + index,
        name: row["Otel Adı"] || "",
        company_name: row["Firma Adı"] || "",
        location: row["Konum"] || "",
        concept: row["Konsept"] || "",
        rating: row["Yıldız"] ? parseInt(row["Yıldız"]) : 5,
        contact_person: row["İletişim Kişisi"] || "",
        phone: row["Telefon"] || "",
        email: row["E-posta"] || "",
        address: row["Adres"] || "",
        tax_number: row["Vergi Numarası"] || "",
        tax_office: row["Vergi Dairesi"] || "",
        accounting_link_codes: {
          TL: row["TL Kodu"] || "",
          EUR: row["EUR Kodu"] || "",
          USD: row["USD Kodu"] || "",
          GBP: row["GBP Kodu"] || "",
        },
        is_active:
          row["Durum"] === "Aktif" ||
          row["Durum"] === "aktif" ||
          row["Durum"] === true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Mevcut otellerle birleştir
      const updatedHotels = [...hotels, ...importedHotels];
      setHotels(updatedHotels);

      setSuccess(`${importedHotels.length} otel başarıyla içe aktarıldı!`);
    } catch (error) {
      console.error("Excel import hatası:", error);
      setError("Excel dosyası okunurken bir hata oluştu.");
    } finally {
      setImporting(false);
      // Input'u temizle
      event.target.value = "";
    }
  };

  const toggleActive = async (hotelId: string) => {
    try {
      const hotelToUpdate = hotels.find((hotel) => hotel.id === hotelId);
      if (!hotelToUpdate) return;

      const updatedHotel = {
        ...hotelToUpdate,
        is_active: !hotelToUpdate.is_active,
      };
      const updatedHotels = hotels.map((hotel) =>
        hotel.id === hotelId ? updatedHotel : hotel,
      );

      setHotels(updatedHotels);
      try {
        await hotelsService.update(hotelId, {
          is_active: updatedHotel.is_active,
        } as any);
        await loadHotels();
      } catch (e: any) {
        toast.error(`Supabase güncelleme hatası: ${e?.message || e}`);
      }

      toast.success("Otel durumu başarıyla değiştirildi!");
    } catch (error) {
      console.error("Otel durumu değiştirilirken hata:", error);
      toast.error(
        "Otel durumu değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company_name: "",
      location: "",
      concept: "",
      rating: 5,
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      tax_number: "",
      tax_office: "",
      accounting_link_codes: {
        TL: "",
        EUR: "",
        USD: "",
        GBP: "",
      },
    });
    setEditingHotel(null);
    setShowAddModal(false);
  };

  const searchHotels = (hotels: Hotel[], term: string, tokens: string[]) => {
    if (!term && (!tokens || tokens.length === 0)) return hotels;

    return hotels.filter((hotel) => {
      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return (
          hotel.name.toLowerCase().includes(lowerS) ||
          (hotel.company_name &&
            hotel.company_name.toLowerCase().includes(lowerS)) ||
          (hotel.location && hotel.location.toLowerCase().includes(lowerS)) ||
          (hotel.concept && hotel.concept.toLowerCase().includes(lowerS)) ||
          (hotel.rating !== undefined &&
            hotel.rating !== null &&
            hotel.rating.toString().includes(lowerS)) ||
          (hotel.contact_person &&
            hotel.contact_person.toLowerCase().includes(lowerS)) ||
          (hotel.phone && hotel.phone.toLowerCase().includes(lowerS)) ||
          (hotel.email && hotel.email.toLowerCase().includes(lowerS)) ||
          (hotel.address && hotel.address.toLowerCase().includes(lowerS)) ||
          (hotel.tax_number &&
            hotel.tax_number.toLowerCase().includes(lowerS)) ||
          (hotel.tax_office && hotel.tax_office.toLowerCase().includes(lowerS))
        );
      };

      if (term && !matches(term)) return false;

      if (tokens && tokens.length > 0) {
        for (const t of tokens) {
          if (!matches(t)) return false;
        }
      }

      return true;
    });
  };

  const sortHotels = (
    hotels: Hotel[],
    field: string,
    direction: "asc" | "desc",
  ) => {
    if (!field) return hotels;

    return [...hotels].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "company_name":
          aValue = a.company_name || "";
          bValue = b.company_name || "";
          break;
        case "location":
          aValue = a.location || "";
          bValue = b.location || "";
          break;
        case "concept":
          aValue = a.concept;
          bValue = b.concept;
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "contact_person":
          aValue = a.contact_person || "";
          bValue = b.contact_person || "";
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[field as keyof Hotel];
          bValue = b[field as keyof Hotel];
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
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

  const filteredHotels = sortHotels(
    searchHotels(
      filter === "all"
        ? hotels
        : hotels.filter((hotel) =>
            filter === "active"
              ? hotel.is_active
              : filter === "inactive"
                ? !hotel.is_active
                : true,
          ),
      searchTerm,
      searchTokens,
    ),
    sortField,
    sortDirection,
  );
  const paginatedHotels = paginateItems(filteredHotels, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchTokens, filter, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Hotels görüntüleme yetkisi kontrolü
  if (!canView(Module.HOTELS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Oteller sayfasına erişim için yetkiniz bulunmuyor.
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
    return <LoadingSpinner message="Oteller yükleniyor..." />;
  }

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
      <div className="w-full min-w-0 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4 shrink-0">
          {/* Title Area */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-600 dark:text-blue-400 shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-light tracking-wide text-v3-text glow-text">
                Otel Yönetimi
              </h1>
              <p className="text-xs text-v3-muted mt-1">
                Otel bilgilerini yönetin ve düzenleyin
              </p>
            </div>
          </div>

          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                GENEL ARAMA (OTEL, FİRMA, KONUM...)
              </label>
              <div className="h-10">
                <MultiTokenFilterInput
                  label=""
                  placeholder="Yaz, Enter ile ekle"
                  inputValue={searchTerm}
                  onInputChange={setSearchTerm}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchTerm("");
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter((st) => st !== t));
                  }}
                />
              </div>
            </div>

            {/* Trash Button */}
            <button
              onClick={() => {
                setFilter("all");
                setSearchTerm("");
                setSearchTokens([]);
              }}
              className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all shrink-0"
              title="Filtreleri Temizle"
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
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>

            {/* Actions Divider */}
            <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block"></div>

            {/* Actions */}
            <label className="h-10 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {importing ? "YÜKLENİYOR..." : "EXCEL YÜKLE"}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                disabled={importing}
                className="hidden"
              />
            </label>

            <button
              onClick={exportHotelsToExcel}
              disabled={exporting}
              className="h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" />
              </svg>
              {exporting ? "İNDİRİLİYOR..." : "EXCEL İNDİR"}
            </button>

            {canCreate(Module.HOTELS) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                <Plus size={16} /> YENİ OTEL
              </button>
            )}
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-v3-border">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[11px] font-medium text-v3-text">Durum:</span>
          </div>

          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${filter === "all" ? "bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            TÜMÜ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "all" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300" : "bg-white/10"}`}
            >
              {hotels.length}
            </span>
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${filter === "active" ? "bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            AKTİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "active" ? "bg-teal-500/20 text-teal-600 dark:text-teal-300" : "bg-white/10"}`}
            >
              {hotels.filter((h) => h.is_active).length}
            </span>
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${filter === "inactive" ? "bg-red-500/20 border border-red-500/30 text-red-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            PASİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "inactive" ? "bg-red-500/20 text-red-300" : "bg-white/10"}`}
            >
              {hotels.filter((h) => !h.is_active).length}
            </span>
          </button>
        </div>

        {/* Hotels Table */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <div className="overflow-auto w-full flex-1 custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-border sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Otel Bilgileri
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Konum & Konsept
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    İletişim
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Muhasebe
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Durum
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedHotels.items.map((hotel) => (
                  <tr
                    key={hotel.id}
                    className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                    onDoubleClick={() => handleEdit(hotel)}
                  >
                    <td className="px-2.5 py-2.5">
                      <div>
                        <div className="text-sm font-medium text-v3-text mb-0.5">
                          {hotel.name}
                        </div>
                        <div className="text-[11px] text-v3-muted">
                          {hotel.company_name || "-"}
                        </div>
                        <div className="text-[10px] text-v3-muted">
                          ID: {hotel.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-v3-text">
                          {hotel.location || "-"}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {hotel.concept}
                        </div>
                        {hotel.rating && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-xs text-v3-muted ml-1">
                              {hotel.rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-v3-text">
                          {hotel.contact_person || "-"}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {hotel.phone || "-"}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {hotel.email || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-v3-text">
                          Vergi: {hotel.tax_number || "-"}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {hotel.tax_office || "-"}
                        </div>
                        {hotel.accounting_link_codes && (
                          <div className="mt-1">
                            <div className="text-xs text-v3-muted">
                              {hotel.accounting_link_codes.TL &&
                                `TL: ${hotel.accounting_link_codes.TL}`}
                            </div>
                            <div className="text-xs text-v3-muted">
                              {hotel.accounting_link_codes.EUR &&
                                `EUR: ${hotel.accounting_link_codes.EUR}`}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                          hotel.is_active
                            ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {hotel.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        {canEdit(Module.HOTELS) && (
                          <button
                            onClick={() => handleEdit(hotel)}
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
                        {canDelete(Module.HOTELS) && (
                          <button
                            onClick={() => setHotelToDelete(hotel.id)}
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
                        {canEdit(Module.HOTELS) && (
                          <button
                            onClick={() => toggleActive(hotel.id)}
                            className={`p-1.5 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100 ${
                              hotel.is_active
                                ? "text-orange-600 dark:text-orange-400 hover:text-orange-600 dark:text-orange-300 hover:bg-orange-500/20"
                                : "text-teal-600 dark:text-teal-400 hover:text-teal-600 dark:text-teal-300 hover:bg-teal-500/20"
                            }`}
                            title={hotel.is_active ? "Pasif Yap" : "Aktif Yap"}
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
              </tbody>
            </table>
          </div>
        </div>
        <PaginationControls
          page={paginatedHotels.page}
          pageSize={paginatedHotels.pageSize}
          total={paginatedHotels.total}
          totalPages={paginatedHotels.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="hotels_page_size"
          compactRight
        />
      </div>

      {/* Add/Edit Hotel Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingHotel(null);
          resetForm();
        }}
        title={editingHotel ? "Otel Düzenle" : "Yeni Otel Ekle"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-2">
                <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                Temel Bilgiler
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-v3-text mb-1.5">
                    Otel Adı *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    defaultValue=""
                    required
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="Otel Adı"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text mb-1.5">
                    Firma Adı
                  </label>
                  <input
                    ref={companyNameInputRef}
                    type="text"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="Şirket Ünvanı"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-1">
                      <MapPin size={12} /> Konum
                    </label>
                    <input
                      ref={locationInputRef}
                      type="text"
                      defaultValue=""
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                      placeholder="Şehir/Bölge"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5">
                      Konsept *
                    </label>
                    <input
                      ref={conceptInputRef}
                      type="text"
                      defaultValue=""
                      required
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                      placeholder="Örn: Her Şey Dahil"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-1">
                    <Star size={12} /> Yıldız
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Yıldız
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-2">
                <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                İletişim & Fatura
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5">
                      İletişim Kişisi
                    </label>
                    <input
                      ref={contactPersonInputRef}
                      type="text"
                      defaultValue=""
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-1">
                      <Phone size={12} /> Telefon
                    </label>
                    <input
                      ref={phoneInputRef}
                      type="text"
                      defaultValue=""
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                      placeholder="+90..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-1">
                    <Mail size={12} /> E-posta
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="otel@eposta.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-v3-text mb-1.5">
                    Adres
                  </label>
                  <input
                    ref={addressInputRef}
                    type="text"
                    defaultValue=""
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    placeholder="Tam adres..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5">
                      Vergi No
                    </label>
                    <input
                      ref={taxNumberInputRef}
                      type="text"
                      defaultValue=""
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5">
                      Vergi Dairesi
                    </label>
                    <input
                      ref={taxOfficeInputRef}
                      type="text"
                      defaultValue=""
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-2">
              <FileText size={16} className="text-blue-600 dark:text-blue-400" />
              Muhasebe Bağlantı Kodları
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                  TL Kodu
                </label>
                <input
                  ref={tlCodeInputRef}
                  type="text"
                  defaultValue=""
                  className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                  EUR Kodu
                </label>
                <input
                  ref={eurCodeInputRef}
                  type="text"
                  defaultValue=""
                  className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                  USD Kodu
                </label>
                <input
                  ref={usdCodeInputRef}
                  type="text"
                  defaultValue=""
                  className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                  GBP Kodu
                </label>
                <input
                  ref={gbpCodeInputRef}
                  type="text"
                  defaultValue=""
                  className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-v3-border">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingHotel(null);
                resetForm();
              }}
              className="px-6 py-2.5 text-sm font-bold text-v3-text bg-v3-surface border border-v3-border rounded-xl hover:bg-v3-border transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-sm font-bold rounded-xl hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all flex items-center gap-2"
            >
              {editingHotel ? <Pencil size={18} /> : <Plus size={18} />}
              {editingHotel ? "Güncelle" : "Otel Oluştur"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={!!hotelToDelete}
        title="Oteli Sil"
        message="Bu oteli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={() => hotelToDelete && handleDelete(hotelToDelete)}
        onCancel={() => setHotelToDelete(null)}
        type="danger"
        confirmText="Evet, Sil"
        cancelText="İptal"
      />

      {/* Mesaj Bildirimleri */}
      {(success || error) && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl z-[1000] border backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            success
              ? "bg-green-500/90 border-green-400 text-white"
              : "bg-red-500/90 border-red-400 text-white"
          }`}
        >
          {success ? <Save size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{success || error}</span>
        </div>
      )}
    </div>
  );
}
