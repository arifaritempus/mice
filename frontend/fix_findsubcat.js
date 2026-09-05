const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// Replace old findSubCat(row.kayit_adi, catKayit) with findSubCat([row.kayit_adi], catKayit, "Kayıt Tipi")
code = code.replace(/findSubCat\(row\.kayit_adi,\s*catKayit\)/g, 'findSubCat([row.kayit_adi], catKayit, "Kayıt Tipi")');

// Replace old findSubCat([...], catKayit) missing third arg
code = code.replace(/findSubCat\(\[([^\]]+)\],\s*catKonaklama\)/g, 'findSubCat([$1], catKonaklama, "Oda Tipi")');
code = code.replace(/findSubCat\(\[([^\]]+)\],\s*catUcak\)/g, 'findSubCat([$1], catUcak, "Uçuş Tipi")');
code = code.replace(/findSubCat\(\[([^\]]+)\],\s*catTransfer\)/g, 'findSubCat([$1], catTransfer, "Transfer Tipi")');


// Replace importErrors logic since it's removed
code = code.replace(/disabled=\{loading \|\| importErrors\.length > 0\}/g, 'disabled={loading}');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed missing args!");
