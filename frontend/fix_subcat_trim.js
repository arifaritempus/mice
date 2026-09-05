const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const f1 = `const findSubCat = (val: string, parentId: string) => {
    if (!val) return null;
    const match = categories.find(c => c.parent_id === parentId && c.name.toLowerCase() === val.toLowerCase());
    return match ? match.id : null;
  };`;

const f1New = `const findSubCat = (val: string, parentId: string) => {
    if (!val) return null;
    const match = categories.find(c => c.parent_id === parentId && c.name.toLowerCase().trim() === val.toLowerCase().trim());
    return match ? match.id : null;
  };`;

code = code.replace(f1, f1New);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success findSubCat trim!");
