"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  projectsService,
  agenciesService,
  hotelsService,
  categoriesService,
  publicLinksService,
  projectSalesItemsService,
  SettingsService,
} from "@/lib/supabaseService";
import { lsGet } from "@/utils/safeStorage";
import { getLogosForExcel } from "@/utils/logoUtils";
import { toast } from "react-hot-toast";

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
  code?: string | number;
  sort_order?: number;
}

interface Project {
  id: string;
  reference: string;
  agency_id: string;
  company_name: string;
  start_date: string;
  end_date: string;
  hotel_id: string;
  quote_type: string;
  status: string;
  room_count: number;
  pax_count: number;
  hotels_data?: any[];
}

interface SalesItem {
  id: string;
  main_category?: string;
  sub_category?: string;
  qty: number;
  repeat: number;
  unit_price: number;
  currency: string;
  total: number;
  total_try?: number;
  description?: string;
  vat?: number;
  fx?: number;
  hotel_id?: string;
}

// FIXED_PUBLIC_LOGO_URL removed to use dynamic logo from appSettings

const isUuid = (value?: string) =>
  !!value &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const getCategorySortKey = (category: any) => {
  if (!category) return "";
  const code = (category.code || "").toString().trim();
  if (code) return code;
  const id = (category.id || "").toString().trim();
  if (id && !isUuid(id)) return id;
  return (category.name || "").toString().trim();
};

const getCategorySortWeight = (category: any) => {
  const key = getCategorySortKey(category);
  const nums = key.match(/\d+/g);
  if (!nums) return Number.MAX_SAFE_INTEGER;
  const weight = Number(nums.join(""));
  return Number.isFinite(weight) ? weight : Number.MAX_SAFE_INTEGER;
};

const compareByCategoryId = (a: any, b: any) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const aOrder = a.sort_order ?? 9999;
  const bOrder = b.sort_order ?? 9999;
  if (aOrder !== bOrder) return aOrder - bOrder;

  const wa = getCategorySortWeight(a);
  const wb = getCategorySortWeight(b);
  if (wa !== wb) return wa - wb;
  return getCategorySortKey(a).localeCompare(getCategorySortKey(b), "tr", {
    numeric: true,
    sensitivity: "base",
  });
};

export default function ProjectViewPublicPage() {
  const formatTr = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const formatNumberTR = (value: number) => {
    if (isNaN(value)) return "0.00";
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  const formatEUR = (value: number) => `€ ${formatNumberTR(value)}`;
  const formatTRY = (value: number) => `₺${formatNumberTR(value)}`;

  // UUID Check & Scrubbing Helper
  const isUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  const scrubText = (text: string) => {
    if (!text) return "";
    // Removes square brackets and anything inside them like [T:...] or [uuid]
    return text.replace(/\[.*?\]/g, "").trim();
  };

  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const token = searchParams.get("token");

  const [project, setProject] = useState<Project | null>(null);
  const [itemsSales, setItemsSales] = useState<SalesItem[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [error, setError] = useState("");
  const [linkData, setLinkData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [iconLogo, setIconLogo] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [wordmarkLogo, setWordmarkLogo] = useState<string | null>(null);
  const [activeViewHotelId, setActiveViewHotelId] = useState<string>("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    name: "",
    surname: "",
    email: "",
  });
  const [approving, setApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    loadAppSettings();
    const loadLinkData = async () => {
      if (!token) {
        setError("Geçersiz link. Token bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        const link = await publicLinksService.getByToken(token);
        if (!link) {
          setError("Link bulunamadı veya geçersiz.");
          setLoading(false);
          return;
        }

        if (link.link_type !== "project" || link.project_id !== projectId) {
          setError("Link bu proje için geçerli değil.");
          setLoading(false);
          return;
        }

        setLinkData(link);
        if (link.approval && link.approval.is_approved) {
          setIsApproved(true);
        }

        if (link.expiry_date) {
          const expiryDate = new Date(link.expiry_date);
          const now = new Date();
          if (now > expiryDate) {
            setError("Link süresi dolmuş.");
            setLoading(false);
            return;
          }
        }

        if (!link.is_active) {
          setError("Link pasif durumda.");
          setLoading(false);
          return;
        }

        if (!showPasswordForm) {
          loadProjectData();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Link yükleme hatası:", error);
        setError("Link yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };

    loadLinkData();
  }, [token, projectId, showPasswordForm]);

  const loadAppSettings = async () => {
    try {
      const settings = await SettingsService.getSettings();
      if (settings?.general_settings) {
        setAppSettings(settings.general_settings);
      }
    } catch (error) {
      console.error("Settings load error:", error);
    }
  };

  const loadProjectData = async () => {
    console.log("--- loadProjectData başlatıldı ---");
    console.log("Project ID:", projectId);
    try {
      console.log("1. projectsService.getById çağrılıyor...");
      const p = await projectsService.getById(projectId);
      console.log("1. projectsService.getById bitti. Veri:", p ? "Var" : "Yok");

      if (p) {
        setProject(p as any);
        const hData = (p as any).hotels_data || [];
        setActiveViewHotelId("all");
      } else {
        console.warn("Proje bulunamadı, p is null");
        setError("Proje bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        console.log("2. projectSalesItemsService.getByProjectId çağrılıyor...");
        const salesItems =
          await projectSalesItemsService.getByProjectId(projectId);
        console.log(
          "2. projectSalesItemsService bitti. Kayıt sayısı:",
          salesItems?.length || 0,
        );
        const deduplicateItems = (items: any[]) => {
          if (!Array.isArray(items)) return [];
          // Sort by creation date descending to keep the most recent entries
          const sorted = [...items].sort(
            (a, b) =>
              new Date(b.created_at || b.updated_at || 0).getTime() -
              new Date(a.created_at || a.updated_at || 0).getTime(),
          );

          const seen = new Set();
          return sorted.filter((it) => {
            const cat = (it.category || it.main_category || "")
              .trim()
              .toLowerCase();
            const name = (it.description || "").trim().toLowerCase();
            const qty = Number(it.unit_quantity || 0);
            const price = Math.round(Number(it.unit_price || 0) * 100) / 100;
            const hId = it.hotel_id || "";

            // Group by content that defines the service (excluding repeat count to catch updates)
            const contentKey = `${cat}|${name}|${qty}|${price}|${hId}`;

            if (seen.has(contentKey)) return false;
            seen.add(contentKey);
            return true;
          });
        };

        const uniqueSales = deduplicateItems(salesItems || []);
        const hData = (p as any)?.hotels_data || [];

        const parseDescriptionTags = (desc: string) => {
          if (!desc)
            return {
              cleanDesc: "",
              tabTag: null,
              supplierTag: null,
              repeatTag: null,
            };
          const tabMatch = desc.match(/ \[T:(.*?)\]/);
          const supplierMatch = desc.match(/ \[S:(.*?)\]/);
          const repeatMatch = desc.match(/ \[R:(.*?)\]/);
          let cleanDesc = desc
            .replace(/ \[T:.*?\]/g, "")
            .replace(/ \[S:.*?\]/g, "")
            .replace(/ \[R:.*?\]/g, "")
            .trim();
          return {
            cleanDesc,
            tabTag: tabMatch ? tabMatch[1] : null,
            supplierTag: supplierMatch ? supplierMatch[1] : null,
            repeatTag: repeatMatch ? repeatMatch[1] : null,
          };
        };

        const mappedSales = uniqueSales.map((it) => {
          let uiHotelId = it.hotel_id;
          if (it.hotel_id && hData.length > 0) {
            const matched = hData.find((h: any) => h.hotel_id === it.hotel_id);
            if (matched) uiHotelId = matched.id;
          }
          const { cleanDesc, repeatTag } = parseDescriptionTags(
            it.description || "",
          );
          let inferredRepeat = 1;
          if (repeatTag !== null && repeatTag !== undefined && repeatTag !== "")
            inferredRepeat = Number(repeatTag);
          else if (
            it.sefer !== undefined &&
            it.sefer !== null &&
            it.sefer !== ""
          )
            inferredRepeat = Number(it.sefer);
          else if (
            it.repeat !== undefined &&
            it.repeat !== null &&
            it.repeat !== ""
          )
            inferredRepeat = Number(it.repeat);
          const qty = Number(it.unit_quantity || 1);
          const uPrice = Number(it.unit_price || 0);
          const tPrice = Number(it.total_price || it.total || 0);
          if (qty > 0 && uPrice > 0 && tPrice > 0) {
            const expectedTotal = qty * uPrice * inferredRepeat;
            if (Math.abs(expectedTotal - tPrice) > 1) {
              const calc = Math.round(tPrice / (qty * uPrice));
              if (calc > 0) inferredRepeat = calc;
            }
          }
          return {
            ...it,
            hotel_id: uiHotelId,
            main_category: it.category,
            qty: it.unit_quantity,
            repeat: inferredRepeat,
            total: it.total_price,
            total_try: (it.total_price || 0) * (it.fx || 1),
            description: cleanDesc,
          };
        });
        setItemsSales(mappedSales);
      } catch (err) {
        console.error("Satış kalemleri yüklenirken hata:", err);
        setItemsSales([]);
      }

      try {
        const list = await agenciesService.getAll();
        setAgencies((list || []) as any);
      } catch {
        setAgencies([]);
      }

      try {
        const list = await hotelsService.getAll();
        setHotels((list || []) as any);
      } catch {
        setHotels([]);
      }

      try {
        const cats = await categoriesService.getAll();
        setCategories((cats || []) as any);
      } catch (err) {
        console.error("Kategori yükleme hatası:", err);
        setCategories([]);
      }
    } catch (error: any) {
      console.error("Veri yükleme hatası detaylı:", {
        name: error?.name,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
        stack: error?.stack,
        stringified: String(error),
      });
      // Object properties log for empty {} objects
      try {
        console.log(
          "Hata objesi tüm özellikleri:",
          Object.getOwnPropertyNames(error || {}),
        );
      } catch (e) {}

      setError(
        `Veri yüklenirken bir hata oluştu: ${error?.message || "Bilinmeyen hata (Detay konsolda)"}`,
      );
    } finally {
      console.log("--- loadProjectData bitti ---");
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData) {
      setError("Link bilgisi bulunamadı.");
      return;
    }
    if (password !== linkData.password) {
      setError("Şifre hatalı. Lütfen tekrar deneyin.");
      return;
    }
    setError("");
    setShowPasswordForm(false);
    setLoading(true);
    loadProjectData();
  };

  const getAgencyName = (agencyId: string) => {
    if (!agencyId) return "";
    const name = agencies.find((agency) => agency.id === agencyId)?.name || "";
    return isUUID(name) ? "" : name;
  };
  const getHotelName = (hotelId: string) => {
    if (!hotelId) return "";
    const name = hotels.find((hotel) => hotel.id === hotelId)?.name || "";
    return isUUID(name) ? "" : name;
  };
  const getHotelConcept = (hotelId: string) => {
    const hotel = hotels.find((h) => h.id === hotelId) as any;
    if (!hotel) return "";
    return (
      hotel.concept ||
      hotel.board ||
      hotel.board_name ||
      hotel.meal_plan ||
      hotel.pension ||
      ""
    );
  };
  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return "";
    const category = categories.find((cat) => cat.id === categoryId);
    if (category?.name) return category.name;
    // If it's a UUID and no name found, don't show the UUID
    return isUUID(categoryId) ? "" : categoryId;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "completed":
        return "Tamamlandı";
      case "on_hold":
      case "on-hold":
        return "Beklemede";
      case "cancelled":
        return "İptal";
      case "approved":
        return "Onaylandı";
      default:
        return status || "";
    }
  };

  const getClientGeoData = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      return {
        ip: data.ip || "N/A",
        city: data.city || "N/A",
        region: data.region || "N/A",
        country: data.country_name || "N/A",
        postal: data.postal || "N/A",
      };
    } catch (error) {
      console.error("GeoIP verisi alınamadı:", error);
      // Fallback to simple IP if full geo data fails
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        return {
          ip: ipData.ip || "N/A",
          city: "N/A",
          region: "N/A",
          country: "N/A",
          postal: "N/A",
        };
      } catch {
        return {
          ip: "N/A",
          city: "N/A",
          region: "N/A",
          country: "N/A",
          postal: "N/A",
        };
      }
    }
  };

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData || !token || !projectId) {
      setError("Link bilgisi bulunamadı.");
      return;
    }

    try {
      setApproving(true);
      const geoData = await getClientGeoData();
      const approvalData = {
        is_approved: true,
        name: approvalForm.name,
        surname: approvalForm.surname,
        email: approvalForm.email,
        approved_at: new Date().toISOString(),
        ip_address: geoData.ip,
        geo_location: {
          city: geoData.city,
          region: geoData.region,
          country: geoData.country,
          postal: geoData.postal,
        },
      };

      // Use Secure API route instead of direct Supabase calls
      const response = await fetch("/api/public/projects/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          projectId,
          approvalData,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "API Hatası");
      }

      setLinkData({ ...linkData, approval: approvalData });
      setIsApproved(true);
      setShowApprovalForm(false);

      // Update local project status if needed
      if (project) {
        setProject({ ...project, status: "approved" });
      }

      toast.success(
        "Mutabakat başarıyla onaylandı! Bildirim ilgili yöneticilere iletildi.",
      );
    } catch (error: any) {
      console.error("❌ Onaylama hatası:", error);
      setError(
        `Onaylama sırasında bir hata oluştu: ${error?.message || "Bilinmeyen hata"}`,
      );
      toast.error("Onay işlemi sırasında bir hata oluştu.");
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(true);
        setIconLogo(iconLogoBase64 || null);
        setWordmarkLogo(wordmarkLogoBase64 || null);
      } catch (error) {
        console.error("Logo yükleme hatası:", error);
      }
    };
    if (!showPasswordForm && project) {
      loadLogos();
    }
  }, [showPasswordForm, project]);

  const formatSalesData = () => {
    if (!itemsSales || itemsSales.length === 0) {
      return {
        referans: project?.reference || "Bilinmeyen",
        odaPax: `${project?.room_count || 0} | ${project?.pax_count || 0}`,
        acenteFirma: `${getAgencyName(project?.agency_id || "")} | ${project?.company_name || ""}`,
        konsept: getHotelConcept(project?.hotel_id || ""),
        tarih:
          project?.start_date && project?.end_date
            ? `${new Date(project.start_date).toLocaleDateString("tr-TR")} - ${new Date(project.end_date).toLocaleDateString("tr-TR")}`
            : "",
        opsiyon: "SOR - SAT",
        otelAdi: getHotelName(project?.hotel_id || ""),
        teklifTuru: project?.quote_type || "PAKET",
        durum: getStatusText(project?.status || ""),
        not: "",
        bolumler: [],
        genelToplamEUR: formatEUR(0),
        genelToplamEurNum: 0,
        genelToplamTL: formatTRY(0),
        genelToplamTlNum: 0,
        notlar: [
          "FİYATLAR, NET & KOMİSYONSUZDUR.",
          'ALINMASI HENÜZ KESİNLEŞMEYEN SERVİSLER İÇİN BİRİM/ ADET veya SEFER/TEKRAR ÇARPANI "0" (SIFIR) OLARAK GÜNCELLENMİŞTİR.',
          "OTELE GİRİŞ GÜNÜ KONAKLAMA ÖĞLE YEMEĞİ İLE BAŞLAR, OTELDEN ÇIKIŞ GÜNÜ KONAKLAMA SABAH KAHVALTISI İLE SON BULUR.",
          "OTELE GİRİŞ GÜNÜ SABAH KAHVALTISI, OTELDEN ÇIKIŞ GÜNÜ ÖĞLE YEMEĞİ EKSTRA OLARAK ÜCRETLENDİRİLİR.",
        ],
      };
    }

    const grouped = itemsSales.reduce((acc: any, item: any) => {
      const mainCat = getCategoryName(item.main_category) || "Diğer";
      if (!acc[mainCat]) {
        acc[mainCat] = [];
      }
      acc[mainCat].push(item);
      return acc;
    }, {});

    const bolumler = Object.entries(grouped).map(
      ([mainCategory, categoryItems]: [string, any]) => {
        const categoryTotal = categoryItems.reduce(
          (sum: number, item: any) => sum + (item.total || 0),
          0,
        );
        const categoryTotalTRY = categoryItems.reduce(
          (sum: number, item: any) => sum + (item.total_try || 0),
          0,
        );

        return {
          baslik: mainCategory,
          hizmetler: categoryItems.map((item: any) => ({
            hizmet: getCategoryName(item.sub_category) || "",
            birim: item.qty || 0,
            tekrar: item.repeat || 0,
            birimFiyat: formatEUR(item.unit_price || 0),
            birimFiyatNum: Number(item.unit_price || 0),
            toplamEur: formatEUR(item.total || 0),
            toplamEurNum: Number(item.total || 0),
            kur: formatTRY(item.fx || 0),
            kurNum: Number(item.fx || 0),
            toplamTl: formatTRY(item.total_try || 0),
            toplamTlNum: Number(item.total_try || 0),
            aciklama: item.description || "",
          })),
          araToplamEUR: formatEUR(categoryTotal),
          araToplamEurNum: Number(categoryTotal),
          araToplamTL: formatTRY(categoryTotalTRY),
          araToplamTlNum: Number(categoryTotalTRY),
        };
      },
    );

    const totalSales = itemsSales.reduce(
      (sum: number, item: any) => sum + (item.total || 0),
      0,
    );
    const totalSalesTRY = itemsSales.reduce(
      (sum: number, item: any) => sum + (item.total_try || 0),
      0,
    );

    return {
      referans: project?.reference || "Bilinmeyen",
      odaPax: `${project?.room_count || 0} | ${project?.pax_count || 0}`,
      acenteFirma: `${getAgencyName(project?.agency_id || "")} | ${project?.company_name || ""}`,
      konsept: getHotelConcept(project?.hotel_id || ""),
      tarih:
        project?.start_date && project?.end_date
          ? `${new Date(project.start_date).toLocaleDateString("tr-TR")} - ${new Date(project.end_date).toLocaleDateString("tr-TR")}`
          : "",
      opsiyon: "SOR - SAT",
      otelAdi: getHotelName(project?.hotel_id || ""),
      teklifTuru: project?.quote_type || "PAKET",
      durum: project?.status === "active" ? "Aktif" : project?.status || "",
      not: "",
      bolumler,
      genelToplamEUR: formatEUR(totalSales),
      genelToplamEurNum: Number(totalSales),
      genelToplamTL: formatTRY(totalSalesTRY),
      genelToplamTlNum: Number(totalSalesTRY),
      notlar: [
        "FİYATLAR, NET & KOMİSYONSUZDUR.",
        'ALINMASI HENÜZ KESİNLEŞMEYEN SERVİSLER İÇİN BİRİM/ ADET veya SEFER/TEKRAR ÇARPANI "0" (SIFIR) OLARAK GÜNCELLENMİŞTİR.',
      ],
    };
  };

  const exportToExcel = async (reportType: "satis" | "alis" = "satis") => {
    try {
      setExporting(true);
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();

      // Use logos from state if available to avoid refetching and CORS issues
      let iconLogoBase64 = iconLogo;
      let wordmarkLogoBase64 = wordmarkLogo;

      let logosData: any = {};
      if (!iconLogoBase64 || !wordmarkLogoBase64) {
        try {
          logosData = await getLogosForExcel(true, appSettings);
          if (!iconLogoBase64) iconLogoBase64 = logosData.iconLogoBase64 || null;
          if (!wordmarkLogoBase64) wordmarkLogoBase64 = logosData.wordmarkLogoBase64 || null;
        } catch (logoError) {
          console.error("Logo loading error for excel:", logoError);
        }
      }

      const iconWidth = logosData.iconWidth || 60; // default 60 (since aspect ratio gets preserved, 60 is standard height)
      const iconHeight = logosData.iconHeight || 60;
      const wordmarkWidth = logosData.wordmarkWidth || 120;
      const wordmarkHeight = logosData.wordmarkHeight || 60;const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (d: string): "png" | "jpeg" =>
        (d || "").includes("image/png") ? "png" : "jpeg";

      const hotelsData = project?.hotels_data || [];

      // Helper to add a sheet for a specific set of items and hotel info
      const addSheet = (sheetName: string, h: any, items: any[]) => {
        if (items.length === 0 && sheetName !== "GENEL HİZMETLER") return;

        const sheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Excel sheet name limit is 31
        sheet.pageSetup = {
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          horizontalCentered: true,
          paperSize: 9,
          margins: {
            left: 0.25,
            right: 0.25,
            top: 0.3,
            bottom: 0.3,
            header: 0.1,
            footer: 0.1,
          },
        } as any;

        const topBandRow = sheet.addRow([]);
        topBandRow.height = 70;
        sheet.mergeCells("A1:F1");
        for (let c = 1; c <= 6; c++) {
          sheet.getRow(1).getCell(c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF232F38" },
          };
        }
        if (iconLogoBase64 && iconLogoBase64.startsWith("data:")) {
          try {
            sheet.addImage(
              workbook.addImage({
                base64: iconLogoBase64,
                extension: guessExt(iconLogoBase64) as any,
              }),
              {
                tl: { col: 0.15, row: 0.15 },
                ext: { width: iconWidth, height: iconHeight },
              },
            );
          } catch (e) {
            console.error("Icon error:", e);
          }
        }
        if (wordmarkLogoBase64 && wordmarkLogoBase64.startsWith("data:")) {
          try {
            sheet.addImage(
              workbook.addImage({
                base64: wordmarkLogoBase64,
                extension: guessExt(wordmarkLogoBase64) as any,
              }),
              {
                tl: { col: 5.9, row: 0.23 },
                ext: { width: wordmarkWidth, height: wordmarkHeight },
              },
            );
          } catch (e) {
            console.error("Wordmark error:", e);
          }
        }

        const isGeneral = sheetName === "GENEL HİZMETLER";
        const headerInfo = [
          [
            "REFERANS",
            project.reference,
            "ODA | PAX",
            isGeneral ? "-" : `${h.room_count || 0} | ${h.pax_count || 0}`,
          ],
          [
            "ACENTE | FİRMA",
            `${getAgencyName(project.agency_id)} | ${project.company_name}`,
            "KONSEPT",
            isGeneral ? "-" : h.hotel_concept || "",
          ],
          [
            "C/IN - C/OUT",
            !isGeneral && h.check_in_date
              ? `${new Date(h.check_in_date).toLocaleDateString("tr-TR")} - ${new Date(h.check_out_date).toLocaleDateString("tr-TR")}`
              : "-",
            "OPSİYON",
            isGeneral ? "-" : "SOR-SAT",
          ],
          [
            "OTEL",
            isGeneral ? "GENEL HİZMETLER" : getHotelName(h.hotel_id),
            "DURUM",
            getStatusText(project.status),
          ],
          ["TEKLİF TÜRÜ", project.quote_type || "PAKET", "NOT", ""],
        ];

        let rowIndex = 2;
        headerInfo.forEach(([lLabel, lVal, rLabel, rVal]) => {
          const rowValues: any[] = new Array(6);
          rowValues[0] = lLabel;
          rowValues[1] = lVal;
          rowValues[4] = rLabel;
          rowValues[5] = rVal;
          const row = sheet.addRow(rowValues);
          row.height = 24;
          row.getCell(1).font = { bold: true, size: 12 };
          row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(2).font = { size: 12 };
          row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(5).font = { bold: true, size: 12 };
          row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(6).font = { size: 12 };
          row.getCell(6).alignment = { horizontal: "left", vertical: "middle" };
          sheet.mergeCells(`B${rowIndex}:D${rowIndex}`);
          sheet.mergeCells(`F${rowIndex}:F${rowIndex}`);
          for (let c = 1; c <= 6; c++)
            row.getCell(c).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD3CBBE" },
            };
          rowIndex++;
        });

        // Title
        sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
        const titleCell = sheet.getCell(`A${rowIndex}`);
        titleCell.value = reportType === "alis" ? "ALIŞLAR" : "SATIŞLAR";
        titleCell.font = { size: 20, bold: true };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        sheet.getRow(rowIndex).height = 35;
        for (let c = 1; c <= 6; c++)
          sheet.getRow(rowIndex).getCell(c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
        rowIndex++;

        // Group items
        const grouped: Record<string, any[]> = {};
        items.forEach((item) => {
          const key = item.main_category || "other";
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        const subtotalRowsE: number[] = [];

        const sortedCatIds = Object.keys(grouped).sort((a, b) => {
          if (a === "other") return 1;
          if (b === "other") return -1;
          const catA = categories.find((c) => c.id === a || c.name === a) || {
            id: a,
            name: a,
          };
          const catB = categories.find((c) => c.id === b || c.name === b) || {
            id: b,
            name: b,
          };
          return compareByCategoryId(catA, catB);
        });

        sortedCatIds.forEach((catId, i) => {
          const catItems = grouped[catId];
          const mainCat = getCategoryName(catId) || "DİĞER HİZMETLER";
          const catRow = sheet.addRow([`${i + 1}. ${mainCat}`]);
          catRow.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
          for (let c = 1; c <= 6; c++)
            catRow.getCell(c).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF666666" },
            };
          catRow.height = 25;
          sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
          rowIndex++;

          const hRow = sheet.addRow([
            "DETAY/AÇIKLAMA",
            "BİRİM/ADET",
            "SEFER/TEKRAR",
            "BİRİM/FİYAT",
            "TOPLAM EUR",
            "AÇIKLAMA",
          ]);
          hRow.font = { bold: true, size: 11 };
          hRow.height = 22;
          for (let c = 1; c <= 6; c++)
            hRow.getCell(c).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F0F0" },
            };
          rowIndex++;

          let firstItemRow: number | null = null;
          catItems.forEach((item) => {
            const sRow = sheet.addRow([
              getCategoryName(item.sub_category || ""),
              item.qty || 0,
              item.repeat || 0,
              item.unit_price || 0,
              0,
              item.description || "",
            ]);
            if (!firstItemRow) firstItemRow = sRow.number;
            const r = sRow.number;
            sRow.getCell(4).numFmt = "€ #,##0.00";
            sRow.getCell(5).numFmt = "€ #,##0.00";
            sRow.getCell(5).value = {
              formula: `B${r}*C${r}*D${r}`,
              result: item.total ?? 0,
            } as any;
            sRow.height = 18;
            rowIndex++;
          });

          const lastItemRow = rowIndex - 1;
          const araRow = sheet.addRow(["ARA TOPLAM", "", "", "", 0, ""]);
          araRow.font = { bold: true, size: 12 };
          for (let c = 1; c <= 6; c++)
            araRow.getCell(c).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD3CBBE" },
            }; // Aligned with header color for subtotal
          if (firstItemRow) {
            araRow.getCell(5).value = {
              formula: `SUM(E${firstItemRow}:E${lastItemRow})`,
              result: catItems.reduce((s, i) => s + (i.total || 0), 0),
            } as any;
          }
          araRow.getCell(5).numFmt = "€ #,##0.00";
          araRow.height = 22;
          subtotalRowsE.push(araRow.number);
          rowIndex++;
          sheet.addRow([]);
          rowIndex++;
        });

        const totalRow = sheet.addRow([
          reportType === "alis"
            ? "ALIŞ GENEL TOPLAMLAR"
            : "SATIŞ GENEL TOPLAMLAR",
          "",
          "",
          "",
          0,
          "",
        ]);
        totalRow.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        for (let c = 1; c <= 6; c++)
          totalRow.getCell(c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF333333" },
          };
        if (subtotalRowsE.length > 0) {
          totalRow.getCell(5).value = {
            formula: `SUM(${subtotalRowsE.map((r) => `E${r}`).join(",")})`,
            result: items.reduce((s, i) => s + (i.total || 0), 0),
          } as any;
        }
        totalRow.getCell(5).numFmt = "€ #,##0.00";
        totalRow.height = 30;

        // Column widths
        sheet.columns = [
          { width: 45 },
          { width: 12 },
          { width: 12 },
          { width: 15 },
          { width: 20 },
          { width: 45 },
        ];
        sheet.views = [{ state: "normal", showGridLines: false }];
      };

      // Add sheet for each hotel
      hotelsData.forEach((h: any, idx: number) => {
        const hItems = itemsSales.filter(
          (item) => item.hotel_id === h.hotel_id || item.hotel_id === h.id,
        );
        const hotelName = getHotelName(h.hotel_id);
        const namePrefix = `${idx + 1}. ${hotelName || "OTEL"}`;
        addSheet(namePrefix, h, hItems);
      });

      // Add "GENEL HİZMETLER" sheet
      const generalItems = itemsSales.filter(
        (item) => !item.hotel_id || item.hotel_id === "general",
      );
      if (generalItems.length > 0) {
        addSheet("GENEL HİZMETLER", {}, generalItems);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `PROJE_${reportType.toUpperCase()}_${(project?.reference || "RAPOR").replace(/[^a-z0-9]/gi, "_")}.xlsx`;

      const uint8 = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++)
        binary += String.fromCharCode(uint8[i]);
      const base64 = window.btoa(binary);
      const url = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

      const anchor = document.createElement("a");
      anchor.style.display = "none";
      anchor.href = url;
      anchor.setAttribute("download", filename);
      document.body.appendChild(anchor);
      anchor.click();

      setTimeout(() => {
        if (document.body.contains(anchor)) document.body.removeChild(anchor);
      }, 5000);
    } catch (error) {
      console.error("Excel export hatası:", error);
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = itemsSales.filter(
    (item) =>
      activeViewHotelId === "all" ||
      item.hotel_id === activeViewHotelId ||
      (activeViewHotelId === "general" &&
        (!item.hotel_id || item.hotel_id === "general")),
  );

  const hotelsData = project?.hotels_data || [];

  if (loading)
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  if (error && !showPasswordForm)
    return <div className="p-8 text-center text-red-500">{error}</div>;

  if (showPasswordForm) {
    const loginLogo =
      appSettings?.darkMenuLogo ||
      appSettings?.lightMenuLogo ||
      appSettings?.darkIconLogo ||
      "";
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Dekoratif arka plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {loginLogo && (
              <img
                src={loginLogo}
                alt="Logo"
                className="h-24 w-auto object-contain drop-shadow-2xl transition-all duration-700"
              />
            )}
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl w-full"
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Güvenli Erişim
              </h2>
              <p className="text-slate-400 text-sm">
                Devam etmek için proje şifresini giriniz
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre"
                  className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all text-center text-lg tracking-widest"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 justify-center text-red-400 text-sm font-bold bg-red-400/10 py-3 rounded-xl border border-red-400/20">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-14 bg-blue-500 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] text-lg"
              >
                Görüntüle
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center"></div>
          </form>
        </div>
      </div>
    );
  }

  if (!project)
    return (
      <div className="p-8 text-center text-gray-500">Proje bulunamadı.</div>
    );

  return (
    <div
      className="min-h-screen h-full overflow-y-auto p-4 md:p-8 transition-colors duration-500"
      style={{ backgroundColor: appSettings?.lightBgMain || "#f8fafc" }}
    >
      <div
        className="max-w-6xl mx-auto rounded-2xl shadow-xl overflow-hidden border transition-all duration-500"
        style={{
          backgroundColor: appSettings?.lightCard || "#ffffff",
          borderColor: appSettings?.lightSidebarBorder || "#e2e8f0",
        }}
      >
        {/* Banner - Dark Theme */}
        <div
          className="p-6 flex flex-wrap justify-between items-center gap-4 transition-colors duration-500"
          style={{ backgroundColor: "#232f38" }}
        >
          <div className="flex items-center gap-3">
            {(appSettings?.darkIconLogo || appSettings?.lightIconLogo) && (
              <img
                src={appSettings?.darkIconLogo || appSettings?.lightIconLogo}
                alt="Logo"
                className="h-10 w-auto"
              />
            )}
            <span className="text-white text-lg font-bold tracking-tight">
              {appSettings?.companyName ||
                process.env.NEXT_PUBLIC_AGENCY_NAME ||
                "COOP EVENT"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => exportToExcel("satis")}
              disabled={exporting}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-green-900/20"
            >
              <svg
                className="w-3 h-3 mr-1.5"
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
              {exporting ? "İşleniyor..." : "EXCEL İNDİR"}
            </button>
            <div className="text-white text-right border-l border-white/10 pl-4">
              <p className="text-[10px] text-gray-100 font-bold uppercase tracking-wider">
                PROJE REFERANS
              </p>
              <p className="text-lg font-bold">{project.reference || "-"}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {/* Main Info Grid - Exact Style from Quote Link */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 p-8 rounded-2xl border transition-colors duration-500"
            style={{
              backgroundColor: appSettings?.lightBgSecondary || "#f8fafc",
              borderColor: appSettings?.lightSidebarBorder || "#f1f5f9",
            }}
          >
            <div>
              <label
                className="block text-[10px] font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30"
                style={{ color: appSettings?.colorSecondary || "#64748b" }}
              >
                ACENTE | FİRMA
              </label>
              <p
                className="text-sm font-bold"
                style={{ color: appSettings?.lightText || "#1e293b" }}
              >
                {getAgencyName(project.agency_id)} | {project.company_name}
              </p>
            </div>
            <div>
              <label className="block text-[10px] text-gray-600 font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30">
                PROJE DURUMU
              </label>
              <span
                className={`px-2 py-1 text-[10px] font-bold rounded-full ${project.status === "approved" || project.status === "completed" ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-400"}`}
              >
                {getStatusText(project.status).toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-[10px] text-gray-600 font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30">
                C-IN TARİHİ
              </label>
              <p className="text-sm font-bold text-slate-900">
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>
            <div>
              <label className="block text-[10px] text-gray-600 font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30">
                C-OUT TARİHİ
              </label>
              <p className="text-sm font-bold text-slate-900">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>
          </div>

          {/* Navigator (Tabs) - Support Multi-Hotel Navigation */}
          <div
            className="flex relative group transition-colors"
            style={{
              backgroundColor: appSettings?.lightBgMain || "#f1f5f9",
              borderColor: appSettings?.lightSidebarBorder || "#e2e8f0",
              borderBottomWidth: "1px",
            }}
          >
            <div className="flex-1 flex flex-nowrap overflow-x-auto scrollbar-hide py-1 px-1">
              <button
                onClick={() => setActiveViewHotelId("all")}
                className={`px-6 py-4 text-xs font-bold transition-all whitespace-nowrap ${activeViewHotelId === "all" ? "text-blue-700 border-b-2 border-blue-600" : "text-gray-700 hover:text-gray-900"}`}
                style={{
                  backgroundColor:
                    activeViewHotelId === "all"
                      ? appSettings?.lightBgSecondary || "#ffffff"
                      : "transparent",
                  minWidth: "fit-content",
                }}
              >
                TÜMÜ
              </button>
              {hotelsData.map((h: any, idx: number) => (
                <button
                  key={h.id}
                  onClick={() => setActiveViewHotelId(h.id)}
                  className={`px-6 py-4 text-xs font-bold transition-all whitespace-nowrap ${activeViewHotelId === h.id ? "text-blue-700 border-b-2 border-blue-600" : "text-gray-700 hover:text-gray-900"}`}
                  style={{
                    backgroundColor:
                      activeViewHotelId === h.id
                        ? appSettings?.lightBgSecondary || "#ffffff"
                        : "transparent",
                    minWidth: "fit-content",
                  }}
                >
                  {getHotelName(h.hotel_id) !== ""
                    ? getHotelName(h.hotel_id)
                    : `OTEL ${idx + 1}`}
                </button>
              ))}
              <button
                onClick={() => setActiveViewHotelId("general")}
                className={`px-6 py-4 text-xs font-bold transition-all whitespace-nowrap ${activeViewHotelId === "general" ? "text-blue-700 border-b-2 border-blue-600" : "text-gray-700 hover:text-gray-900"}`}
                style={{
                  backgroundColor:
                    activeViewHotelId === "general"
                      ? appSettings?.lightBgSecondary || "#ffffff"
                      : "transparent",
                  minWidth: "fit-content",
                }}
              >
                GENEL HİZMETLER
              </button>
            </div>

            {/* Visual indicator for more content */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-6">
            {/* Active Hotel Details Card - Exact Style from Quote Link */}
            {activeViewHotelId &&
              activeViewHotelId !== "general" &&
              (() => {
                const h = hotelsData.find(
                  (x: any) => x.id === activeViewHotelId,
                );
                if (!h) return null;
                return (
                  <div
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-xl mb-8 border shadow-sm transition-colors"
                    style={{
                      backgroundColor:
                        appSettings?.lightBgSecondary || "#f8fafc",
                      borderColor:
                        appSettings?.lightSidebarBorder || "#f1f5f9",
                    }}
                  >
                    <div>
                      <span
                        className="block text-[10px] font-bold uppercase mb-1 tracking-tighter underline decoration-blue-500/20"
                        style={{
                          color: appSettings?.colorSecondary || "#475569",
                        }}
                      >
                        OTEL KONSEPTİ
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: appSettings?.lightText || "#1e293b",
                        }}
                      >
                        {h.hotel_concept || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-600 font-bold uppercase mb-1 tracking-tighter">
                        GİRİŞ / ÇIKIŞ
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {h.check_in_date
                          ? new Date(h.check_in_date).toLocaleDateString(
                              "tr-TR",
                            )
                          : "-"}{" "}
                        /{" "}
                        {h.check_out_date
                          ? new Date(h.check_out_date).toLocaleDateString(
                              "tr-TR",
                            )
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-600 font-bold uppercase mb-1 tracking-tighter">
                        ODA / PAX
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {h.room_count || 0} Oda / {h.pax_count || 0} Pax
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-600 font-bold uppercase mb-1 tracking-tighter">
                        OPSİYON
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {h.option || "SOR - SAT"}{" "}
                        {h.option_date
                          ? `(${new Date(h.option_date).toLocaleDateString("tr-TR")})`
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })()}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead
                  style={{
                    backgroundColor: appSettings?.lightBgMain || "#f8fafc",
                  }}
                >
                  <tr
                    className="border-b-2"
                    style={{
                      borderColor:
                        appSettings?.lightSidebarBorder || "#e2e8f0",
                    }}
                  >
                    <th
                      className="py-4 px-4 text-[10px] font-black uppercase tracking-tighter"
                      style={{
                        color: appSettings?.colorSecondary || "#475569",
                      }}
                    >
                      HİZMET DETAYI / AÇIKLAMA
                    </th>
                    <th className="py-4 text-[10px] font-black text-gray-700 uppercase tracking-tighter text-right">
                      MİKTAR
                    </th>
                    <th className="py-4 text-[10px] font-black text-gray-700 uppercase tracking-tighter text-right">
                      BİRİM FİYAT
                    </th>
                    <th className="py-4 px-4 text-[10px] font-black text-gray-700 uppercase tracking-tighter text-right">
                      TOPLAM EUR
                    </th>
                  </tr>
                </thead>
                {filteredItems.length === 0 ? (
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-gray-400 text-xs italic"
                      >
                        Seçilen kategori/tab için kayıtlı hizmet
                        bulunmamaktadır.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  (() => {
                    const grouped = filteredItems.reduce(
                      (acc: Record<string, any[]>, item: any) => {
                        const catId = item.main_category || "other";
                        if (!acc[catId]) acc[catId] = [];
                        acc[catId].push(item);
                        return acc;
                      },
                      {},
                    );

                    const sortedCatIds = Object.keys(grouped).sort((a, b) => {
                      if (a === "other") return 1;
                      if (b === "other") return -1;
                      const catA = categories.find(
                        (c) => c.id === a || c.name === a,
                      ) || { id: a, name: a };
                      const catB = categories.find(
                        (c) => c.id === b || c.name === b,
                      ) || { id: b, name: b };
                      return compareByCategoryId(catA, catB);
                    });

                    return sortedCatIds.map((catId) => {
                      const items = grouped[catId];
                      const catTotalEur = items.reduce(
                        (s, i) => s + (i.total || 0),
                        0,
                      );
                      const catTotalTry = items.reduce(
                        (s, i) => s + (i.total_try || 0),
                        0,
                      );

                      return (
                        <tbody
                          key={catId}
                          className="border-b border-gray-100 "
                        >
                          {/* Category Header Row */}
                          <tr className="bg-gray-50/80 ">
                            <td colSpan={6} className="py-3 px-4">
                              <span className="text-[10px] font-black text-[#232f38] uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                {getCategoryName(catId) || "DİĞER HİZMETLER"}
                              </span>
                            </td>
                          </tr>

                          {/* Service Items */}
                          {[...items]
                            .sort((a: any, b: any) => {
                              const aSub = a.sub_category
                                ? categories.find(
                                    (c) => c.id === a.sub_category,
                                  )
                                : null;
                              const bSub = b.sub_category
                                ? categories.find(
                                    (c) => c.id === b.sub_category,
                                  )
                                : null;
                              if (aSub || bSub) {
                                return compareByCategoryId(aSub, bSub);
                              }
                              return a.id.localeCompare(b.id);
                            })
                            .map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-blue-500/10/20  transition-colors"
                              >
                                <td className="py-4 px-4">
                                  <p className="text-xs font-bold text-slate-800">
                                    {scrubText(
                                      getCategoryName(
                                        item.sub_category || "",
                                      ) ||
                                        getCategoryName(
                                          item.main_category || "",
                                        ),
                                    )}
                                  </p>
                                  {item.description && (
                                    <p className="text-[10px] text-gray-700 mt-1 leading-relaxed max-w-xl">
                                      {scrubText(item.description)}
                                    </p>
                                  )}
                                </td>
                                <td className="py-4 text-xs font-medium text-right text-slate-600 whitespace-nowrap">
                                  {item.qty} x {item.repeat}
                                </td>
                                <td className="py-4 text-xs font-medium text-right text-slate-600 whitespace-nowrap">
                                  {formatTr(item.unit_price)}{" "}
                                  {item.currency === "TRY"
                                    ? "₺"
                                    : item.currency === "EUR"
                                      ? "€"
                                      : item.currency}
                                </td>
                                <td className="py-4 px-4 text-sm font-black text-right text-slate-900 whitespace-nowrap">
                                  {formatEUR(item.total)}
                                </td>
                              </tr>
                            ))}

                          {/* Category Subtotal Row */}
                          <tr className="bg-slate-50/50">
                            <td colSpan={3} className="py-3 text-right">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic pr-4">
                                ARA TOPLAM ({getCategoryName(catId)})
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-black text-gray-900 text-right whitespace-nowrap border-t border-slate-200">
                              {formatEUR(catTotalEur)}
                            </td>
                          </tr>
                        </tbody>
                      );
                    });
                  })()
                )}
              </table>
            </div>

            {/* Footer Totals & Notes */}
            <div className="mt-10 flex flex-wrap justify-between items-end gap-6 bg-[#232f38] p-8 rounded-2xl shadow-xl">
              <div className="flex-1 min-w-[300px]">
                <h4 className="text-[10px] text-white/80 font-bold uppercase tracking-wider mb-2">
                  NOTLAR & ŞARTLAR
                </h4>
                <ul className="text-[11px] text-gray-300 space-y-1.5 leading-relaxed">
                  <li>• FİYATLAR, NET & KOMİSYONSUZDUR.</li>
                  <li>
                    • ALINMASI HENÜZ KESİNLEŞMEYEN SERVİSLER İÇİN BİRİM/ ADET
                    veya SEFER/TEKRAR ÇARPANI "0" (SIFIR) OLARAK
                    GÜNCELLENMİŞTİR.
                  </li>
                  <li>
                    • OTELE GİRİŞ GÜNÜ KONAKLAMA ÖĞLE YEMEĞİ İLE BAŞLAR, SABAH
                    KAHVALTISI EKSTRA ÜCRETLENDİRİLİR.
                  </li>
                </ul>
              </div>
              <div className="text-right">
                <h3 className="text-[10px] text-white/80 font-bold mb-1 uppercase tracking-widest">
                  TOPLAM GENEL TUTAR
                </h3>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-white">
                    {formatEUR(filteredItems.reduce((s, i) => s + i.total, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Mutabakat Onayı */}
            <div className="mt-12 border-t border-gray-100  pt-10">
              {isApproved ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 flex flex-wrap items-center gap-6">
                  <div className="bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-500/20">
                    <svg
                      className="w-8 h-8"
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
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-green-500 mb-2">
                      Mutabakat Onaylandı
                    </h3>
                    {linkData?.approval && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-[10px] font-bold text-gray-500  uppercase tracking-wider">
                        <div>
                          <p className="text-gray-400 font-medium mb-1">
                            Onaylayan
                          </p>
                          <p className="text-gray-900 ">
                            {linkData.approval.name} {linkData.approval.surname}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">
                            E-posta
                          </p>
                          <p className="text-gray-900  lowercase font-normal">
                            {linkData.approval.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">
                            Onay Tarihi
                          </p>
                          <p className="text-gray-900 ">
                            {new Date(
                              linkData.approval.approved_at,
                            ).toLocaleString("tr-TR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium mb-1">
                            IP Adresi
                          </p>
                          <p className="text-gray-900 ">
                            {linkData.approval.ip_address || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white  rounded-2xl shadow-xl overflow-hidden border border-gray-100  group">
                  <div className="bg-blue-500 p-8 flex flex-wrap justify-between items-center gap-6 group-hover:bg-blue-500/90 transition-colors">
                    <div className="max-w-xl text-white">
                      <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                        Mutabakat Onayı
                      </h3>
                      <p className="text-sm opacity-80 leading-relaxed font-medium">
                        Bu projeyi onaylayarak tüm şartları ve rakamları kabul
                        etmiş sayılırsınız. Onayınız dijital olarak
                        mühürlenecektir.
                      </p>
                    </div>
                    {!showApprovalForm && (
                      <button
                        onClick={() => setShowApprovalForm(true)}
                        className="bg-white text-blue-600 px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/20"
                      >
                        MUTABAKATI ONAYLA
                      </button>
                    )}
                  </div>

                  {showApprovalForm && (
                    <div className="p-8 bg-gray-50 ">
                      <form
                        onSubmit={handleApprovalSubmit}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-600 uppercase mb-2 tracking-widest">
                              İSİM
                            </label>
                            <input
                              type="text"
                              value={approvalForm.name}
                              onChange={(e) =>
                                setApprovalForm({
                                  ...approvalForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-600 uppercase mb-2 tracking-widest">
                              SOYİSİM
                            </label>
                            <input
                              type="text"
                              value={approvalForm.surname}
                              onChange={(e) =>
                                setApprovalForm({
                                  ...approvalForm,
                                  surname: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-600 uppercase mb-2 tracking-widest">
                              E-POSTA
                            </label>
                            <input
                              type="email"
                              value={approvalForm.email}
                              onChange={(e) =>
                                setApprovalForm({
                                  ...approvalForm,
                                  email: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                          <button
                            type="button"
                            onClick={() => setShowApprovalForm(false)}
                            className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700  transition-colors"
                          >
                            İPTAL
                          </button>
                          <button
                            type="submit"
                            disabled={approving}
                            className="px-10 py-3 bg-green-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-900/10 active:scale-95 transition-all"
                          >
                            {approving ? "İŞLENİYOR..." : "ONAYI TAMAMLA"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
