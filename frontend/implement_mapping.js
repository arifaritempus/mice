const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Add states for Mapping Wizard
const states = `
  const [mismatches, setMismatches] = useState<{type: string, excelValue: string, mappedId: string}[]>([]);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingDict, setMappingDict] = useState<Record<string, string>>({});
  const [tempParsedData, setTempParsedData] = useState<any[]>([]); // To hold data while mapping
`;
code = code.replace(/const \[importErrors, setImportErrors\] = useState<string\[\]>\(\[\]\);/, states);

// 2. Modify helpers to use mappingDict
const oldHelpers = /const findSupplier = \([\s\S]*?return null;\n  \};\n/g;
const newHelpers = `
  const findSupplier = (nameStr: string) => {
    if (!nameStr) return null;
    const s1 = nameStr.trim();
    if (mappingDict[\`Tedarikçi:\${s1}\`]) return mappingDict[\`Tedarikçi:\${s1}\`];
    
    const sLow = s1.toLowerCase();
    let found = dbSuppliers.find(s => s.name.toLowerCase() === sLow) || projectHotels.find(h => h.name.toLowerCase() === sLow);
    if (!found) {
        found = dbSuppliers.find(s => s.name.toLowerCase().includes(sLow) || sLow.includes(s.name.toLowerCase())) || 
                projectHotels.find(h => h.name.toLowerCase().includes(sLow) || sLow.includes(h.name.toLowerCase()));
    }
    return found ? found.id : null;
  };
  
  const findSubCat = (nameStr: string | string[], parentId: string, type: string) => {
    if (!nameStr) return null;
    const searchTerms = Array.isArray(nameStr) ? nameStr : [nameStr];
    
    for (const str of searchTerms) {
        if (!str) continue;
        const s1 = str.trim();
        if (mappingDict[\`\${type}:\${s1}\`]) return mappingDict[\`\${type}:\${s1}\`];
    }
    
    for (const str of searchTerms) {
        if (!str) continue;
        const sLow = str.trim().toLowerCase();
        let found = categories.find(c => c.parent_id === parentId && c.name.toLowerCase() === sLow);
        if (!found) {
            found = categories.find(c => c.parent_id === parentId && (c.name.toLowerCase().includes(sLow) || sLow.includes(c.name.toLowerCase())));
        }
        if (found) return found.id;
    }
    return null;
  };
`;
code = code.replace(oldHelpers, newHelpers);

// 3. Update findSubCat calls in code (add type parameter)
code = code.replace(/findSubCat\(\[row\.kayit_adi\], catKayit\)/g, 'findSubCat([row.kayit_adi], catKayit, "Kayıt Tipi")');
code = code.replace(/findSubCat\(\[row\.konaklama_oda, row\.konaklama_otel\], catKonaklama\)/g, 'findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi")');
code = code.replace(/findSubCat\(\[row\.ucus_tipi, row\.ucus_parkuru, row\.havayolu\], catUcak\)/g, 'findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu], catUcak, "Uçuş Tipi")');
code = code.replace(/findSubCat\(\[row\.ucus_tipi, row\.donus_ucus_parkuru, row\.donus_havayolu\], catUcak\)/g, 'findSubCat([row.ucus_tipi, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi")');
code = code.replace(/findSubCat\(\[row\.transfer_arac_tipi, row\.transfer_tipi\], catTransfer\)/g, 'findSubCat([row.transfer_arac_tipi, row.transfer_tipi], catTransfer, "Transfer Tipi")');
code = code.replace(/findSubCat\(\[row\.donus_transfer_arac_tipi, row\.donus_transfer_tipi\], catTransfer\)/g, 'findSubCat([row.donus_transfer_arac_tipi, row.donus_transfer_tipi], catTransfer, "Transfer Tipi")');


fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Step 1 done");
