"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import PaginationControls from "@/components/PaginationControls";
import { ExcelUtils } from "@/utils/excelUtils";
import { formatDate } from "@/utils/formatters";
import { agenciesService } from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { DEFAULT_PAGE_SIZE, paginateItems } from "@/types/pagination";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  Plus,
  Pencil,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Agency {
  id: string;
  name: string;
  company_name: string;
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

export default function AgenciesPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    loading: permissionsLoading,
  } = usePermissions();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
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
  const [agencyToDelete, setAgencyToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
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

  // Yeni acente için ref'ler
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const newCompanyNameInputRef = useRef<HTMLInputElement>(null);
  const newContactPersonInputRef = useRef<HTMLInputElement>(null);
  const newPhoneInputRef = useRef<HTMLInputElement>(null);
  const newEmailInputRef = useRef<HTMLInputElement>(null);
  const newAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const newTaxNumberInputRef = useRef<HTMLInputElement>(null);
  const newTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const newTlCodeInputRef = useRef<HTMLInputElement>(null);
  const newEurCodeInputRef = useRef<HTMLInputElement>(null);
  const newUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const newGbpCodeInputRef = useRef<HTMLInputElement>(null);

  // Düzenleme için ref'ler
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const editCompanyNameInputRef = useRef<HTMLInputElement>(null);
  const editContactPersonInputRef = useRef<HTMLInputElement>(null);
  const editPhoneInputRef = useRef<HTMLInputElement>(null);
  const editEmailInputRef = useRef<HTMLInputElement>(null);
  const editAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const editTaxNumberInputRef = useRef<HTMLInputElement>(null);
  const editTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const editTlCodeInputRef = useRef<HTMLInputElement>(null);
  const editEurCodeInputRef = useRef<HTMLInputElement>(null);
  const editUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const editGbpCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const supaAgencies = await agenciesService.getAll();
      const normalized = (supaAgencies || []).map((a: any) => ({
        id: a.id || a.uuid || "",
        name: a.name || "",
        company_name: a.company_name || "",
        contact_person: a.contact_person || "",
        phone: a.phone || "",
        email: a.email || "",
        address: a.address || "",
        tax_number: a.tax_number || "",
        tax_office: a.tax_office || "",
        accounting_link_codes: a.accounting_link_codes || {},
        is_active: a.is_active ?? true,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.updated_at || undefined,
      }));
      setAgencies(normalized);
      (window as any).globalAgencies = normalized;
      window.dispatchEvent(
        new CustomEvent("agenciesUpdated", { detail: normalized }),
      );
    } catch (error) {
      console.error("Acenteler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ref'lerden değerleri al
    const nameValue = editingAgency
      ? editNameInputRef.current?.value || ""
      : newNameInputRef.current?.value || "";
    const companyNameValue = editingAgency
      ? editCompanyNameInputRef.current?.value || ""
      : newCompanyNameInputRef.current?.value || "";
    const contactPersonValue = editingAgency
      ? editContactPersonInputRef.current?.value || ""
      : newContactPersonInputRef.current?.value || "";
    const phoneValue = editingAgency
      ? editPhoneInputRef.current?.value || ""
      : newPhoneInputRef.current?.value || "";
    const emailValue = editingAgency
      ? editEmailInputRef.current?.value || ""
      : newEmailInputRef.current?.value || "";
    const addressValue = editingAgency
      ? editAddressInputRef.current?.value || ""
      : newAddressInputRef.current?.value || "";
    const taxNumberValue = editingAgency
      ? editTaxNumberInputRef.current?.value || ""
      : newTaxNumberInputRef.current?.value || "";
    const taxOfficeValue = editingAgency
      ? editTaxOfficeInputRef.current?.value || ""
      : newTaxOfficeInputRef.current?.value || "";
    const tlCodeValue = editingAgency
      ? editTlCodeInputRef.current?.value || ""
      : newTlCodeInputRef.current?.value || "";
    const eurCodeValue = editingAgency
      ? editEurCodeInputRef.current?.value || ""
      : newEurCodeInputRef.current?.value || "";
    const usdCodeValue = editingAgency
      ? editUsdCodeInputRef.current?.value || ""
      : newUsdCodeInputRef.current?.value || "";
    const gbpCodeValue = editingAgency
      ? editGbpCodeInputRef.current?.value || ""
      : newGbpCodeInputRef.current?.value || "";

    try {
      if (editingAgency) {
        // Mevcut acenteyi güncelle
        const updatedAgencies = agencies.map((agency) =>
          agency.id === editingAgency.id
            ? {
                ...agency,
                name: nameValue,
                company_name: companyNameValue,
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
                updated_at: new Date().toISOString(),
              }
            : agency,
        );
        setAgencies(updatedAgencies);
        try {
          await agenciesService.update(editingAgency.id, {
            name: nameValue,
            company_name: companyNameValue,
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
          } as any);
          await loadAgencies();
        } catch (e: any) {
          toast.error(`Supabase güncelleme hatası: ${e?.message || e}`);
        }
        toast.success("Acente başarıyla güncellendi!");
      } else {
        // Yeni acente oluştur
        const newAgency: Agency = {
          id: Date.now().toString(),
          name: nameValue,
          company_name: companyNameValue,
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
          created_at: new Date().toISOString(),
        };
        const updatedAgencies = [...agencies, newAgency];
        setAgencies(updatedAgencies);
        try {
          await agenciesService.create({
            name: nameValue,
            company_name: companyNameValue,
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
          await loadAgencies();
        } catch (e: any) {
          toast.error(`Supabase kayıt hatası: ${e?.message || e}`);
        }
        toast.success("Acente başarıyla oluşturuldu!");
      }

      // Formu sıfırla ve modalı kapat
      setFormData({
        name: "",
        company_name: "",
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
      setEditingAgency(null);
      setShowAddModal(false);
    } catch (error) {
      console.error("Acente kaydedilirken hata:", error);
      toast.error(
        "Acente kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      company_name: agency.company_name,
      contact_person: agency.contact_person || "",
      phone: agency.phone || "",
      email: agency.email || "",
      address: agency.address || "",
      tax_number: agency.tax_number || "",
      tax_office: agency.tax_office || "",
      accounting_link_codes: {
        TL: agency.accounting_link_codes?.TL || "",
        EUR: agency.accounting_link_codes?.EUR || "",
        USD: agency.accounting_link_codes?.USD || "",
        GBP: agency.accounting_link_codes?.GBP || "",
      },
    });
    setShowAddModal(true);

    // Ref'lere değerleri set et
    setTimeout(() => {
      if (editNameInputRef.current)
        editNameInputRef.current.value = agency.name || "";
      if (editCompanyNameInputRef.current)
        editCompanyNameInputRef.current.value = agency.company_name || "";
      if (editContactPersonInputRef.current)
        editContactPersonInputRef.current.value = agency.contact_person || "";
      if (editPhoneInputRef.current)
        editPhoneInputRef.current.value = agency.phone || "";
      if (editEmailInputRef.current)
        editEmailInputRef.current.value = agency.email || "";
      if (editAddressInputRef.current)
        editAddressInputRef.current.value = agency.address || "";
      if (editTaxNumberInputRef.current)
        editTaxNumberInputRef.current.value = agency.tax_number || "";
      if (editTaxOfficeInputRef.current)
        editTaxOfficeInputRef.current.value = agency.tax_office || "";
      if (editTlCodeInputRef.current)
        editTlCodeInputRef.current.value =
          agency.accounting_link_codes?.TL || "";
      if (editEurCodeInputRef.current)
        editEurCodeInputRef.current.value =
          agency.accounting_link_codes?.EUR || "";
      if (editUsdCodeInputRef.current)
        editUsdCodeInputRef.current.value =
          agency.accounting_link_codes?.USD || "";
      if (editGbpCodeInputRef.current)
        editGbpCodeInputRef.current.value =
          agency.accounting_link_codes?.GBP || "";
    }, 100);
  };

  const handleDelete = async (agencyId: string) => {
    try {
      await agenciesService.delete(agencyId);
      await loadAgencies();
      setSuccess("Acente başarıyla silindi!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Acente silinirken hata:", error);
      setError("Acente silinirken bir hata oluştu.");
    } finally {
      setAgencyToDelete(null);
    }
  };

  const exportAgenciesToExcel = async () => {
    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const workbook = await ExcelUtils.createWorkbook();
      const worksheet = workbook.addWorksheet("Acenteler");

      // Başlık satırı
      const headers = [
        "Acente Adı",
        "Firma Adı",
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
      filteredAgencies.forEach((agency) => {
        worksheet.addRow([
          agency.name,
          agency.company_name || "",
          agency.contact_person || "",
          agency.phone || "",
          agency.email || "",
          agency.address || "",
          agency.tax_number || "",
          agency.tax_office || "",
          agency.accounting_link_codes?.TL || "",
          agency.accounting_link_codes?.EUR || "",
          agency.accounting_link_codes?.USD || "",
          agency.accounting_link_codes?.GBP || "",
          agency.is_active ? "Aktif" : "Pasif",
          formatDate(agency.created_at),
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
      link.download = `acenteler_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess("Acenteler başarıyla Excel dosyasına aktarıldı!");
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

      const importedAgencies: Agency[] = data.map(
        (row: any, index: number) => ({
          id: Date.now().toString() + index,
          name: row["Acente Adı"] || "",
          company_name: row["Firma Adı"] || "",
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
        }),
      );

      const updatedAgencies = [...agencies, ...importedAgencies];
      setAgencies(updatedAgencies);

      try {
        for (const a of importedAgencies) {
          await agenciesService.create({
            name: a.name,
            company_name: a.company_name,
            contact_person: a.contact_person,
            phone: a.phone,
            email: a.email,
            address: a.address,
            tax_number: a.tax_number,
            tax_office: a.tax_office,
            accounting_link_codes: a.accounting_link_codes,
            is_active: a.is_active,
          } as any);
        }
        await loadAgencies();
      } catch (e: any) {
        toast.error(`Supabase kayıt hatası: ${e?.message || e}`);
      }

      setSuccess(`${importedAgencies.length} acente başarıyla içe aktarıldı!`);
    } catch (error) {
      console.error("Excel import hatası:", error);
      setError("Excel dosyası okunurken bir hata oluştu.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const toggleActive = async (agencyId: string) => {
    try {
      const agencyToUpdate = agencies.find((agency) => agency.id === agencyId);
      if (!agencyToUpdate) return;

      const updatedAgency = {
        ...agencyToUpdate,
        is_active: !agencyToUpdate.is_active,
      };
      const updatedAgencies = agencies.map((agency) =>
        agency.id === agencyId ? updatedAgency : agency,
      );
      setAgencies(updatedAgencies);
      try {
        await agenciesService.update(agencyId, {
          is_active: updatedAgency.is_active,
        } as any);
        await loadAgencies();
      } catch (e: any) {
        toast.error(`Supabase güncelleme hatası: ${e?.message || e}`);
      }
      toast.success("Acente durumu başarıyla değiştirildi!");
    } catch (error) {
      console.error("Acente durumu değiştirilirken hata:", error);
      toast.error(
        "Acente durumu değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    }
  };

  const searchAgencies = (
    agencies: Agency[],
    term: string,
    tokens: string[],
  ) => {
    if (!term && (!tokens || tokens.length === 0)) return agencies;

    return agencies.filter((agency) => {
      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return (
          agency.name.toLowerCase().includes(lowerS) ||
          (agency.company_name &&
            agency.company_name.toLowerCase().includes(lowerS)) ||
          (agency.contact_person &&
            agency.contact_person.toLowerCase().includes(lowerS)) ||
          (agency.phone && agency.phone.toLowerCase().includes(lowerS)) ||
          (agency.email && agency.email.toLowerCase().includes(lowerS)) ||
          (agency.address && agency.address.toLowerCase().includes(lowerS)) ||
          (agency.tax_number &&
            agency.tax_number.toLowerCase().includes(lowerS)) ||
          (agency.tax_office &&
            agency.tax_office.toLowerCase().includes(lowerS))
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

  const sortAgencies = (
    agencies: Agency[],
    field: string,
    direction: "asc" | "desc",
  ) => {
    if (!field) return agencies;

    return [...agencies].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "company_name":
          aValue = a.company_name;
          bValue = b.company_name;
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
          aValue = a[field as keyof Agency];
          bValue = b[field as keyof Agency];
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

  const filteredAgencies = sortAgencies(
    searchAgencies(
      filter === "all"
        ? agencies
        : agencies.filter((agency) =>
            filter === "active"
              ? agency.is_active
              : filter === "inactive"
                ? !agency.is_active
                : true,
          ),
      searchTerm,
      searchTokens,
    ),
    sortField,
    sortDirection,
  );
  const paginatedAgencies = paginateItems(filteredAgencies, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchTokens, filter, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Agencies görüntüleme yetkisi kontrolü
  if (!canView(Module.AGENCIES)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Acenteler sayfasına erişim için yetkiniz bulunmuyor.
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
    return <LoadingSpinner message="Acenteler yükleniyor..." />;
  }

  return (
    <div className="flex-1 min-h-0 w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-v3-text">
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
                Acente Yönetimi
              </h1>
              <p className="text-xs text-v3-muted mt-1">
                Acente bilgilerini yönetin ve düzenleyin
              </p>
            </div>
          </div>

          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                GENEL ARAMA (ACENTE, FİRMA, İLETİŞİM...)
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
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <label className="flex-1 sm:flex-none justify-center h-10 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shrink-0">
                <svg
                  className="w-4 h-4 shrink-0"
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
                <span>{importing ? "YÜKLENİYOR..." : "EXCEL YÜKLE"}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>

              <button
                onClick={exportAgenciesToExcel}
                disabled={exporting}
                className="flex-1 sm:flex-none justify-center h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" />
                </svg>
                <span>{exporting ? "İNDİRİLİYOR..." : "EXCEL İNDİR"}</span>
              </button>

              {canCreate(Module.AGENCIES) && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 sm:flex-none justify-center h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus size={16} className="shrink-0" /> <span>YENİ ACENTE</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Unified Stats Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-v3-surface backdrop-blur-md border border-v3-border rounded-xl p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-v3-border w-full sm:w-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0"></div>
            <span className="text-[11px] font-medium text-v3-text shrink-0">Durum:</span>
          </div>

          <button
            onClick={() => setFilter("all")}
            className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shrink-0 ${filter === "all" ? "bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            TÜMÜ
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "all" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300" : "bg-white/10"}`}
            >
              {agencies.length}
            </span>
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shrink-0 ${filter === "active" ? "bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.15)]" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            AKTİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "active" ? "bg-teal-500/20 text-teal-600 dark:text-teal-300" : "bg-white/10"}`}
            >
              {agencies.filter((a) => a.is_active).length}
            </span>
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shrink-0 ${filter === "inactive" ? "bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.15)]" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            PASİF
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "inactive" ? "bg-red-500/20 text-red-600 dark:text-red-300" : "bg-white/10"}`}
            >
              {agencies.filter((a) => !a.is_active).length}
            </span>
          </button>
        </div>

        {/* Agencies Table */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <div className="overflow-auto w-full flex-1 custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-border sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border transition-colors border-b border-v3-border"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Acente Adı
                      {sortField === "name" && (
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border transition-colors border-b border-v3-border"
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    İletişim
                  </th>
                  <th className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider border-b border-v3-border">
                    Vergi Bilgileri
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border transition-colors border-b border-v3-border"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Kayıt Tarihi
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      )}
                    </div>
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
                {paginatedAgencies.items.map((agency) => (
                  <tr
                    key={agency.id}
                    className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                    onDoubleClick={() => handleEdit(agency)}
                  >
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-sm font-medium text-v3-text transition-colors">
                      {agency.name}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors">
                      {agency.company_name}
                    </td>
                    <td className="px-2.5 py-2.5 text-xs text-v3-text transition-colors">
                      <div>
                        <div className="font-medium text-v3-text">
                          {agency.contact_person || "-"}
                        </div>
                        <div className="text-v3-muted">
                          {agency.phone || "-"}
                        </div>
                        <div className="text-v3-muted">
                          {agency.email || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 text-xs text-v3-text transition-colors">
                      <div>
                        <div className="font-medium text-v3-text">
                          {agency.tax_number || "-"}
                        </div>
                        <div className="text-v3-muted">
                          {agency.tax_office || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text transition-colors">
                      {new Date(agency.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full border ${agency.is_active ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                      >
                        {agency.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium">
                      <div className="flex space-x-2">
                        {canEdit(Module.AGENCIES) && (
                          <button
                            onClick={() => handleEdit(agency)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-600 dark:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/20 transition-all duration-200 opacity-70 group-hover:opacity-100"
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
                        {canDelete(Module.AGENCIES) && (
                          <button
                            onClick={() => setAgencyToDelete(agency.id)}
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
                        {canEdit(Module.AGENCIES) && (
                          <button
                            onClick={() => toggleActive(agency.id)}
                            className={`p-1.5 rounded-lg transition-all duration-200 opacity-70 group-hover:opacity-100 ${agency.is_active ? "text-red-400 hover:text-red-300 hover:bg-red-500/20" : "text-teal-600 dark:text-teal-400 hover:text-teal-600 dark:text-teal-300 hover:bg-teal-500/20"}`}
                            title={agency.is_active ? "Pasif Yap" : "Aktif Yap"}
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
          page={paginatedAgencies.page}
          pageSize={paginatedAgencies.pageSize}
          total={paginatedAgencies.total}
          totalPages={paginatedAgencies.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="agencies_page_size"
          compactRight
        />

        {/* Add/Edit Agency Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingAgency(null);
          }}
          title={editingAgency ? "Acente Düzenle" : "Yeni Acente Ekle"}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-2">
                  <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                  Acente Bilgileri
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5">
                      Acente Adı *
                    </label>
                    <input
                      ref={editingAgency ? editNameInputRef : newNameInputRef}
                      type="text"
                      defaultValue={editingAgency?.name || ""}
                      required
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      placeholder="Acente Adı"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5">
                      Firma Adı *
                    </label>
                    <input
                      ref={
                        editingAgency
                          ? editCompanyNameInputRef
                          : newCompanyNameInputRef
                      }
                      type="text"
                      defaultValue={editingAgency?.company_name || ""}
                      required
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      placeholder="Şirket Ünvanı"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-2">
                      <User size={12} /> İletişim Kişisi
                    </label>
                    <input
                      ref={
                        editingAgency
                          ? editContactPersonInputRef
                          : newContactPersonInputRef
                      }
                      type="text"
                      defaultValue={editingAgency?.contact_person || ""}
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      placeholder="Yetkili Kişi"
                    />
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
                      <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-2">
                        <Phone size={12} /> Telefon
                      </label>
                      <input
                        ref={
                          editingAgency ? editPhoneInputRef : newPhoneInputRef
                        }
                        type="text"
                        defaultValue={editingAgency?.phone || ""}
                        className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                        placeholder="+90..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-2">
                        <Mail size={12} /> E-posta
                      </label>
                      <input
                        ref={
                          editingAgency ? editEmailInputRef : newEmailInputRef
                        }
                        type="email"
                        defaultValue={editingAgency?.email || ""}
                        className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                        placeholder="acente@eposta.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-v3-text mb-1.5 flex items-center gap-2">
                      <MapPin size={12} /> Adres
                    </label>
                    <textarea
                      ref={
                        editingAgency ? editAddressInputRef : newAddressInputRef
                      }
                      defaultValue={editingAgency?.address || ""}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm resize-none"
                      placeholder="Tam adres..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-v3-text mb-1.5">
                        Vergi No
                      </label>
                      <input
                        ref={
                          editingAgency
                            ? editTaxNumberInputRef
                            : newTaxNumberInputRef
                        }
                        type="text"
                        defaultValue={editingAgency?.tax_number || ""}
                        className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-v3-text mb-1.5">
                        Vergi Dairesi
                      </label>
                      <input
                        ref={
                          editingAgency
                            ? editTaxOfficeInputRef
                            : newTaxOfficeInputRef
                        }
                        type="text"
                        defaultValue={editingAgency?.tax_office || ""}
                        className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
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
                    ref={editingAgency ? editTlCodeInputRef : newTlCodeInputRef}
                    type="text"
                    defaultValue={
                      editingAgency?.accounting_link_codes?.TL || ""
                    }
                    className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                    EUR Kodu
                  </label>
                  <input
                    ref={
                      editingAgency ? editEurCodeInputRef : newEurCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingAgency?.accounting_link_codes?.EUR || ""
                    }
                    className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                    USD Kodu
                  </label>
                  <input
                    ref={
                      editingAgency ? editUsdCodeInputRef : newUsdCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingAgency?.accounting_link_codes?.USD || ""
                    }
                    className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase mb-1">
                    GBP Kodu
                  </label>
                  <input
                    ref={
                      editingAgency ? editGbpCodeInputRef : newGbpCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingAgency?.accounting_link_codes?.GBP || ""
                    }
                    className="w-full px-3 py-2 bg-v3-surface border border-v3-border text-v3-text rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-v3-border mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAgency(null);
                }}
                className="px-6 py-2.5 text-sm font-bold text-v3-text bg-v3-surface border border-v3-border rounded-xl hover:bg-v3-border transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-sm font-bold rounded-xl hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all flex items-center gap-2"
              >
                {editingAgency ? <Pencil size={18} /> : <Plus size={18} />}
                {editingAgency ? "Güncelle" : "Acente Oluştur"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Silme Onay Modal */}
        <ConfirmModal
          isOpen={!!agencyToDelete}
          title="Acenteyi Sil"
          message="Bu acenteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={() => agencyToDelete && handleDelete(agencyToDelete)}
          onCancel={() => setAgencyToDelete(null)}
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
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${success ? "bg-green-400/20" : "bg-red-400/20"}`}
            >
              {success ? (
                <Plus size={18} className="text-v3-text" />
              ) : (
                <Building2 size={18} className="text-v3-text" />
              )}
            </div>
            <span className="font-bold text-sm">{success || error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
