const fs = require('fs');

// 1. Get the 354-line file
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 2. Get newParse and newDbLogic from final_salvation.js
const finalSalvation = fs.readFileSync('final_salvation.js', 'utf8');
const newParseMatch = finalSalvation.match(/const newParse = \`(const dataRows = data\.slice\(2\);[\s\S]*?)\`;/);
const newDbLogicMatch = finalSalvation.match(/const newDbLogic = \`([\s\S]*?)\`;\n\ncode = code\.replace/);

// 3. Get newDownloadTemplate from fix.js
const fixJs = fs.readFileSync('fix.js', 'utf8');
const newDownloadMatch = fixJs.match(/const newDownloadTemplate = \`(const downloadTemplate = async \(\) => \{[\s\S]*?)\`;\n\ncode = code\.replace/);

if (!newParseMatch || !newDbLogicMatch || !newDownloadMatch) {
   console.log("Failed to match one of the blocks!");
   process.exit(1);
}

// 4. Do the replacements!
// Download Template
const dtStart = 'const downloadTemplate = async () => {';
const dtEnd = 'toast.error("Şablon oluşturulurken hata: " + err.message);\n    }\n  };';
const dtStartIdx = code.indexOf(dtStart);
const dtEndIdx = code.indexOf(dtEnd, dtStartIdx);
if(dtStartIdx !== -1 && dtEndIdx !== -1) {
   code = code.substring(0, dtStartIdx) + newDownloadMatch[1] + code.substring(dtEndIdx + dtEnd.length);
} else { console.log("Failed downloadTemplate"); }

// Parse Block
const pStart = 'const data = XLSX.utils.sheet_to_json(ws);';
const pEnd = '})).filter(r => r.first_name && r.last_name);';
const pStartIdx = code.indexOf(pStart);
const pEndIdx = code.indexOf(pEnd, pStartIdx);
if(pStartIdx !== -1 && pEndIdx !== -1) {
   const replacedParse = 'const data = XLSX.utils.sheet_to_json(ws, { header: 1 });\n        ' + newParseMatch[1];
   code = code.substring(0, pStartIdx) + replacedParse + code.substring(pEndIdx + pEnd.length);
} else { console.log("Failed parse"); }

// DB Logic
const dbStart = 'if (row.kayit_ucreti || row.kayit_adi) {';
const dbEnd = 'if (srvError) console.error("Servisler eklenirken hata:", srvError);\n      }';
const dbStartIdx = code.indexOf(dbStart);
const dbEndIdx = code.indexOf(dbEnd, dbStartIdx);
if(dbStartIdx !== -1 && dbEndIdx !== -1) {
   code = code.substring(0, dbStartIdx) + newDbLogicMatch[1] + code.substring(dbEndIdx + dbEnd.length);
} else { console.log("Failed db"); }

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Reconstructed core logic!");
