"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  SejourService,
  AgencyService,
  HotelService,
  SupplierService,
  ServiceTypeService,
  SettingsService,
  categoriesService,
} from "@/lib/supabaseService";
import { usePermissions, Module } from "@/lib/permissions";
import { getLogosForExcel } from "@/utils/logoUtils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import EditAIInvoiceModal from "@/components/ocr/EditAIInvoiceModal";
import Modal from "@/components/Modal";
import { CheckCircle2, Edit2, Trash2, Eye, X } from "lucide-react";

// Basit arama ve klavye destekli ComboBox - Modernize Edildi
function ComboBox({
  options,
  value,
  onChange,
  placeholder = "Seçin...",
  className = "",
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  const getName = (o: any) =>
    String((o && (o.name ?? o.label ?? o.title)) || "");
  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) =>
    getName(o).toLowerCase().includes(query.toLowerCase()),
  );

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
    setHighlight(-1);
  }

  const getDropdownPosition = () => {
    if (!inputRef) return { top: 0, left: 0, width: 300 };

    const rect = inputRef.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 200),
    };
  };

  const position = getDropdownPosition();

  return (
    <div className="relative">
      <div
        className={`relative flex items-center bg-v3-surface border-2 border-gray-100 dark:border-gray-700/50 rounded-lg transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 ${className}`}
      >
        <input
          ref={setInputRef}
          className="w-full px-2 py-1 bg-transparent text-xs font-bold text-v3-text placeholder-gray-400 outline-none"
          placeholder={open ? (selected?.name || placeholder) : placeholder}
          value={open ? query : selected ? getName(selected) : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => {
            setOpen(true);
            setHighlight(0);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
              setOpen(true);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % Math.max(filtered.length, 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight(
                (h) =>
                  (h - 1 + Math.max(filtered.length, 1)) %
                  Math.max(filtered.length, 1),
              );
            }
            if (e.key === "Enter") {
              if (filtered.length > 0)
                handleSelect(filtered[Math.max(highlight, 0)].id);
            }
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
              setHighlight(-1);
            }
          }}
          autoComplete="off"
        />
        <div className="pr-4 pointer-events-none text-v3-muted">
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
        </div>
      </div>
      {open && (
        <div
          className="fixed z-[9999] bg-v3-surface border border-v3-border rounded shadow-sm max-h-56 overflow-auto animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            minWidth: "200px",
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-2 py-1 text-xs font-bold text-v3-muted">
              Sonuç bulunamadı
            </div>
          ) : (
            filtered.map((o, i) => (
              <div
                key={o.id}
                className={`px-2 py-1 text-xs font-bold cursor-pointer transition-colors duration-200 ${i === highlight ? "bg-blue-500 text-white" : "text-v3-text hover:bg-gray-100 dark:hover:bg-gray-700/50"}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(o.id);
                }}
              >
                {getName(o)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface Room {
  id: string;
  roomNumber: string;
  hotelId: string;
  supplierId?: string;
  checkIn?: string;
  checkOut?: string;
  accommodationType?: string;
  roomType: string;
  guestInfo: string;
  price: number;
  currency: string;
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
  hotelName?: string;
}

interface FlightInfo {
  id: string;
  flightDate: string;
  airline: string;
  route: string;
  departureAirport?: string;
  arrivalAirport?: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  currency: string;
  type: "departure" | "return";
  // Biletleme alanları
  ticketingDate: string;
  ticketingProvider: string;
  pnr: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface TransferInfo {
  id: string;
  date: string;
  provider: string;
  type: "private" | "economic";
  vehicle: string;
  vehicleType?: string;
  time: string;
  price: number;
  currency: string;
  direction: "arrival" | "return" | "intermediate";
  routeDescription?: string;
  // Alış maliyeti için yeni alanlar
  costPrice?: number;
  costCurrency?: string;
}

interface ExtraService {
  id: string;
  serviceType: string;
  date?: string;
  provider: string;
  description: string;
  price: number;
  currency: string;
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  // Alış maliyeti için alanlar (sadece alış tab'ında kullanılır)
  costPrice?: number;
  costCurrency?: string;
}

interface Collection {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  currency: string;
  note?: string;
  method?: string;
}

export default function EditSejourPage() {
  // --- V6 INJECTED STATES ---
  const [activeMainTab, setActiveMainTab] = useState<'info' | 'details' | 'invoices'>('info');
  const [activeTabV6, setActiveTabV6] = useState("sales");
  const [isEditingInfoV6, setIsEditingInfoV6] = useState(false);
  const [expandedSectionsV6, setExpandedSectionsV6] = useState<string[]>(["rooms", "flights", "transfers", "extraServices"]);

  const toggleSection = (section: string) => {
    setExpandedSectionsV6(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };
  const [roomPriceInputV6, setRoomPriceInputV6] = useState<Record<string, string>>({});
  const [roomCostInputV6, setRoomCostInputV6] = useState<Record<string, string>>({});
  const [servicePriceInputV6, setServicePriceInputV6] = useState<Record<string, string>>({});
  const [serviceCostInputV6, setServiceCostInputV6] = useState<Record<string, string>>({});

  const parseAmountV6 = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };
  
  const formatAmountV6 = (val: number) => {
    if (!val && val !== 0) return "";
    return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  // -------------------------

  const { isDark } = useTheme();
  const { canEdit, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const params = useParams();
  const sejourId = params.id as string;
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Voucher PDF states
  const voucherRef = useRef<HTMLDivElement>(null);
  const [darkIconLogo, setDarkIconLogo] = useState<string>("");
  const [darkWordmarkLogo, setDarkWordmarkLogo] = useState<string>("");
  const [companyInfo, setCompanyInfo] = useState({
    company_name:
      typeof document !== "undefined"
        ? document.title.split("-")[0].trim()
        : "Firma",
    company_email: "info@firma.com",
    company_phone: "",
    company_address: "",
    company_website: "www.firma.com",
  });

  // Sales Form Data
  const [salesData, setSalesData] = useState({
    voucherNumber: "",
    customerType: "agency", // 'agency' or 'individual'
    agencyId: "",
    customerName: "",
    checkInDate: "",
    checkOutDate: "",
    totalAmount: 0,
    currency: "TRY",
    status: "BEKLEMEDE",
    notes: "",
  });

  // Rooms
  const [rooms, setRooms] = useState<Room[]>([]);

  // Flight Info
  const [flights, setFlights] = useState<FlightInfo[]>([]);

  // Transfer Info
  const [transfers, setTransfers] = useState<TransferInfo[]>([]);

  // Extra Services
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);

  // Service Price Input State for TR formatting
  const [servicePriceInput, setServicePriceInput] = useState<
    Record<string, string>
  >({});

  // Real Data States
  const [agencies, setAgencies] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierServiceTypes, setSupplierServiceTypes] = useState<any[]>([]);
  const [sejourInvoices, setSejourInvoices] = useState<any[]>([]);
  const [invoicedSalesItemIds, setInvoicedSalesItemIds] = useState<Set<string>>(new Set());
  const [invoicedPurchaseItemIds, setInvoicedPurchaseItemIds] = useState<Set<string>>(new Set());
  const [editModalInvoice, setEditModalInvoice] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [roomTypes] = useState([
    "Standart Oda",
    "Kara Manzaralı",
    "Deniz Manzaralı",
    "Kısmi Deniz Manzaralı",
    "Suite",
    "King Suite",
    "Villa",
    "Deluxe Oda",
    "Executive Suite",
  ]);

  const [vehicleTypes] = useState([
    "Vito",
    "Binek",
    "S Class",
    "Sprinter",
    "Otobüs",
  ]);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load agencies
        const agenciesData = await AgencyService.getAgencies();
        setAgencies(agenciesData);

        // Load hotels
        const hotelsData = await HotelService.getHotels();
        setHotels(hotelsData);

        // Load suppliers
        const suppliersData = await SupplierService.getSuppliers();
        setSuppliers(suppliersData);

        // Load service types
        const serviceTypesData = await ServiceTypeService.getServiceTypes();
        setSupplierServiceTypes(serviceTypesData);

        // Load categories
        const allCategories = await categoriesService.getAll();
        setCategories(allCategories);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
    loadLogos();
    loadCompanyInfo();
  }, []);

  const loadLogos = async () => {
    try {
      const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(false);
      if (iconLogoBase64) setDarkIconLogo(iconLogoBase64);
      if (wordmarkLogoBase64) setDarkWordmarkLogo(wordmarkLogoBase64);
    } catch (error) {
      console.error("Error loading logos:", error);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      const settings = await SettingsService.getSettings();
      const generalSettings = settings.general_settings || {};
      setCompanyInfo({
        company_name:
          generalSettings.companyName || generalSettings.company_name ||
          (typeof document !== "undefined"
            ? document.title.split("-")[0].trim()
            : "Firma"),
        company_email: generalSettings.companyEmail || generalSettings.company_email || "info@firma.com",
        company_phone: generalSettings.companyPhone || generalSettings.company_phone || "",
        company_address: generalSettings.companyAddress || generalSettings.company_address || "",
        company_website:
          generalSettings.companyWebsite || generalSettings.company_website || "www.firma.com",
      });
    } catch (error) {
      console.error("Error loading company info:", error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!voucherRef.current) return;

    try {
      setIsGeneratingPDF(true);
      const voucherElement = voucherRef.current;

      // Her ihtimale karşı kısa bir gecikme ekle (logoların render olması için)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(voucherElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: true,
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pageWidth,
        Math.min(imgHeight, pageHeight),
      );
      pdf.save(`voucher-${salesData.voucherNumber || "draft"}.pdf`);
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast.error(
        "PDF oluşturulurken hata oluştu: " + (error as Error).message,
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const loadSejourInvoices = async () => {
    if (!sejourId || typeof sejourId !== "string") return;
    try {
      const response = await fetch(`/api/invoices/list?entityId=${sejourId}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && data.invoices) {
        setSejourInvoices(data.invoices);
        
        const salesIds = new Set<string>();
        const purchaseIds = new Set<string>();
        
        data.invoices.forEach((inv: any) => {
          if (inv.invoice_items && Array.isArray(inv.invoice_items)) {
            inv.invoice_items.forEach((item: any) => {
              if (item.item_id) {
                if (item.item_type === 'sales') salesIds.add(item.item_id);
                if (item.item_type === 'purchase') purchaseIds.add(item.item_id);
              }
            });
          }
        });
        
        setInvoicedSalesItemIds(salesIds);
        setInvoicedPurchaseItemIds(purchaseIds);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveInvoice = async (invoice: any) => {
    try {
      setUpdatingId(invoice.id);
      const res = await fetch('/api/invoices/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      });
      if (!res.ok) throw new Error('Failed to approve');
      
      toast.success('Fatura onaylandı.');
      loadSejourInvoices();
    } catch (err) {
      console.error("Fatura onaylanırken hata:", err);
      toast.error("Fatura onaylanırken hata oluştu.");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteConfirmId) return;
    try {
      setUpdatingId(deleteConfirmId);
      const res = await fetch("/api/invoices/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: deleteConfirmId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Fatura başarıyla silindi.");
      loadSejourInvoices();
    } catch (err) {
      console.error("Fatura silinirken hata:", err);
      toast.error("Fatura silinirken hata oluştu.");
    } finally {
      setUpdatingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteClick = (invoiceId: string) => {
    setDeleteConfirmId(invoiceId);
  };

  // Load existing sejour data
  useEffect(() => {
    const loadSejourData = async () => {
      if (sejourId) {
        try {
          const sejour = await SejourService.getSejourWithDetails(sejourId);

          if (sejour) {
            setSalesData({
              voucherNumber: sejour.voucherNumber || "",
              customerType: sejour.customerType || "agency",
              agencyId: sejour.agencyId || "",
              customerName: sejour.customerName || "",
              checkInDate: sejour.checkInDate || "",
              checkOutDate: sejour.checkOutDate || "",
              totalAmount: sejour.totalAmount || 0,
              currency: sejour.currency || "TRY",
              status: sejour.status || "BEKLEMEDE",
              notes: sejour.notes || "",
            });

            if (sejour.rooms) {
              setRooms(sejour.rooms.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));
              if (sejour.rooms.length > 0) setShowAccommodation(true);
            }
            if (sejour.flights) {
              setFlights(sejour.flights.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));
              if (sejour.flights.length > 0) setShowFlight(true);
            }
            if (sejour.transfers) {
              setTransfers(sejour.transfers.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));
              if (sejour.transfers.length > 0) setShowTransfer(true);
            }
            if (sejour.extraServices) {
              setExtraServices(sejour.extraServices.map((x: any) => ({ ...x, costCurrency: x.costCurrency || 'TRY', currency: x.currency || 'TRY' })));
              if (sejour.extraServices.length > 0) setShowExtraServices(true);
            }
              if (sejour.collections) {
              // Mevcut tahsilatlarda currency yoksa ekle
              const collectionsWithCurrency = sejour.collections.map(
                (collection: any) => ({
                  ...collection,
                  currency: collection.currency || "TRY",
                }),
              );
              setCollections(collectionsWithCurrency);
            }

            // Datalar yüklendiğinde içi dolu olan sekmeleri otomatik olarak aç
            const sectionsToExpand: string[] = [];
            if (sejour.rooms && sejour.rooms.length > 0) sectionsToExpand.push("rooms");
            if (sejour.flights && sejour.flights.length > 0) sectionsToExpand.push("flights");
            if (sejour.transfers && sejour.transfers.length > 0) sectionsToExpand.push("transfers");
            if (sejour.extraServices && sejour.extraServices.length > 0) sectionsToExpand.push("extraServices");
            
            if (sectionsToExpand.length > 0) {
              setExpandedSectionsV6(sectionsToExpand);
            }
          }
          
          // Faturaları yükle
          await loadSejourInvoices();
        } catch (error) {
          console.error("Error loading sejour data:", error);
        }
      }
    };

    loadSejourData();
  }, [sejourId]);

  // Section visibility states
  const [showAccommodation, setShowAccommodation] = useState(true);
  const [showFlight, setShowFlight] = useState(true);
  const [showTransfer, setShowTransfer] = useState(true);
  const [showExtraServices, setShowExtraServices] = useState(true);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setSalesData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSalesData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  // Room Management
  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      roomNumber: `Oda ${rooms.length + 1}`,
      checkIn: salesData.checkInDate,
      checkOut: salesData.checkOutDate,
      hotelId: "",
      accommodationType: "",
      roomType: "",
      guestInfo: "",
      price: 0,
      currency: "TRY",
      costPrice: 0,
    };
    setRooms([...rooms, newRoom]);
  };

  // Flight Management
  const addFlight = (type: "departure" | "return") => {
    const newFlight: FlightInfo = {
      id: Date.now().toString(),
      flightDate:
        type === "departure" ? salesData.checkInDate : salesData.checkOutDate,
      airline: "",
      route: "",
      flightNo: "",
      departureTime: "",
      arrivalTime: "",
      price: 0,
      currency: "TRY",
      costCurrency: "TRY",
      type: type,
      ticketingDate: new Date().toISOString().split("T")[0], // Bugünün tarihi
      ticketingProvider: "",
      pnr: "",
      costPrice: 0,
    };
    setFlights([...flights, newFlight]);
  };

  const updateFlight = (
    id: string,
    field: keyof FlightInfo,
    value: string | number,
  ) => {
    setFlights(
      flights.map((flight) =>
        flight.id === id ? { ...flight, [field]: value } : flight,
      ),
    );
  };

  const removeFlight = (id: string) => {
    setFlights(flights.filter((flight) => flight.id !== id));
  };

  // Transfer Management
  const addTransfer = (direction: "arrival" | "return" | "intermediate") => {
    const newTransfer: TransferInfo = {
      id: Date.now().toString(),
      date:
        direction === "arrival"
          ? salesData.checkInDate
          : direction === "intermediate"
            ? salesData.checkOutDate
            : salesData.checkOutDate,
      provider: "",
      type: "private",
      vehicle: "",
      time: "",
      price: 0,
      currency: "TRY",
      costCurrency: "TRY",
      direction: direction,
      costPrice: 0,
    };
    setTransfers([...transfers, newTransfer]);
  };

  const updateTransfer = (
    id: string,
    field: keyof TransferInfo,
    value: string | number,
  ) => {
    setTransfers(
      transfers.map((transfer) =>
        transfer.id === id ? { ...transfer, [field]: value } : transfer,
      ),
    );
  };

  const removeTransfer = (id: string) => {
    setTransfers(transfers.filter((transfer) => transfer.id !== id));
  };

  const updateRoom = (
    id: string,
    field: keyof Room,
    value: string | number,
  ) => {
    setRooms(
      rooms.map((room) =>
        room.id === id ? { ...room, [field]: value } : room,
      ),
    );
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  // Extra Service Management
  const addExtraService = () => {
    const newService: ExtraService = {
      id: Date.now().toString(),
      date: salesData.checkInDate,
      serviceType: "",
      provider: "",
      description: "",
      price: 0,
      currency: "TRY",
      costPrice: 0,
    };
    setExtraServices([...extraServices, newService]);
  };

  const updateExtraService = (
    id: string,
    field: keyof ExtraService,
    value: string | number,
  ) => {
    setExtraServices(
      extraServices.map((service) =>
        service.id === id ? { ...service, [field]: value } : service,
      ),
    );
  };

  const removeExtraService = (id: string) => {
    setExtraServices(extraServices.filter((service) => service.id !== id));
  };

  // TR format helper
  const formatAmount = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "0,00";
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // TR format input helpers
  const normalizeTyping = (value: string) =>
    value.replace(/[^\d,]/g, "").replace(/,/g, ".");

  const parseTrAmount = (value: string): number | null => {
    if (!value) return null;
    const normalized = value.replace(/\./g, "").replace(/,/g, ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  // Currency options in order
  const CURRENCY_OPTIONS = ["TRY", "EUR", "USD", "GBP"];

  // Calculate total amount by currency
  const calculateTotalAmount = () => {
    const totals = {
      TRY: 0,
      EUR: 0,
      USD: 0,
      GBP: 0,
    } as Record<string, number>;

    // Room totals
    rooms.forEach((room) => {
      totals[room.currency as keyof typeof totals] += room.price;
    });

    // Flight totals
    flights.forEach((flight) => {
      totals[flight.currency as keyof typeof totals] += flight.price;
    });

    // Transfer totals
    transfers.forEach((transfer) => {
      totals[transfer.currency as keyof typeof totals] += transfer.price;
    });

    // Service totals
    extraServices.forEach((service) => {
      totals[service.currency as keyof typeof totals] += service.price;
    });

    return totals;
  };

  // Calculate total cost by currency
  const calculateTotalCost = () => {
    const costs = {
      TRY: 0,
      EUR: 0,
      USD: 0,
      GBP: 0,
    } as Record<string, number>;

    // Room costs
    rooms.forEach((room) => {
      const costCurrency = room.costCurrency || room.currency;
      costs[costCurrency as keyof typeof costs] += room.costPrice || 0;
    });

    // Flight costs
    flights.forEach((flight) => {
      const costCurrency = flight.costCurrency || flight.currency;
      costs[costCurrency as keyof typeof costs] += flight.costPrice || 0;
    });

    // Transfer costs
    transfers.forEach((transfer) => {
      const costCurrency = transfer.costCurrency || transfer.currency;
      costs[costCurrency as keyof typeof costs] += transfer.costPrice || 0;
    });

    // Service costs
    extraServices.forEach((service) => {
      const costCurrency = service.costCurrency || service.currency;
      costs[costCurrency as keyof typeof costs] += service.costPrice || 0;
    });

    return costs;
  };

  // Get total for specific currency
  const getTotalForCurrency = (currency: string) => {
    const totals = calculateTotalAmount();
    return totals[currency as keyof typeof totals] || 0;
  };

  // Get cost for specific currency
  const getCostForCurrency = (currency: string) => {
    const costs = calculateTotalCost();
    return costs[currency as keyof typeof costs] || 0;
  };

  // Calculate profit/loss for specific currency
  const getProfitForCurrency = (currency: string) => {
    const total = getTotalForCurrency(currency);
    const cost = getCostForCurrency(currency);
    return total - cost;
  };

  const getCollectionForCurrency = (currency: string) => {
    return collections
      .filter((c) => c.currency === currency)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  // Collections Management
  const addCollection = () => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      type: "Banka Havalesi",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      currency: "TRY",
    };
    setCollections([...collections, newCollection]);
  };

  const updateCollection = (
    id: string,
    field: keyof Collection,
    value: string | number,
  ) => {
    setCollections(
      collections.map((collection) =>
        collection.id === id ? { ...collection, [field]: value } : collection,
      ),
    );
  };

  const removeCollection = (id: string) => {
    setCollections(collections.filter((collection) => collection.id !== id));
  };

  const calculateTotalCollections = () => {
    return collections.reduce((sum, collection) => sum + collection.amount, 0);
  };

  const calculateTotalCollectionsByCurrency = (currency: string) => {
    return collections
      .filter((collection) => collection.currency === currency)
      .reduce((sum, collection) => sum + collection.amount, 0);
  };

  const calculateBalance = () => {
    const totalAmount = getTotalForCurrency(salesData.currency);
    return totalAmount - calculateTotalCollections();
  };

  const calculateBalanceByCurrency = (currency: string) => {
    const totalAmount = getTotalForCurrency(currency);
    const totalCollections = calculateTotalCollectionsByCurrency(currency);
    return totalAmount - totalCollections;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!salesData.voucherNumber.trim()) {
        setError("Voucher numarası gereklidir");
        return;
      }

      // Müşteri tipi Acenta ise acente seçimi zorunlu, Şahıs ise zorunlu değil
      if (salesData.customerType === "agency" && !salesData.agencyId) {
        setError("Acente seçimi gereklidir");
        return;
      }

      if (!salesData.checkInDate || !salesData.checkOutDate) {
        setError("Giriş ve çıkış tarihleri gereklidir");
        return;
      }

      if (new Date(salesData.checkInDate) >= new Date(salesData.checkOutDate)) {
        setError("Çıkış tarihi giriş tarihinden sonra olmalıdır");
        return;
      }

      // Update existing sejour object
      const sejourData = {
        id: sejourId,
        voucherNumber: salesData.voucherNumber,
        customerType: salesData.customerType,
        agencyId: salesData.agencyId,
        agencyName:
          salesData.customerType === "agency"
            ? agencies.find((a) => a.id === salesData.agencyId)?.name
            : "",
        customerName: salesData.customerName,
        checkInDate: salesData.checkInDate,
        checkOutDate: salesData.checkOutDate,
        rooms: rooms,
        flights: flights,
        transfers: transfers,
        extraServices: extraServices,
        totalAmount:
          calculateTotalAmount()[
            salesData.currency as keyof ReturnType<typeof calculateTotalAmount>
          ] ||
          calculateTotalAmount().TRY ||
          0,
        totals: calculateTotalAmount(),
        costs: calculateTotalCost(),
        profits: {
          TRY: getProfitForCurrency("TRY"),
          EUR: getProfitForCurrency("EUR"),
          USD: getProfitForCurrency("USD"),
          GBP: getProfitForCurrency("GBP"),
        },
        currency: salesData.currency,
        status: salesData.status,
        notes: salesData.notes,
        collections: collections,
        updated_at: new Date().toISOString(),
      };

      // Debug: Maliyet verilerini kontrol et
      console.log("Sejour data before update:", {
        rooms: rooms.map((r) => ({
          id: r.id,
          costPrice: r.costPrice,
          costCurrency: r.costCurrency,
        })),
        flights: flights.map((f) => ({
          id: f.id,
          costPrice: f.costPrice,
          costCurrency: f.costCurrency,
        })),
        transfers: transfers.map((t) => ({
          id: t.id,
          costPrice: t.costPrice,
          costCurrency: t.costCurrency,
        })),
        extraServices: extraServices.map((s) => ({
          id: s.id,
          costPrice: s.costPrice,
          costCurrency: s.costCurrency,
        })),
      });

      // Update Supabase
      await SejourService.updateSejour(sejourId, sejourData);

      console.log("Sejour updated and saved to Supabase:", {
        sejourData,
        sejourId,
      });

      toast.success("Sejour başarıyla güncellendi!");
      setSuccess("Sejour başarıyla güncellendi!");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.refresh();
        router.push("/sejour");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.details ||
        error?.hint ||
        (typeof error === "string" ? error : "") ||
        "Sejour güncellenirken bir hata oluştu";
      console.error("Error updating sejour:", errorMessage, error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  if (permissionsLoading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  // Sejour düzenleme yetkisi kontrolü
  if (!canEdit(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Yetki Gerekli
          </h1>
          <p className="text-v3-muted mb-6">
            Sejour kaydını düzenlemek için yetkiniz bulunmuyor.
          </p>
          <button
            onClick={() => router.push("/sejour")}
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Sejour Listesine Dön
          </button>
        </div>
      </div>
    );
  }
  const tabs = [
    { id: "sales", name: "SATIŞ", icon: "💰" },
    { id: "purchase", name: "ALIŞ", icon: "🛒" },
    { id: "collections", name: "TAHSİLAT", icon: "💳" },
  ];

  // Basit arama destekli açılır liste (klavye destekli) - Modernize Edildi
  const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    className = "",
  }: {
    options: { id: string; name: string }[];
    value: string;
    onChange: (id: string) => void;
    placeholder: string;
    className?: string;
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const selected = options.find((o) => o.id === value);
    const display = open ? query : selected?.name || "";

    const filtered = useMemo(() => {
      if (!query) return options.slice(0, 100);
      const lowerQuery = query.toLowerCase();
      return options
        .filter((o) => o.name?.toLowerCase().includes(lowerQuery))
        .slice(0, 100);
    }, [options, query]);

    const handleSelect = (id: string) => {
      onChange(id);
      setOpen(false);
      setQuery("");
    };
    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative flex items-center bg-v3-surface border-2 border-gray-100 dark:border-gray-700/50 rounded-lg transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
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
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={open ? (selected?.name || placeholder) : placeholder}
            className="w-full px-2 py-1.5 bg-transparent text-xs text-v3-text placeholder-gray-400 outline-none"
          />
          <div className="pr-6 pointer-events-none text-v3-muted">
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
          </div>
        </div>
        {open && (
          <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-auto bg-v3-surface border border-v3-border rounded-lg shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 text-[10px] font-black text-v3-muted uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
              {filtered.length} sonuç
            </div>
            {filtered.map((opt, idx) => (
              <button
                type="button"
                key={opt.id}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left px-2 py-1 text-xs font-bold transition-colors duration-200 ${idx === highlight ? "bg-blue-500 text-white" : "text-v3-text hover:bg-gray-100 dark:hover:bg-gray-700/50"}`} tabIndex={-1}
              >
                {opt.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-5 py-4 text-xs font-bold text-v3-muted italic">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mb-4"
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
          <div className="text-gray-500 font-medium text-sm">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  // Yetki kontrolü
  if (!canEdit(Module.SEJOUR)) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-v3-text mb-4">
            Erişim Reddedildi
          </h1>
          <p className="text-v3-muted mb-1">
            Sejour düzenleme sayfasına erişim için yetkiniz bulunmuyor.
          </p>
          <button
            onClick={() => router.push("/sejour")}
            className="bg-blue-500 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-colors duration-200"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  


  return (
    <div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-1 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex justify-between items-center bg-v3-surface p-1 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
              <div>
                <h1 className="text-xl font-bold text-v3-text tracking-tight">
                  Sejour Düzenle
                </h1>
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-widest">
                  {salesData.voucherNumber || "Yükleniyor..."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-blue-500 hover:bg-blue-500/90 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center disabled:opacity-70 disabled:cursor-wait"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3 mr-2"
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
                    HAZIRLANIYOR...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    PDF VOUCHER İNDİR
                  </>
                )}
              </button>
              <button
                onClick={() => router.push("/sejour")}
                className="px-6 py-2.5 bg-white dark:bg-gray-700 text-v3-text text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </div>

        {/* Status and Messages */}
        <div className="max-w-[1800px] mx-auto mb-2">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20/80 dark:bg-red-900/20 backdrop-blur-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-2 py-1.5 rounded-lg mb-1 flex items-center shadow-lg shadow-red-500/10 animate-in zoom-in-95 duration-300">
              <span className="mr-3 text-xl">⚠️</span>
              <p className="font-bold text-sm tracking-tight">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20/80 dark:bg-emerald-900/20 backdrop-blur-md border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 px-2 py-1.5 rounded-lg mb-1 flex items-center shadow-lg shadow-emerald-500/10 animate-in zoom-in-95 duration-300">
              <span className="mr-3 text-xl">✅</span>
              <p className="font-bold text-sm tracking-tight">{success}</p>
            </div>
          )}
        </div>

                <form onSubmit={handleSubmit} className="relative pb-32">
          
            {/* NEW: Sticky Main Tabs - Full Width Minimal */}
            <div className="sticky top-0 z-40 pb-2 pt-2 mb-6 border-b border-v3-border bg-black/5 dark:bg-white/5 backdrop-blur-md">
              <div className="max-w-[1920px] mx-auto px-4 flex justify-between items-center w-full">
                {/* Left Back Button */}
                <div className="w-[120px]">
                  <Link
                    href="/sejour"
                    className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-v3-muted dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-v3-text dark:hover:text-v3-text transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    GERİ DÖN
                  </Link>
                </div>
                
                {/* Center Tabs */}
                <div className="flex bg-transparent p-1 rounded-xl border border-v3-border w-full max-w-[500px]">
                   <button 
                     type="button"
                     onClick={() => setActiveMainTab('info')} 
                     className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'info' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-600 dark:text-gray-400 hover:text-v3-text hover:bg-v3-border'}`}
                   >
                     SEJOUR BİLGİLERİ
                   </button>
                   <button 
                     type="button"
                     onClick={() => setActiveMainTab('details')} 
                     className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'details' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-600 dark:text-gray-400 hover:text-v3-text hover:bg-v3-border'}`}
                   >
                     SEJOUR DETAYLARI
                   </button>
                   <button 
                     type="button"
                     onClick={() => setActiveMainTab('invoices')} 
                     className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'invoices' ? 'bg-emerald-600/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-600 dark:text-gray-400 hover:text-v3-text hover:bg-v3-border'}`}
                   >
                     FATURALAR
                   </button>
                </div>
                
                {/* Right Action Button Placeholder */}
                <div className="w-[120px] flex justify-end"></div>
              </div>
            </div>

          {/* INNER DETAY TABS */}
          {activeMainTab === 'details' && (
            <div className="flex justify-center mb-6">
              <div className="flex bg-transparent p-1 rounded-xl border border-v3-border w-full max-w-[600px]">
                 <button 
                   type="button"
                   onClick={() => setActiveTabV6('sales')} 
                   className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTabV6 === 'sales' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-600 dark:text-gray-400 hover:text-v3-text hover:bg-v3-border'}`}
                 >
                   SATIŞ HİZMETLERİ
                 </button>
                 <button 
                   type="button"
                   onClick={() => setActiveTabV6('purchase')} 
                   className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTabV6 === 'purchase' ? 'bg-indigo-600/90 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-gray-600 dark:text-gray-400 hover:text-v3-text hover:bg-v3-border'}`}
                 >
                   ALIŞ (MALİYET)
                 </button>
                 <button 
                   type="button"
                   onClick={() => setActiveTabV6('collection')} 
                   className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTabV6 === 'collection' ? 'bg-emerald-600/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-600 dark:text-gray-400 hover:text-v3-text hover:bg-v3-border'}`}
                 >
                   TAHSİLAT
                 </button>
              </div>
            </div>
          )}

          {/* SEJOUR BİLGİLERİ TABI */}
          {activeMainTab === 'info' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* SEJOUR BİLGİLERİ (HEADER) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sejour Bilgileri</h2>
                      <p className="text-[10px] text-gray-500 font-medium">Voucher detayları ve genel rezervasyon bilgileri</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingInfoV6(!isEditingInfoV6)}
                    className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    {isEditingInfoV6 ? "Detayları Gizle" : "Detayları Düzenle"}
                  </button>
                </div>

                {!isEditingInfoV6 ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Voucher No</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{salesData.voucherNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Acente</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {salesData.agencyId ? agencies.find(a => a.id === salesData.agencyId)?.name : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Giriş - Çıkış</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {salesData.checkInDate ? new Date(salesData.checkInDate).toLocaleDateString("tr-TR") : "-"} - {salesData.checkOutDate ? new Date(salesData.checkOutDate).toLocaleDateString("tr-TR") : "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">İç Notlar</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{salesData.notes || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Durum</p>
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                        salesData.status === "BEKLEMEDE" ? "bg-amber-100 text-amber-700" :
                        salesData.status === "KONFIRME" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {salesData.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1] lg:[&>*:nth-child(6)]:flex-[1] lg:[&>*:nth-child(7)]:flex-[0.5] lg:[&>*:nth-child(8)]:flex-[2]">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Voucher No *</label>
                        <input type="text" name="voucherNumber" value={salesData.voucherNumber} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Müşteri Tipi *</label>
                        <select name="customerType" value={salesData.customerType || "agency"} onChange={(e) => setSalesData(prev => ({...prev, customerType: e.target.value, agencyId: "", customerName: ""}))} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                          <option value="agency">Acente</option>
                          <option value="individual">Şahıs</option>
                        </select>
                      </div>
                      {salesData.customerType === "agency" ? (
                        <div className="relative z-[100]">
                          <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Acente Seçimi *</label>
                          <div className="h-[36px]">
                            <SearchableSelect options={agencies.map(a => ({id: a.id, name: a.name}))} value={salesData.agencyId} onChange={(val) => setSalesData(prev => ({...prev, agencyId: val}))} placeholder="Acente ara..." />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Şahıs (Ad Soyad) *</label>
                          <input type="text" name="customerName" value={salesData.customerName || ""} onChange={handleInputChange} placeholder="İsim Soyisim..." className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Giriş Tarihi *</label>
                        <input type="date" name="checkInDate" value={salesData.checkInDate} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Çıkış Tarihi *</label>
                        <input type="date" name="checkOutDate" value={salesData.checkOutDate} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Durum</label>
                        <select name="status" value={salesData.status} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                          <option value="BEKLEMEDE">⏳ BEKLEMEDE</option>
                          <option value="KONFIRME">✅ KONFİRME</option>
                          <option value="İPTAL">❌ İPTAL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">İç Notlar</label>
                        <input type="text" name="notes" placeholder="Eklemek istediğiniz notlar..." value={salesData.notes} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SATIŞ HİZMETLERİ BÖLÜMÜ */}
          {activeMainTab === 'details' && activeTabV6 === 'sales' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* HİZMETLER BÖLÜMÜ BAŞLIĞI */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Satış Hizmetleri</h2>
                  <p className="text-xs text-gray-500">Sejour için eklenen hizmetlerin satış bedellerini ve detaylarını aşağıda yönetebilirsiniz.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowAccommodation(true); if (!expandedSectionsV6.includes("rooms")) toggleSection("rooms"); }} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">+ Konaklama</button>
                  <button type="button" onClick={() => { setShowFlight(true); if (!expandedSectionsV6.includes("flights")) toggleSection("flights"); }} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">+ Uçuş</button>
                  <button type="button" onClick={() => { setShowTransfer(true); if (!expandedSectionsV6.includes("transfers")) toggleSection("transfers"); }} className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">+ Transfer</button>
                  <button type="button" onClick={() => { setShowExtraServices(true); if (!expandedSectionsV6.includes("extraServices")) toggleSection("extraServices"); }} className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">+ Ekstra</button>
                </div>
              </div>

              {/* KONAKLAMA ACCORDION ROW */}
              {showAccommodation && (
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSectionsV6.includes('rooms') ? "border border-blue-200 dark:border-blue-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSectionsV6.includes('rooms') ? 'bg-blue-50/30 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => toggleSection('rooms')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                      <span className="text-lg">🏨</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Konaklama ({rooms.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{rooms.reduce((acc, r) => acc + (r.adultCount||0) + (r.childCount||0) + (r.infantCount||0), 0)} kişi • {rooms.length} oda</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {!expandedSectionsV6.includes('rooms') && (
                        rooms.length > 0 ? rooms.map((r, i) => (
                          <div key={r.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Otel</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {r.hotelId ? hotels.find((h) => h.id === r.hotelId)?.name : "Otel Seçilmedi"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Oda Tipi</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{r.roomType || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Giriş / Çıkış</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {r.checkIn ? new Date(r.checkIn).toLocaleDateString("tr-TR") : "--"} - {r.checkOut ? new Date(r.checkOut).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{r.price ? (r.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {r.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz oda eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSectionsV6.includes('rooms') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSectionsV6.includes('rooms') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowAccommodation(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* KONAKLAMA İÇERİĞİ (AÇIK DURUM) */}
                  {expandedSectionsV6.includes('rooms') && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4">
                        <button type="button" onClick={addRoom} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          <span className="text-lg leading-none">+</span> Oda Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {rooms.map((room, index) => (
                          <div key={room.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            {(!invoicedSalesItemIds.has(room.id) && !invoicedPurchaseItemIds.has(room.id)) && (
                              <button type="button" onClick={() => removeRoom(room.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Odayı Sil">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            )}
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.5] lg:[&>*:nth-child(6)]:flex-[1.5] lg:[&>*:nth-child(7)]:flex-[0.6] lg:[&>*:nth-child(8)]:flex-[1.2]">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">OTEL</label>
                                <SearchableSelect options={hotels.map((h) => ({ id: h.id, name: h.name }))} value={room.hotelId || ""} onChange={(val) => updateRoom(room.id, "hotelId", val)} placeholder="Otel Seçiniz..." />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ODA TİPİ</label>
                                <select value={room.roomType || ""} onChange={(e) => updateRoom(room.id, "roomType", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-blue-500 outline-none">
                                  <option value="">Seçin</option>
                                  {roomTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KONAK. TİPİ</label>
                                <select value={room.accommodationType || ""} onChange={(e) => updateRoom(room.id, "accommodationType", e.target.value)} className="w-full h-[36px] px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-blue-500 outline-none">
                                  <option value="">Seçin</option>
                                  <option value="SNG">SNG</option>
                                  <option value="DBL">DBL</option>
                                  <option value="TRP">TRP</option>
                                  <option value="QUAD">QUAD</option>
                                  <option value="CHLD">CHLD</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PAX (Y|Ç|B)</label>
                                <div className="flex gap-0 items-center border border-gray-200 rounded-md overflow-hidden h-[36px]">
                                  <input type="number" min="1" value={room.adultCount || 1} onChange={(e) => updateRoom(room.id, "adultCount", parseInt(e.target.value) || 1)} className="w-1/3 h-full text-center text-[11px] font-semibold outline-none focus:bg-blue-50" title="Yetişkin" />
                                  <div className="w-px h-4 bg-gray-200"></div>
                                  <input type="number" min="0" value={room.childCount || 0} onChange={(e) => updateRoom(room.id, "childCount", parseInt(e.target.value) || 0)} className="w-1/3 h-full text-center text-[11px] font-semibold outline-none focus:bg-blue-50" title="Çocuk" />
                                  <div className="w-px h-4 bg-gray-200"></div>
                                  <input type="number" min="0" value={room.infantCount || 0} onChange={(e) => updateRoom(room.id, "infantCount", parseInt(e.target.value) || 0)} className="w-1/3 h-full text-center text-[11px] font-semibold outline-none focus:bg-blue-50" title="Bebek" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">C-IN & C-OUT</label>
                                <div className="flex items-center gap-1">
                                  <input type="date" value={room.checkIn || ""} onChange={(e) => updateRoom(room.id, "checkIn", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" />
                                  <span className="text-gray-400">-</span>
                                  <input type="date" value={room.checkOut || ""} onChange={(e) => updateRoom(room.id, "checkOut", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">MİSAFİR</label>
                                <input type="text" placeholder="İsim Soyisim" value={room.guestInfo || ""} onChange={(e) => updateRoom(room.id, "guestInfo", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                                <input type="number" min="0" max="100" value={room.vat !== undefined ? room.vat : ""} onChange={(e) => updateRoom(room.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" disabled={invoicedSalesItemIds.has(room.id)} value={roomPriceInputV6[room.id] !== undefined ? roomPriceInputV6[room.id] : room.price ? room.price.toString().replace(".", ",") : ""} onChange={(e) => setRoomPriceInputV6((prev) => ({ ...prev, [room.id]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateRoom(room.id, "price", parsed); setRoomPriceInputV6((prev) => ({ ...prev, [room.id]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-blue-600 outline-none focus:border-blue-500 bg-blue-50/30 disabled:opacity-50" />
                                  <select value={room.currency || "TRY"} disabled={invoicedSalesItemIds.has(room.id)} onChange={(e) => updateRoom(room.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UÇUŞ ACCORDION ROW */}
              {showFlight && (
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSectionsV6.includes('flights') ? "border border-emerald-200 dark:border-emerald-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSectionsV6.includes('flights') ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => toggleSection('flights')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                      <span className="text-lg">✈️</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Uçuşlar ({flights.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{flights.length} uçuş eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {!expandedSectionsV6.includes('flights') && (
                        flights.length > 0 ? flights.map((f, i) => (
                          <div key={f.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Gidiş - Dönüş</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {f.departureAirport} ➝ {f.arrivalAirport}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Havayolu</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{f.airline || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {f.flightDate ? new Date(f.flightDate).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{f.price ? (f.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {f.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz uçuş eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSectionsV6.includes('flights') ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSectionsV6.includes('flights') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowFlight(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedSectionsV6.includes('flights') && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4 gap-2">
                        <button type="button" onClick={() => addFlight("departure")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Gidiş Ekle
                        </button>
                        <button type="button" onClick={() => addFlight("return")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Dönüş Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {flights.map((flight, index) => (
                          <div key={flight.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            {(!invoicedSalesItemIds.has(flight.id) && !invoicedPurchaseItemIds.has(flight.id)) && (
                              <button type="button" onClick={() => removeFlight(flight.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Uçuşu Sil">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            )}
                            <span className="absolute top-2 left-4 text-[9px] font-bold text-gray-400">{flight.type === 'departure' ? 'GİDİŞ' : 'DÖNÜŞ'} UÇUŞU {index + 1}</span>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.2] lg:[&>*:nth-child(6)]:flex-[1] lg:[&>*:nth-child(7)]:flex-[1] lg:[&>*:nth-child(8)]:flex-[1.2] mt-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                                <input type="date" value={flight.flightDate || ""} onChange={(e) => updateFlight(flight.id, "flightDate", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">HAVAYOLU</label>
                                <input type="text" placeholder="THY" value={flight.airline || ""} onChange={(e) => updateFlight(flight.id, "airline", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KALKIŞ / VARIŞ (HVL)</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="IST" value={flight.departureAirport || ""} onChange={(e) => updateFlight(flight.id, "departureAirport", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                  <span className="text-gray-400">-</span>
                                  <input type="text" placeholder="JFK" value={flight.arrivalAirport || ""} onChange={(e) => updateFlight(flight.id, "arrivalAirport", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">UÇUŞ NO</label>
                                <input type="text" placeholder="TK100" value={flight.flightNo || ""} onChange={(e) => updateFlight(flight.id, "flightNo", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KALKIŞ / VARIŞ SAAT</label>
                                <div className="flex items-center gap-1">
                                  <input type="time" value={flight.departureTime || ""} onChange={(e) => updateFlight(flight.id, "departureTime", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                  <span className="text-gray-400">-</span>
                                  <input type="time" value={flight.arrivalTime || ""} onChange={(e) => updateFlight(flight.id, "arrivalTime", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                </div>
                              </div>
                                                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PNR</label>
                                <input type="text" placeholder="PNR" value={flight.pnr || ""} onChange={(e) => updateFlight(flight.id, "pnr", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">BİLET TARİHİ</label>
                                <input type="date" value={flight.ticketingDate || ""} onChange={(e) => updateFlight(flight.id, "ticketingDate", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
<div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                                <input type="number" min="0" max="100" value={flight.vat !== undefined ? flight.vat : ""} onChange={(e) => updateFlight(flight.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" disabled={invoicedSalesItemIds.has(flight.id)} value={servicePriceInputV6[`flight_${flight.id}`] !== undefined ? servicePriceInputV6[`flight_${flight.id}`] : flight.price ? flight.price.toString().replace(".", ",") : ""} onChange={(e) => setServicePriceInputV6((prev) => ({ ...prev, [`flight_${flight.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateFlight(flight.id, "price", parsed); setServicePriceInputV6((prev) => ({ ...prev, [`flight_${flight.id}`]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-emerald-600 outline-none focus:border-emerald-500 bg-emerald-50/30 disabled:opacity-50" />
                                  <select value={flight.currency || "TRY"} disabled={invoicedSalesItemIds.has(flight.id)} onChange={(e) => updateFlight(flight.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TRANSFER ACCORDION ROW */}
              {showTransfer && (
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSectionsV6.includes('transfers') ? "border border-purple-200 dark:border-purple-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSectionsV6.includes('transfers') ? 'bg-purple-50/30 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => toggleSection('transfers')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                      <span className="text-lg">🚗</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Transferler ({transfers.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{transfers.length} transfer eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {!expandedSectionsV6.includes('transfers') && (
                        transfers.length > 0 ? transfers.map((t, i) => (
                          <div key={t.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tip & Yön</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {t.type === 'private' ? 'Özel' : 'Ekonomik'} - {t.direction === 'arrival' ? 'Geliş' : t.direction === 'return' ? 'Dönüş' : 'Ara'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "--"} {t.time || ""}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Araç</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{t.vehicle || "-"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{t.price ? (t.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {t.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz transfer eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSectionsV6.includes('transfers') ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSectionsV6.includes('transfers') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowTransfer(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedSectionsV6.includes('transfers') && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4 gap-2">
                        <button type="button" onClick={() => addTransfer("arrival")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Geliş Ekle
                        </button>
                        <button type="button" onClick={() => addTransfer("return")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Dönüş Ekle
                        </button>
                        <button type="button" onClick={() => addTransfer("intermediate")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Ara Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {transfers.map((transfer, index) => (
                          <div key={transfer.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            {(!invoicedSalesItemIds.has(transfer.id) && !invoicedPurchaseItemIds.has(transfer.id)) && (
                              <button type="button" onClick={() => removeTransfer(transfer.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Transferi Sil">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            )}
                            <span className="absolute top-2 left-4 text-[9px] font-bold text-gray-400">{transfer.direction === 'arrival' ? 'GELİŞ' : transfer.direction === 'return' ? 'DÖNÜŞ' : 'ARA'} TRANSFER {index + 1}</span>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.2] mt-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH & SAAT</label>
                                <div className="flex items-center gap-1">
                                  <input type="date" value={transfer.date || ""} onChange={(e) => updateTransfer(transfer.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />
                                  <input type="time" value={transfer.time || ""} onChange={(e) => updateTransfer(transfer.id, "time", e.target.value)} className="w-20 h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TİP</label>
                                <select value={transfer.type || ""} onChange={(e) => updateTransfer(transfer.id, "type", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-purple-500 outline-none">
                                  <option value="private">Özel</option><option value="economic">Ekonomik</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ARAÇ</label>
                                <select value={transfer.vehicle || ""} onChange={(e) => updateTransfer(transfer.id, "vehicle", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-purple-500 outline-none">
                                  <option value="">Seçin</option>
                                  {vehicleTypes.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">GÜZERGAH NOTU</label>
                                <input type="text" value={transfer.routeDescription || ""} onChange={(e) => updateTransfer(transfer.id, "routeDescription", e.target.value)} placeholder="Örn: Otel - Havalimanı" className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                                <input type="number" min="0" max="100" value={transfer.vat !== undefined ? transfer.vat : ""} onChange={(e) => updateTransfer(transfer.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-purple-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" disabled={invoicedSalesItemIds.has(transfer.id)} value={servicePriceInputV6[`transfer_${transfer.id}`] !== undefined ? servicePriceInputV6[`transfer_${transfer.id}`] : transfer.price ? transfer.price.toString().replace(".", ",") : ""} onChange={(e) => setServicePriceInputV6((prev) => ({ ...prev, [`transfer_${transfer.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateTransfer(transfer.id, "price", parsed); setServicePriceInputV6((prev) => ({ ...prev, [`transfer_${transfer.id}`]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-purple-600 outline-none focus:border-purple-500 bg-purple-50/30 disabled:opacity-50" />
                                  <select value={transfer.currency || "TRY"} disabled={invoicedSalesItemIds.has(transfer.id)} onChange={(e) => updateTransfer(transfer.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EKSTRA HİZMETLER ACCORDION ROW */}
              {showExtraServices && (
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSectionsV6.includes('extraServices') ? "border border-amber-200 dark:border-amber-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSectionsV6.includes('extraServices') ? 'bg-amber-50/30 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => toggleSection('extraServices')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                      <span className="text-lg">✨</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Ekstra Hizmetler ({extraServices.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{extraServices.length} hizmet eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {!expandedSectionsV6.includes('extraServices') && (
                        extraServices.length > 0 ? extraServices.map((e, i) => (
                          <div key={e.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Hizmet Tipi</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {e.serviceType ? supplierServiceTypes.find(t => t.id === e.serviceType)?.name : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {e.date ? new Date(e.date).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Açıklama</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{e.description || "-"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{e.price ? (e.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {e.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz ekstra hizmet eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSectionsV6.includes('extraServices') ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSectionsV6.includes('extraServices') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(ev) => ev.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowExtraServices(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedSectionsV6.includes('extraServices') && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4">
                        <button type="button" onClick={addExtraService} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          <span className="text-lg leading-none">+</span> Hizmet Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {extraServices.map((service, index) => (
                          <div key={service.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            {(!invoicedSalesItemIds.has(service.id) && !invoicedPurchaseItemIds.has(service.id)) && (
                              <button type="button" onClick={() => removeExtraService(service.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Hizmeti Sil">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            )}
                            <span className="absolute top-2 left-4 text-[9px] font-bold text-gray-400">EKSTRA HİZMET {index + 1}</span>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1.5] lg:[&>*:nth-child(3)]:flex-[2] lg:[&>*:nth-child(4)]:flex-[1.2] mt-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                                <input type="date" value={service.date || ""} onChange={(e) => updateExtraService(service.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-orange-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">HİZMET TİPİ</label>
                                <select value={service.serviceType || ""} onChange={(e) => updateExtraService(service.id, "serviceType", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-orange-500 outline-none">
                                  <option value="">Seçin</option>
                                  {supplierServiceTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">AÇIKLAMA</label>
                                <input type="text" placeholder="Örn: Rehberlik" value={service.description || ""} onChange={(e) => updateExtraService(service.id, "description", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-orange-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                                <input type="number" min="0" max="100" value={service.vat !== undefined ? service.vat : ""} onChange={(e) => updateExtraService(service.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" disabled={invoicedSalesItemIds.has(service.id)} value={servicePriceInputV6[`extra_${service.id}`] !== undefined ? servicePriceInputV6[`extra_${service.id}`] : service.price ? service.price.toString().replace(".", ",") : ""} onChange={(e) => setServicePriceInputV6((prev) => ({ ...prev, [`extra_${service.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateExtraService(service.id, "price", parsed); setServicePriceInputV6((prev) => ({ ...prev, [`extra_${service.id}`]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-orange-600 outline-none focus:border-orange-500 bg-orange-50/30 disabled:opacity-50" />
                                  <select value={service.currency || "TRY"} disabled={invoicedSalesItemIds.has(service.id)} onChange={(e) => updateExtraService(service.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ALIŞ (MALİYET) BİLGİLERİ TABI */}
          {activeMainTab === 'details' && activeTabV6 === 'purchase' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alış (Maliyet) Detayları</h2>
                  <p className="text-xs text-gray-500">Sejour için eklenen hizmetlerin tedarikçi ve maliyet bilgilerini aşağıda yönetebilirsiniz.</p>
                </div>
              </div>

              {/* KONAKLAMA MALİYETLERİ */}
              {showAccommodation && rooms.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"><span className="text-sm">🏨</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Konaklama Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {rooms.map((room, index) => (
                      <div key={room.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">ODA {index + 1} - {room.hotelId ? hotels.find(h => h.id === room.hotelId)?.name : "Otel Yok"}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[0.5] lg:[&>*:nth-child(4)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={room.supplierId || ""} onChange={(val) => updateRoom(room.id, "supplierId", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                            <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                              {room.price ? room.price.toLocaleString("tr-TR") : "0"} {room.currency || "TRY"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                            <input type="number" min="0" max="100" value={room.vat !== undefined ? room.vat : ""} onChange={(e) => updateRoom(room.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" disabled={invoicedPurchaseItemIds.has(room.id)} value={roomCostInputV6?.[room.id] !== undefined ? roomCostInputV6[room.id] : room.costPrice ? room.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setRoomCostInputV6((prev) => ({ ...prev, [room.id]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateRoom(room.id, "costPrice", parsed); setRoomCostInputV6((prev) => ({ ...prev, [room.id]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500 disabled:opacity-50" />
                              <select value={room.costCurrency || "TRY"} disabled={invoicedPurchaseItemIds.has(room.id)} onChange={(e) => updateRoom(room.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UÇUŞ MALİYETLERİ */}
              {showFlight && flights.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg"><span className="text-sm">✈️</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Uçuş Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {flights.map((flight, index) => (
                      <div key={flight.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">{flight.type === 'departure' ? 'GİDİŞ' : 'DÖNÜŞ'} UÇUŞU {index + 1} - {flight.departureAirport} ➝ {flight.arrivalAirport}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[0.5] lg:[&>*:nth-child(4)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ (TICKETING)</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={flight.ticketingProvider || ""} onChange={(val) => updateFlight(flight.id, "ticketingProvider", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                            <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                              {flight.price ? flight.price.toLocaleString("tr-TR") : "0"} {flight.currency || "TRY"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                            <input type="number" min="0" max="100" value={flight.vat !== undefined ? flight.vat : ""} onChange={(e) => updateFlight(flight.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" disabled={invoicedPurchaseItemIds.has(flight.id)} value={serviceCostInputV6?.[`flight_${flight.id}`] !== undefined ? serviceCostInputV6[`flight_${flight.id}`] : flight.costPrice ? flight.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setServiceCostInputV6((prev) => ({ ...prev, [`flight_${flight.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateFlight(flight.id, "costPrice", parsed); setServiceCostInputV6((prev) => ({ ...prev, [`flight_${flight.id}`]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500 disabled:opacity-50" />
                              <select value={flight.costCurrency || "TRY"} disabled={invoicedPurchaseItemIds.has(flight.id)} onChange={(e) => updateFlight(flight.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSFER MALİYETLERİ */}
              {showTransfer && transfers.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg"><span className="text-sm">🚗</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Transfer Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {transfers.map((transfer, index) => (
                      <div key={transfer.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">{transfer.direction === 'arrival' ? 'GELİŞ' : transfer.direction === 'return' ? 'DÖNÜŞ' : 'ARA'} TRANSFER {index + 1}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[0.5] lg:[&>*:nth-child(4)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={transfer.provider || ""} onChange={(val) => updateTransfer(transfer.id, "provider", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                            <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                              {transfer.price ? transfer.price.toLocaleString("tr-TR") : "0"} {transfer.currency || "TRY"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                            <input type="number" min="0" max="100" value={transfer.vat !== undefined ? transfer.vat : ""} onChange={(e) => updateTransfer(transfer.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" disabled={invoicedPurchaseItemIds.has(transfer.id)} value={serviceCostInputV6?.[`transfer_${transfer.id}`] !== undefined ? serviceCostInputV6[`transfer_${transfer.id}`] : transfer.costPrice ? transfer.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setServiceCostInputV6((prev) => ({ ...prev, [`transfer_${transfer.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateTransfer(transfer.id, "costPrice", parsed); setServiceCostInputV6((prev) => ({ ...prev, [`transfer_${transfer.id}`]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500 disabled:opacity-50" />
                              <select value={transfer.costCurrency || "TRY"} disabled={invoicedPurchaseItemIds.has(transfer.id)} onChange={(e) => updateTransfer(transfer.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EKSTRA HİZMET MALİYETLERİ */}
              {showExtraServices && extraServices.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-lg"><span className="text-sm">✨</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Ekstra Hizmet Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {extraServices.map((service, index) => (
                      <div key={service.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">EKSTRA HİZMET {index + 1}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[0.5] lg:[&>*:nth-child(4)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={service.provider || ""} onChange={(val) => updateExtraService(service.id, "provider", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                            <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                              {service.price ? service.price.toLocaleString("tr-TR") : "0"} {service.currency || "TRY"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KDV %</label>
                            <input type="number" min="0" max="100" value={service.vat !== undefined ? service.vat : ""} onChange={(e) => updateExtraService(service.id, "vat", e.target.value === "" ? undefined : parseFloat(e.target.value))} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" disabled={salesData.isInternational} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" disabled={invoicedPurchaseItemIds.has(service.id)} value={serviceCostInputV6?.[`extra_${service.id}`] !== undefined ? serviceCostInputV6[`extra_${service.id}`] : service.costPrice ? service.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setServiceCostInputV6((prev) => ({ ...prev, [`extra_${service.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmountV6(e.target.value); if (parsed !== null) { updateExtraService(service.id, "costPrice", parsed); setServiceCostInputV6((prev) => ({ ...prev, [`extra_${service.id}`]: formatAmountV6(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500 disabled:opacity-50" />
                              <select value={service.costCurrency || "TRY"} disabled={invoicedPurchaseItemIds.has(service.id)} onChange={(e) => updateExtraService(service.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none disabled:opacity-50">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAHSİLAT TABI */}
          {activeMainTab === 'details' && activeTabV6 === 'collection' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tahsilat Bilgileri</h2>
                  <p className="text-xs text-gray-500">Sejour tahsilatlarını buradan ekleyebilir ve yönetebilirsiniz.</p>
                </div>
                <button type="button" onClick={addCollection} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  <span className="text-lg leading-none">+</span> Tahsilat Ekle
                </button>
              </div>

              {collections.length > 0 ? (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
                      <button type="button" onClick={() => removeCollection(collection.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Tahsilatı Sil">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                                            <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                        <input type="date" value={collection.date || ""} onChange={(e) => updateCollection(collection.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">YÖNTEM</label>
                        <select value={collection.type || "cash"} onChange={(e) => updateCollection(collection.id, "type", e.target.value)} className="w-full h-[36px] px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                          <option value="cash">Nakit</option>
                          <option value="bank">Havale / EFT</option>
                          <option value="credit_card">Kredi Kartı</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">AÇIKLAMA</label>
                        <input type="text" placeholder="Tahsilat notu..." value={collection.description || ""} onChange={(e) => updateCollection(collection.id, "description", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TUTAR VE BİRİM</label>
                        <div className="flex gap-1 h-[36px]">
                          <input type="number" value={collection.amount || 0} onChange={(e) => updateCollection(collection.id, "amount", parseFloat(e.target.value) || 0)} className="w-full px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold outline-none" />
                          <select value={collection.currency || "TRY"} onChange={(e) => updateCollection(collection.id, "currency", e.target.value)} className="w-[60px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                            <option value="TRY">TRY</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                  <span className="text-3xl block mb-2">💳</span>
                  <p className="text-sm font-semibold text-gray-500">Henüz tahsilat eklenmemiş</p>
                </div>
              )}
            </div>
          )}

          {/* FATURALAR TABI */}
          {activeMainTab === 'invoices' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Faturalar</h2>
                  <p className="text-xs text-gray-500">Bu rezervasyona ait tüm yapay zeka faturaları</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100">
                    Toplam: {sejourInvoices.length}
                  </div>
                </div>
              </div>

              {sejourInvoices.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700 w-16">Görsel</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700">Tedarikçi</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700">Fatura No</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700">Tarih</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700">Kategori</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700 text-right">Tutar</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700 text-center">Durum</th>
                        <th className="px-4 py-3 font-semibold text-xs border-b border-gray-200 dark:border-gray-700 text-center w-24">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sejourInvoices.map((inv: any) => (
                        <tr 
                          key={inv.id} 
                          className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onDoubleClick={() => window.open(`/api/invoices/preview/${inv.id}${inv.file_url?.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg'}`, '_blank')}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {inv.file_url ? (
                                <div 
                                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 relative group-hover:ring-2 ring-blue-500/50 transition-all cursor-pointer shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/api/invoices/preview/${inv.id}${inv.file_url?.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg'}`, '_blank'); }}
                                >
                                  <img src={`/api/invoices/preview/${inv.id}${inv.file_url?.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg'}`} alt="Fatura" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-gray-400">
                                  Yok
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate" title={inv.extracted_data?.supplier || "Bilinmeyen Tedarikçi"}>
                            {inv.extracted_data?.supplier || "Bilinmeyen Tedarikçi"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs font-medium">
                            {inv.extracted_data?.invoiceNo || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">
                            {inv.extracted_data?.date ? new Date(inv.extracted_data.date).toLocaleDateString('tr-TR') : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {(inv.category || inv.extracted_data?.category) ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[120px]" title={categories.find((c: any) => c.id === (inv.category || inv.extracted_data?.category))?.name || inv.category || inv.extracted_data?.category}>
                                  {categories.find((c: any) => c.id === (inv.category || inv.extracted_data?.category))?.name || inv.category || inv.extracted_data?.category}
                                </span>
                                {inv.sub_category && (
                                  <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]" title={categories.find((c: any) => c.id === inv.sub_category)?.name || inv.sub_category}>
                                    {categories.find((c: any) => c.id === inv.sub_category)?.name || inv.sub_category}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-black text-gray-900 dark:text-white">
                              {Number(inv.extracted_data?.total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 ml-1">{inv.extracted_data?.currency || "TRY"}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              inv.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                              inv.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            }`}>
                              {inv.status === 'APPROVED' ? 'ONAYLI' :
                               inv.status === 'PROCESSING' ? 'İŞLENİYOR' :
                               inv.status === 'CANCELLED' ? 'İPTAL' :
                               'BEKLİYOR'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {inv.status?.toUpperCase() !== 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleApproveInvoice(inv); }}
                                  disabled={updatingId === inv.id}
                                  className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50 transition-colors"
                                  title="Onayla"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditModalInvoice(inv); }}
                                disabled={updatingId === inv.id}
                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id); }}
                                disabled={updatingId === inv.id}
                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                  <span className="text-3xl block mb-2">📄</span>
                  <p className="text-sm font-semibold text-gray-500">Bu rezervasyona ait yapay zeka faturası bulunmuyor</p>
                </div>
              )}
            </div>
          )}

          {/* TOTALS FOOTER */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] p-3 z-40 transition-all duration-300">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between relative">
              <div className="flex-1"></div>
              <div className="flex items-center justify-center gap-6 overflow-x-auto pb-1 absolute left-1/2 -translate-x-1/2 w-max max-w-[70vw]">
                {["TRY", "USD", "EUR", "GBP"].filter(c => getTotalForCurrency(c) !== 0 || getCostForCurrency(c) !== 0 || getCollectionForCurrency(c) !== 0).length === 0 ? (
                  <div className="text-sm font-semibold text-gray-400">Veri yok</div>
                ) : (
                  ["TRY", "USD", "EUR", "GBP"].filter(c => getTotalForCurrency(c) !== 0 || getCostForCurrency(c) !== 0 || getCollectionForCurrency(c) !== 0).map(c => {
                    const total = getTotalForCurrency(c);
                    const cost = getCostForCurrency(c);
                    const col = getCollectionForCurrency(c);
                    const profit = total - cost;
                    const balance = total - col;
                    
                    return (
                      <div key={c} className="flex items-center gap-4 min-w-max border-r border-gray-200 pr-6 last:border-0 last:pr-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{c} DÖVİZİ</span>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Satış</span>
                              <span className="text-xs font-bold text-gray-900">{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Maliyet</span>
                              <span className="text-xs font-bold text-red-600">{cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Kâr/Zarar</span>
                              <span className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{profit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Tahsilat</span>
                              <span className="text-xs font-bold text-blue-600">{col.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-gray-400 uppercase">Bakiye</span>
                              <span className={`text-xs font-bold ${balance > 0 ? 'text-orange-500' : 'text-gray-900'}`}>{balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-3 flex-1 relative z-10">
                <button type="button" onClick={() => router.push("/sejour")} className="px-6 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : "Sejour'u Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </form>


        {/* PDF Voucher - Gizli bölüm (Capture için off-screen) */}
        <div
          ref={voucherRef}
          className="absolute pointer-events-none"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            width: "210mm",
            backgroundColor: "white",
            color: "#1a1a1a",
            fontFamily: "'Inter', system-ui, sans-serif",
            zIndex: -100,
          }}
        >
          <div
            className="bg-v3-surface px-10 py-12 w-full min-h-[297mm] text-gray-900"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Elegant Header with Logos */}
            <div className="flex justify-between items-center border-b-[3px] border-gray-900 pb-6 mb-8">
              <div className="flex items-center">
                {darkIconLogo && (
                  <img
                    src={darkIconLogo}
                    alt="Logo"
                    className="w-16 h-auto object-contain"
                  />
                )}
              </div>
              <div className="text-right flex flex-col items-end">
                {darkWordmarkLogo && (
                  <img
                    src={darkWordmarkLogo}
                    alt="Wordmark"
                    className="h-6 w-auto object-contain mb-2"
                  />
                )}
                <div className="text-[10px] tracking-[0.2em] text-gray-600 font-medium uppercase mt-1">
                  OFFICIAL VOUCHER
                </div>
              </div>
            </div>

            {/* Voucher & Guest Profile */}
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-2xl font-light text-gray-900 tracking-wider mb-4 uppercase">
                  RESERVATION DIRECTORY
                </h1>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 responsive-filter-grid">
                  <div>
                    <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                      GUEST NAME
                    </span>
                    <span className="block text-sm font-medium text-gray-900">
                      {salesData.customerName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                      GUEST TYPE
                    </span>
                    <span className="block text-sm font-medium text-gray-900">
                      {salesData.customerType === "agency"
                        ? `Agency (${agencies.find((a) => a.id === salesData.agencyId)?.name || ""})`
                        : "Individual"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                      CHECK IN
                    </span>
                    <span className="block text-sm font-medium text-gray-900">
                      {salesData.checkInDate
                        ? new Date(salesData.checkInDate).toLocaleDateString(
                            "tr-TR",
                          )
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-1">
                      CHECK OUT
                    </span>
                    <span className="block text-sm font-medium text-gray-900">
                      {salesData.checkOutDate
                        ? new Date(salesData.checkOutDate).toLocaleDateString(
                            "tr-TR",
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[8px] tracking-[0.2em] text-gray-600 uppercase mb-2">
                  VOUCHER NO
                </span>
                <span className="block text-3xl font-light tracking-widest text-gray-900">
                  {salesData.voucherNumber}
                </span>
              </div>
            </div>

            {/* ITINERARY */}
            <div className="space-y-8">
              {/* Accommodation */}
              {rooms.length > 0 && (
                <div>
                  <div className="border-b border-gray-300 pb-2 mb-4">
                    <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">
                      Accommodation Details
                    </h2>
                  </div>
                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {hotels.find((h) => h.id === rooms[0].hotelId)?.name ||
                        rooms[0].hotelName ||
                        rooms[0].hotelId ||
                        "-"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {rooms.map((room, idx) => (
                      <div
                        key={idx}
                        className="bg-v3-surface border border-gray-200 p-4 rounded-sm flex justify-between items-center"
                      >
                        <div>
                          <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">
                            ROOM {room.roomNumber || idx + 1}
                          </span>
                          <span className="block text-xs font-semibold text-gray-900">
                            {room.roomType}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] tracking-widest text-gray-600 uppercase mb-1">
                            GUESTS
                          </span>
                          <span className="block text-xs font-medium text-gray-700">
                            {room.guestInfo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flights */}
              {flights.length > 0 && (
                <div>
                  <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                    <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">
                      Flight Itinerary
                    </h2>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">
                          Direction
                        </th>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">
                          Airline / Flight No
                        </th>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">
                          Date
                        </th>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">
                          Route
                        </th>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100 text-right">
                          PNR / Timing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {flights.map((flight, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-900">
                            {flight.type === "departure" ? "Gidiş" : "Dönüş"}
                          </td>
                          <td className="py-3 text-gray-700">
                            {flight.airline}{" "}
                            <span className="text-gray-600 ml-1">
                              ({flight.flightNo})
                            </span>
                          </td>
                          <td className="py-3 text-gray-700">
                            {flight.flightDate
                              ? new Date(flight.flightDate).toLocaleDateString(
                                  "tr-TR",
                                )
                              : "-"}
                          </td>
                          <td className="py-3 font-medium text-gray-900">
                            {flight.route}
                          </td>
                          <td className="py-3 text-right">
                            <span className="block font-semibold text-gray-900">
                              {(flight as any).pnr || "N/A"}
                            </span>
                            <span className="block text-[9px] text-gray-600 mt-0.5">
                              {flight.departureTime} → {flight.arrivalTime}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transfers */}
              {transfers.length > 0 && (
                <div>
                  <div className="border-b border-gray-300 pb-2 mb-4 mt-6">
                    <h2 className="text-[10px] tracking-[0.3em] text-gray-900 font-bold uppercase">
                      Transfer Services
                    </h2>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">
                          Direction
                        </th>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100">
                          Vehicle Type
                        </th>
                        <th className="py-2 text-[8px] tracking-widest text-gray-600 font-normal uppercase border-b border-gray-100 text-right">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {transfers.map((trans, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-900">
                            {trans.direction === "arrival"
                              ? "Varış"
                              : trans.direction === "return"
                                ? "Dönüş"
                                : "Ara"}
                          </td>
                          <td className="py-3 text-gray-700">
                            {trans.vehicleType}
                          </td>
                          <td className="py-3 font-semibold text-gray-900 text-right">
                            {trans.time || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* IMPORTANT NOTES */}
            {salesData.notes && (
              <div className="mt-12 bg-v3-surface border border-gray-200 p-4">
                <h3 className="text-[9px] tracking-widest text-gray-900 font-bold uppercase mb-2">
                  IMPORTANT NOTES
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed italic">
                  {salesData.notes}
                </p>
              </div>
            )}

            {/* Footer (Extremely clean, like a letterhead footer) */}
            <div className="mt-16 pt-8 border-t-[1px] border-gray-200">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-semibold tracking-wide text-gray-900 mb-1">
                    {companyInfo.company_name}
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">
                    {companyInfo.company_address}
                  </div>
                  <div className="flex gap-4 text-[9px] font-medium text-gray-600">
                    {companyInfo.company_phone && (
                      <span>T: {companyInfo.company_phone}</span>
                    )}
                    <span>E: {companyInfo.company_email}</span>
                    <span>W: {companyInfo.company_website}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] text-v3-muted uppercase tracking-widest mb-1">
                    Generated By System
                  </div>
                  <div className="text-[10px] font-semibold text-gray-800 tracking-[0.2em]">
                    {new Date().toLocaleDateString("tr-TR")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editModalInvoice && (
        <EditAIInvoiceModal
          invoice={editModalInvoice}
          onClose={() => setEditModalInvoice(null)}
          onSuccess={() => {
            setEditModalInvoice(null);
            loadSejourInvoices();
          }}
          categories={categories}
          lockEntitySelection={true}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl relative w-full max-w-sm mx-4 transform transition-all">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              Faturayı Sil
            </h3>
            
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
              Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={updatingId === deleteConfirmId}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={confirmDeleteInvoice}
                disabled={updatingId === deleteConfirmId}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {updatingId === deleteConfirmId ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sil'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
