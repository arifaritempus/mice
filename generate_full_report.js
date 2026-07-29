const fs = require('fs');
const target = '/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/utils/projectFullReportExport.ts';

const code = `import { getLogosForExcel } from "./logoUtils";

export const generateProjectFullReport = async ({
  project,
  salesItems,
  purchaseItems,
  flightTickets,
  projectOthers,
  collectionPlans,
  paymentPlans,
  accommodationItems,
  transfers,
  getCategoryName,
  getSupplierName,
  getHotelName,
  t
}: any) => {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const logos = await getLogosForExcel(true);
  const { iconLogoBase64, wordmarkLogoBase64 } = logos;

  const inchToPx = (inch: number) => Math.round(inch * 96);
  const saveWorkbook = async () => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = \`TAM_RAPOR_\${project.name || "PROJE"}_\${new Date().toISOString().slice(0, 10)}.xlsx\`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper to get formatted dates
  const fmtDate = (d: any) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("tr-TR");
    } catch {
      return "-";
    }
  };

  const fmtMoney = (val: any) => {
    if (!val) return "0,00";
    return Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- SHEET 1: PROJE BİLGİLERİ ---
  const createProjectInfoSheet = () => {
    const sheet = workbook.addWorksheet("PROJE BİLGİLERİ");
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } };
    sheet.columns = [
      { width: 30 }, { width: 40 }, { width: 30 }, { width: 40 }
    ];
    
    // Header
    sheet.getRow(1).height = 70;
    sheet.mergeCells("A1:D1");
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F38" } };
    if (iconLogoBase64) {
      const iconId = workbook.addImage({ base64: iconLogoBase64, extension: "png" });
      sheet.addImage(iconId, { tl: { col: 0.05, row: 0.1 }, ext: { width: 85, height: 85 } });
    }
    if (wordmarkLogoBase64) {
      const wordmarkId = workbook.addImage({ base64: wordmarkLogoBase64, extension: "png" });
      sheet.addImage(wordmarkId, { tl: { nativeCol: 3, nativeColOff: 1800000, nativeRow: 0, nativeRowOff: 90000 }, ext: { width: 85, height: 85 } });
    }

    sheet.getRow(3).height = 25;
    sheet.getCell("A3").value = "PROJE BİLGİLERİ";
    sheet.getCell("A3").font = { bold: true, size: 14 };
    sheet.mergeCells("A3:D3");
    
    const info = [
      ["REFERANS", project.reference || "-", "FİRMA ADI", project.company_name || "-"],
      ["PROJE DURUMU", project.status || "-", "ACENTE ADI", project.agency_name || "-"],
      ["", "", "PROJE SORUMLUSU", project.manager_name || "-"],
      ["OTELLER VE KONAKLAMA TARİHLERİ", project.hotel_name || "-", "ODA | PAX", project.room_pax || "-"],
      ["", "", "TEKLİF TÜRÜ", project.quote_type || "BİRİM"]
    ];

    let r = 5;
    info.forEach(row => {
      const rowObj = sheet.getRow(r);
      rowObj.height = 25;
      rowObj.getCell(1).value = row[0]; rowObj.getCell(1).font = { bold: true }; rowObj.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      rowObj.getCell(2).value = row[1];
      rowObj.getCell(3).value = row[2]; rowObj.getCell(3).font = { bold: true }; rowObj.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      rowObj.getCell(4).value = row[3];
      
      for(let i=1; i<=4; i++) {
        rowObj.getCell(i).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        rowObj.getCell(i).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }
      r++;
    });
  };

  // --- SHEET 2 & 3: SATIŞLAR ve ALIŞLAR ---
  const createSalesPurchaseSheet = (sheetName: string, items: any[], isSales: boolean) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } };
    
    sheet.columns = [
      { key: "desc", width: 45 },
      { key: "qty", width: 12 },
      { key: "repeat", width: 12 },
      { key: "price", width: 15 },
      { key: "totalEur", width: 15 },
      { key: "fx", width: 10 },
      { key: "totalTl", width: 15 },
      { key: "notes", width: 35 },
      { key: "hotel", width: 25 },
    ];

    sheet.getRow(1).height = 70;
    sheet.mergeCells("A1:I1");
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F38" } };
    if (iconLogoBase64) {
      const iconId = workbook.addImage({ base64: iconLogoBase64, extension: "png" });
      sheet.addImage(iconId, { tl: { col: 0.05, row: 0.1 }, ext: { width: 85, height: 85 } });
    }
    if (wordmarkLogoBase64) {
      const wordmarkId = workbook.addImage({ base64: wordmarkLogoBase64, extension: "png" });
      sheet.addImage(wordmarkId, { tl: { nativeCol: 8, nativeColOff: 1800000, nativeRow: 0, nativeRowOff: 90000 }, ext: { width: 85, height: 85 } });
    }

    let currentRow = 3;
    const titleRow = sheet.getRow(currentRow);
    titleRow.height = 30;
    titleRow.getCell(1).value = sheetName;
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(\`A\${currentRow}:I\${currentRow}\`);
    currentRow += 2;

    const grouped: any = {};
    items.forEach(it => {
      const cat = it.main_category || "other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        desc: getCategoryName(it.sub_category) || it.description || "-",
        qty: it.qty || it.unit_quantity || 1,
        repeat: it.repeat || it.sefer || 1,
        price: it.unit_price || 0,
        totalEur: (it.total || 0),
        fx: it.fx || 1,
        totalTl: (it.total || 0) * (it.fx || 1),
        notes: it.description || "",
        hotel: getHotelName(it.hotel_id) || "-"
      });
    });

    let globalTotalEur = 0;
    let globalTotalTl = 0;

    Object.keys(grouped).forEach(catId => {
      const catTitle = getCategoryName(catId) || catId;
      const catRow = sheet.getRow(currentRow);
      catRow.height = 25;
      catRow.getCell(1).value = catTitle.toUpperCase();
      catRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.mergeCells(\`A\${currentRow}:I\${currentRow}\`);
      for (let c=1; c<=9; c++) catRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF444444" } };
      currentRow++;

      const hRow = sheet.getRow(currentRow);
      hRow.height = 22;
      ["DETAY/AÇIKLAMA", "BİRİM/ADET", "SEFER/TEKRAR", "BİRİM/FİYAT", "TOPLAM EUR", "KUR", "TOPLAM TL", "AÇIKLAMA", "OTEL"].forEach((h, i) => {
        hRow.getCell(i+1).value = h;
        hRow.getCell(i+1).font = { bold: true, size: 10 };
        hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      });
      currentRow++;

      let subTotalEur = 0;
      let subTotalTl = 0;

      grouped[catId].forEach((it: any) => {
        const row = sheet.getRow(currentRow);
        row.height = 18;
        row.getCell(1).value = it.desc;
        row.getCell(2).value = it.qty;
        row.getCell(3).value = it.repeat;
        row.getCell(4).value = it.price; row.getCell(4).numFmt = "#,##0.00";
        row.getCell(5).value = it.totalEur; row.getCell(5).numFmt = "€#,##0.00";
        row.getCell(6).value = it.fx;
        row.getCell(7).value = it.totalTl; row.getCell(7).numFmt = "₺#,##0.00";
        row.getCell(8).value = it.notes; row.getCell(8).alignment = { wrapText: true };
        row.getCell(9).value = it.hotel;
        
        subTotalEur += it.totalEur;
        subTotalTl += it.totalTl;
        currentRow++;
      });

      const subRow = sheet.getRow(currentRow);
      subRow.getCell(1).value = "ARA TOPLAM"; subRow.getCell(1).font = { bold: true };
      subRow.getCell(5).value = subTotalEur; subRow.getCell(5).numFmt = "€#,##0.00"; subRow.getCell(5).font = { bold: true };
      subRow.getCell(7).value = subTotalTl; subRow.getCell(7).numFmt = "₺#,##0.00"; subRow.getCell(7).font = { bold: true };
      for (let c=1; c<=9; c++) subRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
      currentRow += 2;

      globalTotalEur += subTotalEur;
      globalTotalTl += subTotalTl;
    });

    const totalRow = sheet.getRow(currentRow);
    totalRow.height = 30;
    totalRow.getCell(1).value = sheetName + " GENEL TOPLAMLARI";
    totalRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    totalRow.getCell(5).value = globalTotalEur; totalRow.getCell(5).numFmt = "€#,##0.00"; totalRow.getCell(5).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    totalRow.getCell(7).value = globalTotalTl; totalRow.getCell(7).numFmt = "₺#,##0.00"; totalRow.getCell(7).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    
    sheet.mergeCells(\`A\${currentRow}:D\${currentRow}\`);
    sheet.mergeCells(\`E\${currentRow}:F\${currentRow}\`);
    sheet.mergeCells(\`G\${currentRow}:I\${currentRow}\`);

    const color = isSales ? "FF2563EB" : "FFDC2626"; // Blue for Sales, Red for Purchases
    for (let c=1; c<=9; c++) totalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  };

  createProjectInfoSheet();
  createSalesPurchaseSheet("SATIŞLAR", salesItems, true);
  createSalesPurchaseSheet("ALIŞLAR", purchaseItems, false);

  // --- SHEET 4: KONAKLAMA ---
  const createAccommodationSheet = () => {
    const sheet = workbook.addWorksheet("KONAKLAMA");
    
    let minD = new Date(2100, 1, 1);
    let maxD = new Date(1900, 1, 1);
    accommodationItems.forEach((r: any) => {
      if (r.check_in_date) {
        const ci = new Date(r.check_in_date);
        if (ci < minD) minD = ci;
      }
      if (r.check_out_date) {
        const co = new Date(r.check_out_date);
        if (co > maxD) maxD = co;
      }
    });
    if (minD > maxD) {
      if (project?.start_date && project?.end_date) {
        minD = new Date(project.start_date);
        maxD = new Date(project.end_date);
      } else {
        const today = new Date();
        minD = new Date(today);
        maxD = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    const dates: Date[] = [];
    let cur = new Date(minD);
    while (cur < maxD) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const headers = [
      "ODA #", "ODA TİPİ", "İSİM", "SOYİSİM", "GİRİŞ TARİHİ", "ÇIKIŞ TARİHİ", "OTEL", "UÇAK", "TOPLAM", "DÖVİZ"
    ];
    dates.forEach(d => {
      headers.push(d.toLocaleDateString("tr-TR", { day: '2-digit', month: 'short' }));
    });
    headers.push("GECELEME");

    sheet.columns = headers.map(h => ({ header: "", key: h, width: 15 }));
    sheet.columns[0].width = 8;
    sheet.columns[2].width = 20;
    sheet.columns[3].width = 20;
    sheet.columns[6].width = 25;

    const totalCols = headers.length;
    const lastColLetter = sheet.getColumn(totalCols).letter;

    sheet.getRow(1).height = 70;
    sheet.mergeCells(\`A1:\${lastColLetter}1\`);
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F38" } };
    if (iconLogoBase64) {
      const iconId = workbook.addImage({ base64: iconLogoBase64, extension: "png" });
      sheet.addImage(iconId, { tl: { col: 0.05, row: 0.1 }, ext: { width: 85, height: 85 } });
    }
    if (wordmarkLogoBase64) {
      const wordmarkId = workbook.addImage({ base64: wordmarkLogoBase64, extension: "png" });
      sheet.addImage(wordmarkId, { tl: { nativeCol: totalCols - 2, nativeColOff: 1800000, nativeRow: 0, nativeRowOff: 90000 }, ext: { width: 85, height: 85 } });
    }

    const hRow = sheet.getRow(3);
    hRow.height = 30;
    headers.forEach((h, i) => {
      hRow.getCell(i+1).value = h;
      hRow.getCell(i+1).font = { bold: true };
      hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      hRow.getCell(i+1).alignment = { vertical: 'middle', horizontal: 'center' };
    });

    let r = 4;
    accommodationItems.forEach((it: any) => {
      const row = sheet.getRow(r);
      row.getCell(1).value = it.oda_no || "";
      row.getCell(2).value = it.oda_tipi || "";
      row.getCell(3).value = it.isim || "";
      row.getCell(4).value = it.soyisim || "";
      row.getCell(5).value = fmtDate(it.check_in_date);
      row.getCell(6).value = fmtDate(it.check_out_date);
      row.getCell(7).value = getHotelName(it.hotel_id) || "";
      row.getCell(8).value = it.flight_code || "";
      row.getCell(9).value = it.toplam || 0;
      row.getCell(10).value = it.doviz || "EUR";

      let nightsCount = 0;
      const itemCin = it.check_in_date ? new Date(it.check_in_date) : null;
      const itemCout = it.check_out_date ? new Date(it.check_out_date) : null;
      
      dates.forEach((d, idx) => {
        const cell = row.getCell(11 + idx);
        if (itemCin && itemCout && d >= itemCin && d < itemCout) {
          cell.value = it.oda_tipi || "SNG";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } }; // Light blue
          nightsCount++;
        }
      });
      row.getCell(11 + dates.length).value = nightsCount;
      r++;
    });

    // Forecast Table
    r += 2;
    sheet.getRow(r).getCell(1).value = "Forecast - ODA # Bazında Analiz";
    sheet.getRow(r).getCell(1).font = { bold: true, size: 14 };
    r += 2;

    const fRow = sheet.getRow(r);
    fRow.getCell(1).value = "TARİH";
    fRow.getCell(2).value = "SNG";
    fRow.getCell(3).value = "DBL";
    fRow.getCell(4).value = "TOPLAM ODA";
    fRow.getCell(5).value = "TOPLAM KİŞİ";
    for(let i=1; i<=5; i++) {
        fRow.getCell(i).font = { bold: true };
        fRow.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    }
    r++;

    let totalSng = 0, totalDbl = 0, totalOda = 0, totalKisi = 0;
    dates.forEach(d => {
      let sng = 0, dbl = 0;
      accommodationItems.forEach((it: any) => {
        const itemCin = it.check_in_date ? new Date(it.check_in_date) : null;
        const itemCout = it.check_out_date ? new Date(it.check_out_date) : null;
        if (itemCin && itemCout && d >= itemCin && d < itemCout) {
          if (it.oda_tipi === "SNG" || it.oda_tipi?.toUpperCase().includes("SNG") || it.oda_tipi === "SINGLE") sng++;
          else dbl++;
        }
      });
      const topOda = sng + dbl;
      const topKisi = sng + (dbl * 2);
      const row = sheet.getRow(r);
      row.getCell(1).value = fmtDate(d);
      row.getCell(2).value = sng;
      row.getCell(3).value = dbl;
      row.getCell(4).value = topOda;
      row.getCell(5).value = topKisi;
      
      totalSng += sng;
      totalDbl += dbl;
      totalOda += topOda;
      totalKisi += topKisi;
      r++;
    });

    const totRow = sheet.getRow(r);
    totRow.getCell(1).value = "GENEL TOPLAM"; totRow.getCell(1).font = { bold: true };
    totRow.getCell(2).value = totalSng; totRow.getCell(2).font = { bold: true };
    totRow.getCell(3).value = totalDbl; totRow.getCell(3).font = { bold: true };
    totRow.getCell(4).value = totalOda; totRow.getCell(4).font = { bold: true };
    totRow.getCell(5).value = totalKisi; totRow.getCell(5).font = { bold: true };
    for(let i=1; i<=5; i++) totRow.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } };
  };
  createAccommodationSheet();

  // --- Finish and Save ---
  await saveWorkbook();
};
