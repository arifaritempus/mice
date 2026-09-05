const XLSX = require("xlsx");
const ExcelJS = require("exceljs");

async function run() {
  const workbook = new ExcelJS.Workbook();
  const catSheet = workbook.addWorksheet('Kategoriler', { state: 'hidden' });
  const ws = workbook.addWorksheet('Rooming_List');
  
  ws.addRow([
    "KATILIMCI BİLGİLERİ", "", "", "", "", "", "", "",
    "KONAKLAMA", "", "", "", "",
    "GELİŞ UÇUŞ", "", "", "", "", "",
    "DÖNÜŞ UÇUŞ", "", "", "", "", "",
    "OPERASYONEL / EK ALANLAR (SİSTEM İÇİN)", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
  ]);
  ws.mergeCells('A1:H1');
  ws.mergeCells('I1:M1');
  ws.mergeCells('N1:S1');
  ws.mergeCells('T1:Y1');
  ws.mergeCells('Z1:AV1');
  
  const headers = [
    "NO", "İSİM", "SOYİSİM", "KAYIT TÜRÜ", "TELEFON", "MAİL ADRESİ", "TC", "DOĞUM TARİHİ", // A-H
    "OTEL ADI", "GİRİŞ", "ÇIKIŞ", "ODA TİPİ", "YATAK TİPİ", // I-M
    "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // N-S (Geliş)
    "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // T-Y (Dönüş)
    "GELİŞ TRANSFER TARİHİ", "GELİŞ TRANSFER SAATİ", "GELİŞ TRANSFER YÖNÜ", "GELİŞ TRANSFER GÜZERGAHI", "GELİŞ TRANSFER ARAÇ TİPİ", "GELİŞ TRANSFER TEDARİKÇİ", // Z-AE
    "DÖNÜŞ TRANSFER TARİHİ", "DÖNÜŞ TRANSFER SAATİ", "DÖNÜŞ TRANSFER YÖNÜ", "DÖNÜŞ TRANSFER GÜZERGAHI", "DÖNÜŞ TRANSFER ARAÇ TİPİ", "DÖNÜŞ TRANSFER TEDARİKÇİ", // AF-AK
    "GELİŞ UÇUŞ PNR", "GELİŞ UÇUŞ TEDARİKÇİ", // AL-AM
    "DÖNÜŞ UÇUŞ PNR", "DÖNÜŞ UÇUŞ TEDARİKÇİ", // AN-AO
    "KAYIT ÜCRETİ", "KONAKLAMA ÜCRETİ", // AP-AQ
    "GELİŞ UÇUŞ ÜCRETİ", "DÖNÜŞ UÇUŞ ÜCRETİ", // AR-AS
    "GELİŞ TRANSFER ÜCRETİ", "DÖNÜŞ TRANSFER ÜCRETİ", // AT-AU
    "NOTLAR" // AV
  ];
  ws.addRow(headers);
  
  ws.addRow([
    "1", "Ahmet", "Yılmaz", "Hekim", "05551234567", "ahmet@test.com", "12345678901", "01.01.1980", // A-H
    "Titanic", "12.05.2024", "15.05.2024", "SINGLE ODA", "FRENCH", // I-M
    "12.05.2024", "10:30", "12:00", "IST-AYT", "THY", "TK1234", // N-S
    "15.05.2024", "14:45", "16:00", "AYT-IST", "AJET", "VF1235", // T-Y
    "12.05.2024", "12:00", "Havalimanı-Otel", "AYT - Titanic", "Vito", "VIP Transfer", // Z-AE
    "15.05.2024", "12:00", "Otel-Havalimanı", "Titanic - AYT", "Midibus", "VIP Transfer", // AF-AK
    "P12345", "ETS", // AL-AM
    "P12346", "ETS", // AN-AO
    300, 450, // AP-AQ
    50, 50, // AR-AS
    25, 25, // AT-AU
    "Vejetaryen" // AV
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  
  const wb2 = XLSX.read(buffer, { type: "buffer" });
  const ws2 = wb2.Sheets[wb2.SheetNames[1]];
  const data = XLSX.utils.sheet_to_json(ws2, { header: 1 });
  const row = data[2];
  
  console.log("OTEL (8):", row[8]); // I
  console.log("GIRIS (9):", row[9]); // J
  console.log("CIKIS (10):", row[10]); // K
  console.log("ODA (11):", row[11]); // L
  console.log("TRANSFER (27):", row[27]); // AB (Geliş Yönü)
}

run();
