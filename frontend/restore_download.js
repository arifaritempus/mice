const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const downloadRegex = /const downloadTemplate = async \(\) => \{[\s\S]*?toast\.success\("Şablon başarıyla indirildi\."\);\n    \} catch \(err: any\) \{\n      console\.error\(err\);\n      toast\.dismiss\(\);\n      toast\.error\("Şablon oluşturulurken hata: " \+ err\.message\);\n    \}\n  \};/m;

const newDownload = `const downloadTemplate = async () => {
    toast.loading("Şablon hazırlanıyor...");
    try {
      const { data: cats } = await supabase.from('project_categories').select('id, name, parent_id').eq('project_id', projectId);
      const allCats = cats || [];
      
      const kayitCats = allCats.filter(c => c.parent_id === catKayit).map(c => c.name);
      const konaklamaCats = allCats.filter(c => c.parent_id === catKonaklama).map(c => c.name);
      const ucakCats = allCats.filter(c => c.parent_id === catUcak).map(c => c.name);
      const transferCats = allCats.filter(c => c.parent_id === catTransfer).map(c => c.name);

      const hotelNames = projectHotels.map(h => h.name);

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      
      const catSheet = workbook.addWorksheet('Kategoriler', { state: 'hidden' });
      catSheet.getColumn(1).values = ['Kayıt Tipleri', ...kayitCats];
      catSheet.getColumn(2).values = ['Oda Tipleri', ...konaklamaCats];
      catSheet.getColumn(3).values = ['Uçuş Tipleri', ...ucakCats];
      catSheet.getColumn(4).values = ['Transfer Tipleri', ...transferCats];
      catSheet.getColumn(5).values = ['Oteller', ...hotelNames];

      const ws = workbook.addWorksheet('Rooming_List');
      
      // ROW 1: Merged Headers
      ws.addRow([
        "KATILIMCI BİLGİLERİ", "", "", "", "", "", "", "",
        "KONAKLAMA", "", "", "",
        "GELİŞ UÇUŞ", "", "", "", "", "",
        "DÖNÜŞ UÇUŞ", "", "", "", "", "",
        "OPERASYONEL / İÇ KULLANIM", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);
      ws.mergeCells('A1:H1');
      ws.mergeCells('I1:L1');
      ws.mergeCells('M1:R1');
      ws.mergeCells('S1:X1');
      ws.mergeCells('Y1:AO1');
      
      // ROW 2: Column Headers
      const headers = [
        "NO", "İSİM", "SOYİSİM", "KAYIT TÜRÜ", "TELEFON", "MAİL ADRESİ", "TC", "DOĞUM TARİHİ", // A-H
        "GİRİŞ", "ÇIKIŞ", "ODA TİPİ", "YATAK TİPİ", // I-L
        "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // M-R (Geliş)
        "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // S-X (Dönüş)
        "NOTLAR", "KAYIT PAKETİ", "KAYIT ÜCRETİ", "OTEL ADI", "KONAKLAMA ÜCRETİ", // Y-AC
        "UÇUŞ PNR", "UÇUŞ TEDARİKÇİ", "UÇUŞ ÜCRETİ", // AD-AF
        "TRANSFER YÖNÜ", "TRANSFER GÜZERGAHI", "TRANSFER GİDİŞ TARİHİ", "TRANSFER GİDİŞ SAATİ", "TRANSFER DÖNÜŞ TARİHİ", "TRANSFER DÖNÜŞ SAATİ", "TRANSFER ARAÇ TİPİ", "TRANSFER TEDARİKÇİ", "TRANSFER ÜCRETİ" // AG-AO
      ];
      ws.addRow(headers);
      
      // ROW 3: Example Data
      ws.addRow([
        "1", "Ahmet", "Yılmaz", "Hekim", "05551234567", "ahmet@test.com", "12345678901", "01.01.1980",
        "12.05.2024", "15.05.2024", konaklamaCats[0] || "SNG", "FRENCH",
        "12.05.2024", "10:30", "12:00", "IST-AYT", "THY", "TK1234", 
        "15.05.2024", "14:45", "16:00", "AYT-IST", "THY", "TK1235",
        "Vejetaryen", kayitCats[0] || "Erken Kayıt", 300, "Titanic", 450,
        "P12345", "ETS", 100,
        transferCats[0] || "Havalimanı", "AYT - Titanic", "12.05.2024", "12:00", "15.05.2024", "12:00", "Vito", "VIP Transfer", 50
      ]);

      // Styling Row 1 (Merged Headers)
      const r1 = ws.getRow(1);
      r1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      r1.alignment = { horizontal: 'center', vertical: 'middle' };
      r1.height = 25;
      
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800000' } }; // Dark Red
      ws.getCell('I1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Red
      ws.getCell('M1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }; // Blue
      ws.getCell('S1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } }; // Dark Blue
      ws.getCell('Y1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } }; // Gray

      // Styling Row 2 (Columns)
      const r2 = ws.getRow(2);
      r2.font = { bold: true };
      r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      
      // Auto-fit columns
      ws.columns.forEach(col => { col.width = 15; });

      // Data Validation
      for (let i = 3; i <= 1000; i++) {
        // Kayıt Tipi / Paketi (Z)
        if (kayitCats.length > 0) ws.getCell(\`Z\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$A$2:$A$\${kayitCats.length + 1}\`] };
        // Oda Tipi (K)
        if (konaklamaCats.length > 0) ws.getCell(\`K\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$B$2:$B$\${konaklamaCats.length + 1}\`] };
        // Otel (AB)
        if (hotelNames.length > 0) ws.getCell(\`AB\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$E$2:$E$\${hotelNames.length + 1}\`] };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Katilimci_Rooming_Listesi.xlsx";
      a.click();
      toast.dismiss();
      toast.success("Şablon başarıyla indirildi.");
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error("Şablon oluşturulurken hata: " + err.message);
    }
  };`;

if (code.match(downloadRegex)) {
  code = code.replace(downloadRegex, newDownload);
  fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
  console.log("Success restored downloadTemplate!");
} else {
  console.log("Failed to match downloadTemplate.");
  console.log("Found snippet index:", code.indexOf("const downloadTemplate = async () => {"));
}
