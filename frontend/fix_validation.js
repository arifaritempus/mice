const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Add state
code = code.replace(/const \[currency, setCurrency\] = useState<string>\("EUR"\);/, 
  'const [currency, setCurrency] = useState<string>("EUR");\n  const [importErrors, setImportErrors] = useState<string[]>([]);');

// 2. Move helpers out of handleSubmit
const helpersBlock = `
  const findSupplier = (nameStr: string) => {
    if (!nameStr) return null;
    const s1 = nameStr.trim().toLowerCase();
    let found = dbSuppliers.find(s => s.name.toLowerCase() === s1) || projectHotels.find(h => h.name.toLowerCase() === s1);
    if (!found) {
        found = dbSuppliers.find(s => s.name.toLowerCase().includes(s1) || s1.includes(s.name.toLowerCase())) || 
                projectHotels.find(h => h.name.toLowerCase().includes(s1) || s1.includes(h.name.toLowerCase()));
    }
    return found ? found.id : null;
  };
  const findSubCat = (nameStr: string | string[], parentId: string) => {
    if (!nameStr) return null;
    const searchTerms = Array.isArray(nameStr) ? nameStr : [nameStr];
    for (const str of searchTerms) {
        if (!str) continue;
        const s1 = str.trim().toLowerCase();
        let found = categories.find(c => c.parent_id === parentId && c.name.toLowerCase() === s1);
        if (!found) {
            found = categories.find(c => c.parent_id === parentId && (c.name.toLowerCase().includes(s1) || s1.includes(c.name.toLowerCase())));
        }
        if (found) return found.id;
    }
    return null;
  };
`;
// Insert helpers after loadHotels
code = code.replace(/const parseDate =/, helpersBlock + '\n  const parseDate =');

// 3. Remove them from handleSubmit
code = code.replace(/const findSupplier = \([\s\S]*?return found \? found\.id : null;\n\s*\};\n/, '');
code = code.replace(/const findSubCat = \([\s\S]*?return null;\n\s*\};\n/, '');

// 4. Add validation in handleFileUpload
const validationLogic = `
        const errors: string[] = [];
        formattedData.forEach((row, i) => {
          const rowNum = i + 4; // Headers are on row 3, data starts at 4
          
          if (row.kayit_adi && !findSubCat([row.kayit_adi], catKayit)) errors.push(\`Satır \${rowNum}: Kayıt Paketi "\${row.kayit_adi}" sistemde bulunamadı.\`);
          
          if (row.konaklama_oda && !findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama)) errors.push(\`Satır \${rowNum}: Oda Tipi "\${row.konaklama_oda}" sistemde bulunamadı.\`);
          if (row.konaklama_otel) {
            const hStr = row.konaklama_otel.trim().toLowerCase();
            const hMatch = projectHotels.find(h => h.name.toLowerCase() === hStr) || projectHotels.find(h => h.name.toLowerCase().includes(hStr) || hStr.includes(h.name.toLowerCase()));
            if (!hMatch) errors.push(\`Satır \${rowNum}: Otel "\${row.konaklama_otel}" sistemde bulunamadı.\`);
          }
          
          if ((row.ucus_tipi || row.ucus_parkuru || row.havayolu) && !findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu], catUcak)) errors.push(\`Satır \${rowNum}: Gidiş Uçuş Sınıfı/Tipi "\${row.ucus_tipi || row.ucus_parkuru}" sistemde bulunamadı.\`);
          
          if ((row.ucus_tipi || row.donus_ucus_parkuru || row.donus_havayolu) && !findSubCat([row.ucus_tipi, row.donus_ucus_parkuru, row.donus_havayolu], catUcak)) errors.push(\`Satır \${rowNum}: Dönüş Uçuş Sınıfı/Tipi "\${row.ucus_tipi || row.donus_ucus_parkuru}" sistemde bulunamadı.\`);
          
          if ((row.transfer_tipi || row.transfer_arac_tipi) && !findSubCat([row.transfer_arac_tipi, row.transfer_tipi], catTransfer)) errors.push(\`Satır \${rowNum}: Gidiş Transfer Tipi "\${row.transfer_arac_tipi || row.transfer_tipi}" sistemde bulunamadı.\`);
          
          if ((row.donus_transfer_tipi || row.donus_transfer_arac_tipi) && !findSubCat([row.donus_transfer_arac_tipi, row.donus_transfer_tipi], catTransfer)) errors.push(\`Satır \${rowNum}: Dönüş Transfer Tipi "\${row.donus_transfer_arac_tipi || row.donus_transfer_tipi}" sistemde bulunamadı.\`);
        });

        if (errors.length > 0) {
          setImportErrors(errors);
          return;
        } else {
          setImportErrors([]);
        }
`;
code = code.replace(/if \(formattedData\.length === 0\)/, validationLogic + '\n        if (formattedData.length === 0)');

// 5. Add UI for errors
const errorUI = `
        {importErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4 mb-4">
            <h4 className="text-red-700 dark:text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
              ⚠️ Lütfen Excel dosyanızdaki hataları düzeltin:
            </h4>
            <div className="max-h-40 overflow-y-auto text-xs text-red-600 dark:text-red-300 space-y-1 pl-6 list-disc">
              {importErrors.map((err, i) => (
                <div key={i} className="list-item">{err}</div>
              ))}
            </div>
            <p className="text-xs text-red-500 mt-3 font-semibold">Bu eksikleri tamamlamadan aktarım yapamazsınız.</p>
          </div>
        )}
`;
code = code.replace(/\{parsedData\.length > 0 && \(/, errorUI + '\n        {parsedData.length > 0 && (');

// Disable Aktar button if errors exist
code = code.replace(/<button onClick=\{handleSubmit\} disabled=\{loading\} className="flex items-center gap-2/, '<button onClick={handleSubmit} disabled={loading || importErrors.length > 0} className="flex items-center gap-2');


fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Validation added!");
