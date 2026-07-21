"use client";

import { useState, useEffect, useRef } from "react";
import PaginationControls from "@/components/PaginationControls";
import MultiTokenFilterInput from "@/components/MultiTokenFilterInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ExcelUtils } from "@/utils/excelUtils";
import { formatDate } from "@/utils/formatters";
import { suppliersService } from "@/lib/supabaseService";
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
  Save,
  MapPin,
  Briefcase,
  CreditCard,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  title: string; // Tedarikçi Unvanı
  service_type: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  tax_office: string;
  accounting_link_codes?: {
    TL?: string;
    EUR?: string;
    USD?: string;
    GBP?: string;
  };
  bank_info: {
    bank_name: string;
    account_number: string;
    iban: string;
  };
  contract_info: {
    contract_start: string;
    contract_end: string;
    commission_rate: number;
    payment_terms: string;
  };
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function SuppliersPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    userRole,
    loading: permissionsLoading,
  } = usePermissions();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTokens, setSearchTokens] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    title: "",
    service_type: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
    tax_office: "",
    accounting_link_codes: {
      TL: "",
      EUR: "",
      USD: "",
      GBP: "",
    },
    bank_info: {
      bank_name: "",
      account_number: "",
      iban: "",
    },
    contract_info: {
      contract_start: "",
      contract_end: "",
      commission_rate: 0,
      payment_terms: "",
    },
    is_active: true,
    notes: "",
  });

  // Yeni tedarikçi için ref'ler
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const newTitleInputRef = useRef<HTMLInputElement>(null);
  const newContactPersonInputRef = useRef<HTMLInputElement>(null);
  const newPhoneInputRef = useRef<HTMLInputElement>(null);
  const newEmailInputRef = useRef<HTMLInputElement>(null);
  const newAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const newTaxIdInputRef = useRef<HTMLInputElement>(null);
  const newTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const newBankNameInputRef = useRef<HTMLInputElement>(null);
  const newAccountNumberInputRef = useRef<HTMLInputElement>(null);
  const newIbanInputRef = useRef<HTMLInputElement>(null);
  const newContractStartInputRef = useRef<HTMLInputElement>(null);
  const newContractEndInputRef = useRef<HTMLInputElement>(null);
  const newCommissionRateInputRef = useRef<HTMLInputElement>(null);
  const newPaymentTermsInputRef = useRef<HTMLInputElement>(null);
  const newNotesInputRef = useRef<HTMLTextAreaElement>(null);
  const newTlCodeInputRef = useRef<HTMLInputElement>(null);
  const newEurCodeInputRef = useRef<HTMLInputElement>(null);
  const newUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const newGbpCodeInputRef = useRef<HTMLInputElement>(null);

  // Düzenleme için ref'ler
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const editTitleInputRef = useRef<HTMLInputElement>(null);
  const editContactPersonInputRef = useRef<HTMLInputElement>(null);
  const editPhoneInputRef = useRef<HTMLInputElement>(null);
  const editEmailInputRef = useRef<HTMLInputElement>(null);
  const editAddressInputRef = useRef<HTMLTextAreaElement>(null);
  const editTaxIdInputRef = useRef<HTMLInputElement>(null);
  const editTaxOfficeInputRef = useRef<HTMLInputElement>(null);
  const editBankNameInputRef = useRef<HTMLInputElement>(null);
  const editAccountNumberInputRef = useRef<HTMLInputElement>(null);
  const editIbanInputRef = useRef<HTMLInputElement>(null);
  const editContractStartInputRef = useRef<HTMLInputElement>(null);
  const editContractEndInputRef = useRef<HTMLInputElement>(null);
  const editCommissionRateInputRef = useRef<HTMLInputElement>(null);
  const editPaymentTermsInputRef = useRef<HTMLInputElement>(null);
  const editNotesInputRef = useRef<HTMLTextAreaElement>(null);
  const editTlCodeInputRef = useRef<HTMLInputElement>(null);
  const editEurCodeInputRef = useRef<HTMLInputElement>(null);
  const editUsdCodeInputRef = useRef<HTMLInputElement>(null);
  const editGbpCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      // Supabase'ten tedarikçileri yükle
      const supaSuppliers = await suppliersService.getAll();
      if (supaSuppliers && supaSuppliers.length > 0) {
        const normalized: Supplier[] = supaSuppliers.map((s: any) => ({
          id: s.id || s.uuid || "",
          name: s.name || "",
          title: s.title || "",
          service_type: s.service_type || "",
          contact_person: s.contact_person || "",
          phone: s.phone || "",
          email: s.email || "",
          address: s.address || "",
          tax_id: s.tax_id || "",
          tax_office: s.tax_office || "",
          accounting_link_codes: s.accounting_link_codes || {},
          bank_info: s.bank_info || {},
          contract_info: s.contract_info || {},
          is_active: s.is_active ?? true,
          notes: s.notes || "",
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));
        setSuppliers(normalized);
      } else {
        setSuppliers([]);
      }

      // Hizmet türlerini yükle (varsayılan)
      const defaultServiceTypes = [
        { id: "1", name: "Transfer", code: "TRANSFER" },
        { id: "2", name: "Kokartlı Rehber", code: "GUIDE" },
        { id: "3", name: "Otel", code: "HOTEL" },
        { id: "4", name: "Restoran", code: "RESTAURANT" },
        { id: "5", name: "Eğlence", code: "ENTERTAINMENT" },
        { id: "6", name: "Ulaşım", code: "TRANSPORT" },
        { id: "7", name: "Diğer", code: "OTHER" },
      ];
      setServiceTypes(defaultServiceTypes);

      setLoading(false);
    } catch (error: any) {
      setError("Tedarikçiler yüklenirken hata oluştu");
      setLoading(false);
    }
  };

  const exportSuppliersToExcel = async () => {
    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const workbook = await ExcelUtils.createWorkbook();
      const worksheet = workbook.addWorksheet("Tedarikçiler");

      // Başlık satırı
      const headers = [
        "Tedarikçi Adı",
        "Unvan",
        "Hizmet Türü",
        "İletişim Kişisi",
        "Telefon",
        "E-posta",
        "Adres",
        "Vergi Numarası",
        "Vergi Dairesi",
        "Vade",
        "TL Kodu",
        "EUR Kodu",
        "USD Kodu",
        "GBP Kodu",
        "Durum",
        "Oluşturulma Tarihi",
      ];

      worksheet.addRow(headers);

      // Veri satırları
      filteredSuppliers.forEach((supplier) => {
        worksheet.addRow([
          supplier.name,
          supplier.title || "",
          supplier.service_type,
          supplier.contact_person || "",
          supplier.phone || "",
          supplier.email || "",
          supplier.address || "",
          supplier.tax_id || "",
          supplier.tax_office || "",
          supplier.contract_info?.payment_terms || "",
          supplier.accounting_link_codes?.TL || "",
          supplier.accounting_link_codes?.EUR || "",
          supplier.accounting_link_codes?.USD || "",
          supplier.accounting_link_codes?.GBP || "",
          supplier.is_active ? "Aktif" : "Pasif",
          formatDate(supplier.created_at),
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
      link.download = `tedarikciler_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess("Tedarikçiler başarıyla Excel dosyasına aktarıldı!");
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

      const importedSuppliers: Supplier[] = data.map(
        (row: any, index: number) => ({
          id: Date.now().toString() + index,
          name: row["Tedarikçi Adı"] || "",
          title: row["Unvan"] || "",
          service_type: row["Hizmet Türü"] || "",
          contact_person: row["İletişim Kişisi"] || "",
          phone: row["Telefon"] || "",
          email: row["E-posta"] || "",
          address: row["Adres"] || "",
          tax_id: row["Vergi Numarası"] || "",
          tax_office: row["Vergi Dairesi"] || "",
          bank_info: {
            bank_name: "",
            account_number: "",
            iban: "",
          },
          contract_info: {
            contract_start: "",
            contract_end: "",
            payment_terms: row["Vade"] || "",
            commission_rate: 0,
          },
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
          notes: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      );

      // Mevcut tedarikçilerle birleştir
      const updatedSuppliers = [...suppliers, ...importedSuppliers];
      setSuppliers(updatedSuppliers);

      // Supabase'e kaydet
      try {
        for (const supplier of importedSuppliers) {
          await suppliersService.create({
            name: supplier.name,
            title: supplier.title,
            service_type: supplier.service_type,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            tax_id: supplier.tax_id,
            tax_office: supplier.tax_office,
            accounting_link_codes: supplier.accounting_link_codes,
            bank_info: supplier.bank_info,
            contract_info: supplier.contract_info,
            is_active: supplier.is_active,
            notes: supplier.notes,
            type: "supplier",
          } as any);
        }
        await loadSuppliers();
      } catch (e: any) {
        alert(`Supabase kayıt hatası: ${e?.message || e}`);
      }

      setSuccess(
        `${importedSuppliers.length} tedarikçi başarıyla içe aktarıldı!`,
      );
    } catch (error) {
      console.error("Excel import hatası:", error);
      setError("Excel dosyası okunurken bir hata oluştu.");
    } finally {
      setImporting(false);
      // Input'u temizle
      event.target.value = "";
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowEditModal(true);

    // Ref'lere değerleri set et
    setTimeout(() => {
      if (editNameInputRef.current)
        editNameInputRef.current.value = supplier.name || "";
      if (editTitleInputRef.current)
        editTitleInputRef.current.value = supplier.title || "";
      if (editContactPersonInputRef.current)
        editContactPersonInputRef.current.value = supplier.contact_person || "";
      if (editPhoneInputRef.current)
        editPhoneInputRef.current.value = supplier.phone || "";
      if (editEmailInputRef.current)
        editEmailInputRef.current.value = supplier.email || "";
      if (editAddressInputRef.current)
        editAddressInputRef.current.value = supplier.address || "";
      if (editTaxIdInputRef.current)
        editTaxIdInputRef.current.value = supplier.tax_id || "";
      if (editTaxOfficeInputRef.current)
        editTaxOfficeInputRef.current.value = supplier.tax_office || "";
      if (editTlCodeInputRef.current)
        editTlCodeInputRef.current.value =
          supplier.accounting_link_codes?.TL || "";
      if (editEurCodeInputRef.current)
        editEurCodeInputRef.current.value =
          supplier.accounting_link_codes?.EUR || "";
      if (editUsdCodeInputRef.current)
        editUsdCodeInputRef.current.value =
          supplier.accounting_link_codes?.USD || "";
      if (editGbpCodeInputRef.current)
        editGbpCodeInputRef.current.value =
          supplier.accounting_link_codes?.GBP || "";
      if (editPaymentTermsInputRef.current)
        editPaymentTermsInputRef.current.value =
          supplier.contract_info?.payment_terms || "";
    }, 100);
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    setError("");
    setSuccess("");

    // Ref'lerden değerleri al
    const nameValue = editNameInputRef.current?.value || "";
    const titleValue = editTitleInputRef.current?.value || "";
    const contactPersonValue = editContactPersonInputRef.current?.value || "";
    const phoneValue = editPhoneInputRef.current?.value || "";
    const emailValue = editEmailInputRef.current?.value || "";
    const addressValue = editAddressInputRef.current?.value || "";
    const taxIdValue = editTaxIdInputRef.current?.value || "";
    const taxOfficeValue = editTaxOfficeInputRef.current?.value || "";
    const tlCodeValue = editTlCodeInputRef.current?.value || "";
    const eurCodeValue = editEurCodeInputRef.current?.value || "";
    const usdCodeValue = editUsdCodeInputRef.current?.value || "";
    const gbpCodeValue = editGbpCodeInputRef.current?.value || "";
    const paymentTermsValue = editPaymentTermsInputRef.current?.value || "";

    try {
      await suppliersService.update(editingSupplier.id, {
        name: nameValue,
        title: titleValue,
        contact_person: contactPersonValue,
        phone: phoneValue,
        email: emailValue,
        address: addressValue,
        tax_id: taxIdValue,
        tax_office: taxOfficeValue,
        accounting_link_codes: {
          TL: tlCodeValue,
          EUR: eurCodeValue,
          USD: usdCodeValue,
          GBP: gbpCodeValue,
        },
        contract_info: {
          ...editingSupplier.contract_info,
          payment_terms: paymentTermsValue,
        },
      } as any);

      await loadSuppliers();
      setSuccess("Tedarikçi başarıyla güncellendi");
      setShowEditModal(false);
      setEditingSupplier(null);
    } catch (e: any) {
      console.error(e);
      alert(`Supabase güncelleme hatası: ${e?.message || JSON.stringify(e)}`);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await suppliersService.delete(id);
      await loadSuppliers();
      setSuccess("Tedarikçi başarıyla silindi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Tedarikçi silinirken hata:", error);
      setError("Tedarikçi silinirken hata oluştu");
    } finally {
      setSupplierToDelete(null);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Ref'lerden değerleri al
    const nameValue = newNameInputRef.current?.value || "";
    const titleValue = newTitleInputRef.current?.value || "";
    const contactPersonValue = newContactPersonInputRef.current?.value || "";
    const phoneValue = newPhoneInputRef.current?.value || "";
    const emailValue = newEmailInputRef.current?.value || "";
    const addressValue = newAddressInputRef.current?.value || "";
    const taxIdValue = newTaxIdInputRef.current?.value || "";
    const taxOfficeValue = newTaxOfficeInputRef.current?.value || "";
    const tlCodeValue = newTlCodeInputRef.current?.value || "";
    const eurCodeValue = newEurCodeInputRef.current?.value || "";
    const usdCodeValue = newUsdCodeInputRef.current?.value || "";
    const gbpCodeValue = newGbpCodeInputRef.current?.value || "";
    const paymentTermsValue = newPaymentTermsInputRef.current?.value || "";

    try {
      await suppliersService.create({
        name: nameValue,
        title: titleValue,
        service_type: newSupplier.service_type,
        contact_person: contactPersonValue,
        phone: phoneValue,
        email: emailValue,
        address: addressValue,
        tax_id: taxIdValue,
        tax_office: taxOfficeValue,
        accounting_link_codes: {
          TL: tlCodeValue,
          EUR: eurCodeValue,
          USD: usdCodeValue,
          GBP: gbpCodeValue,
        },
        bank_info: newSupplier.bank_info,
        contract_info: {
          ...newSupplier.contract_info,
          payment_terms: paymentTermsValue,
        },
        is_active: newSupplier.is_active,
        notes: newSupplier.notes,
        type: "supplier",
      } as any);

      await loadSuppliers();
      setSuccess("Tedarikçi başarıyla oluşturuldu");
      setShowCreateModal(false);

      setNewSupplier({
        name: "",
        title: "",
        service_type: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        tax_id: "",
        tax_office: "",
        accounting_link_codes: {
          TL: "",
          EUR: "",
          USD: "",
          GBP: "",
        },
        bank_info: {
          bank_name: "",
          account_number: "",
          iban: "",
        },
        contract_info: {
          contract_start: "",
          contract_end: "",
          commission_rate: 0,
          payment_terms: "",
        },
        is_active: true,
        notes: "",
      });
    } catch (e: any) {
      console.error(e);
      alert(`Supabase kayıt hatası: ${e?.message || JSON.stringify(e)}`);
    }
  };

  const getServiceTypeDisplayName = (type: string) => {
    switch (type) {
      case "transfer":
        return "Transfer";
      case "guide":
        return "Rehber";
      case "hotel":
        return "Otel";
      case "restaurant":
        return "Restoran";
      case "transport":
        return "Ulaşım";
      case "entertainment":
        return "Eğlence";
      case "other":
        return "Diğer";
      default:
        return type;
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "guide":
        return "bg-green-100 text-green-800";
      case "hotel":
        return "bg-purple-100 text-purple-800";
      case "restaurant":
        return "bg-orange-100 text-orange-800";
      case "transport":
        return "bg-red-100 text-red-800";
      case "entertainment":
        return "bg-pink-100 text-pink-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.is_active).length,
    transfer: suppliers.filter((s) => s.service_type === "transfer").length,
    guide: suppliers.filter((s) => s.service_type === "guide").length,
    hotel: suppliers.filter((s) => s.service_type === "hotel").length,
  };

  const searchSuppliers = (
    suppliers: Supplier[],
    term: string,
    tokens: string[],
  ) => {
    if (!term && (!tokens || tokens.length === 0)) return suppliers;

    return suppliers.filter((supplier) => {
      const matches = (s: string) => {
        if (!s) return true;
        const lowerS = s.toLowerCase();
        return (
          supplier.name.toLowerCase().includes(lowerS) ||
          (supplier.title && supplier.title.toLowerCase().includes(lowerS)) ||
          (supplier.service_type &&
            supplier.service_type.toLowerCase().includes(lowerS)) ||
          (supplier.contact_person &&
            supplier.contact_person.toLowerCase().includes(lowerS)) ||
          (supplier.phone && supplier.phone.toLowerCase().includes(lowerS)) ||
          (supplier.email && supplier.email.toLowerCase().includes(lowerS)) ||
          (supplier.address &&
            supplier.address.toLowerCase().includes(lowerS)) ||
          (supplier.tax_id && supplier.tax_id.toLowerCase().includes(lowerS)) ||
          (supplier.tax_office &&
            supplier.tax_office.toLowerCase().includes(lowerS)) ||
          (supplier.notes && supplier.notes.toLowerCase().includes(lowerS))
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

  const sortSuppliers = (
    suppliers: Supplier[],
    field: string,
    direction: "asc" | "desc",
  ) => {
    if (!field) return suppliers;

    return [...suppliers].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "title":
          aValue = a.title;
          bValue = b.title;
          break;
        case "service_type":
          aValue = a.service_type;
          bValue = b.service_type;
          break;
        case "contact_person":
          aValue = a.contact_person;
          bValue = b.contact_person;
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[field as keyof Supplier];
          bValue = b[field as keyof Supplier];
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

  const filteredSuppliers = sortSuppliers(
    searchSuppliers(
      filter === "all"
        ? suppliers
        : suppliers.filter((supplier) =>
            filter === "active"
              ? supplier.is_active
              : filter === "inactive"
                ? !supplier.is_active
                : filter === "transfer"
                  ? supplier.service_type === "transfer"
                  : filter === "guide"
                    ? supplier.service_type === "guide"
                    : filter === "hotel"
                      ? supplier.service_type === "hotel"
                      : true,
          ),
      searchTerm,
      searchTokens,
    ),
    sortField,
    sortDirection,
  );
  const paginatedSuppliers = paginateItems(filteredSuppliers, page, pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchTokens, filter, sortField, sortDirection]);

  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Suppliers görüntüleme yetkisi kontrolü
  if (!canView(Module.SUPPLIERS)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Tedarikçiler sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <a
            href="/"
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Tedarikçiler yükleniyor..." />;
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
                Tedarikçi Yönetimi
              </h1>
              <p className="text-xs text-v3-muted mt-1">
                Transfer, rehber, otel ve diğer hizmet tedarikçilerini yönetin
              </p>
            </div>
          </div>

          {/* Filters & Actions Area */}
          <div className="flex flex-row items-end justify-start xl:justify-end gap-3 flex-1 flex-wrap">
            {/* Search Bar */}
            <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px] max-w-lg shrink-0">
              <label className="text-[10px] font-semibold text-v3-muted uppercase tracking-wider">
                GENEL ARAMA (TEDARİKÇİ, UNVAN, HİZMET...)
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
              onClick={exportSuppliersToExcel}
              disabled={exporting}
              className="h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.5,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V7.5L14.5,2M10,19L7,19V15H10V19M13,19L10,19V15H13V19M16,19L13,19V15H16V19M10,14L7,14V10H10V14M13,14L10,14V10H13V14M16,14L13,14V10H16V14M13,7V3.5L18.5,9H14A1,1 0 0,1 13,8V7Z" />
              </svg>
              {exporting ? "İNDİRİLİYOR..." : "EXCEL İNDİR"}
            </button>

            {canCreate(Module.SUPPLIERS) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 py-2 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0"
              >
                <Plus size={16} /> YENİ TEDARİKÇİ
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
              {stats.total}
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
              {stats.active}
            </span>
          </button>
          <button
            onClick={() => setFilter("transfer")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${filter === "transfer" ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            TRANSFER
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "transfer" ? "bg-purple-500/20 text-purple-300" : "bg-white/10"}`}
            >
              {stats.transfer}
            </span>
          </button>
          <button
            onClick={() => setFilter("guide")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${filter === "guide" ? "bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            REHBER
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "guide" ? "bg-orange-500/20 text-orange-600 dark:text-orange-300" : "bg-white/10"}`}
            >
              {stats.guide}
            </span>
          </button>
          <button
            onClick={() => setFilter("hotel")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${filter === "hotel" ? "bg-pink-500/20 border border-pink-500/30 text-pink-300" : "text-v3-muted hover:text-v3-text hover:bg-v3-border border border-transparent"}`}
          >
            OTEL
            <span
              className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === "hotel" ? "bg-pink-500/20 text-pink-300" : "bg-white/10"}`}
            >
              {stats.hotel}
            </span>
          </button>
        </div>

        {/* Tedarikçiler Tablosu */}
        <div className="bg-v3-surface backdrop-blur-md border border-v3-border rounded-2xl w-full min-w-0 flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <div className="overflow-auto w-full flex-1 custom-scrollbar">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-v3-border sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border border-b border-v3-border"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Tedarikçi Adı
                      {sortField === "name" && (
                        <svg
                          className={`h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border border-b border-v3-border"
                    onClick={() => handleSort("service_type")}
                  >
                    <div className="flex items-center gap-1">
                      Hizmet Türü
                      {sortField === "service_type" && (
                        <svg
                          className={`h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border border-b border-v3-border"
                    onClick={() => handleSort("contact_person")}
                  >
                    <div className="flex items-center gap-1">
                      İletişim
                      {sortField === "contact_person" && (
                        <svg
                          className={`h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                    Vergi Bilgileri
                  </th>
                  <th
                    className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-v3-text uppercase tracking-wider cursor-pointer hover:bg-v3-border border-b border-v3-border"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1">
                      Oluşturulma Tarihi
                      {sortField === "created_at" && (
                        <svg
                          className={`h-3 w-3 ${sortDirection === "asc" ? "rotate-180" : ""}`}
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
                {paginatedSuppliers.items.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-v3-border last:border-0"
                    onDoubleClick={() => handleEditSupplier(supplier)}
                  >
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-sm font-medium text-v3-text">
                      {supplier.name}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                          supplier.service_type === "hotel"
                            ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
                            : supplier.service_type === "transfer"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : supplier.service_type === "guide"
                                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                : "bg-slate-500/10 text-v3-muted border-slate-500/20"
                        }`}
                      >
                        {getServiceTypeDisplayName(supplier.service_type)}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-v3-text">
                          {supplier.contact_person}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {supplier.phone}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {supplier.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5">
                      <div>
                        <div className="text-xs font-medium text-v3-text">
                          Vergi: {supplier.tax_id || "-"}
                        </div>
                        <div className="text-xs text-v3-muted">
                          {supplier.tax_office || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs text-v3-text">
                      {formatDate(supplier.created_at)}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
                          supplier.is_active
                            ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {supplier.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        {canEdit(Module.SUPPLIERS) && (
                          <button
                            onClick={() => handleEditSupplier(supplier)}
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
                        {canDelete(Module.SUPPLIERS) && (
                          <button
                            onClick={() => setSupplierToDelete(supplier.id)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <PaginationControls
          page={paginatedSuppliers.page}
          pageSize={paginatedSuppliers.pageSize}
          total={paginatedSuppliers.total}
          totalPages={paginatedSuppliers.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          preferenceKey="suppliers_page_size"
          compactRight
        />

        {/* Add/Edit Supplier Modal */}
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingSupplier(null);
          }}
          title={editingSupplier ? "Tedarikçi Düzenle" : "Yeni Tedarikçi Ekle"}
          maxWidth="max-w-5xl"
        >
          <form
            onSubmit={
              editingSupplier ? handleUpdateSupplier : handleCreateSupplier
            }
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temel Bilgiler Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  Kurumsal Bilgiler
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                      Tedarikçi Adı *
                    </label>
                    <input
                      ref={editingSupplier ? editNameInputRef : newNameInputRef}
                      type="text"
                      defaultValue={editingSupplier?.name || ""}
                      required
                      className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      placeholder="Kısa isim"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                      Tedarikçi Unvanı *
                    </label>
                    <input
                      ref={
                        editingSupplier ? editTitleInputRef : newTitleInputRef
                      }
                      type="text"
                      defaultValue={editingSupplier?.title || ""}
                      required
                      className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      placeholder="Tam ticari unvan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                        Hizmet Türü *
                      </label>
                      <select
                        value={
                          editingSupplier
                            ? editingSupplier.service_type
                            : newSupplier.service_type
                        }
                        onChange={(e) =>
                          editingSupplier
                            ? setEditingSupplier({
                                ...editingSupplier,
                                service_type: e.target.value,
                              })
                            : setNewSupplier({
                                ...newSupplier,
                                service_type: e.target.value,
                              })
                        }
                        className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm cursor-pointer"
                        required
                      >
                        <option value="">Seçiniz</option>
                        {serviceTypes.map((st) => (
                          <option key={st.id} value={st.name.toLowerCase()}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                        Vade / Ödeme Koşulu
                      </label>
                      <input
                        ref={
                          editingSupplier
                            ? editPaymentTermsInputRef
                            : newPaymentTermsInputRef
                        }
                        type="text"
                        defaultValue={
                          editingSupplier?.contract_info?.payment_terms || ""
                        }
                        className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                        placeholder="Örn: 30 Gün"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                        Vergi No
                      </label>
                      <input
                        ref={
                          editingSupplier ? editTaxIdInputRef : newTaxIdInputRef
                        }
                        type="text"
                        defaultValue={editingSupplier?.tax_id || ""}
                        className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                        Vergi Dairesi
                      </label>
                      <input
                        ref={
                          editingSupplier
                            ? editTaxOfficeInputRef
                            : newTaxOfficeInputRef
                        }
                        type="text"
                        defaultValue={editingSupplier?.tax_office || ""}
                        className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* İletişim Bilgileri Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Phone size={16} className="text-green-400" />
                  </div>
                  İletişim Detayları
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                      İletişim Kişisi *
                    </label>
                    <input
                      ref={
                        editingSupplier
                          ? editContactPersonInputRef
                          : newContactPersonInputRef
                      }
                      type="text"
                      defaultValue={editingSupplier?.contact_person || ""}
                      required
                      className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-sm"
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                        <Phone size={12} /> Telefon *
                      </label>
                      <input
                        ref={
                          editingSupplier ? editPhoneInputRef : newPhoneInputRef
                        }
                        type="tel"
                        defaultValue={editingSupplier?.phone || ""}
                        required
                        className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                        <Mail size={12} /> E-posta *
                      </label>
                      <input
                        ref={
                          editingSupplier ? editEmailInputRef : newEmailInputRef
                        }
                        type="email"
                        defaultValue={editingSupplier?.email || ""}
                        required
                        className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                      <MapPin size={12} /> Adres *
                    </label>
                    <textarea
                      ref={
                        editingSupplier
                          ? editAddressInputRef
                          : newAddressInputRef
                      }
                      defaultValue={editingSupplier?.address || ""}
                      required
                      rows={4}
                      className="w-full px-2.5 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all text-sm resize-none"
                      placeholder="Fatura ve şirket adresi"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Muhasebe Kodları Section */}
            <div className="space-y-4 mt-2">
              <h4 className="text-sm font-bold text-v3-text flex items-center gap-2 border-b border-v3-border pb-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <FileText size={16} className="text-purple-400" />
                </div>
                Muhasebe Bağlantı Kodları
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                    TL Kodu
                  </label>
                  <input
                    ref={
                      editingSupplier ? editTlCodeInputRef : newTlCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingSupplier?.accounting_link_codes?.TL || ""
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                    EUR Kodu
                  </label>
                  <input
                    ref={
                      editingSupplier ? editEurCodeInputRef : newEurCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingSupplier?.accounting_link_codes?.EUR || ""
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                    USD Kodu
                  </label>
                  <input
                    ref={
                      editingSupplier ? editUsdCodeInputRef : newUsdCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingSupplier?.accounting_link_codes?.USD || ""
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-v3-muted uppercase tracking-wider mb-1.5 ml-1">
                    GBP Kodu
                  </label>
                  <input
                    ref={
                      editingSupplier ? editGbpCodeInputRef : newGbpCodeInputRef
                    }
                    type="text"
                    defaultValue={
                      editingSupplier?.accounting_link_codes?.GBP || ""
                    }
                    className="w-full px-4 py-2.5 bg-v3-surface border border-v3-border text-v3-text rounded-xl focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none text-xs transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1 py-2">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="isActiveModal"
                    type="checkbox"
                    className="h-5 w-5 rounded border-v3-border text-blue-600 dark:text-blue-400/50 focus:ring-blue-500/50 bg-v3-surface cursor-pointer transition-all"
                    checked={
                      editingSupplier
                        ? editingSupplier.is_active
                        : newSupplier.is_active
                    }
                    onChange={(e) =>
                      editingSupplier
                        ? setEditingSupplier({
                            ...editingSupplier,
                            is_active: e.target.checked,
                          })
                        : setNewSupplier({
                            ...newSupplier,
                            is_active: e.target.checked,
                          })
                    }
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label
                    htmlFor="isActiveModal"
                    className="font-semibold text-v3-text cursor-pointer"
                  >
                    Aktif Tedarikçi
                  </label>
                  <p className="text-v3-muted text-xs">
                    Bu tedarikçi sistemde listelenecek ve işlem yapılabilecek.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-v3-border mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingSupplier(null);
                }}
                className="px-6 py-2.5 text-sm font-bold text-v3-text bg-v3-surface border border-v3-border rounded-xl hover:bg-v3-border transition-all"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-sm font-bold rounded-xl hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all flex items-center gap-2"
              >
                {editingSupplier ? <Pencil size={18} /> : <Plus size={18} />}
                {editingSupplier
                  ? "Değişiklikleri Kaydet"
                  : "Tedarikçiyi Oluştur"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Silme Onay Modal */}
        <ConfirmModal
          isOpen={!!supplierToDelete}
          title="Tedarikçiyi Sil"
          message="Bu tedarikçiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          onConfirm={() =>
            supplierToDelete && handleDeleteSupplier(supplierToDelete)
          }
          onCancel={() => setSupplierToDelete(null)}
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
                <Save size={18} className="text-v3-text" />
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
