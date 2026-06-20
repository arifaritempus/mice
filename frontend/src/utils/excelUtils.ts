// import ExcelJS from 'exceljs';
import { getLogosForExcel } from './logoUtils';

// Excel Export Utility Functions
export class ExcelUtils {
  // Create Workbook
  static async createWorkbook() {
    const ExcelJS = (await import('exceljs')).default;
    return new ExcelJS.Workbook();
  }

  // Read Excel File
  static async readExcelFile(file: File): Promise<any[]> {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.worksheets[0];
      const data: any[] = [];
      
      if (worksheet) {
        const headers: string[] = [];
        const headerRow = worksheet.getRow(1);
        
        // Başlık satırını oku
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || '';
        });
        
        // Veri satırlarını oku
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // İlk satır başlık
            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                rowData[header] = cell.value;
              }
            });
            data.push(rowData);
          }
        });
      }
      
      return data;
    } catch (error) {
      console.error('Excel dosyası okuma hatası:', error);
      throw new Error('Excel dosyası okunamadı');
    }
  }

  // Generic Excel Export - Geçici olarak devre dışı
  static async exportToExcel(data: any[], sheetName: string, fileName: string, columns?: any[]) {
    alert('Excel export özelliği geçici olarak devre dışı bırakılmıştır.');
  }

  // Quotes Export - Kapsamlı teklif listesi export'u
  static async exportQuotes(quotes: any[], agencies: any[], hotels: any[]) {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${typeof document !== 'undefined' ? document.title.split('-')[0].trim() : 'MICE'} - Teklifler`);

      sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        verticalCentered: false,
        paperSize: 9,
        margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      } as any;

      // Üst bant ve logolar
      const topBandRow = sheet.addRow([]);
      topBandRow.height = 70;
      sheet.mergeCells('A1:O1');
      for (let c = 1; c <= 15; c++) {
        // Row1'i sadece görsel bant olarak kullan, metin yazma
        sheet.getRow(1).getCell(c).value = '';
        sheet.getRow(1).getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF232F38' }
        };
      }

      // Logos - yeni sistem (URL'den base64'e çevirir)
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true); // Koyu tema logosu kullan

      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';

      if (iconLogoBase64) {
        const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) });
        sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any);
      }
      if (wordmarkLogoBase64) {
        const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) });
        sheet.addImage(markId, { tl: { col: 12.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any);
      }

      // Kapsamlı sütunlar - tüm bilgileri içerir
      sheet.columns = [
        { header: 'Oluşturma Tarihi', key: 'created_at', width: 14 },
        { header: 'Referans', key: 'reference', width: 16 },
        { header: 'Acente', key: 'agency', width: 20 },
        { header: 'Firma Adı', key: 'company_name', width: 22 },
        { header: 'Otel', key: 'hotel', width: 20 },
        { header: 'Konsept', key: 'concept', width: 16 },
        { header: 'C/IN Tarihi', key: 'check_in', width: 14 },
        { header: 'C/OUT Tarihi', key: 'check_out', width: 14 },
        { header: 'Teklif Türü', key: 'quote_type', width: 14 },
        { header: 'Opsiyon', key: 'option', width: 14 },
        { header: 'Opsiyon Tarihi', key: 'option_date', width: 14 },
        { header: 'Oda Sayısı', key: 'room_count', width: 12 },
        { header: 'Pax Sayısı', key: 'pax_count', width: 12 },
        { header: 'Toplam Tutar', key: 'total_amount', width: 14 },
        { header: 'Durum', key: 'status', width: 12 }
      ];

      // Başlık stili
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any;
        cell.border = { 
          top: { style: 'thin', color: { argb: 'FF425160' } },
          left: { style: 'thin', color: { argb: 'FF425160' } },
          right: { style: 'thin', color: { argb: 'FF425160' } },
          bottom: { style: 'thin', color: { argb: 'FF425160' } }
        } as any;
      });

      // Yardımcı fonksiyonlar
      const agencyName = (id: string) => agencies.find((a: any) => a.id === id)?.name || '';
      const hotelName = (id: string) => hotels.find((h: any) => h.id === id)?.name || '';
      const hotelConcept = (id: string) => hotels.find((h: any) => h.id === id)?.concept || '';
      const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
      const fmtNumber = (n: any) =>
        (typeof n === 'number' ? n : Number(n || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

      // Tüm teklifleri detaylı olarak export et
      for (const q of quotes) {
        sheet.addRow({
          created_at: fmtDate(q.created_at),
          reference: q.reference || '',
          agency: agencyName(q.agency_id),
          company_name: q.company_name || '',
          hotel: hotelName(q.hotel_id),
          concept: hotelConcept(q.hotel_id),
          check_in: fmtDate(q.check_in_date),
          check_out: fmtDate(q.check_out_date),
          quote_type: q.quote_type || '',
          option: q.option || '',
          option_date: fmtDate(q.option_date),
          room_count: q.room_count || '',
          pax_count: q.pax_count || '',
          total_amount: fmtNumber(q.total_amount || 0),
          status: q.status || ''
        });
      }

      // Sayı sütunlarını formatla
      sheet.getColumn('total_amount').numFmt = '#,##0.00';
      sheet.getColumn('total_amount').alignment = { horizontal: 'right' } as any;
      sheet.getColumn('room_count').alignment = { horizontal: 'center' } as any;
      sheet.getColumn('pax_count').alignment = { horizontal: 'center' } as any;

      // Tüm sütunlara border ekle
      for (let row = 2; row <= quotes.length + 1; row++) {
        for (let col = 1; col <= 15; col++) {
          const cell = sheet.getRow(row).getCell(col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFd1d5db' } },
            left: { style: 'thin', color: { argb: 'FFd1d5db' } },
            right: { style: 'thin', color: { argb: 'FFd1d5db' } },
            bottom: { style: 'thin', color: { argb: 'FFd1d5db' } }
          } as any;
        }
      }

      // İndir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teklifler_detayli_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası oluşturulurken bir hata oluştu.');
    }
  }

  // Tickets (Operations) - Detay tabına göre export
  static async exportTicketDetails(tickets: any[]) {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${typeof document !== 'undefined' ? document.title.split('-')[0].trim() : 'MICE'} - Biletler (Detay)`);

      sheet.pageSetup = {
        orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
        paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      } as any;

      // Üst bant ve logolar
      const topBandRow = sheet.addRow([]); topBandRow.height = 70; sheet.mergeCells('A1:O1');
      for (let c = 1; c <= 15; c++) {
        sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any;
      }
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true);

      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
      if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) });
        sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
      if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) });
        sheet.addImage(markId, { tl: { col: 12.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any); }

      // Kolonlar (Detay başlık sırası)
      sheet.columns = [
        { header: 'Voucher', key: 'voucher', width: 16 },
        { header: 'BİLETLEME TARİHİ', key: 'ticketing', width: 16 },
        { header: 'Tür', key: 'type', width: 10 },
        { header: 'ACENTE/MÜŞTERİ', key: 'customer', width: 24 },
        { header: 'Misafir Adı', key: 'guest', width: 28 },
        { header: 'PNR', key: 'pnr', width: 16 },
        { header: 'Uçuş Tarihi', key: 'flight_date', width: 14 },
        { header: 'Kalkış Saati', key: 'dep_time', width: 12 },
        { header: 'Varış Saati', key: 'arr_time', width: 12 },
        { header: 'HAVAYOLU', key: 'airline', width: 12 },
        { header: 'GÜZERGAH', key: 'route', width: 16 },
        { header: 'UÇUŞ NO', key: 'flight_no', width: 12 },
        { header: 'TEDARİKÇİ', key: 'supplier', width: 20 },
        { header: 'MALİYET', key: 'cost', width: 12 },
        { header: 'MALİYET DÖVİZİ', key: 'cost_cur', width: 14 }
      ];
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      });
      const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
      const fmtTime = (t?: string) => (t ? (t.includes('T') ? new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false}) : t) : '');
      const fmtNumber = (n: any) => (typeof n === 'number' ? n : Number(n || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

      for (const t of tickets) {
        sheet.addRow({
          voucher: t.voucherNumber || '',
          ticketing: fmtDate(t.ticketingDate),
          type: 'Sejour',
          customer: t.agencyName || t.customerName || '',
          guest: t.guestNames || '',
          pnr: t.pnr || '',
          flight_date: fmtDate(t.flightDate),
          dep_time: fmtTime(t.departureTime),
          arr_time: fmtTime(t.arrivalTime),
          airline: t.airline || '',
          route: t.route || '',
          flight_no: t.flightNo || '',
          supplier: t.ticketingProviderName || t.ticketingProvider || '',
          cost: fmtNumber(t.costPrice || 0),
          cost_cur: t.costCurrency || ''
        });
      }

      // İndir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `biletler_detay_${new Date().toISOString().split('T')[0]}.xlsx`; link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Excel export (detay) hatası:', error);
      alert('Excel export başarısız oldu.');
    }
  }

  // Tickets (Operations) - Özet tabına göre export
  static async exportTicketSummary(summaryRows: any[]) {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${typeof document !== 'undefined' ? document.title.split('-')[0].trim() : 'MICE'} - Biletler (Özet)`);
      sheet.pageSetup = {
        orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true,
        paperSize: 9, margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      } as any;

      const topBandRow = sheet.addRow([]); topBandRow.height = 70; sheet.mergeCells('A1:O1');
      for (let c = 1; c <= 15; c++) {
        sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any;
      }
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true);

      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
      if (iconLogoBase64) { const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) });
        sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any); }
      if (wordmarkLogoBase64) { const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) });
        sheet.addImage(markId, { tl: { col: 12.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any); }

      // Özet kolonları (Voucher ve PNR dahil)
      sheet.columns = [
        { header: 'Voucher', key: 'voucher', width: 16 },
        { header: 'BİLETLEME TARİHİ', key: 'ticketing', width: 16 },
        { header: 'Tür', key: 'type', width: 10 },
        { header: 'ACENTE/MÜŞTERİ', key: 'customer', width: 24 },
        { header: 'Misafir Adı', key: 'guest', width: 28 },
        { header: 'PNR', key: 'pnr', width: 16 },
        { header: 'Gidiş Tarihi', key: 'dep_date', width: 14 },
        { header: 'Kalkış Saati', key: 'dep_time', width: 12 },
        { header: 'Dönüş Tarihi', key: 'ret_date', width: 14 },
        { header: 'Varış Saati', key: 'arr_time', width: 12 },
        { header: 'HAVAYOLU', key: 'airline', width: 12 },
        { header: 'GÜZERGAH', key: 'route', width: 16 },
        { header: 'UÇUŞ NO', key: 'flight_no', width: 12 },
        { header: 'TEDARİKÇİ', key: 'supplier', width: 20 },
        { header: 'MALİYET DÖVİZİ', key: 'cost_cur', width: 14 }
      ];
      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      });
      const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
      const fmtTime = (t?: string) => (t ? (t.includes('T') ? new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false}) : t) : '');

      for (const s of summaryRows) {
        sheet.addRow({
          voucher: s.voucherNumber || '',
          ticketing: fmtDate(s.ticketingDate),
          type: 'Sejour',
          customer: s.agencyName || s.customerName || '',
          guest: s.guestNames || '',
          pnr: s.pnr || '',
          dep_date: fmtDate(s.departureDate),
          dep_time: fmtTime(s.departureTime),
          ret_date: fmtDate(s.returnDate),
          arr_time: fmtTime(s.arrivalTime),
          airline: s.airline || s.airlines || '',
          route: s.route || s.departureRoute || '',
          flight_no: s.flightNo || '',
          supplier: s.ticketingProviderName || s.ticketingProvider || '',
          cost_cur: s.costCurrency || ''
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `biletler_ozet_${new Date().toISOString().split('T')[0]}.xlsx`; link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Excel export (özet) hatası:', error);
      alert('Excel export başarısız oldu.');
    }
  }

  // Quote Detail Export - Geçici olarak devre dışı
  static async exportQuoteDetail(quote: any, quoteItems: any[], agencies: any[], hotels: any[]) {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${typeof document !== 'undefined' ? document.title.split('-')[0].trim() : 'MICE'} - Teklif`);

      sheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        verticalCentered: false,
        paperSize: 9,
        margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      } as any;

      // Üst bant ve logolar
      const topBandRow = sheet.addRow([]);
      topBandRow.height = 70;
      sheet.mergeCells('A1:H1');
      for (let c = 1; c <= 8; c++) {
        sheet.getRow(1).getCell(c).value = '';
        sheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any;
      }

      // Logos - yeni sistem (URL'den base64'e çevirir)
      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true); // Koyu tema logosu kullan

      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';
      if (iconLogoBase64) {
        const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) });
        sheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any);
      }
      if (wordmarkLogoBase64) {
        const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) });
        sheet.addImage(markId, { tl: { col: 7.90, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any);
      }

      const agencyName = (id: string) => agencies.find((a: any) => a.id === id)?.name || '';
      const hotelName = (id: string) => hotels.find((h: any) => h.id === id)?.name || '';
      const hotelConcept = (id: string) => hotels.find((h: any) => h.id === id)?.concept || '';
      const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
      const fmtNumber = (n: any) => (typeof n === 'number' ? n : Number(n || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

      // Teklif üst bilgi kutuları (2 satır)
      sheet.addRow(['Referans', quote?.reference || '', 'Acente', agencyName(quote?.agency_id), 'Firma', quote?.company_name || '', 'Durum', quote?.status || '' ]);
      sheet.addRow(['Otel', hotelName(quote?.hotel_id), 'Konsept', hotelConcept(quote?.hotel_id), 'C/IN - C/OUT', `${fmtDate(quote?.check_in_date)} - ${fmtDate(quote?.check_out_date)}`, 'Tür | Opsiyon', `${quote?.quote_type || ''} | ${quote?.option || ''}`]);
      for (let r = 2; r <= 3; r++) {
        for (let c = 1; c <= 8; c++) {
          const cell = sheet.getRow(r).getCell(c);
          cell.border = { top: { style: 'thin', color: { argb: 'FFd1d5db' } }, left: { style: 'thin', color: { argb: 'FFd1d5db' } }, right: { style: 'thin', color: { argb: 'FFd1d5db' } }, bottom: { style: 'thin', color: { argb: 'FFd1d5db' } } } as any;
        }
      }

      sheet.addRow([]);

      // Kalemler tablosu
      sheet.columns = [
        { header: 'Ana Kategori', key: 'main', width: 24 },
        { header: 'Alt Kategori', key: 'sub', width: 28 },
        { header: 'Açıklama', key: 'desc', width: 42 },
        { header: 'Adet', key: 'qty', width: 10 },
        { header: 'Birim Fiyat', key: 'price', width: 14 },
        { header: 'Döviz', key: 'cur', width: 8 },
        { header: 'Tutar', key: 'total', width: 14 }
      ];

      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      });

      for (const item of quoteItems || []) {
        sheet.addRow({
          main: item.main_category || '',
          sub: item.sub_category || '',
          desc: item.description || item.detail_description || '',
          qty: item.unit_quantity || item.sefer || 1,
          price: fmtNumber(item.unit_price || 0),
          cur: item.currency || 'EUR',
          total: fmtNumber(item.total || item.total_price || (item.unit_quantity || 1) * (item.unit_price || 0))
        });
      }

      sheet.getColumn('total').alignment = { horizontal: 'right' } as any;

      // Toplam satırı
      const sum = (quoteItems || []).reduce((s: number, it: any) => s + (it.total || it.total_price || (it.unit_quantity || 1) * (it.unit_price || 0)), 0);
      const totalRow = sheet.addRow(['', '', 'TOPLAM', '', '', '', fmtNumber(sum)]);
      totalRow.getCell(3).font = { bold: true };
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(7).alignment = { horizontal: 'right' } as any;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Sürüm işareti ekleyerek yeni kodun çalıştığını doğrulamak için dosya adına v2 ekliyoruz
      link.download = `teklif_${quote?.reference || quote?.id || 'detay'}_v2.xlsx`;
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası oluşturulurken bir hata oluştu.');
    }
  }

  // Categories Export - Geçici olarak devre dışı
  static async exportCategories(categories: any[]) {
    alert('Excel export özelliği geçici olarak devre dışı bırakılmıştır.');
  }

  // Operations Export - Geçici olarak devre dışı
  static async exportOperations(operations: any[], suppliers: any[], quotes: any[]) {
    alert('Excel export özelliği geçici olarak devre dışı bırakılmıştır.');
  }

  // Projects Export - Kapsamlı proje listesi export'u (Her otel bir sheet olacak şekilde)
  static async exportProjects(projects: any[], agencies: any[], hotels: any[]) {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      
      // 1. ÖZET SAYFASI (SUMMARY)
      const summarySheet = workbook.addWorksheet('PROJE ÖZET LİSTESİ');
      summarySheet.pageSetup = {
        orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        horizontalCentered: true, paperSize: 9,
        margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      } as any;

      // Üst bant ve logolar (Özet Sayfası)
      const topBandRow = summarySheet.addRow([]);
      topBandRow.height = 70;
      summarySheet.mergeCells('A1:J1');
      for (let c = 1; c <= 10; c++) {
        summarySheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any;
      }

      const { iconLogoBase64, wordmarkLogoBase64 } = await getLogosForExcel(true);
      const inchToPx = (inch: number) => Math.round(inch * 96);
      const guessExt = (dataUrl: string): 'png' | 'jpeg' => (dataUrl || '').includes('image/png') ? 'png' : 'jpeg';

      if (iconLogoBase64) {
        const iconId = workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) });
        summarySheet.addImage(iconId, { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } as any } as any);
      }
      if (wordmarkLogoBase64) {
        const markId = workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) });
        summarySheet.addImage(markId, { tl: { col: 7.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } as any } as any);
      }

      summarySheet.columns = [
        { header: 'Oluşturulma Tarihi', key: 'created_at', width: 14 },
        { header: 'Referans', key: 'reference', width: 16 },
        { header: 'Organizasyon Tarihi', key: 'org_date', width: 22 },
        { header: 'Firma Adı', key: 'company_name', width: 22 },
        { header: 'Acente', key: 'agency', width: 20 },
        { header: 'Otel', key: 'hotel', width: 20 },
        { header: 'Bütçe', key: 'budget', width: 14 },
        { header: 'Oda | Pax', key: 'room_pax', width: 12 },
        { header: 'Durum', key: 'status', width: 12 },
        { header: 'Sayfa', key: 'sheet_link', width: 12 }
      ];

      const headerRow = summarySheet.addRow(summarySheet.columns.map((c: any) => c.header));
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any;
        cell.alignment = { vertical: 'middle', horizontal: 'center' } as any;
      });

      const agencyName = (id?: string) => agencies.find((a: any) => a.id === id)?.name || '';
      const hotelName = (id?: string) => hotels.find((h: any) => h.id === id)?.name || '';
      const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('tr-TR') : '');
      const fmtNumber = (n: any) => (typeof n === 'number' ? n : Number(n || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
      
      const getStatusText = (status?: string) => {
        if (!status) return '';
        switch (status) {
          case 'active': return 'Aktif';
          case 'completed': return 'Tamamlandı';
          case 'on_hold': case 'on-hold': return 'Beklemede';
          case 'cancelled': return 'İptal';
          case 'approved': return 'Onaylandı';
          default: return status;
        }
      };

      // 2. HER PROJE İÇİN AYRI SHEET OLUŞTUR
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        const hName = hotelName(p.hotel_id);
        const safeSheetName = `${i + 1}-${hName.substring(0, 25)}`.replace(/[\\\/\?\*\[\]]/g, '');
        
        // Özet satırını ekle
        summarySheet.addRow({
          created_at: fmtDate(p.confirmed_at || p.created_at),
          reference: p.reference || '',
          org_date: `${fmtDate(p.start_date)} - ${fmtDate(p.end_date)}`,
          company_name: p.company_name || '',
          agency: agencyName(p.agency_id),
          hotel: hName,
          budget: fmtNumber(p.budget || 0),
          room_pax: p.room_pax || '',
          status: getStatusText(p.status),
          sheet_link: safeSheetName
        });

        // Detay sayfasını oluştur
        const detailSheet = workbook.addWorksheet(safeSheetName);
        detailSheet.pageSetup = {
          orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
          horizontalCentered: true, paperSize: 9,
          margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
        } as any;
        
        // Üst bant ve logolar (Detay Sayfası)
        const dTopBand = detailSheet.addRow([]); dTopBand.height = 70; detailSheet.mergeCells('A1:H1');
        for (let c = 1; c <= 8; c++) detailSheet.getRow(1).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F38' } } as any;
        
        if (iconLogoBase64) detailSheet.addImage(workbook.addImage({ base64: iconLogoBase64, extension: guessExt(iconLogoBase64) }), { tl: { col: 0.15, row: 0.15 }, ext: { width: inchToPx(1.25), height: inchToPx(0.70) } } as any);
        if (wordmarkLogoBase64) detailSheet.addImage(workbook.addImage({ base64: wordmarkLogoBase64, extension: guessExt(wordmarkLogoBase64) }), { tl: { col: 5.5, row: 0.23 }, ext: { width: inchToPx(2.4), height: inchToPx(0.55) } } as any);

        // Proje Üst Bilgileri
        detailSheet.addRow(['PROJE DETAYI', '', '', '', '', '', 'TARİH', fmtDate(new Date().toISOString())]);
        detailSheet.mergeCells('A2:F2');
        detailSheet.getRow(2).getCell(1).font = { bold: true, size: 14 };
        
        detailSheet.addRow(['Referans', p.reference || '', 'Firma', p.company_name || '', 'Acente', agencyName(p.agency_id), 'Durum', getStatusText(p.status)]);
        detailSheet.addRow(['Otel', hName, 'Tarih Aralığı', `${fmtDate(p.start_date)} - ${fmtDate(p.end_date)}`, 'Oda | Pax', p.room_pax || '', 'Bütçe', fmtNumber(p.budget || 0)]);
        
        for (let r = 3; r <= 4; r++) {
          for (let c = 1; c <= 8; c++) {
            const cell = detailSheet.getRow(r).getCell(c);
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
            if (c % 2 === 1) cell.font = { bold: true };
          }
        }

        detailSheet.addRow([]);
        detailSheet.addRow(['Hizmet Kalemleri']);
        detailSheet.getRow(6).font = { bold: true, size: 12 };
        
        const dHeader = detailSheet.addRow(['Kategori', 'Alt Kategori', 'Açıklama', 'Adet', 'Birim Fiyat', 'Döviz', 'Toplam', 'KDV']);
        dHeader.eachCell(c => { c.font={bold:true, color:{argb:'FFFFFFFF'}}; c.fill={type:'pattern', pattern:'solid', fgColor:{argb:'FF2F3B46'}}; c.alignment={horizontal:'center' }; });
        
        detailSheet.addRow(['Bu export özet amaçlıdır. Detaylı kalemler için proje sayfasını ziyaret edin.']);
        detailSheet.mergeCells(`A8:H8`);
        detailSheet.getRow(8).alignment = { horizontal: 'center' };
      }

      // Format Summary Sheet Borders
      for (let r = 2; r <= projects.length + 2; r++) {
        for (let c = 1; c <= 10; c++) {
          summarySheet.getRow(r).getCell(c).border = { 
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, 
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, 
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }, 
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } 
          };
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projeler_detayli_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası oluşturulurken bir hata oluştu.');
    }
  }

  // Suppliers Export - Geçici olarak devre dışı
  static async exportSuppliers(suppliers: any[]) {
    alert('Excel export özelliği geçici olarak devre dışı bırakılmıştır.');
  }

  // Users Import - Geçici olarak devre dışı
  static async importUsers(file: File): Promise<any[]> {
    alert('Excel import özelliği geçici olarak devre dışı bırakılmıştır.');
    return [];
  }

  // Categories Import - Geçici olarak devre dışı
  static async importCategories(file: File): Promise<any[]> {
    alert('Excel import özelliği geçici olarak devre dışı bırakılmıştır.');
    return [];
  }

  // Users Export
  static async exportUsers(users: any[]) {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${typeof document !== 'undefined' ? document.title.split('-')[0].trim() : 'MICE'} - Kullanıcılar`);

      sheet.columns = [
        { header: 'Ad Soyad', key: 'full_name', width: 25 },
        { header: 'E-posta', key: 'email', width: 30 },
        { header: 'Rol', key: 'role', width: 15 },
        { header: 'Durum', key: 'status', width: 12 },
        { header: 'Oluşturma Tarihi', key: 'created_at', width: 18 }
      ];

      const headerRow = sheet.addRow(sheet.columns.map((c: any) => c.header));
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F3B46' } } as any;
      });

      for (const u of users) {
        sheet.addRow({
          full_name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          email: u.email || '',
          role: u.role || '',
          status: u.is_active ? 'Aktif' : 'Pasif',
          created_at: u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : ''
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kullanicilar_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Kullanıcı export hatası:', error);
      alert('Kullanıcı listesi dışa aktarılırken bir hata oluştu.');
    }
  }

  // Validate Excel File - Geçici olarak devre dışı
  static validateExcelFile(file: File): { isValid: boolean; error?: string } {
    return { isValid: false, error: 'Excel import özelliği geçici olarak devre dışı bırakılmıştır.' };
  }
}

export const ExcelImportUtils = ExcelUtils;