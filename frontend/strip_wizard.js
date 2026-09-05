const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Remove states
code = code.replace(/const \[mismatches, setMismatches\] = useState<any\[\]>\(\[\]\);\n\s*const \[showMappingWizard, setShowMappingWizard\] = useState\(false\);\n\s*const \[tempFormattedData, setTempFormattedData\] = useState<any\[\]>\(\[\]\);/g, '');

// 2. Remove addMismatch logic block
const mismatchLogicRegex = /const addMismatch = \([\s\S]*?\};\n\n\s*const checkMismatches = \(\) => \{[\s\S]*?if \(!matched\) \{[\s\S]*?\}\n\s*\}\n\n[\s\S]*?if \(newMismatches\.length > 0\) \{[\s\S]*?return;\n\s*\}/g;
code = code.replace(mismatchLogicRegex, '');

// 3. Instead of checkMismatches and returning, just setParsedData(formattedData)
code = code.replace(/checkMismatches\(\);/g, `
        if (formattedData.length === 0) {
          toast.error("Geçerli bir veri bulunamadı. Lütfen şablonu kontrol edin.");
          return;
        }
        setParsedData(formattedData);
        toast.success(formattedData.length + " katılımcı listeye eklendi.");
`);

// 4. Remove applyMappings
const applyMappingsRegex = /const applyMappings = \(\) => \{[\s\S]*?toast\.success\("Eşleştirmeler tamamlandı! Veriler aktarıma hazır\."\);\n\s*\};/g;
code = code.replace(applyMappingsRegex, '');

// 5. Remove Mapping Wizard UI
const wizardUIRegex = /\{showMappingWizard && \([\s\S]*?\{!showMappingWizard && \(/g;
code = code.replace(wizardUIRegex, '{('); // leave the main UI block

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Stripped wizard!");
