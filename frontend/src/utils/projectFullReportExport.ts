import { getLogosForExcel } from "./logoUtils";

export const generateProjectFullReport = async ({
  project,
  salesItems = [],
  purchaseItems = [],
  flightTickets = [],
  projectOthers = [],
  collectionPlans = [],
  paymentPlans = [],
  collections = [],
  payments = [],
  categories = [],
  hotels = [],
  suppliers = [],
  accommodationItems = [],
  transfers = [],
  getCategoryName,
  getSupplierName,
  getHotelName,
  t
}: any) => {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const logos = await getLogosForExcel(true);
  const { iconLogoBase64, wordmarkLogoBase64 } = logos;

  const saveWorkbook = async () => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TAM_RAPOR_${project?.name || "PROJE"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseDate = (dateStr: any) => {
    if (!dateStr) return null;
    if (typeof dateStr === "string" && dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const [day, month, year] = dateStr.split(".");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const fmtDate = (d: any) => {
    const parsed = parseDate(d);
    return parsed ? parsed.toLocaleDateString("tr-TR") : (d || "-");
  };

  const fmtMoney = (val: any) => {
    if (!val && val !== 0) return "0,00";
    return Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const drawHeaders = (sheet: any, mergeStr: string, wordmarkColFloat: number) => {
    sheet.getRow(1).height = 70;
    sheet.mergeCells(mergeStr);
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F38" } };
    if (iconLogoBase64) {
      const iconId = workbook.addImage({ base64: iconLogoBase64, extension: "png" });
      sheet.addImage(iconId, { tl: { col: 0.05, row: 0.1 }, ext: { width: 85, height: 85 } });
    }
    if (wordmarkLogoBase64) {
      const wordmarkId = workbook.addImage({ base64: wordmarkLogoBase64, extension: "png" });
      sheet.addImage(wordmarkId, { tl: { col: wordmarkColFloat, row: 0.1 }, ext: { width: 85, height: 85 } });
    }
  };

  // --- 1. PROJE BİLGİLERİ ---
  const createProjectInfoSheet = () => {
    const sheet = workbook.addWorksheet("PROJE BİLGİLERİ");
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.3, footer: 0.3 } };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [ { width: 30 }, { width: 40 }, { width: 30 }, { width: 40 } ];
    drawHeaders(sheet, "A1:D1", 3.1);

    sheet.getRow(3).height = 25;
    sheet.getCell("A3").value = "PROJE BİLGİLERİ";
    sheet.getCell("A3").font = { bold: true, size: 14 };
    sheet.mergeCells("A3:D3");
    
    const getStatusLabel = (s: string) => {
      switch (s) {
        case 'active': return 'Aktif';
        case 'completed': return 'Tamamlandı';
        case 'cancelled': return 'İptal Edildi';
        case 'draft': return 'Taslak';
        case 'pending': return 'Beklemede';
        default: return s || '-';
      }
    };

    const formattedHotels = (project?.hotels_data || []).map((h: any) => {
      const name = h.name || h.hotel_name || getHotelName(h.hotel_id) || "";
      if (!name) return null;
      const ci = h.check_in_date || h.check_in ? fmtDate(h.check_in_date || h.check_in) : "";
      const co = h.check_out_date || h.check_out ? fmtDate(h.check_out_date || h.check_out) : "";
      if (ci && co) return `${name} (${ci} - ${co})`;
      return name;
    }).filter(Boolean).join(", ") || "-";

    const info = [
      ["REFERANS", project?.reference || "-", "FİRMA ADI", project?.company_name || "-"],
      ["PROJE DURUMU", getStatusLabel(project?.status), "BAŞLANGIÇ TARİHİ", fmtDate(project?.start_date)],
      ["TEKLİF TÜRÜ", project?.quote_type || "BİRİM", "BİTİŞ TARİHİ", fmtDate(project?.end_date)],
      ["OTELLER VE KONAKLAMA TARİHLERİ", formattedHotels, "ODA | PAX", project?.room_pax || "-"]
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

  // --- 2 & 3. SATIŞLAR ve ALIŞLAR ---
  const createSalesPurchaseSheet = (sheetName: string, items: any[], isSales: boolean) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [
      { key: "desc", width: 45 }, { key: "qty", width: 12 }, { key: "repeat", width: 12 },
      { key: "price", width: 15 }, { key: "totalEur", width: 15 }, { key: "fx", width: 10 },
      { key: "totalTl", width: 15 }, { key: "notes", width: 35 }, { key: "hotel", width: 25 },
    ];
    drawHeaders(sheet, "A1:I1", 8.1);

    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = sheetName;
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:I${r}`);
    r += 2;

    const getSym = (c: string) => {
      if (c === "TRY" || c === "TL") return "₺";
      if (c === "USD") return "$";
      if (c === "GBP") return "£";
      return "€";
    };
    
    const fmtN = (val: number) => Number(val).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        hotel: getHotelName(it.hotel_id) || (it.hotel_id ? "-" : "GENEL"),
        currency: it.currency || "EUR"
      });
    });

    let globalTotalTl = 0;
    const globalCurTotals: any = {};
    const subTotalRows: number[] = [];

    Object.keys(grouped).forEach(catId => {
      const catTitle = getCategoryName(catId) || catId;
      const catRow = sheet.getRow(r);
      catRow.height = 25;
      catRow.getCell(1).value = catTitle.toUpperCase();
      catRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      sheet.mergeCells(`A${r}:I${r}`);
      for (let c=1; c<=9; c++) catRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF666666" } };
      r++;

      const hRow = sheet.getRow(r);
      hRow.height = 22;
      ["DETAY/AÇIKLAMA", "BİRİM/ADET", "SEFER/TEKRAR", "BİRİM/FİYAT", "TOPLAM DÖVİZ", "KUR", "TOPLAM TL", "AÇIKLAMA", "OTEL"].forEach((h, i) => {
        hRow.getCell(i+1).value = h;
        hRow.getCell(i+1).font = { bold: true, size: 11 };
        hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
        hRow.getCell(i+1).alignment = { horizontal: "center", vertical: "middle" };
      });
      r++;

      let subTotalTl = 0;
      const catCurTotals: any = {};
      const startRow = r;
      
      grouped[catId].forEach((it: any, idx: number) => {
        const cur = it.currency;
        catCurTotals[cur] = (catCurTotals[cur] || 0) + it.totalEur;
        globalCurTotals[cur] = (globalCurTotals[cur] || 0) + it.totalEur;
        
        const row = sheet.getRow(r); row.height = 18;
        row.getCell(1).value = it.desc;
        row.getCell(2).value = it.qty;
        row.getCell(3).value = it.repeat;
        
        const sym = getSym(cur);
        row.getCell(4).value = it.price; row.getCell(4).numFmt = `"${sym}"#,##0.00`;
        row.getCell(5).value = { formula: `B${r}*C${r}*D${r}`, result: it.totalEur }; row.getCell(5).numFmt = `"${sym}"#,##0.00`;
        row.getCell(6).value = it.fx;
        row.getCell(7).value = { formula: `E${r}*F${r}`, result: it.totalTl }; row.getCell(7).numFmt = `"₺"#,##0.00`;
        row.getCell(8).value = it.notes;
        row.getCell(9).value = it.hotel;
        
        for (let c=1; c<=7; c++) {
          row.getCell(c).alignment = { vertical: 'middle', wrapText: true };
        }
        row.getCell(8).alignment = { wrapText: true, vertical: 'top' };
        row.getCell(9).alignment = { wrapText: true, vertical: 'top' };
        
        subTotalTl += it.totalTl;
        r++;
      });
      const endRow = r - 1;

      const subRow = sheet.getRow(r);
      subRow.getCell(1).value = "ARA TOPLAM"; subRow.getCell(1).font = { bold: true, size: 12 };
      
      const catCurKeys = Object.keys(catCurTotals);
      if (catCurKeys.length === 1) {
        const cur = catCurKeys[0];
        if (endRow >= startRow) {
          subRow.getCell(5).value = { formula: `SUM(E${startRow}:E${endRow})`, result: catCurTotals[cur] };
        } else {
          subRow.getCell(5).value = catCurTotals[cur];
        }
        subRow.getCell(5).numFmt = `"${getSym(cur)}"#,##0.00`;
      } else {
        subRow.getCell(5).value = catCurKeys.map(c => `${fmtN(catCurTotals[c])} ${getSym(c)}`).join(" + ");
        subRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      }
      subRow.getCell(5).font = { bold: true, size: 12 };

      if (endRow >= startRow) {
        subRow.getCell(7).value = { formula: `SUM(G${startRow}:G${endRow})`, result: subTotalTl };
      } else {
        subRow.getCell(7).value = subTotalTl;
      }
      subRow.getCell(7).numFmt = `"₺"#,##0.00`; subRow.getCell(7).font = { bold: true, size: 12 };
      
      for (let c=1; c<=9; c++) subRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD0D0D0" } };
      
      subTotalRows.push(r);
      r += 2;
      globalTotalTl += subTotalTl;
    });

    const totalRow = sheet.getRow(r);
    totalRow.height = 30;
    totalRow.getCell(1).value = `${sheetName} GENEL TOPLAMLARI`;
    totalRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    
    const globCurKeys = Object.keys(globalCurTotals);
    if (globCurKeys.length === 1) {
      const cur = globCurKeys[0];
      if (subTotalRows.length > 0) {
        totalRow.getCell(5).value = { formula: subTotalRows.map(rowIdx => `E${rowIdx}`).join('+'), result: globalCurTotals[cur] };
      } else {
        totalRow.getCell(5).value = globalCurTotals[cur];
      }
      totalRow.getCell(5).numFmt = `"${getSym(cur)}"#,##0.00`;
    } else {
      totalRow.getCell(5).value = globCurKeys.map(c => `${fmtN(globalCurTotals[c])} ${getSym(c)}`).join(" + ");
      totalRow.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    }
    totalRow.getCell(5).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    
    if (subTotalRows.length > 0) {
      totalRow.getCell(7).value = { formula: subTotalRows.map(rowIdx => `G${rowIdx}`).join('+'), result: globalTotalTl };
    } else {
      totalRow.getCell(7).value = globalTotalTl;
    }
    totalRow.getCell(7).numFmt = `"₺"#,##0.00`; totalRow.getCell(7).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    
    sheet.mergeCells(`A${r}:D${r}`); sheet.mergeCells(`E${r}:F${r}`); sheet.mergeCells(`G${r}:I${r}`);
    for (let c=1; c<=9; c++) {
      totalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF333333" } };
      totalRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  };

  // --- 4. KONAKLAMA ---
  const createAccommodationSheet = () => {
    const sheet = workbook.addWorksheet("KONAKLAMA");
    sheet.views = [{ state: "normal", showGridLines: false }];
    
    let minD = new Date(2100, 1, 1);
    let maxD = new Date(1900, 1, 1);
    accommodationItems.forEach((r: any) => {
      const checkInDate = parseDate(r.check_in_date || r.gelis_tarihi);
      const checkOutDate = parseDate(r.check_out_date || r.cikis_tarihi);
      if (checkInDate) { if (checkInDate < minD) minD = checkInDate; }
      if (checkOutDate) { if (checkOutDate > maxD) maxD = checkOutDate; }
    });
    if (minD > maxD) {
      const projStart = parseDate(project?.start_date);
      const projEnd = parseDate(project?.end_date);
      if (projStart && projEnd) {
        minD = new Date(projStart);
        maxD = new Date(projEnd);
      } else {
        const today = new Date();
        minD = new Date(today);
        maxD = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    const dates: Date[] = [];
    let cur = new Date(minD);
    while (cur < maxD) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

    const headers = [ "ODA #", "ODA TİPİ", "YATAK TİPİ", "İSİM", "SOYİSİM", "ODA NO", "ODA NOTU", "GİRİŞ TARİHİ", "GELİŞ UÇUŞ KODU", "GELİŞ UÇAK KALKIŞ", "GELİŞ UÇAK İNİŞ", "ÇIKIŞ TARİHİ", "DÖNÜŞ UÇUŞ KODU", "DÖNÜŞ UÇAK KALKIŞ", "DÖNÜŞ UÇAK İNİŞ" ];
    dates.forEach(d => headers.push(d.toLocaleDateString("tr-TR", { day: '2-digit', month: 'short' })));
    headers.push("GECELEME", "PAKET", "OTEL", "UÇAK", "TOPLAM", "DÖVİZ");

    sheet.columns = headers.map(h => ({ header: "", key: h, width: 15 }));
    sheet.columns[0].width = 8; sheet.columns[3].width = 20; sheet.columns[4].width = 20;

    const totalCols = headers.length;
    const lastColLetter = sheet.getColumn(totalCols).letter;
    drawHeaders(sheet, `A1:${lastColLetter}1`, totalCols - 1.2);

    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = "KONAKLAMA";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:${lastColLetter}${r}`);
    r += 2;

    const hRow = sheet.getRow(r);
    hRow.height = 30;
    headers.forEach((h, i) => {
      hRow.getCell(i+1).value = h;
      hRow.getCell(i+1).font = { bold: true, size: 9 };
      hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      hRow.getCell(i+1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    r++;

    accommodationItems.forEach((it: any) => {
      const row = sheet.getRow(r); row.height = 18;
      row.getCell(1).value = it.oda_no || "";
      row.getCell(2).value = it.oda_tipi || "";
      row.getCell(3).value = it.yatak_tipi || "";
      row.getCell(4).value = it.isim || "";
      row.getCell(5).value = it.soyisim || "";
      row.getCell(6).value = it.oda_no_2 || it.gercek_oda_no || "";
      row.getCell(7).value = it.oda_notu || "";
      row.getCell(8).value = fmtDate(it.check_in_date || it.gelis_tarihi);
      row.getCell(9).value = it.gelis_ucus_kodu || "";
      row.getCell(10).value = it.gelis_ucak_kalkis || it.gelis_saati || "";
      row.getCell(11).value = it.gelis_ucak_inis || it.gelis_inis_saati || "";
      row.getCell(12).value = fmtDate(it.check_out_date || it.cikis_tarihi);
      row.getCell(13).value = it.donus_ucus_kodu || "";
      row.getCell(14).value = it.donus_ucak_kalkis || it.donus_saati || "";
      row.getCell(15).value = it.donus_ucak_inis || it.donus_inis_saati || "";

      let nightsCount = 0;
      const itemCinStr = it.check_in_date || it.gelis_tarihi;
      const itemCoutStr = it.check_out_date || it.cikis_tarihi;
      const itemCin = parseDate(itemCinStr);
      const itemCout = parseDate(itemCoutStr);
      
      dates.forEach((d, idx) => {
        const cell = row.getCell(16 + idx);
        if (itemCin && itemCout && d >= itemCin && d < itemCout) {
          cell.value = it.oda_tipi || "SNG";
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } };
          nightsCount++;
        }
      });
      const endIdx = 16 + dates.length;
      row.getCell(endIdx).value = nightsCount || it.geceleme || 0;
      row.getCell(endIdx + 1).value = it.paket || "";
      row.getCell(endIdx + 2).value = it.otel || "";
      row.getCell(endIdx + 3).value = it.ucak || "";
      row.getCell(endIdx + 4).value = it.toplam || 0;
      row.getCell(endIdx + 5).value = it.doviz || "EUR";
      
      r++;
    });

    r += 2;
    sheet.getRow(r).getCell(1).value = "Forecast - ODA # Bazında Analiz";
    sheet.getRow(r).getCell(1).font = { bold: true, size: 14 };
    r += 2;

    const fRow = sheet.getRow(r);
    fRow.getCell(1).value = "TARİH"; fRow.getCell(2).value = "SNG"; fRow.getCell(3).value = "DBL";
    fRow.getCell(4).value = "TOPLAM ODA"; fRow.getCell(5).value = "TOPLAM KİŞİ";
    for(let i=1; i<=5; i++) {
        fRow.getCell(i).font = { bold: true };
        fRow.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    }
    r++;

    let totalSng = 0, totalDbl = 0, totalOda = 0, totalKisi = 0;
    dates.forEach(d => {
      let sng = 0, dbl = 0;
      accommodationItems.forEach((it: any) => {
        const itemCinStr = it.check_in_date || it.gelis_tarihi;
        const itemCoutStr = it.check_out_date || it.cikis_tarihi;
        const itemCin = parseDate(itemCinStr);
        const itemCout = parseDate(itemCoutStr);
        if (itemCin && itemCout && d >= itemCin && d < itemCout) {
          if (it.oda_tipi === "SNG" || (it.oda_tipi && it.oda_tipi.toUpperCase().includes("SNG")) || it.oda_tipi === "SINGLE") sng++;
          else dbl++;
        }
      });
      const topOda = sng + dbl;
      const topKisi = sng + (dbl * 2);
      const row = sheet.getRow(r);
      row.getCell(1).value = fmtDate(d); row.getCell(2).value = sng; row.getCell(3).value = dbl;
      row.getCell(4).value = topOda; row.getCell(5).value = topKisi;
      totalSng += sng; totalDbl += dbl; totalOda += topOda; totalKisi += topKisi;
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

  // --- 5. TRANSFER & TUR ---
  const createTransferSheet = () => {
    const sheet = workbook.addWorksheet("TRANSFER & TUR");
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [
      { key: "type", width: 15 }, { key: "hotel", width: 20 }, { key: "date", width: 12 },
      { key: "time", width: 10 }, { key: "flight", width: 15 }, { key: "route", width: 20 },
      { key: "pax", width: 10 }, { key: "transferType", width: 15 }, { key: "vehicle", width: 15 },
      { key: "supplier", width: 20 }, { key: "cost", width: 15 }, { key: "currency", width: 10 }, { key: "guests", width: 25 }
    ];
    drawHeaders(sheet, "A1:M1", 12.1);

    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = "TRANSFER & TUR";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:M${r}`);
    r += 2;

    const hRow = sheet.getRow(r);
    hRow.height = 22;
    ["TRANSFER TİPİ", "OTEL", "TARİH", "SAAT", "UÇUŞ KODU", "GÜZERGAH", "YOLCU SAYISI", "TRANSFER TİPİ", "ARAÇ TİPİ", "TEDARİKÇİ", "MALİYET TUTARI", "DÖVİZ", "MİSAFİRLER"].forEach((h, i) => {
      hRow.getCell(i+1).value = h;
      hRow.getCell(i+1).font = { bold: true, size: 10 };
      hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    });
    r++;

    let totalCost = 0; let totalPax = 0;
    const vehicleMap: any = { vito: "Vito", sprinter: "Sprinter", otobus: "Otobüs", binek: "Binek", "s-class": "S Class" };
    transfers.forEach((it: any) => {
      const row = sheet.getRow(r); row.height = 18;
      
      const pax = Number(it.passengerCount || it.pax || 0);
      const cost = Number(it.costAmount || it.cost || 0);
      const transferTypeCode = it.transferType || it.transfer_type || "";
      const vehicleTypeCode = it.vehicleType || it.vehicle_type || "";
      const tTypeLabel = transferTypeCode === "private" ? "Özel" : transferTypeCode === "economic" ? "Ekonomik" : transferTypeCode;
      const vTypeLabel = vehicleMap[vehicleTypeCode] || vehicleTypeCode;
      const guests = Array.isArray(it.passengers) && it.passengers.length > 0 ? it.passengers.join(", ") : (it.guests || "");
      
      row.getCell(1).value = it.typeLabel || (it.direction === "arrival" ? "Giriş" : it.direction === "departure" ? "Çıkış" : "Ara");
      row.getCell(2).value = getHotelName(it.hotel_id) || "Genel";
      row.getCell(3).value = fmtDate(it.date);
      row.getCell(4).value = it.time || "";
      row.getCell(5).value = it.flightCode || it.flight_code || "";
      row.getCell(6).value = it.route || "";
      row.getCell(7).value = pax;
      row.getCell(8).value = tTypeLabel;
      row.getCell(9).value = vTypeLabel;
      row.getCell(10).value = it.supplierName || getSupplierName(it.supplierId || it.supplier_id) || "-";
      row.getCell(11).value = cost; row.getCell(11).numFmt = "#,##0.00";
      row.getCell(12).value = it.currency || "EUR";
      row.getCell(13).value = guests;
      
      totalCost += cost;
      totalPax += pax;
      r++;
    });

    const totRow = sheet.getRow(r);
    totRow.height = 25;
    totRow.getCell(1).value = "GENEL TOPLAM"; totRow.getCell(1).font = { bold: true };
    totRow.getCell(7).value = totalPax; totRow.getCell(7).font = { bold: true };
    totRow.getCell(11).value = totalCost; totRow.getCell(11).numFmt = "#,##0.00"; totRow.getCell(11).font = { bold: true };
    for (let c=1; c<=13; c++) totRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
  };

  // --- 6. UÇAK BİLETİ ---
  const createFlightSheet = () => {
    const sheet = workbook.addWorksheet("UÇAK BİLETİ");
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [
      { key: "biletTarihi", width: 15 }, { key: "tedarikci", width: 15 }, { key: "airline", width: 15 }, { key: "pnr", width: 15 },
      { key: "ucusTipi", width: 15 }, { key: "gidisTarih", width: 15 }, { key: "gidisSaat", width: 10 }, { key: "gidisUcusKod", width: 15 },
      { key: "donusTarih", width: 15 }, { key: "donusSaat", width: 10 }, { key: "donusUcusKod", width: 15 }, { key: "guzergah", width: 20 },
      { key: "malPax", width: 10 }, { key: "ppMal", width: 15 }, { key: "topMal", width: 15 }, { key: "malDoviz", width: 10 }, { key: "malKur", width: 10 }, { key: "topMalTl", width: 15 },
      { key: "satPax", width: 10 }, { key: "ppSat", width: 15 }, { key: "topSat", width: 15 }, { key: "satDoviz", width: 10 }, { key: "satKur", width: 10 }, { key: "topSatTl", width: 15 },
      { key: "misafirler", width: 25 }, { key: "durum", width: 15 }
    ];
    drawHeaders(sheet, "A1:Z1", 24.8);

    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = "UÇAK BİLETİ";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:Z${r}`);
    r += 2;

    const hRow = sheet.getRow(r);
    hRow.height = 22;
    [
      "BİLETLEME TARİHİ", "TEDARİKÇİ", "HAVAYOLU", "PNR", "UÇUŞ TİPİ", "GİDİŞ TARİHİ", "GİDİŞ SAATİ", "GİDİŞ UÇUŞ KODU", 
      "DÖNÜŞ TARİHİ", "DÖNÜŞ SAATİ", "DÖNÜŞ UÇUŞ KODU", "GÜZERGAH",
      "MALİYET PAX", "PP MALİYET", "TOPLAM MALİYET", "Döviz", "KUR", "Toplam Maliyet TL",
      "SATIŞ PAX", "PP SATIŞ", "TOPLAM SATIŞ", "Döviz", "KUR", "Toplam Satış TL",
      "MİSAFİRLER", "DURUM"
    ].forEach((h, i) => {
      hRow.getCell(i+1).value = h;
      hRow.getCell(i+1).font = { bold: true, size: 10 };
      hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    });
    r++;

    let totalMalTl = 0; let totalSatTl = 0;
    flightTickets.forEach((it: any) => {
      const row = sheet.getRow(r); row.height = 18;
      row.getCell(1).value = fmtDate(it.biletlemeTarihi);
      row.getCell(2).value = it.tedarikci || "";
      row.getCell(3).value = it.havayolu || "";
      row.getCell(4).value = it.pnr || "";
      row.getCell(5).value = it.ucusTipi || "";
      row.getCell(6).value = fmtDate(it.gidisTarihi);
      row.getCell(7).value = it.gidisSaati || "";
      row.getCell(8).value = it.gidisUcusKodu || "";
      row.getCell(9).value = fmtDate(it.donusTarihi);
      row.getCell(10).value = it.donusSaati || "";
      row.getCell(11).value = it.donusUcusKodu || "";
      row.getCell(12).value = it.guzergah || "";
      row.getCell(13).value = Number(it.kisiSayisi || 0);
      row.getCell(14).value = Number(it.ppMaliyet || 0); row.getCell(14).numFmt = "#,##0.00";
      row.getCell(15).value = Number(it.toplamMaliyet || 0); row.getCell(15).numFmt = "#,##0.00";
      row.getCell(16).value = it.doviz || "EUR";
      row.getCell(17).value = Number(it.kur || 0); row.getCell(17).numFmt = "#,##0.00";
      row.getCell(18).value = Number(it.toplamTl || 0); row.getCell(18).numFmt = "₺#,##0.00";
      row.getCell(19).value = Number(it.satisPax || 0);
      row.getCell(20).value = Number(it.ppSatis || 0); row.getCell(20).numFmt = "#,##0.00";
      row.getCell(21).value = Number(it.toplamSatis || 0); row.getCell(21).numFmt = "#,##0.00";
      row.getCell(22).value = it.satisDoviz || "TL";
      row.getCell(23).value = Number(it.satisKur || 0); row.getCell(23).numFmt = "#,##0.00";
      row.getCell(24).value = Number(it.toplamSatisTl || 0); row.getCell(24).numFmt = "₺#,##0.00";
      row.getCell(25).value = it.misafirler || "";
      row.getCell(26).value = it.durum || "";
      
      totalMalTl += Number(it.toplamTl || 0);
      totalSatTl += Number(it.toplamSatisTl || 0);
      r++;
    });

    const totRow = sheet.getRow(r);
    totRow.height = 25;
    totRow.getCell(1).value = "GENEL TOPLAM"; totRow.getCell(1).font = { bold: true };
    totRow.getCell(18).value = totalMalTl; totRow.getCell(18).numFmt = "₺#,##0.00"; totRow.getCell(18).font = { bold: true };
    totRow.getCell(24).value = totalSatTl; totRow.getCell(24).numFmt = "₺#,##0.00"; totRow.getCell(24).font = { bold: true };
    for (let c=1; c<=26; c++) totRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
  };

  // --- 7. DİĞER ---
  const createOthersSheet = () => {
    const sheet = workbook.addWorksheet("DİĞER");
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [
      { key: "date", width: 12 }, { key: "supplier", width: 20 }, { key: "mainCat", width: 20 },
      { key: "subCat", width: 20 }, { key: "desc", width: 30 }, { key: "cost", width: 15 },
      { key: "currency", width: 10 }, { key: "costFx", width: 10 }, { key: "costTotal", width: 15 },
      { key: "price", width: 15 }, { key: "currency2", width: 10 }, { key: "priceFx", width: 10 }, { key: "priceTotal", width: 15 }
    ];
    drawHeaders(sheet, "A1:M1", 12.1);

    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = "DİĞER HİZMETLER";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:M${r}`);
    r += 2;

    const hRow = sheet.getRow(r);
    hRow.height = 22;
    ["TARİH", "OTEL/TEDARİKÇİ", "ANA KATEGORİ", "ALT KATEGORİ", "AÇIKLAMA", "MALİYET", "DÖVİZ", "KUR", "TOP. MLYT(TL)", "SATIŞ", "DÖVİZ", "KUR", "TOP. STŞ(TL)"].forEach((h, i) => {
      hRow.getCell(i+1).value = h;
      hRow.getCell(i+1).font = { bold: true, size: 10 };
      hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    });
    r++;

    let totalMalTl = 0; let totalSatTl = 0;
    projectOthers.forEach((it: any) => {
      const row = sheet.getRow(r); row.height = 18;
      row.getCell(1).value = fmtDate(it.date);
      row.getCell(2).value = it.contact_name || "";
      row.getCell(3).value = it.category_name || "";
      row.getCell(4).value = it.sub_category_name || "";
      row.getCell(5).value = it.description || "";
      row.getCell(6).value = Number(it.cost_amount || 0); row.getCell(6).numFmt = "#,##0.00";
      row.getCell(7).value = it.cost_currency || "";
      row.getCell(8).value = Number(it.cost_exchange_rate || 0); row.getCell(8).numFmt = "#,##0.00";
      row.getCell(9).value = Number(it.cost_amount_try || 0); row.getCell(9).numFmt = "₺#,##0.00";
      
      row.getCell(10).value = Number(it.sale_amount || 0); row.getCell(10).numFmt = "#,##0.00";
      row.getCell(11).value = it.sale_currency || "";
      row.getCell(12).value = Number(it.sale_exchange_rate || 0); row.getCell(12).numFmt = "#,##0.00";
      row.getCell(13).value = Number(it.sale_amount_try || 0); row.getCell(13).numFmt = "₺#,##0.00";
      
      totalMalTl += Number(it.cost_amount_try || 0);
      totalSatTl += Number(it.sale_amount_try || 0);
      r++;
    });

    const totRow = sheet.getRow(r);
    totRow.height = 25;
    totRow.getCell(1).value = "GENEL TOPLAM"; totRow.getCell(1).font = { bold: true };
    totRow.getCell(9).value = totalMalTl; totRow.getCell(9).numFmt = "₺#,##0.00"; totRow.getCell(9).font = { bold: true };
    totRow.getCell(13).value = totalSatTl; totRow.getCell(13).numFmt = "₺#,##0.00"; totRow.getCell(13).font = { bold: true };
    for (let c=1; c<=13; c++) totRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
  };

  // --- 8 & 9. TAHSİLAT ve ÖDEME ---
  const createFinanceSheet = (sheetName: string, plans: any[], actuals: any[], isCollection: boolean) => {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [
      { key: "date", width: 15 }, { key: "type", width: 20 }, { key: "desc", width: 40 },
      { key: "amount", width: 15 }, { key: "currency", width: 10 }, { key: "fx", width: 10 }, { key: "total", width: 15 }
    ];
    drawHeaders(sheet, "A1:G1", 6.1);
    
    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = sheetName;
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:G${r}`);
    r += 2;

    const renderTable = (title: string, data: any[]) => {
      const hRow = sheet.getRow(r);
      hRow.height = 25;
      hRow.getCell(1).value = title;
      hRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.mergeCells(`A${r}:G${r}`);
      for (let c=1; c<=7; c++) hRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: isCollection ? "FF10B981" : "FFEF4444" } };
      r++;

      const subH = sheet.getRow(r);
      subH.height = 22;
      ["TARİH", isCollection ? "TAHSİLAT TİPİ" : "ÖDEME TİPİ", "AÇIKLAMA", "TUTAR", "DÖVİZ", "KUR", "TOPLAM TL"].forEach((h, i) => {
        subH.getCell(i+1).value = h;
        subH.getCell(i+1).font = { bold: true, size: 10 };
        subH.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
      });
      r++;

      let tDoviz = 0, tTRY = 0;
      data.forEach((it: any) => {
        const row = sheet.getRow(r); row.height = 18;
        row.getCell(1).value = fmtDate(it.date);
        
        let typeVal = isCollection ? (it.collectionType || it.collection_type || "") : (it.paymentType || it.payment_type || "");
        let typeLabel = typeVal;
        if (typeVal === "banka") typeLabel = "Banka Havalesi";
        else if (typeVal === "pos") typeLabel = "Kredi Kartı / Pos";
        else if (typeVal === "cek") typeLabel = "Çek / Senet";
        else if (typeVal === "nakit") typeLabel = "Nakit";
        
        row.getCell(2).value = typeLabel || "-";

        row.getCell(3).value = it.description || "";
        row.getCell(4).value = Number(it.amount || 0); row.getCell(4).numFmt = "#,##0.00";
        row.getCell(5).value = it.currency || "EUR";
        row.getCell(6).value = Number(it.exchangeRate || it.exchange_rate || 1);
        row.getCell(7).value = Number(it.totalTRY || it.total_try || it.amount || 0); row.getCell(7).numFmt = "₺#,##0.00";
        
        tDoviz += Number(it.amount || 0);
        tTRY += Number(it.totalTRY || it.total_try || it.amount || 0);
        r++;
      });
      
      const totRow = sheet.getRow(r);
      totRow.getCell(1).value = "TOPLAM"; totRow.getCell(1).font = { bold: true };
      totRow.getCell(4).value = tDoviz; totRow.getCell(4).font = { bold: true }; totRow.getCell(4).numFmt = "#,##0.00";
      totRow.getCell(7).value = tTRY; totRow.getCell(7).font = { bold: true }; totRow.getCell(7).numFmt = "₺#,##0.00";
      for (let c=1; c<=7; c++) totRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
      
      r += 2;
    };

    renderTable(isCollection ? "Tahsilat Planı" : "Ödeme Planı", plans);
    renderTable(isCollection ? "Tahsilatlar" : "Ödemeler", actuals);
  };

  // --- 10. KAR / ZARAR ---
  const createProfitLossSheet = () => {
    const sheet = workbook.addWorksheet("KAR ZARAR ANALİZİ");
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.views = [{ state: "normal", showGridLines: false }];
    sheet.columns = [
      { key: "cat", width: 40 },
      { key: "salesEur", width: 15 }, { key: "salesFx", width: 10 }, { key: "salesTl", width: 15 },
      { key: "purchEur", width: 15 }, { key: "purchFx", width: 10 }, { key: "purchTl", width: 15 },
      { key: "profit", width: 15 }, { key: "profitTl", width: 15 }, { key: "margin", width: 15 }
    ];
    drawHeaders(sheet, "A1:J1", 9.1);
    
    let r = 3;
    const titleRow = sheet.getRow(r);
    titleRow.height = 30;
    titleRow.getCell(1).value = "KAR / ZARAR ANALİZİ";
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${r}:J${r}`);
    r += 2;

    const hRow = sheet.getRow(r);
    hRow.height = 22;
    ["ALT KATEGORİ", "SATIŞ DÖVİZ", "KUR", "SATIŞ TL", "ALIŞ DÖVİZ", "KUR", "ALIŞ TL", "DÖVİZ KAR/ZARAR", "TL KAR/ZARAR", "KAR MARJI"].forEach((h, i) => {
      hRow.getCell(i+1).value = h;
      hRow.getCell(i+1).font = { bold: true, size: 10 };
      hRow.getCell(i+1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    });
    r++;

    // Calculate totals from salesItems and purchaseItems
    let globalSalesEur = 0; let globalSalesTl = 0;
    let globalPurchEur = 0; let globalPurchTl = 0;

    const aggregated: any = {};
    salesItems.forEach((it: any) => {
      const cat = getCategoryName(it.main_category) || it.main_category || "DİĞER";
      if(!aggregated[cat]) aggregated[cat] = { salesEur: 0, salesTl: 0, purchEur: 0, purchTl: 0 };
      const eur = Number(it.total || 0);
      const tl = eur * Number(it.fx || 1);
      aggregated[cat].salesEur += eur; aggregated[cat].salesTl += tl;
      globalSalesEur += eur; globalSalesTl += tl;
    });

    purchaseItems.forEach((it: any) => {
      const cat = getCategoryName(it.main_category) || it.main_category || "DİĞER";
      if(!aggregated[cat]) aggregated[cat] = { salesEur: 0, salesTl: 0, purchEur: 0, purchTl: 0 };
      const eur = Number(it.total || 0);
      const tl = eur * Number(it.fx || 1);
      aggregated[cat].purchEur += eur; aggregated[cat].purchTl += tl;
      globalPurchEur += eur; globalPurchTl += tl;
    });

    Object.keys(aggregated).forEach(catTitle => {
      const catRow = sheet.getRow(r);
      catRow.height = 25;
      catRow.getCell(1).value = catTitle.toUpperCase();
      catRow.getCell(1).font = { bold: true };
      sheet.mergeCells(`A${r}:J${r}`);
      for (let c=1; c<=10; c++) catRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
      r++;

      const sEur = aggregated[catTitle].salesEur;
      const sTl = aggregated[catTitle].salesTl;
      const pEur = aggregated[catTitle].purchEur;
      const pTl = aggregated[catTitle].purchTl;
      const profit = sEur - pEur;
      const profitTl = sTl - pTl;
      const margin = sEur > 0 ? (profit / sEur) : 0;

      const row = sheet.getRow(r); row.height = 18;
      row.getCell(1).value = catTitle;
      row.getCell(2).value = sEur; row.getCell(2).numFmt = "€#,##0.00";
      row.getCell(3).value = "-";
      row.getCell(4).value = sTl; row.getCell(4).numFmt = "₺#,##0.00";
      row.getCell(5).value = pEur; row.getCell(5).numFmt = "€#,##0.00";
      row.getCell(6).value = "-";
      row.getCell(7).value = pTl; row.getCell(7).numFmt = "₺#,##0.00";
      row.getCell(8).value = profit; row.getCell(8).numFmt = "€#,##0.00";
      row.getCell(8).font = { color: { argb: profit >= 0 ? "FF16A34A" : "FFDC2626" }, bold: true };
      row.getCell(9).value = profitTl; row.getCell(9).numFmt = "₺#,##0.00";
      row.getCell(9).font = { color: { argb: profitTl >= 0 ? "FF16A34A" : "FFDC2626" }, bold: true };
      row.getCell(10).value = margin; row.getCell(10).numFmt = "0.00%";
      r++;
    });

    r++;
    const globalProfit = globalSalesEur - globalPurchEur;
    const globalProfitTl = globalSalesTl - globalPurchTl;
    const globalMargin = globalSalesEur > 0 ? (globalProfit / globalSalesEur) : 0;

    const totRow = sheet.getRow(r);
    totRow.height = 30;
    totRow.getCell(1).value = "GENEL KAR/ZARAR DURUMU";
    totRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    
    totRow.getCell(2).value = globalSalesEur; totRow.getCell(2).numFmt = "€#,##0.00"; totRow.getCell(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
    totRow.getCell(3).value = "-";
    totRow.getCell(4).value = globalSalesTl; totRow.getCell(4).numFmt = "₺#,##0.00"; totRow.getCell(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
    
    totRow.getCell(5).value = globalPurchEur; totRow.getCell(5).numFmt = "€#,##0.00"; totRow.getCell(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
    totRow.getCell(6).value = "-";
    totRow.getCell(7).value = globalPurchTl; totRow.getCell(7).numFmt = "₺#,##0.00"; totRow.getCell(7).font = { bold: true, color: { argb: "FFFFFFFF" } };
    
    totRow.getCell(8).value = globalProfit; totRow.getCell(8).numFmt = "€#,##0.00"; totRow.getCell(8).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    totRow.getCell(9).value = globalProfitTl; totRow.getCell(9).numFmt = "₺#,##0.00"; totRow.getCell(9).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    totRow.getCell(10).value = globalMargin; totRow.getCell(10).numFmt = "0.00%"; totRow.getCell(10).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };

    const bgCol = globalProfit >= 0 ? "FF16A34A" : "FFDC2626";
    for(let i=1; i<=10; i++) totRow.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgCol } };
  };

  createProjectInfoSheet();
  createSalesPurchaseSheet("SATIŞLAR", salesItems, true);
  createSalesPurchaseSheet("ALIŞLAR", purchaseItems, false);
  createAccommodationSheet();
  createTransferSheet();
  createFlightSheet();
  createOthersSheet();
  createFinanceSheet("TAHSİLAT", collectionPlans, collections, true);
  createFinanceSheet("ÖDEME", paymentPlans, payments, false);
  createProfitLossSheet();
  await saveWorkbook();
};
