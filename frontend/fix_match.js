const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Aggressive findSubCat
const newFindSubCat = `const findSubCat = (nameStr: string, parentId: string) => {
        if (!nameStr) return null;
        const s1 = nameStr.trim().toLowerCase();
        let found = categories.find(c => c.parent_id === parentId && c.name.toLowerCase() === s1);
        if (!found) {
            found = categories.find(c => c.parent_id === parentId && (c.name.toLowerCase().includes(s1) || s1.includes(c.name.toLowerCase())));
        }
        return found ? found.id : null;
      };`;
code = code.replace(/const findSubCat = \([\s\S]*?\};\n/, newFindSubCat + '\n');

// 2. Aggressive Hotel Match
const oldHotelMatch = /const matchedHotel = projectHotels\.find\(h => h\.name\.toLowerCase\(\)\.includes\(row\.konaklama_otel\?\.trim\(\)\.toLowerCase\(\) \|\| "xxxxx"\) \|\| \(row\.konaklama_otel && row\.konaklama_otel\.toLowerCase\(\)\.includes\(h\.name\.toLowerCase\(\)\)\)\);/g;
const newHotelMatch = `const matchedHotel = (() => {
            const hStr = row.konaklama_otel?.trim().toLowerCase();
            if (!hStr) return null;
            let m = projectHotels.find(h => h.name.toLowerCase() === hStr);
            if (!m) m = projectHotels.find(h => h.name.toLowerCase().includes(hStr) || hStr.includes(h.name.toLowerCase()));
            return m;
          })();`;
code = code.replace(oldHotelMatch, newHotelMatch);

// 3. Aggressive Supplier Match
const supplierHelper = `
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
      const findSubCat =`;
code = code.replace(/const findSubCat =/, supplierHelper);

// 4. Update Ucus Gidis Tedarikci
code = code.replace(/supplier_id: dbSuppliers\.find\(s => s\.name\.toLowerCase\(\) === row\.ucus_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| projectHotels\.find\(h => h\.name\.toLowerCase\(\) === row\.ucus_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| null/g, 'supplier_id: findSupplier(row.ucus_tedarikci)');

// 5. Update Ucus Donus Tedarikci
code = code.replace(/supplier_id: dbSuppliers\.find\(s => s\.name\.toLowerCase\(\) === row\.donus_ucus_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| projectHotels\.find\(h => h\.name\.toLowerCase\(\) === row\.donus_ucus_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| null/g, 'supplier_id: findSupplier(row.donus_ucus_tedarikci)');

// 6. Update Transfer Gidis Tedarikci
code = code.replace(/supplier_id: dbSuppliers\.find\(s => s\.name\.toLowerCase\(\) === row\.transfer_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| projectHotels\.find\(h => h\.name\.toLowerCase\(\) === row\.transfer_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| null/g, 'supplier_id: findSupplier(row.transfer_tedarikci)');

// 7. Update Transfer Donus Tedarikci
code = code.replace(/supplier_id: dbSuppliers\.find\(s => s\.name\.toLowerCase\(\) === row\.donus_transfer_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| projectHotels\.find\(h => h\.name\.toLowerCase\(\) === row\.donus_transfer_tedarikci\?\.trim\(\)\.toLowerCase\(\)\)\?\.id \|\| null/g, 'supplier_id: findSupplier(row.donus_transfer_tedarikci)');


fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed match!");
