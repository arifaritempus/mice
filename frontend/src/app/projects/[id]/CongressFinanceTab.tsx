"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseService";
import { Building2, UserCircle, Receipt, Download, FileText, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface CongressFinanceTabProps {
  projectId: string;
  project: any;
}

export default function CongressFinanceTab({ projectId, project }: CongressFinanceTabProps) {
  const [loading, setLoading] = useState(true);
  const [salesItems, setSalesItems] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<Record<string, string>>({});
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [collectionPlans, setCollectionPlans] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [generalSettings, setGeneralSettings] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agRes, catsRes, salesRes, cpRes, collRes, settingsRes] = await Promise.all([
        supabase.from("agencies").select("id, name"),
        supabase.from("categories").select("id, name"),
        supabase.from("project_sales_items").select("id, category, sub_category, description, unit_price, unit_quantity, total_price, currency, payer_company_id, participant_id").eq("project_id", projectId),
        supabase.from("project_collection_plans").select("*").eq("project_id", projectId),
        supabase.from("project_collections").select("*").eq("project_id", projectId),
        fetch("/api/theme-settings") // Bypass RLS to get settings
      ]);

      const agMap: Record<string, string> = {};
      agRes.data?.forEach(a => agMap[a.id] = a.name);
      setAgencies(agMap);

      const catMap: Record<string, string> = {};
      catsRes.data?.forEach(c => catMap[c.id] = c.name);
      setCategoriesMap(catMap);

      setSalesItems(salesRes.data || []);
      setCollectionPlans(cpRes.data || []);
      setCollections(collRes.data || []);

      if (settingsRes.ok) {
         const sData = await settingsRes.json();
         setGeneralSettings(sData.general_settings || null);
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupId)) newSet.delete(groupId);
    else newSet.add(groupId);
    setExpandedGroups(newSet);
  };

  const groupedData = salesItems.reduce((acc: Record<string, any[]>, item) => {
    const groupId = item.payer_company_id || "self";
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(item);
    return acc;
  }, {});

  const getCatName = (id: string, fallback: string = "Diğer") => {
    return categoriesMap[id] || fallback;
  };

  const groupItemsByMainCat = (items: any[]) => {
    const grouped: Record<string, any[]> = {};
    items.forEach(it => {
      const isExtra = !it.participant_id; // Check if it's an extra / sponsor
      const cName = getCatName(it.category, "Diğer");
      const mainCatName = isExtra ? `EKSTRA / SPONSORLUK (${cName})` : cName;

      if (!grouped[mainCatName]) grouped[mainCatName] = [];
      
      const subName = it.sub_category ? (categoriesMap[it.sub_category] || it.description) : (it.description || "-");
      
      grouped[mainCatName].push({
        subName,
        quantity: it.unit_quantity || 1,
        sefer: 1, // Defaulting to 1 for congress items
        unitPrice: it.unit_price || 0,
        total: it.total_price || 0,
        currency: it.currency || "TRY",
        description: it.description || ""
      });
    });

    // Merge identical lines within same category
    Object.keys(grouped).forEach(k => {
       const merged = new Map<string, any>();
       grouped[k].forEach(it => {
          const mKey = `${it.subName}_${it.unitPrice}_${it.currency}_${it.description}`;
          if (merged.has(mKey)) {
             const ex = merged.get(mKey);
             ex.quantity += it.quantity;
             ex.total += it.total;
          } else {
             merged.set(mKey, { ...it });
          }
       });
       grouped[k] = Array.from(merged.values());
    });

    return grouped;
  };

  const generateProformaExcel = async (groupId: string, items: any[], totals: Record<string, number>, gPlans: any[], gColls: any[], balances: Record<string, number>, collTotals: Record<string, number>) => {
    toast.loading("Proforma Excel hazırlanıyor...");
    try {
      const ExcelJS = (await import("exceljs")).default || await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      
      const { getLogosForExcel } = await import("@/utils/logoUtils");
      const logos = await getLogosForExcel(true);
      const guessExt = (d: string): "png" | "jpeg" => (d || "").includes("image/png") ? "png" : "jpeg";

      const sheet = workbook.addWorksheet("Proforma");
      sheet.pageSetup = { 
        orientation: "landscape", 
        fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, paperSize: 9, 
        margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } 
      };
      sheet.views = [{ state: "normal", showGridLines: false }];
      
      sheet.columns = [
        { width: 30 }, // DETAY/AÇIKLAMA
        { width: 15 }, // BİRİM/ADET
        { width: 15 }, // SEFER/TEKRAR
        { width: 20 }, // BİRİM/FİYAT
        { width: 20 }, // TOPLAM DÖVİZ
        { width: 35 }, // AÇIKLAMA
      ];

      // Top Band
      const topBandRow = sheet.addRow([]);
      topBandRow.height = 70;
      sheet.mergeCells("A1:F1");
      for (let c = 1; c <= 6; c++) {
        sheet.getRow(1).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F38" } };
      }
      
      if (logos.iconLogoBase64) {
        sheet.addImage(
          workbook.addImage({ base64: logos.iconLogoBase64, extension: guessExt(logos.iconLogoBase64) }),
          { tl: { col: 0.05, row: 0.1 }, ext: { width: 85, height: 85 } }
        );
      }
      if (logos.wordmarkLogoBase64) {
        sheet.addImage(
          workbook.addImage({ base64: logos.wordmarkLogoBase64, extension: guessExt(logos.wordmarkLogoBase64) }),
          { tl: { nativeCol: 5, nativeColOff: 2300000, nativeRow: 0, nativeRowOff: 90000 } as any, ext: { width: 85, height: 85 } }
        );
      }

      const companyName = groupId === "self" ? "Bireysel Ödemeler" : (agencies[groupId] || "Bilinmeyen Kurum");

      const headerInfo = [
        ["REFERANS", project?.project_code || "-", "ODA | PAX", "-"],
        ["ACENTE | FİRMA", companyName, "KONSEPT", "-"],
        ["C/IN - C/OUT", project?.start_date ? `${new Date(project.start_date).toLocaleDateString("tr-TR")} - ${new Date(project.end_date).toLocaleDateString("tr-TR")}` : "-", "OPSİYON", "-"],
        ["OTEL", "KONGRE PROJESİ", "DURUM", project?.status || "-"],
        ["TEKLİF TÜRÜ", "PROFORMA HİZMET DÖKÜMÜ", "NOT", "-"]
      ];

      let rowIndex = 2;
      headerInfo.forEach(([lLabel, lVal, rLabel, rVal]) => {
        const row = sheet.addRow([lLabel, lVal, "", rLabel, rVal, ""]);
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
        
        for (let c = 1; c <= 6; c++) {
          row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3CBBE" } };
        }
        rowIndex++;
      });

      // Title
      sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      const titleCell = sheet.getCell(`A${rowIndex}`);
      titleCell.value = "PROFORMA HESAP ÖZETİ";
      titleCell.font = { size: 20, bold: true };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(rowIndex).height = 35;
      for (let c = 1; c <= 6; c++) {
        sheet.getRow(rowIndex).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
      }
      rowIndex++;

      // Items Grouped
      const groupedItems = groupItemsByMainCat(items);
      let catIndex = 1;
      
      Object.entries(groupedItems).forEach(([mainCat, catItems]) => {
        // Category Header (Dark Gray)
        const catRow = sheet.addRow([`${catIndex}. ${mainCat}`]);
        catRow.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        for (let c = 1; c <= 6; c++) {
          catRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF666666" } };
        }
        catRow.height = 25;
        sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
        rowIndex++;

        // Sub Header (Light Gray)
        const hRow = sheet.addRow(["DETAY/AÇIKLAMA", "BİRİM/ADET", "SEFER/TEKRAR", "BİRİM/FİYAT", "TOPLAM DÖVİZ", "AÇIKLAMA"]);
        hRow.font = { bold: true, size: 11 };
        hRow.height = 22;
        for (let c = 1; c <= 6; c++) {
          const cell = hRow.getCell(c);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
          cell.alignment = { vertical: "middle", horizontal: c >= 2 && c <= 5 ? "center" : "left" };
        }
        rowIndex++;

        // Items
        catItems.forEach((item) => {
          const sRow = sheet.addRow([
            item.subName,
            item.quantity,
            item.sefer,
            `${item.unitPrice.toLocaleString('tr-TR')} ${item.currency}`,
            `${item.total.toLocaleString('tr-TR')} ${item.currency}`,
            item.description
          ]);
          sRow.height = 20;
          for (let c = 1; c <= 6; c++) {
            const cell = sRow.getCell(c);
            cell.alignment = { vertical: "middle", horizontal: c >= 2 && c <= 5 ? "center" : "left" };
            cell.border = { bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
          }
          rowIndex++;
        });
        catIndex++;
      });

      // Total
      const totalRow = sheet.addRow(["", "", "", "GENEL TOPLAM:", Object.entries(totals).map(([cur, amount]) => `${amount.toLocaleString('tr-TR')} ${cur}`).join(" | "), ""]);
      totalRow.height = 24;
      totalRow.getCell(4).font = { bold: true, size: 12 };
      totalRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      totalRow.getCell(5).font = { bold: true, size: 12 };
      totalRow.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
      for (let c = 1; c <= 6; c++) totalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
      rowIndex++;
      
      rowIndex++; // Empty space

      // PAYMENT PLAN
      const ppRow = sheet.addRow(["ÖDEME PLANI", "", "", "", "", ""]);
      ppRow.height = 22;
      sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      ppRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ppRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6B7280" } };
      rowIndex++;

      if (gPlans.length > 0) {
        gPlans.forEach(pl => {
           sheet.addRow([new Date(pl.due_date).toLocaleDateString('tr-TR'), pl.description || "-", "", "", `${pl.amount?.toLocaleString('tr-TR')} ${pl.currency}`, ""]);
           sheet.mergeCells(`B${rowIndex}:D${rowIndex}`);
           sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
           sheet.getRow(rowIndex).getCell(5).alignment = { horizontal: "center" };
           rowIndex++;
        });
      } else {
        sheet.addRow(["Planlanmış ödeme yok.", "", "", "", "", ""]);
        sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
        rowIndex++;
      }
      
      rowIndex++; // space

      // COLLECTIONS
      const collRow = sheet.addRow(["GERÇEKLEŞEN TAHSİLATLAR", "", "", "", "", ""]);
      collRow.height = 22;
      sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      collRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      collRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } }; // Emerald
      rowIndex++;

      if (gColls.length > 0) {
        gColls.forEach(c => {
           sheet.addRow([new Date(c.date).toLocaleDateString('tr-TR'), c.notes || "-", "", "", `+${c.amount?.toLocaleString('tr-TR')} ${c.currency}`, ""]);
           sheet.mergeCells(`B${rowIndex}:D${rowIndex}`);
           sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
           sheet.getRow(rowIndex).getCell(5).alignment = { horizontal: "center" };
           sheet.getRow(rowIndex).getCell(5).font = { color: { argb: "FF10B981" } };
           rowIndex++;
        });
        const cTotalRow = sheet.addRow(["", "", "", "TAHSİLAT TOPLAMI:", Object.entries(collTotals).map(([cur, amount]) => `${amount.toLocaleString('tr-TR')} ${cur}`).join(" | "), ""]);
        sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
        cTotalRow.getCell(4).font = { bold: true };
        cTotalRow.getCell(4).alignment = { horizontal: "right" };
        cTotalRow.getCell(5).font = { bold: true, color: { argb: "FF10B981" } };
        cTotalRow.getCell(5).alignment = { horizontal: "center" };
        rowIndex++;
      } else {
        sheet.addRow(["Henüz tahsilat yapılmamış.", "", "", "", "", ""]);
        sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
        rowIndex++;
      }

      rowIndex++; // space

      // BALANCE
      const balRow = sheet.addRow(["", "", "", "KALAN BAKİYE:", Object.entries(balances).map(([cur, amount]) => `${amount.toLocaleString('tr-TR')} ${cur}`).join(" | "), ""]);
      balRow.height = 26;
      sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
      balRow.getCell(4).font = { bold: true, size: 14 };
      balRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      balRow.getCell(5).font = { bold: true, size: 14, color: { argb: "FFEF4444" } };
      balRow.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
      rowIndex++;

      rowIndex++; // space

      // BANK ACCOUNTS
      const bankTitleRow = sheet.addRow(["BANKA HESAP BİLGİLERİ", "", "", "", "", ""]);
      sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      bankTitleRow.getCell(1).font = { bold: true, size: 12 };
      bankTitleRow.getCell(1).border = { bottom: { style: "thin" } };
      rowIndex++;

      if (generalSettings?.bankAccounts && Array.isArray(generalSettings.bankAccounts)) {
        generalSettings.bankAccounts.forEach((acc: any) => {
           sheet.addRow([`Banka:`, acc.bankName || "-", "", `IBAN:`, acc.iban || "-", `Döviz: ${acc.currency || ""}`]);
           sheet.mergeCells(`B${rowIndex}:C${rowIndex}`);
           sheet.getRow(rowIndex).getCell(1).font = { bold: true };
           sheet.getRow(rowIndex).getCell(4).font = { bold: true };
           rowIndex++;
        });
      } else {
        sheet.addRow(["Banka hesap bilgisi bulunamadı.", "", "", "", "", ""]);
        sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
        rowIndex++;
      }

      rowIndex++; // space

      // COMPANY INFO
      const compRow = sheet.addRow(["ŞİRKET BİLGİLERİ", "", "", "", "", ""]);
      sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      compRow.getCell(1).font = { bold: true, size: 12 };
      compRow.getCell(1).border = { bottom: { style: "thin" } };
      rowIndex++;

      sheet.addRow(["Ünvan:", generalSettings?.companyName || "-", "", "", "", ""]); sheet.mergeCells(`B${rowIndex}:F${rowIndex}`); sheet.getRow(rowIndex).getCell(1).font = { bold: true }; rowIndex++;
      sheet.addRow(["Adres:", generalSettings?.companyAddress || "-", "", "", "", ""]); sheet.mergeCells(`B${rowIndex}:F${rowIndex}`); sheet.getRow(rowIndex).getCell(1).font = { bold: true }; rowIndex++;
      sheet.addRow(["Telefon:", generalSettings?.companyPhone || "-", "", "E-Posta:", generalSettings?.companyEmail || "-", ""]); sheet.mergeCells(`B${rowIndex}:C${rowIndex}`); sheet.mergeCells(`E${rowIndex}:F${rowIndex}`); sheet.getRow(rowIndex).getCell(1).font = { bold: true }; sheet.getRow(rowIndex).getCell(4).font = { bold: true }; rowIndex++;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proforma_${companyName.substring(0, 15)}_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Proforma Excel başarıyla indirildi.");
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error("Excel oluşturulurken hata: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Finans verileri yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between bg-white dark:bg-v3-surface p-6 rounded-2xl border border-gray-200 dark:border-v3-border shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Receipt className="w-6 h-6 text-purple-500" />
            Proforma ve Hesap Özeti
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Firmalara ait kayıt, konaklama, uçak ve ekstra satış kalemlerini teklif formatında görüntüleyin ve Excel alın.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedData).map(([groupId, itemsObj]) => {
          const items = itemsObj as any[];
          const isSelf = groupId === "self";
          const groupName = isSelf ? "Bireysel Ödemeler (Kendi Ödeyenler)" : agencies[groupId] || "Bilinmeyen Kurum";
          
          const totals: Record<string, number> = {};
          items.forEach(it => {
            const cur = it.currency || "TRY";
            totals[cur] = (totals[cur] || 0) + (it.total_price || 0);
          });

          const isExpanded = expandedGroups.has(groupId);

          const gPlans = collectionPlans.filter(cp => isSelf ? cp.contact_type === 'person' : cp.contact_id === groupId);
          const gColls = collections.filter(c => isSelf ? c.contact_type === 'person' : c.contact_id === groupId);

          const collTotals: Record<string, number> = {};
          gColls.forEach(c => {
             const cur = c.currency || "TRY";
             collTotals[cur] = (collTotals[cur] || 0) + (c.amount || 0);
          });

          const balances: Record<string, number> = {};
          const allCurrencies = new Set([...Object.keys(totals), ...Object.keys(collTotals)]);
          allCurrencies.forEach(cur => {
             balances[cur] = (totals[cur] || 0) - (collTotals[cur] || 0);
          });

          return (
            <div key={groupId} className="bg-white dark:bg-v3-surface rounded-xl border border-gray-200 dark:border-v3-border overflow-hidden shadow-sm transition-all">
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-v3-border' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                onClick={() => toggleGroup(groupId)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${isSelf ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                    {isSelf ? <UserCircle className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{groupName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{items.length} adet hizmet kalemi</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex gap-4">
                    {Object.entries(balances).map(([cur, amount]) => (
                      <div key={cur} className="text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">BAKİYE ({cur})</span>
                        <div className={`text-sm font-black ${amount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); generateProformaExcel(groupId, items, totals, gPlans, gColls, balances, collTotals); }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" /> Excel İndir
                  </button>

                  <div className="text-gray-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 flex flex-col gap-6">
                  
                  {/* Satış Kalemleri - Teklif Formatında */}
                  <div className="flex flex-col gap-4">
                    {Object.entries(groupItemsByMainCat(items)).map(([mainCat, catItems], idx) => (
                      <div key={mainCat} className="border border-gray-200 dark:border-v3-border rounded-lg overflow-hidden">
                        <div className="bg-[#666666] text-white px-4 py-2 font-bold text-sm tracking-wide">
                          {idx + 1}. {mainCat}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#f0f0f0] dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] uppercase tracking-wider">
                              <tr>
                                <th className="p-3 font-bold border-b border-gray-200 dark:border-v3-border w-1/4">Detay/Açıklama</th>
                                <th className="p-3 font-bold border-b border-gray-200 dark:border-v3-border text-center">Birim/Adet</th>
                                <th className="p-3 font-bold border-b border-gray-200 dark:border-v3-border text-center">Sefer/Tekrar</th>
                                <th className="p-3 font-bold border-b border-gray-200 dark:border-v3-border text-right">Birim/Fiyat</th>
                                <th className="p-3 font-bold border-b border-gray-200 dark:border-v3-border text-right">Toplam Döviz</th>
                                <th className="p-3 font-bold border-b border-gray-200 dark:border-v3-border">Açıklama</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catItems.map((row, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-v3-border hover:bg-gray-50 dark:hover:bg-white/5">
                                  <td className="p-3 text-xs font-semibold text-gray-800 dark:text-gray-200">{row.subName}</td>
                                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 text-center">{row.quantity}</td>
                                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 text-center">{row.sefer}</td>
                                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 text-right">{row.unitPrice.toLocaleString("tr-TR")} {row.currency}</td>
                                  <td className="p-3 text-xs font-black text-gray-800 dark:text-gray-100 text-right">{row.total.toLocaleString("tr-TR")} {row.currency}</td>
                                  <td className="p-3 text-xs text-gray-500 dark:text-gray-400">{row.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end p-4 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-v3-border mt-2">
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-bold text-gray-500 uppercase">Genel Toplam:</span>
                        <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                          {Object.entries(totals).map(([cur, amount]) => (
                            <div key={cur}>{amount.toLocaleString("tr-TR")} {cur}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-v3-border rounded-xl overflow-hidden bg-white dark:bg-v3-surface">
                       <div className="bg-gray-50 dark:bg-black/20 p-3 border-b border-v3-border text-xs font-bold text-v3-text uppercase">Ödeme Planı (Tahsilat Sekmesinden)</div>
                       {gPlans.length === 0 ? (
                         <div className="p-4 text-xs text-v3-muted text-center italic">Bu firmaya ait planlanmış ödeme yok.</div>
                       ) : (
                         <table className="w-full text-left text-xs">
                           <tbody>
                             {gPlans.map(pl => (
                               <tr key={pl.id} className="border-b border-v3-border last:border-0">
                                 <td className="p-2 pl-3">{new Date(pl.due_date).toLocaleDateString('tr-TR')}</td>
                                 <td className="p-2 text-v3-muted">{pl.description || "-"}</td>
                                 <td className="p-2 font-bold text-right pr-3">{pl.amount?.toLocaleString("tr-TR")} {pl.currency}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       )}
                    </div>
                    
                    <div className="border border-v3-border rounded-xl overflow-hidden bg-white dark:bg-v3-surface">
                       <div className="bg-gray-50 dark:bg-black/20 p-3 border-b border-v3-border text-xs font-bold text-v3-text uppercase">Gerçekleşen Tahsilatlar</div>
                       {gColls.length === 0 ? (
                         <div className="p-4 text-xs text-v3-muted text-center italic">Henüz tahsilat yapılmamış.</div>
                       ) : (
                         <table className="w-full text-left text-xs">
                           <tbody>
                             {gColls.map(cl => (
                               <tr key={cl.id} className="border-b border-v3-border last:border-0">
                                 <td className="p-2 pl-3">{new Date(cl.date).toLocaleDateString('tr-TR')}</td>
                                 <td className="p-2 text-v3-muted">{cl.notes || "-"}</td>
                                 <td className="p-2 font-bold text-right text-emerald-500 pr-3">+{cl.amount?.toLocaleString("tr-TR")} {cl.currency}</td>
                               </tr>
                             ))}
                           </tbody>
                           <tfoot className="bg-gray-50 dark:bg-black/20 border-t border-v3-border">
                             <tr>
                               <td colSpan={2} className="p-2 pr-3 text-right font-bold text-v3-muted">Tahsilat Toplamı:</td>
                               <td className="p-2 pr-3 font-black text-right text-emerald-500">
                                 {Object.entries(collTotals).map(([cur, amount]) => (
                                   <div key={cur}>{amount.toLocaleString("tr-TR")} {cur}</div>
                                 ))}
                               </td>
                             </tr>
                           </tfoot>
                         </table>
                       )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {Object.keys(groupedData).length === 0 && (
          <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-v3-border rounded-xl">
            Henüz finansal bir hareket (satış kalemi) bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}