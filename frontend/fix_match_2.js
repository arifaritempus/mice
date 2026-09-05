const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const newFindSubCat = `const findSubCat = (nameStr: string | string[], parentId: string) => {
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
      };`;
      
code = code.replace(/const findSubCat = \([\s\S]*?\};\n/, newFindSubCat + '\n');

// Konaklama SubCat
code = code.replace(/sub_category: findSubCat\(row\.konaklama_oda, catKonaklama\)/, 'sub_category: findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama)');

// Ucak Gidis SubCat
code = code.replace(/sub_category: findSubCat\(row\.ucus_tipi, catUcak\)/, 'sub_category: findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu], catUcak)');

// Ucak Donus SubCat
code = code.replace(/sub_category: findSubCat\(row\.ucus_tipi, catUcak\)/, 'sub_category: findSubCat([row.ucus_tipi, row.donus_ucus_parkuru, row.donus_havayolu], catUcak)');

// Transfer Gidis SubCat
code = code.replace(/sub_category: findSubCat\(row\.transfer_tipi, catTransfer\)/, 'sub_category: findSubCat([row.transfer_arac_tipi, row.transfer_tipi], catTransfer)');

// Transfer Donus SubCat
code = code.replace(/sub_category: findSubCat\(row\.donus_transfer_tipi, catTransfer\)/, 'sub_category: findSubCat([row.donus_transfer_arac_tipi, row.donus_transfer_tipi], catTransfer)');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed match arrays!");
