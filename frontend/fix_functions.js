const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const helpers = `
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

// Remove from old places
const findSupplierRegex = /const findSupplier = \([\s\S]*?return found \? found\.id : null;\s*\};\s*/g;
code = code.replace(findSupplierRegex, '');

const findSubCatRegex = /const findSubCat = \([\s\S]*?return null;\s*\};\s*/g;
code = code.replace(findSubCatRegex, '');

// Place them exactly above handleFileUpload
code = code.replace(/const handleFileUpload =/, helpers + '\n  const handleFileUpload =');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Functions moved!");
