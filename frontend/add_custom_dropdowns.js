const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Add CONSTANTS at the top
const constantsStr = `
const CATEGORY_UUIDS = {
`;
const newConstants = `
const VEHICLE_TYPES = ["Binek", "Vito", "Minibüs", "Midibüs", "Otobüs", "Sprinter", "VIP"];
const SUPPLIERS = ["ETS Tur", "Jolly Tur", "TatilBudur", "Odamax", "Setur", "THY", "Pegasus", "SunExpress", "Ajet", "Diğer"];
const AIRLINES = ["THY", "AJET", "PEGASUS", "SUNEXPRESS", "CORENDON", "Diğer"];

const CATEGORY_UUIDS = {
`;
code = code.replace(constantsStr, newConstants);

// 2. Update Excel downloadTemplate
const downloadRe = /const airlines = \["THY", "AJET", "PEGASUS", "SUNEXPRESS", "CORENDON"\];[\s\S]*?a\.click\(\);/m;

const newDownload = `const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      
      const catSheet = workbook.addWorksheet('Kategoriler', { state: 'hidden' });
      catSheet.getColumn(1).values = ['Kayıt Tipleri', ...kayitCats];
      catSheet.getColumn(2).values = ['Oda Tipleri', ...konaklamaCats];
      catSheet.getColumn(3).values = ['Transfer Tipleri', ...transferCats];
      catSheet.getColumn(4).values = ['Oteller', ...hotelNames];
      catSheet.getColumn(5).values = ['Havayolları', ...AIRLINES];
      catSheet.getColumn(6).values = ['Araç Tipleri', ...VEHICLE_TYPES];
      catSheet.getColumn(7).values = ['Tedarikçiler', ...SUPPLIERS];

      const ws = workbook.addWorksheet('Rooming_List');
      
      // ROW 1: Merged Headers
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
      
      // ROW 2: Column Headers
      const headers = [
        "NO", "İSİM", "SOYİSİM", "KAYIT TÜRÜ", "TELEFON", "MAİL ADRESİ", "TC", "DOĞUM TARİHİ", // A-H
        "OTEL ADI", "GİRİŞ", "ÇIKIŞ", "ODA TİPİ", "YATAK TİPİ", // I-M
        "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // N-S (Geliş)
        "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // T-Y (Dönüş)
        "TARİH", "SAAT", "YÖN", "GÜZERGAH", "ARAÇ TİPİ", "TEDARİKÇİ", // Z-AE (Geliş Transfer)
        "TARİH", "SAAT", "YÖN", "GÜZERGAH", "ARAÇ TİPİ", "TEDARİKÇİ", // AF-AK (Dönüş Transfer)
        "UÇUŞ PNR (G)", "UÇUŞ TED. (G)", "UÇUŞ PNR (D)", "UÇUŞ TED. (D)", // AL-AO
        "KAYIT Ü.", "KONAKLAMA Ü.", "G.UÇUŞ Ü.", "D.UÇUŞ Ü.", "G.TRANSFER Ü.", "D.TRANSFER Ü.", // AP-AU
        "NOTLAR" // AV
      ];
      ws.addRow(headers);
      
      // ROW 3: Example Data
      ws.addRow([
        "1", "Ahmet", "Yılmaz", kayitCats[0] || "Hekim", "05551234567", "ahmet@test.com", "12345678901", "01.01.1980", // A-H
        hotelNames[0] || "Titanic", "12.05.2024", "15.05.2024", konaklamaCats[0] || "SINGLE ODA", "FRENCH", // I-M
        "12.05.2024", "10:30", "12:00", "IST-AYT", "THY", "TK1234", // N-S
        "15.05.2024", "14:45", "16:00", "AYT-IST", "AJET", "VF1235", // T-Y
        "12.05.2024", "12:00", transferCats[0] || "Havalimanı-Otel", "AYT - Titanic", "Vito", "ETS Tur", // Z-AE
        "15.05.2024", "12:00", transferCats[0] || "Otel-Havalimanı", "Titanic - AYT", "Midibüs", "ETS Tur", // AF-AK
        "P12345", "ETS Tur", "P67890", "ETS Tur", // AL-AO
        500, 1500, 750, 750, 150, 150, // AP-AU
        "VIP Karşılama" // AV
      ]);

      // Styling Row 1 (Merged Headers)
      const r1 = ws.getRow(1);
      r1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      r1.alignment = { horizontal: 'center', vertical: 'middle' };
      r1.height = 25;
      
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800000' } }; // Dark Red
      ws.getCell('I1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Red
      ws.getCell('N1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }; // Blue
      ws.getCell('T1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } }; // Dark Blue
      ws.getCell('Z1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } }; // Gray

      // Styling Row 2 (Columns)
      const r2 = ws.getRow(2);
      r2.font = { bold: true };
      r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      
      // Auto-fit columns
      ws.columns.forEach(col => { col.width = 15; });

      // Data Validation
      for (let i = 3; i <= 1000; i++) {
        // Kayıt Tipi (D)
        if (kayitCats.length > 0) ws.getCell(\`D\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$A$2:$A$\${kayitCats.length + 1}\`] };
        // Oda Tipi (L)
        if (konaklamaCats.length > 0) ws.getCell(\`L\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$B$2:$B$\${konaklamaCats.length + 1}\`] };
        // Otel (I)
        if (hotelNames.length > 0) ws.getCell(\`I\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$E$2:$E$\${hotelNames.length + 1}\`] };
        // Geliş Havayolu (R)
        ws.getCell(\`R\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$E$2:$E$\${AIRLINES.length + 1}\`] };
        // Dönüş Havayolu (X)
        ws.getCell(\`X\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$E$2:$E$\${AIRLINES.length + 1}\`] };
        // Geliş Transfer Yönü (AB)
        if (transferCats.length > 0) ws.getCell(\`AB\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$C$2:$C$\${transferCats.length + 1}\`] };
        // Dönüş Transfer Yönü (AH)
        if (transferCats.length > 0) ws.getCell(\`AH\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$C$2:$C$\${transferCats.length + 1}\`] };
        
        // Araç Tipleri (AD, AJ)
        ws.getCell(\`AD\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$F$2:$F$\${VEHICLE_TYPES.length + 1}\`] };
        ws.getCell(\`AJ\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$F$2:$F$\${VEHICLE_TYPES.length + 1}\`] };
        
        // Tedarikçiler (AE, AK, AM, AO)
        ws.getCell(\`AE\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$G$2:$G$\${SUPPLIERS.length + 1}\`] };
        ws.getCell(\`AK\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$G$2:$G$\${SUPPLIERS.length + 1}\`] };
        ws.getCell(\`AM\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$G$2:$G$\${SUPPLIERS.length + 1}\`] };
        ws.getCell(\`AO\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$G$2:$G$\${SUPPLIERS.length + 1}\`] };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Katilimci_Rooming_Listesi.xlsx";
      a.click();`;
code = code.replace(downloadRe, newDownload);

// 3. Update mismatch checks
const mismatchRe = /const newMismatches: any\[\] = \[\];[\s\S]*?for \(let i = 0; i < formattedData\.length; i\+\+\) \{[\s\S]*?if \(r\.konaklama_otel [^\n]*/m;

const newMismatchChecks = `const newMismatches: any[] = [];
        const addMismatch = (type: string, val: string, rowData: any) => {
          if (!val) return;
          const existing = newMismatches.find(m => m.type === type && m.invalidValue.trim().toLowerCase() === val.trim().toLowerCase());
          if (existing) {
            existing.count += 1;
          } else {
            let sampleText = \`\${rowData.first_name} \${rowData.last_name}\`;
            if (type === "konaklama" || type === "otel") {
              sampleText += \` (\${rowData.konaklama_checkin || "Tarih Yok"} ➔ \${rowData.konaklama_checkout || "Tarih Yok"})\`;
            }
            newMismatches.push({ type, invalidValue: val, mappedValue: "", count: 1, sample: sampleText });
          }
        };

        const vehiclesLower = VEHICLE_TYPES.map(v => v.toLowerCase());
        const suppliersLower = SUPPLIERS.map(s => s.toLowerCase());
        const airlinesLower = AIRLINES.map(a => a.toLowerCase());

        for (let i = 0; i < formattedData.length; i++) {
          const r = formattedData[i];
          if (r.kayit_adi && !kayitCatsLower.includes(r.kayit_adi.trim().toLowerCase())) addMismatch("kayit", r.kayit_adi.trim(), r);
          if (r.konaklama_oda && !konaklamaCatsLower.includes(r.konaklama_oda.trim().toLowerCase())) addMismatch("konaklama", r.konaklama_oda.trim(), r);
          if (r.transfer_tipi && !transferCatsLower.includes(r.transfer_tipi.trim().toLowerCase())) addMismatch("transfer", r.transfer_tipi.trim(), r);
          if (r.donus_transfer_tipi && !transferCatsLower.includes(r.donus_transfer_tipi.trim().toLowerCase())) addMismatch("transfer", r.donus_transfer_tipi.trim(), r);
          if (r.konaklama_otel && !hotelNamesLower.some(h => h === r.konaklama_otel.trim().toLowerCase() || h.includes(r.konaklama_otel.trim().toLowerCase()) || r.konaklama_otel.trim().toLowerCase().includes(h))) addMismatch("otel", r.konaklama_otel, r);
          
          // New mismatch checks
          if (r.havayolu && !airlinesLower.includes(r.havayolu.trim().toLowerCase())) addMismatch("havayolu", r.havayolu.trim(), r);
          if (r.donus_havayolu && !airlinesLower.includes(r.donus_havayolu.trim().toLowerCase())) addMismatch("havayolu", r.donus_havayolu.trim(), r);
          
          if (r.transfer_arac_tipi && !vehiclesLower.includes(r.transfer_arac_tipi.trim().toLowerCase())) addMismatch("arac", r.transfer_arac_tipi.trim(), r);
          if (r.donus_transfer_arac_tipi && !vehiclesLower.includes(r.donus_transfer_arac_tipi.trim().toLowerCase())) addMismatch("arac", r.donus_transfer_arac_tipi.trim(), r);
          
          if (r.transfer_tedarikci && !suppliersLower.includes(r.transfer_tedarikci.trim().toLowerCase())) addMismatch("tedarikci", r.transfer_tedarikci.trim(), r);
          if (r.donus_transfer_tedarikci && !suppliersLower.includes(r.donus_transfer_tedarikci.trim().toLowerCase())) addMismatch("tedarikci", r.donus_transfer_tedarikci.trim(), r);
          if (r.ucus_tedarikci && !suppliersLower.includes(r.ucus_tedarikci.trim().toLowerCase())) addMismatch("tedarikci", r.ucus_tedarikci.trim(), r);
          if (r.donus_ucus_tedarikci && !suppliersLower.includes(r.donus_ucus_tedarikci.trim().toLowerCase())) addMismatch("tedarikci", r.donus_ucus_tedarikci.trim(), r);`;

code = code.replace(mismatchRe, newMismatchChecks);

// 4. Update applyMappings to apply to the new fields
const applyMapRe = /return \{\n            \.\.\.r,\n            kayit_adi: applyMap\(r\.kayit_adi, "kayit"\),[\s\S]*?donus_transfer_tipi: applyMap\(r\.donus_transfer_tipi, "transfer"\)\n          \};/m;

const newApplyMap = `return {
            ...r,
            kayit_adi: applyMap(r.kayit_adi, "kayit"),
            konaklama_oda: applyMap(r.konaklama_oda, "konaklama"),
            konaklama_otel: applyMap(r.konaklama_otel, "otel"),
            transfer_tipi: applyMap(r.transfer_tipi, "transfer"),
            donus_transfer_tipi: applyMap(r.donus_transfer_tipi, "transfer"),
            havayolu: applyMap(r.havayolu, "havayolu"),
            donus_havayolu: applyMap(r.donus_havayolu, "havayolu"),
            transfer_arac_tipi: applyMap(r.transfer_arac_tipi, "arac"),
            donus_transfer_arac_tipi: applyMap(r.donus_transfer_arac_tipi, "arac"),
            transfer_tedarikci: applyMap(r.transfer_tedarikci, "tedarikci"),
            donus_transfer_tedarikci: applyMap(r.donus_transfer_tedarikci, "tedarikci"),
            ucus_tedarikci: applyMap(r.ucus_tedarikci, "tedarikci"),
            donus_ucus_tedarikci: applyMap(r.donus_ucus_tedarikci, "tedarikci")
          };`;

code = code.replace(applyMapRe, newApplyMap);

// 5. Render dropdowns for the mapping wizard
const wizardRenderRe = /\{m\.type === "otel" && hotelNamesLower\.map\(\(c, i\) => <option key=\{i\} value=\{c\}>\{c\}<\/option>\)\}/m;

const newWizardRender = `{m.type === "otel" && hotelNamesLower.map((c, i) => <option key={i} value={c}>{c}</option>)}
                            {m.type === "havayolu" && AIRLINES.map((c, i) => <option key={i} value={c.toLowerCase()}>{c}</option>)}
                            {m.type === "arac" && VEHICLE_TYPES.map((c, i) => <option key={i} value={c.toLowerCase()}>{c}</option>)}
                            {m.type === "tedarikci" && SUPPLIERS.map((c, i) => <option key={i} value={c.toLowerCase()}>{c}</option>)}`;

code = code.replace(wizardRenderRe, newWizardRender);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success added custom dropdowns to wizard!");
