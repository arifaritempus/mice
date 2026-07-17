import { getLogosForExcel } from "./logoUtils";

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

  // Ortak sheet başlığı ve logo ekleme yardımcı fonksiyonu
  const createStyledSheet = (sheetName: string, title: string, meta?: any) => {
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));
    sheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
    };

    // 1. Üst Band
    sheet.getRow(1).height = 70;
    sheet.mergeCells("A1:K1");
    const bandCell = sheet.getCell("A1");
    bandCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232F38" } };

    // Logo
    if (logos.iconLogoBase64) {
      const iconId = workbook.addImage({ base64: logos.iconLogoBase64, extension: "png" });
      sheet.addImage(iconId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: logos.iconWidth || 120, height: logos.iconHeight || 60 },
      });
    }
    if (logos.wordmarkLogoBase64) {
      const wordmarkId = workbook.addImage({ base64: logos.wordmarkLogoBase64, extension: "png" });
      sheet.addImage(wordmarkId, {
        tl: { col: 8.5, row: 0.15 },
        ext: { width: logos.wordmarkWidth || 180, height: logos.wordmarkHeight || 45 },
      });
    }

    // 2. Bilgi Paneli (Beige #D3CBBE)
    const headerInfo = [
      ["REFERANS", project?.reference || "-", "MÜŞTERİ/ACENTE", project?.agency_name || project?.company_name || "-"],
      ["PROJE DURUMU", project?.status || "-", "TARİHLER", `${project?.start_date || "-"} - ${project?.end_date || "-"}`],
      ["NOT", project?.notes || "-", "", ""]
    ];

    headerInfo.forEach((rowInfo, idx) => {
      const rowIndex = idx + 2;
      const row = sheet.getRow(rowIndex);
      row.height = 24;
      row.getCell(1).value = rowInfo[0];
      row.getCell(2).value = rowInfo[1];
      row.getCell(6).value = rowInfo[2];
      row.getCell(7).value = rowInfo[3];

      [1, 6].forEach((col) => {
        const cell = row.getCell(col);
        cell.font = { bold: true, size: 10, color: { argb: "FF232F38" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3CBBE" } };
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.border = { bottom: { style: "thin", color: { argb: "FFB8B1A4" } } };
      });
      [2, 7].forEach((col) => {
        const cell = row.getCell(col);
        cell.font = { size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F0" } };
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        cell.border = { bottom: { style: "thin", color: { argb: "FFB8B1A4" } } };
      });
      sheet.mergeCells(`B${rowIndex}:E${rowIndex}`);
      sheet.mergeCells(`G${rowIndex}:K${rowIndex}`);
    });

    // Ara boşluk
    sheet.getRow(headerInfo.length + 2).height = 10;

    // Kategori Başlığı
    const titleRow = sheet.getRow(headerInfo.length + 3);
    titleRow.height = 30;
    titleRow.getCell(1).value = title.toUpperCase();
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF232F38" } };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
    sheet.mergeCells(`A${headerInfo.length + 3}:K${headerInfo.length + 3}`);

    return { sheet, startRow: headerInfo.length + 4 };
  };

  const fmtMoney = (n: any) => (typeof n === "number" ? n : Number(n || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "-";

  // ==========================================
  // SHEET 1: TÜMÜ (ÖZET)
  // ==========================================
  const { sheet: summarySheet, startRow: sRow } = createStyledSheet(t('projects.all') || "Tümü", "PROJE ÖZETİ");
  summarySheet.columns = [
    { key: "category", width: 30 },
    { key: "amount", width: 25 },
    { key: "currency", width: 15 }
  ];
  summarySheet.getCell(`A${sRow}`).value = "Toplam Satış:";
  summarySheet.getCell(`B${sRow}`).value = fmtMoney((salesItems || []).reduce((acc:any, i:any) => acc + (Number(i.total_price) || 0), 0));
  summarySheet.getCell(`C${sRow}`).value = project?.project_currency || "EUR";

  summarySheet.getCell(`A${sRow+1}`).value = "Toplam Alış:";
  summarySheet.getCell(`B${sRow+1}`).value = fmtMoney((purchaseItems || []).reduce((acc:any, i:any) => acc + (Number(i.total_price) || 0), 0));
  summarySheet.getCell(`C${sRow+1}`).value = project?.project_currency || "EUR";

  // ==========================================
  // SHEET 2: SATIŞLAR
  // ==========================================
  const { sheet: salesSheet, startRow: saRow } = createStyledSheet(t('projects.sales') || "Satış", "SATIŞ KALEMLERİ");
  salesSheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Açıklama", key: "desc", width: 35 },
    { header: "Adet", key: "qty", width: 10 },
    { header: "Birim Fiyat", key: "price", width: 15 },
    { header: "KDV %", key: "tax", width: 10 },
    { header: "Toplam", key: "total", width: 15 },
    { header: "PB", key: "currency", width: 10 }
  ];
  salesSheet.getRow(saRow).values = salesSheet.columns.map((c:any) => c.header);
  salesSheet.getRow(saRow).font = { bold: true };
  (salesItems || []).forEach((item: any) => {
    salesSheet.addRow({
      date: fmtDate(item.date),
      category: getCategoryName(item.category_id),
      desc: item.description,
      qty: item.quantity,
      price: fmtMoney(item.unit_price),
      tax: item.tax_rate,
      total: fmtMoney(item.total_price),
      currency: item.currency || "EUR"
    });
  });

  // ==========================================
  // SHEET 3: ALIŞLAR
  // ==========================================
  const { sheet: purSheet, startRow: puRow } = createStyledSheet(t('projects.purchases') || "Alış", "ALIŞ KALEMLERİ");
  purSheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Tedarikçi", key: "supplier", width: 25 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Açıklama", key: "desc", width: 35 },
    { header: "Adet", key: "qty", width: 10 },
    { header: "Birim Fiyat", key: "price", width: 15 },
    { header: "Toplam", key: "total", width: 15 },
    { header: "PB", key: "currency", width: 10 }
  ];
  purSheet.getRow(puRow).values = purSheet.columns.map((c:any) => c.header);
  purSheet.getRow(puRow).font = { bold: true };
  (purchaseItems || []).forEach((item: any) => {
    purSheet.addRow({
      date: fmtDate(item.date),
      supplier: getSupplierName(item.supplier_id),
      category: getCategoryName(item.category_id),
      desc: item.description,
      qty: item.quantity,
      price: fmtMoney(item.unit_price),
      total: fmtMoney(item.total_price),
      currency: item.currency || "EUR"
    });
  });

  // ==========================================
  // SHEET 4: UÇAK BİLETİ
  // ==========================================
  const { sheet: fSheet, startRow: fRow } = createStyledSheet(t('projects.flightTickets') || "Uçak Bileti", "UÇAK BİLETLERİ");
  fSheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Yolcu", key: "pax", width: 25 },
    { header: "Parkur", key: "route", width: 25 },
    { header: "PNR", key: "pnr", width: 15 },
    { header: "Tedarikçi", key: "supplier", width: 25 },
    { header: "Alış", key: "cost", width: 15 },
    { header: "Satış", key: "price", width: 15 },
    { header: "PB", key: "currency", width: 10 }
  ];
  fSheet.getRow(fRow).values = fSheet.columns.map((c:any) => c.header);
  fSheet.getRow(fRow).font = { bold: true };
  (flightTickets || []).forEach((item: any) => {
    fSheet.addRow({
      date: fmtDate(item.date || item.created_at),
      pax: item.yolcu_isim_soyisim || item.pax_name || "",
      route: `${item.nereden || ""} - ${item.nereye || ""}`,
      pnr: item.pnr || "",
      supplier: item.tedarikci ? getSupplierName(item.tedarikci) : "",
      cost: fmtMoney(item.alis_fiyati || item.cost_price),
      price: fmtMoney(item.satis_fiyati || item.sale_price),
      currency: item.para_birimi || "EUR"
    });
  });

  // ==========================================
  // SHEET 5: DİĞER HİZMETLER
  // ==========================================
  const { sheet: oSheet, startRow: oRow } = createStyledSheet(t('projects.otherServices') || "Diğer Hizmetler", "DİĞER HİZMETLER");
  oSheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Açıklama", key: "desc", width: 35 },
    { header: "Tedarikçi", key: "supplier", width: 25 },
    { header: "Alış", key: "cost", width: 15 },
    { header: "Satış", key: "price", width: 15 },
    { header: "PB", key: "currency", width: 10 }
  ];
  oSheet.getRow(oRow).values = oSheet.columns.map((c:any) => c.header);
  oSheet.getRow(oRow).font = { bold: true };
  (projectOthers || []).forEach((item: any) => {
    oSheet.addRow({
      date: fmtDate(item.date || item.created_at),
      desc: item.description || item.aciklama,
      supplier: getSupplierName(item.supplier_id || item.tedarikci_id),
      cost: fmtMoney(item.purchase_price || item.alis_fiyati),
      price: fmtMoney(item.sale_price || item.satis_fiyati),
      currency: item.currency || item.para_birimi || "EUR"
    });
  });

  // ==========================================
  // SHEET 6: TAHSİLAT PLANI
  // ==========================================
  const { sheet: collSheet, startRow: cRow } = createStyledSheet(t('projects.collectionPlan') || "Tahsilat Planı", "TAHSİLAT PLANI");
  collSheet.columns = [
    { header: "Vade Tarihi", key: "date", width: 15 },
    { header: "Açıklama", key: "desc", width: 35 },
    { header: "Ödeme Yöntemi", key: "method", width: 20 },
    { header: "Tutar", key: "amount", width: 15 },
    { header: "PB", key: "currency", width: 10 },
    { header: "Durum", key: "status", width: 15 }
  ];
  collSheet.getRow(cRow).values = collSheet.columns.map((c:any) => c.header);
  collSheet.getRow(cRow).font = { bold: true };
  (collectionPlans || []).forEach((item: any) => {
    collSheet.addRow({
      date: fmtDate(item.due_date || item.vade_tarihi),
      desc: item.description || item.aciklama,
      method: item.payment_method || item.odeme_yontemi,
      amount: fmtMoney(item.amount || item.tutar),
      currency: item.currency || item.para_birimi || "EUR",
      status: item.status || item.durum
    });
  });

  // ==========================================
  // SHEET 7: ÖDEME PLANI
  // ==========================================
  const { sheet: paySheet, startRow: pRow } = createStyledSheet(t('projects.paymentPlan') || "Ödeme Planı", "ÖDEME PLANI");
  paySheet.columns = [
    { header: "Vade Tarihi", key: "date", width: 15 },
    { header: "Tedarikçi", key: "supplier", width: 25 },
    { header: "Açıklama", key: "desc", width: 35 },
    { header: "Tutar", key: "amount", width: 15 },
    { header: "PB", key: "currency", width: 10 },
    { header: "Durum", key: "status", width: 15 }
  ];
  paySheet.getRow(pRow).values = paySheet.columns.map((c:any) => c.header);
  paySheet.getRow(pRow).font = { bold: true };
  (paymentPlans || []).forEach((item: any) => {
    paySheet.addRow({
      date: fmtDate(item.due_date || item.vade_tarihi),
      supplier: getSupplierName(item.supplier_id || item.tedarikci_id),
      desc: item.description || item.aciklama,
      amount: fmtMoney(item.amount || item.tutar),
      currency: item.currency || item.para_birimi || "EUR",
      status: item.status || item.durum
    });
  });

  // ==========================================
  // SHEET 8: KONAKLAMA
  // ==========================================
  const { sheet: accSheet, startRow: aRow } = createStyledSheet(t('projects.accommodation') || "Konaklama", "KONAKLAMA DETAYLARI");
  accSheet.columns = [
    { header: "Otel", key: "hotel", width: 25 },
    { header: "Giriş - Çıkış", key: "dates", width: 25 },
    { header: "Misafir", key: "guest", width: 25 },
    { header: "Oda Tipi", key: "roomType", width: 20 },
    { header: "Konsept", key: "concept", width: 15 },
    { header: "Gece", key: "nights", width: 10 },
    { header: "Alış", key: "cost", width: 15 },
    { header: "Satış", key: "price", width: 15 }
  ];
  accSheet.getRow(aRow).values = accSheet.columns.map((c:any) => c.header);
  accSheet.getRow(aRow).font = { bold: true };
  
  // Otellere göre gruplama (grouped by hotel)
  const groupedAccommodations = (accommodationItems || []).reduce((acc: any, item: any) => {
    const hotelId = item.hotel_id || item.otel_id;
    if (!acc[hotelId]) acc[hotelId] = [];
    acc[hotelId].push(item);
    return acc;
  }, {});

  Object.values(groupedAccommodations).forEach((hotelItems: any) => {
    hotelItems.forEach((item: any) => {
      accSheet.addRow({
        hotel: getHotelName(item.hotel_id || item.otel_id),
        dates: `${fmtDate(item.check_in || item.c_in)} - ${fmtDate(item.check_out || item.c_out)}`,
        guest: item.guest_name || item.misafir_adi || "",
        roomType: item.room_type || item.oda_tipi || "",
        concept: item.concept || item.konsept || "",
        nights: item.nights || item.gece_sayisi || 0,
        cost: fmtMoney(item.cost_price || item.alis_fiyati),
        price: fmtMoney(item.sale_price || item.satis_fiyati)
      });
    });
    // Her otel sonrası 1 satır boşluk
    accSheet.addRow([]);
  });

  // ==========================================
  // SHEET 9: TRANSFER & TUR
  // ==========================================
  const { sheet: transSheet, startRow: tRow } = createStyledSheet(t('projects.transfersAndTours') || "Transfer & Tur", "TRANSFER VE TURLAR");
  transSheet.columns = [
    { header: "Tarih", key: "date", width: 15 },
    { header: "Tür", key: "type", width: 15 },
    { header: "Güzergah / Rota", key: "route", width: 35 },
    { header: "Araç / Kişi", key: "vehicle", width: 20 },
    { header: "Tedarikçi", key: "supplier", width: 25 },
    { header: "Alış", key: "cost", width: 15 },
    { header: "Satış", key: "price", width: 15 }
  ];
  transSheet.getRow(tRow).values = transSheet.columns.map((c:any) => c.header);
  transSheet.getRow(tRow).font = { bold: true };
  (transfers || []).forEach((item: any) => {
    transSheet.addRow({
      date: fmtDate(item.transfer_date || item.tarih),
      type: item.transfer_type || item.tur,
      route: `${item.pickup_location || item.kalkis} -> ${item.dropoff_location || item.varis}`,
      vehicle: item.vehicle_type || item.arac_tipi,
      supplier: getSupplierName(item.supplier_id || item.tedarikci_id),
      cost: fmtMoney(item.cost_price || item.alis_fiyati),
      price: fmtMoney(item.sale_price || item.satis_fiyati)
    });
  });

  // Dosyayı indir
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Proje_TamRapor_${project?.reference || "Taslak"}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  anchor.remove();
};
