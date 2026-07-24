"use client";

import { useState, useEffect, Fragment } from "react";
import { toast } from "react-hot-toast";
import { useParams, useSearchParams } from "next/navigation";
import {
  quotesService,
  quoteItemsService,
  agenciesService,
  hotelsService,
  categoriesService,
  publicLinksService,
  SettingsService,
} from "@/lib/supabaseService";
import { formatNumber } from "@/utils/formatters";
import { getLogosForExcel } from "@/utils/logoUtils";

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
  sort_order?: number;
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
  hotel_id?: string;
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
  quote_type: string;
  option: string;
  status: string;
  total_amount: number;
  created_at: string;
  room_count: number;
  pax_count: number;
  notes?: string;
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

export default function QuoteViewPublicPage() {
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
  const getCurrencySymbol = (currencyCode: string) => {
    const curMap: Record<string, string> = { EUR: "€", USD: "$", TRY: "₺", TL: "₺", GBP: "£" };
    return curMap[currencyCode] || currencyCode + " ";
  };
  const formatCurrency = (value: number) => {
    const c = quote?.currency || (quote as any)?.main_currency || "EUR";
    return `${getCurrencySymbol(c)}${formatNumberTR(value)}`;
  };

  const scrubText = (text: string) => {
    if (!text) return "";
    // Removes square brackets and anything inside them like [T:...] or [uuid]
    return text.replace(/\[.*?\]/g, "").trim();
  };
  const params = useParams();
  const searchParams = useSearchParams();
  const quoteId = params.id as string;
  const token = searchParams.get("token");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [iconLogo, setIconLogo] = useState<string | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [error, setError] = useState("");
  const [linkData, setLinkData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [wordmarkLogo, setWordmarkLogo] = useState<string | null>(null);

  const [activeViewHotelId, setActiveViewHotelId] = useState<string>("");
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState<string>("");
  const [tempHotelsData, setTempHotelsData] = useState<any[]>([]);

  const [approving, setApproving] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    name: "",
    surname: "",
    email: "",
  });

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
        if (!link || link.link_type !== "quote" || link.quote_id !== quoteId) {
          setError("Geçersiz link.");
          setLoading(false);
          return;
        }
        setLinkData(link);
        if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
          setError("Link süresi dolmuş.");
          setLoading(false);
          return;
        }
        if (!link.is_active) {
          setError("Link pasif.");
          setLoading(false);
          return;
        }
        if (!showPasswordForm) loadQuote();
        else setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Hata!");
        setLoading(false);
      }
    };
    loadLinkData();
  }, [token, quoteId, showPasswordForm]);

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

  const loadQuote = async () => {
    try {
      const q = await quotesService.getById(quoteId);
      if (q) {
        setQuote(q as any);
        setTempStatus(q.status);
        setTempHotelsData((q as any).hotels_data || []);
        const hData = (q as any).hotels_data || [];
        // Default to first hotel tab
        if (hData.length > 0) setActiveViewHotelId(hData[0].id);
        else setActiveViewHotelId("general");

        const items = await quoteItemsService.getByQuoteId(q.id);

        const parseDescriptionTags = (desc: string) => {
          if (!desc)
            return {
              cleanDesc: "",
              tabTag: null,
              supplierTag: null,
              repeatTag: null,
            };
          const tabMatch = desc.match(/\[T:(.*?)\]/);
          const supplierMatch = desc.match(/\[S:(.*?)\]/);
          const repeatMatch = desc.match(/\[R:(.*?)\]/);
          let cleanDesc = desc
            .replace(/\s?\[T:.*?\]/g, "")
            .replace(/\s?\[S:.*?\]/g, "")
            .replace(/\s?\[R:.*?\]/g, "")
            .trim();
          return {
            cleanDesc,
            tabTag: tabMatch ? tabMatch[1] : null,
            supplierTag: supplierMatch ? supplierMatch[1] : null,
            repeatTag: repeatMatch ? repeatMatch[1] : null,
          };
        };

        const fixedItems = (items || []).map((item: any) => {
          let uiHotelId = item.hotel_id;
          const { cleanDesc, tabTag, repeatTag } = parseDescriptionTags(
            item.description || "",
          );

          if (tabTag) {
            uiHotelId = tabTag;
          } else if (item.hotel_id && hData.length > 0) {
            const matched = hData.find(
              (h: any) =>
                h.hotel_id === item.hotel_id || h.id === item.hotel_id,
            );
            if (matched) uiHotelId = matched.id;
          }

          let inferredRepeat = 1;
          if (repeatTag !== null && repeatTag !== undefined && repeatTag !== "")
            inferredRepeat = Number(repeatTag);
          else if (
            item.sefer !== undefined &&
            item.sefer !== null &&
            item.sefer !== ""
          )
            inferredRepeat = Number(item.sefer);
          else if (
            item.repeat !== undefined &&
            item.repeat !== null &&
            item.repeat !== ""
          )
            inferredRepeat = Number(item.repeat);
          const qty = Number(item.unit_quantity || 1);
          const uPrice = Number(item.unit_price || 0);
          const tPrice = Number(item.total_price || item.total || 0);
          if (qty > 0 && uPrice > 0 && tPrice > 0) {
            const expectedTotal = qty * uPrice * inferredRepeat;
            if (Math.abs(expectedTotal - tPrice) > 1) {
              const calc = Math.round(tPrice / (qty * uPrice));
              if (calc > 0) inferredRepeat = calc;
            }
          }
          return {
            ...item,
            hotel_id: uiHotelId || "general",
            description: cleanDesc,
            sefer: inferredRepeat,
          } as ServiceItem;
        });
        setServiceItems(fixedItems);
      }
      const [agList, htList, catList] = await Promise.all([
        agenciesService.getAll(),
        hotelsService.getAll(),
        categoriesService.getAll(),
      ]);
      setAgencies((agList as any) || []);
      setHotels((htList as any) || []);
      setCategories((catList as any) || []);
    } catch (err) {
      console.error(err);
      setError("Veri yükleme hatası!");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== linkData?.password) {
      setError("Şifre hatalı!");
      return;
    }
    setError("");
    setShowPasswordForm(false);
    setLoading(true);
  };

  const getAgencyName = (id: string) =>
    agencies.find((a) => a.id === id)?.name || "";
  const getHotelName = (id: string) =>
    hotels.find((h) => h.id === id)?.name || "";
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || id;

  const handleExportExcel = async () => {
    if (!quote) return;
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();

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

      const hotelsData = quote?.hotels_data || [];

      const addSheetForHotel = (
        sheetName: string,
        h: any,
        items: ServiceItem[],
      ) => {
        if (items.length === 0 && sheetName !== "GENEL HİZMETLER") return;

        const sheet = workbook.addWorksheet(sheetName.substring(0, 31));
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

        const currencyCode = (quote as any).currency || (quote as any).main_currency || "EUR";
        const curMap: Record<string, string> = { EUR: "€", USD: "$", TRY: "₺", TL: "₺", GBP: "£" };
        const sym = curMap[currencyCode] || currencyCode + " ";
        const numFmt = `"${sym}" #,##0.00`;

        const isGeneral = sheetName === "GENEL HİZMETLER";
        const headerInfo = [
          [
            "REFERANS",
            quote.reference,
            "ODA | PAX",
            isGeneral ? "-" : `${h.room_count || 0} | ${h.pax_count || 0}`,
          ],
          [
            "ACENTE | FİRMA",
            `${getAgencyName(quote.agency_id)} | ${quote.company_name}`,
            "KONSEPT",
            isGeneral ? "-" : h.hotel_concept || "",
          ],
          [
            "C/IN - C/OUT",
            !isGeneral && h.check_in_date
              ? `${new Date(h.check_in_date).toLocaleDateString("tr-TR")} - ${new Date(h.check_out_date).toLocaleDateString("tr-TR")}`
              : "-",
            "OPSİYON",
            isGeneral ? "-" : h.option || "",
          ],
          [
            "OTEL",
            isGeneral ? "GENEL HİZMETLER" : getHotelName(h.hotel_id),
            "DURUM",
            isGeneral ? quote.status : h.hotel_status || quote.status || "",
          ],
          [
            "TEKLİF TÜRÜ",
            quote.quote_type || "BİRİM",
            "NOT",
            quote.notes?.split("\n")[0] || "",
          ],
        ];

        let rowIndex = 2;
        headerInfo.forEach(([lLabel, lVal, rLabel, rVal]) => {
          const rowValues: any[] = new Array(6);
          rowValues[0] = lLabel;
          rowValues[1] = lVal;
          rowValues[3] = rLabel;
          rowValues[4] = rVal;
          const row = sheet.addRow(rowValues);
          row.height = 24;
          row.getCell(1).font = { bold: true, size: 12 };
          row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(2).font = { size: 12 };
          row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(4).font = { bold: true, size: 12 };
          row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(5).font = { size: 12 };
          row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
          sheet.mergeCells(`B${rowIndex}:C${rowIndex}`);
          sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
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
        titleCell.value = "TEKLİF";
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

        // Group items by category ID
        const grouped: Record<string, ServiceItem[]> = {};
        items.forEach((item) => {
          const catId = item.main_category || "other";
          if (!grouped[catId]) grouped[catId] = [];
          grouped[catId].push(item);
        });

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

        const subtotalRowsE: number[] = [];

        sortedCatIds.forEach((catId, i) => {
          const catItems = grouped[catId];
          const subCategoriesByMain = categories.filter(
            (c) => c.parent_id === catId,
          );

          const sortedCatItems = [...catItems].sort((a: any, b: any) => {
            const aSubOrder = a.sub_category
              ? (subCategoriesByMain.findIndex(
                  (c) => c.id === a.sub_category,
                ) ?? 999)
              : 999;
            const bSubOrder = b.sub_category
              ? (subCategoriesByMain.findIndex(
                  (c) => c.id === b.sub_category,
                ) ?? 999)
              : 999;

            if (
              aSubOrder !== bSubOrder &&
              aSubOrder !== -1 &&
              bSubOrder !== -1
            ) {
              return aSubOrder - bSubOrder;
            }
            return a.id.localeCompare(b.id);
          });

          const mainCatName =
            categories.find((c) => c.id === catId)?.name || "Diğer Hizmetler";

          const catRow = sheet.addRow([`${i + 1}. ${mainCatName}`]);
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
            `TOPLAM ${currencyCode}`,
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
          sortedCatItems.forEach((item) => {
            const sRow = sheet.addRow([
              getCategoryName(item.sub_category || ""),
              item.unit_quantity,
              item.sefer,
              item.unit_price || 0,
              0,
              item.description || "",
            ]);
            if (!firstItemRow) firstItemRow = sRow.number;
            const r = sRow.number;
            sRow.getCell(4).numFmt = numFmt;
            sRow.getCell(5).numFmt = numFmt;
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
              fgColor: { argb: "FFD0D0D0" },
            };
          if (firstItemRow) {
            araRow.getCell(5).value = {
              formula: `SUM(E${firstItemRow}:E${lastItemRow})`,
              result: catItems.reduce((s, i) => s + (i.total || 0), 0),
            } as any;
          }
          araRow.getCell(5).numFmt = numFmt;
          araRow.height = 22;
          subtotalRowsE.push(araRow.number);
          rowIndex++;
          sheet.addRow([]);
          rowIndex++;
        });

        const totalRow = sheet.addRow([
          "SATIŞ GENEL TOPLAMLAR",
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
        totalRow.getCell(5).numFmt = numFmt;
        totalRow.height = 30;

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

      hotelsData.forEach((h: any, idx: number) => {
        const hItems = serviceItems.filter((item) => item.hotel_id === h.id);
        const hotelName = getHotelName(h.hotel_id);
        const namePrefix = `${idx + 1}. ${hotelName || "OTEL"}`;
        addSheetForHotel(namePrefix, h, hItems);
      });

      const generalItems = serviceItems.filter(
        (item) => !item.hotel_id || item.hotel_id === "general",
      );
      if (generalItems.length > 0) {
        addSheetForHotel("GENEL HİZMETLER", {}, generalItems);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `TEKLIF_${(quote.reference || "RAPOR").replace(/[^a-z0-9]/gi, "_")}.xlsx`;
      const uint8 = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = window.btoa(binary);
      const url = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 5000);
    } catch (err) {
      console.error(err);
      alert("Excel export hatası!");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const { iconLogoBase64, wordmarkLogoBase64, iconWidth, iconHeight, wordmarkWidth, wordmarkHeight } = await getLogosForExcel(
          true,
          appSettings,
        );
        setIconLogo(iconLogoBase64 || null);
        setWordmarkLogo(wordmarkLogoBase64 || null);
      } catch {}
    };
    if (!showPasswordForm && quote) loadLogos();
  }, [showPasswordForm, quote, appSettings]);

  const handleUpdateStatus = async () => {
    if (!token) return;
    try {
      setSavingStatus(true);
      // Update logic: using existing quotesService update.
      // Note: In production, ensure RLS allows this update for public token holders if possible.
      await quotesService.update(quoteId, {
        status: tempStatus,
        hotels_data: tempHotelsData,
        // (Removing confirmed_at as it may not exist in DB schema)
      } as any);

      setQuote((prev) =>
        prev
          ? { ...prev, status: tempStatus, hotels_data: tempHotelsData }
          : null,
      );
      alert("Durum başarıyla güncellendi.");
    } catch (err) {
      console.error("Status update error:", err);
      alert("Durum güncellenirken bir hata oluştu.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleHotelStatusChange = (hotelId: string, newStatus: string) => {
    setTempHotelsData((prev) =>
      prev.map((h) =>
        h.id === hotelId || h.hotel_id === hotelId
          ? {
              ...h,
              hotel_status: newStatus,
              is_confirmed: newStatus === "KONFİRME",
            }
          : h,
      ),
    );

    // Auto-confirm general quote if any hotel is confirmed?
    // The user said: "bir veya birden fazla otel ile... teklif o şekilde konfirmeye dönüşecek"
    if (newStatus === "KONFİRME") {
      setTempStatus("KONFİRME");
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
    if (!token || !quote) return;

    const hasPendingHotels = tempHotelsData.some(
      (h: any) => !h.hotel_status || h.hotel_status === "BEKLEMEDE",
    );
    if (hasPendingHotels) {
      toast.error(
        "Lütfen tüm oteller için KONFİRME veya İPTAL durumunu seçiniz.",
      );
      return;
    }

    try {
      setApproving(true);

      const geoData = await getClientGeoData();
      const approvalData = {
        ...approvalForm,
        approved_at: new Date().toISOString(),
        ip_address: geoData.ip,
        geo_location: {
          city: geoData.city,
          region: geoData.region,
          country: geoData.country,
          postal: geoData.postal,
        },
        is_approved: true,
      };

      // Persist changes via secure API route (bypasses RLS)
      const response = await fetch("/api/public/quotes/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          quoteId,
          approvalData,
          hotelsData: tempHotelsData,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "API Hatası");
      }

      setQuote((prev) => (prev ? { ...prev, status: "KONFİRME" } : null));
      setLinkData((prev) => ({ ...prev, approval: approvalData }));
      setShowApprovalForm(false);

      toast.success(
        "Teklif başarıyla onaylandı. İlginiz için teşekkür ederiz.",
      );
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(err.message || "Onay işlemi sırasında bir hata oluştu.");
    } finally {
      setApproving(false);
    }
  };

  const filteredItems = serviceItems.filter(
    (item) =>
      item.hotel_id === activeViewHotelId ||
      (activeViewHotelId === "general" && !item.hotel_id),
  );

  const hotelsData = quote?.hotels_data || [];

  if (loading)
    return <div className="p-8 text-center text-slate-800">Yükleniyor...</div>;
  if (error && !showPasswordForm)
    return <div className="p-8 text-center text-red-500">{error}</div>;

  if (showPasswordForm) {
    const loginLogo =
      appSettings?.darkMenuLogo ||
      appSettings?.lightMenuLogo ||
      appSettings?.darkIconLogo ||
      "";
    return (
      <div className="min-h-screen bg-v3-surface flex items-center justify-center p-4 relative overflow-hidden">
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
            className="bg-v3-surface backdrop-blur-2xl border border-v3-border p-10 rounded-3xl shadow-2xl w-full"
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-v3-text mb-2 tracking-tight">
                Güvenli Erişim
              </h2>
              <p className="text-v3-muted text-sm">
                Devam etmek için teklif şifresini giriniz
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre"
                  className="w-full h-14 px-6 bg-v3-surface border border-v3-border rounded-2xl text-v3-text placeholder:text-v3-muted focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all text-center text-lg tracking-widest"
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

            <div className="mt-8 pt-6 border-t border-slate-200 text-center"></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-y-auto p-4 md:p-8 transition-colors duration-500 z-50 text-slate-900"
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
              onClick={handleExportExcel}
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
                  strokeWidth={2 / 5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {exporting ? "İşleniyor..." : "EXCEL İNDİR"}
            </button>
            <div className="text-white text-right border-l border-slate-200 pl-4">
              <p className="text-[10px] text-gray-100 font-bold uppercase tracking-wider">
                TEKLİF REFERANS
              </p>
              <p className="text-lg font-bold">{quote?.reference || "-"}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10">
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
                
              >
                MÜŞTERİ | FİRMA
              </label>
              <p
                className="text-sm font-bold"
                
              >
                {getAgencyName(quote?.agency_id || "")} | {quote?.company_name}
              </p>
            </div>
            <div>
              <label className="block text-[10px] text-slate-800 font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30">
                C-IN TARİHİ
              </label>
              <p className="text-sm font-bold text-slate-800">
                {quote?.check_in_date
                  ? new Date(quote.check_in_date).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>
            <div>
              <label className="block text-[10px] text-slate-800 font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30">
                C-OUT TARİHİ
              </label>
              <p className="text-sm font-bold text-slate-800">
                {quote?.check_out_date
                  ? new Date(quote.check_out_date).toLocaleDateString("tr-TR")
                  : "-"}
              </p>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-[10px] text-slate-800 font-black uppercase tracking-tighter mb-2 italic underline decoration-blue-600/30">
                TEKLİF DURUMU (GÜNCELLE)
              </label>
              <div className="relative">
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  disabled={linkData?.approval?.is_approved}
                  className="w-full max-w-[200px] h-10 px-3 text-xs font-bold rounded-lg border-2 border-gray-400 text-slate-800 focus:border-blue-500 focus:outline-none bg-white shadow-sm appearance-none pr-8 disabled:bg-black/5 dark:bg-white/5 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-gray-300"
                >
                  <option value="BEKLEMEDE">BEKLEMEDE</option>
                  <option value="KONFİRME">KONFİRME</option>
                  <option value="İPTAL">İPTAL</option>
                </select>
                {!linkData?.approval?.is_approved && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-blue-600 dark:text-blue-400">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigator */}
          <div
            className="flex relative group transition-colors"
            style={{
              backgroundColor: appSettings?.lightBgMain || "#f1f5f9",
              borderColor: appSettings?.lightSidebarBorder || "#e2e8f0",
              borderBottomWidth: "1px",
            }}
          >
            <div className="flex-1 flex flex-nowrap overflow-x-auto scrollbar-hide py-1 px-1">
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
            {activeViewHotelId &&
              activeViewHotelId !== "general" &&
              (() => {
                const h = hotelsData.find(
                  (x: any) => x.id === activeViewHotelId,
                );
                if (!h) return null;
                return (
                  <div
                    className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6 rounded-xl mb-8 border shadow-sm items-center transition-colors duration-500"
                    style={{
                      backgroundColor:
                        appSettings?.lightBgSecondary || "#f8fafc",
                      borderColor:
                        appSettings?.lightSidebarBorder || "#f1f5f9",
                    }}
                  >
                    <div>
                      <span
                        className="block text-[10px] font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30"
                        
                      >
                        OTEL KONSEPTİ
                      </span>
                      <span
                        className="text-sm font-bold"
                        
                      >
                        {h.hotel_concept || "-"}
                      </span>
                    </div>
                    <div>
                      <span
                        className="block text-[10px] font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30"
                        
                      >
                        GİRİŞ / ÇIKIŞ
                      </span>
                      <span
                        className="text-sm font-bold whitespace-nowrap"
                        
                      >
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
                      <span
                        className="block text-[10px] font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30"
                        
                      >
                        ODA / PAX
                      </span>
                      <span
                        className="text-sm font-bold"
                        
                      >
                        {h.room_count} Oda / {h.pax_count} Pax
                      </span>
                    </div>
                    <div>
                      <span
                        className="block text-[10px] font-black uppercase tracking-tighter mb-2 underline decoration-blue-600/30"
                        
                      >
                        OPSİYON
                      </span>
                      <span
                        className="text-sm font-bold"
                        
                      >
                        {h.option || "-"}{" "}
                        {h.option_date ? (
                          <span className="text-blue-600 block text-xs mt-0.5">
                            (
                            {new Date(h.option_date).toLocaleDateString(
                              "tr-TR",
                            )}
                            )
                          </span>
                        ) : (
                          ""
                        )}
                      </span>
                    </div>
                    <div>
                      <span
                        className="block text-[10px] font-black uppercase tracking-tighter mb-2 italic underline decoration-blue-600/30"
                        
                      >
                        OTEL DURUMU (GÜNCELLE)
                      </span>
                      <div className="relative">
                        <select
                          value={
                            tempHotelsData.find(
                              (x) =>
                                x.id === activeViewHotelId ||
                                x.hotel_id === activeViewHotelId,
                            )?.hotel_status || "BEKLEMEDE"
                          }
                          onChange={(e) =>
                            handleHotelStatusChange(
                              activeViewHotelId,
                              e.target.value,
                            )
                          }
                          disabled={linkData?.approval?.is_approved}
                          className="w-full max-w-[200px] h-10 px-3 text-xs font-bold rounded-lg border-2 border-gray-400 text-slate-800 focus:border-blue-500 focus:outline-none bg-white shadow-sm appearance-none pr-8 disabled:bg-black/5 dark:bg-white/5 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-gray-300"
                        >
                          <option value="BEKLEMEDE">BEKLEMEDE</option>
                          <option value="KONFİRME">KONFİRME</option>
                          <option value="İPTAL">İPTAL</option>
                        </select>
                        {!linkData?.approval?.is_approved && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-blue-600 dark:text-blue-400">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
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
                      TOPLAM DÖVİZ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-10 text-center text-slate-800 text-xs italic"
                      >
                        Kayıtlı hizmet bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const grouped = filteredItems.reduce(
                        (acc: Record<string, ServiceItem[]>, item: any) => {
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
                        const catItems = grouped[catId];
                        const subCategoriesByMain = categories.filter(
                          (c) => c.parent_id === catId,
                        );

                        const sortedCatItems = [...catItems].sort(
                          (a: any, b: any) => {
                            const aSub = a.sub_category
                              ? categories.find((c) => c.id === a.sub_category)
                              : null;
                            const bSub = b.sub_category
                              ? categories.find((c) => c.id === b.sub_category)
                              : null;
                            if (aSub || bSub) {
                              return compareByCategoryId(aSub, bSub);
                            }
                            return a.id.localeCompare(b.id);
                          },
                        );

                        const catName =
                          categories.find((c) => c.id === catId)?.name ||
                          "Diğer Hizmetler";
                        const catSubtotal = sortedCatItems.reduce(
                          (sum, item) => sum + item.total,
                          0,
                        );
                        const currency = sortedCatItems[0]?.currency || "EUR";

                        return (
                          <Fragment key={catId}>
                            {/* Category Header Row */}
                            <tr className="bg-black/5 dark:bg-white/5/80 ">
                              <td colSpan={4} className="py-3 px-4">
                                <span className="text-[10px] font-black text-[#232f38] uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                  {catName}
                                </span>
                              </td>
                            </tr>

                            {/* Items in Category */}
                            {sortedCatItems.map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-blue-500/10/20 transition-colors"
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
                                <td className="py-4 text-xs font-medium text-right text-slate-800 whitespace-nowrap">
                                  {item.unit_quantity} x {item.sefer}
                                </td>
                                <td className="py-4 text-xs font-medium text-right text-slate-800 whitespace-nowrap">
                                  {formatTr(item.unit_price)}{" "}
                                  {item.currency === "TRY"
                                    ? "₺"
                                    : item.currency === "EUR"
                                      ? "€"
                                      : item.currency}
                                </td>
                                <td className="py-4 px-4 text-sm font-black text-right text-slate-800 whitespace-nowrap">
                                  {formatCurrency(item.total)}
                                </td>
                              </tr>
                            ))}

                            {/* Category Subtotal Row */}
                            <tr className="bg-black/5 dark:bg-white/5">
                              <td colSpan={3} className="py-3 text-right">
                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic pr-4">
                                  ARA TOPLAM ({catName})
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm font-black text-gray-900 text-right whitespace-nowrap border-t border-slate-200">
                                {formatCurrency(catSubtotal)}
                              </td>
                            </tr>
                          </Fragment>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-10 flex flex-wrap justify-between items-end gap-6 bg-black/5 dark:bg-white/5 p-8 rounded-2xl shadow-xl">
              <div className="flex-1 min-w-[300px]">
                <h4 className="text-[10px] text-slate-800/80 font-bold uppercase tracking-wider mb-2">
                  NOTLAR & ŞARTLAR
                </h4>
                <ul className="text-[11px] text-slate-800 space-y-1.5 leading-relaxed">
                  {quote?.notes ? (
                    quote.notes
                      .split("\n")
                      .map((note, idx) => <li key={idx}>• {note}</li>)
                  ) : (
                    <>
                      <li>
                        • ALINMASI HENÜZ KESİNLEŞMEYEN SERVİSLER İÇİN BİRİM/
                        ADET veya SEFER/TEKRAR ÇARPANI "0" (SIFIR) OLARAK
                        GÜNCELLENMİŞTİR.
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="text-right">
                <h3 className="text-[10px] text-slate-800/80 font-bold mb-1 uppercase tracking-widest">
                  TOPLAM GENEL TUTAR
                </h3>
                <p className="text-3xl font-black text-slate-800">
                  {formatCurrency(filteredItems.reduce((s, i) => s + i.total, 0))}
                </p>
              </div>
            </div>

            {/* Quote Approval Section */}
            <div className="mt-12 space-y-6 text-left">
              {linkData?.approval?.is_approved ? (
                <div className="bg-green-50 border-2 border-green-100 rounded-3xl p-8 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                      <svg
                        className="w-6 h-6"
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
                    <div>
                      <h3 className="text-xl font-black text-green-900 uppercase tracking-tight text-left">
                        Teklif Onaylandı
                      </h3>
                      <p className="text-sm text-green-700 font-medium text-left">
                        Bu teklif resmi olarak onaylanmış ve kayda alınmıştır.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-green-100">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-green-800/40 uppercase mb-1">
                        ONAYLAYAN
                      </p>
                      <p className="text-sm font-bold text-green-900">
                        {linkData.approval.name} {linkData.approval.surname}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-green-800/40 uppercase mb-1">
                        E-POSTA
                      </p>
                      <p className="text-sm font-bold text-green-900 lowercase">
                        {linkData.approval.email}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-green-800/40 uppercase mb-1">
                        ONAY TARİHİ
                      </p>
                      <p className="text-sm font-bold text-green-900">
                        {new Date(linkData.approval.approved_at).toLocaleString(
                          "tr-TR",
                        )}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-green-800/40 uppercase mb-1">
                        ONAY MÜHÜRÜ (IP)
                      </p>
                      <p className="text-sm font-bold text-green-900">
                        {linkData.approval.ip_address || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-50 group hover:border-blue-100 transition-all duration-500">
                  <div className="bg-blue-500 p-8 flex flex-wrap justify-between items-center gap-6 group-hover:bg-blue-500/90 transition-colors">
                    <div className="max-w-xl text-slate-800 text-left">
                      <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-slate-800">
                        Teklif Onayı
                      </h3>
                      <p className="text-sm font-medium opacity-80 leading-relaxed text-slate-800/90">
                        Bu teklifi onaylayarak seçimlerinizi kaydedip, yukarıda
                        belirtilen tüm hizmetleri ve şartları kabul etmiş
                        sayılırsınız. Onayınız dijital olarak mühürlenecek ve
                        sistemimize kaydedilecektir.
                      </p>
                    </div>
                    {!showApprovalForm && (
                      <button
                        onClick={() => {
                          const hasPendingHotels = tempHotelsData.some(
                            (h: any) =>
                              !h.hotel_status || h.hotel_status === "BEKLEMEDE",
                          );
                          if (hasPendingHotels) {
                            toast.error(
                              "Lütfen teklifi onaylamadan önce tüm oteller için KONFİRME veya İPTAL durumunu seçiniz.",
                            );
                            return;
                          }
                          setShowApprovalForm(true);
                        }}
                        className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-900/20"
                      >
                        TEKLİFİ ONAYLA
                      </button>
                    )}
                  </div>

                  {showApprovalForm && (
                    <div className="p-10 bg-black/5 dark:bg-white/5/50">
                      <form
                        onSubmit={handleApprovalSubmit}
                        className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="text-left">
                            <label className="block text-[10px] font-black text-slate-800 uppercase mb-3 tracking-widest">
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
                              placeholder="Adınız"
                              className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                          <div className="text-left">
                            <label className="block text-[10px] font-black text-slate-800 uppercase mb-3 tracking-widest">
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
                              placeholder="Soyadınız"
                              className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                          <div className="text-left">
                            <label className="block text-[10px] font-black text-slate-800 uppercase mb-3 tracking-widest">
                              E-POSTA ADRESİ
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
                              placeholder="Email adresiniz"
                              className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-end items-center pt-6 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setShowApprovalForm(false)}
                            className="px-8 py-4 text-xs font-black text-slate-800 uppercase tracking-widest hover:text-gray-800 hover:bg-black/5 dark:bg-white/5/50 rounded-xl transition-all"
                          >
                            VAZGEÇ
                          </button>
                          <button
                            type="submit"
                            disabled={approving}
                            className="px-12 py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 hover:scale-105 disabled:opacity-50 shadow-2xl shadow-green-900/20 active:scale-95 transition-all flex items-center gap-3"
                          >
                            {approving ? (
                              <div className="w-4 h-4 border-2 border-slate-200 border-t-white rounded-full animate-spin" />
                            ) : (
                              <svg
                                className="w-4 h-4"
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
                            )}
                            {approving ? "ONAYLANIYOR..." : "ONAYI TAMAMLA"}
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
