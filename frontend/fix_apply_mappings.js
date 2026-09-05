const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const applyMappingsRegex = /const applyMappings = \(\) => \{[\s\S]*?toast\.success\("Eşleştirmeler tamamlandı! Veriler aktarıma hazır\."\);\n\s*\};/g;

const newApplyMappings = `const applyMappings = () => {
    // Check if all mismatches are mapped or explicitly ignored (if we allow ignore)
    const unmapped = mismatches.filter(m => !m.mappedValue);
    if (unmapped.length > 0) {
      toast.error("Lütfen tüm eşleşmeyen veriler için bir seçim yapın.");
      return;
    }

    const updatedData = tempFormattedData.map(row => {
      const newRow = { ...row };
      
      const applyMap = (val: string, type: string, fallbackVal: string = "") => {
        const valToSearch = val || fallbackVal;
        if (!valToSearch) return val;
        
        const match = mismatches.find(m => m.type === type && m.invalidValue.trim().toLowerCase() === valToSearch.trim().toLowerCase());
        if (match && match.mappedValue !== "IGNORE") {
          return match.mappedValue;
        }
        if (match && match.mappedValue === "IGNORE") {
          return "";
        }
        return val;
      };

      newRow.kayit_adi = applyMap(newRow.kayit_adi, "kayit");
      newRow.konaklama_oda = applyMap(newRow.konaklama_oda, "konaklama");
      newRow.ucus_tipi = applyMap(newRow.ucus_tipi, "ucak");
      newRow.transfer_tipi = applyMap(newRow.transfer_tipi, "transfer");
      newRow.donus_transfer_tipi = applyMap(newRow.donus_transfer_tipi, "transfer");
      newRow.konaklama_otel = applyMap(newRow.konaklama_otel, "otel", "Otel Seçilmedi");
      
      newRow.havayolu = applyMap(newRow.havayolu, "havayolu");
      newRow.donus_havayolu = applyMap(newRow.donus_havayolu, "havayolu");
      newRow.transfer_arac_tipi = applyMap(newRow.transfer_arac_tipi, "arac");
      newRow.donus_transfer_arac_tipi = applyMap(newRow.donus_transfer_arac_tipi, "arac");
      newRow.transfer_tedarikci = applyMap(newRow.transfer_tedarikci, "tedarikci");
      newRow.donus_transfer_tedarikci = applyMap(newRow.donus_transfer_tedarikci, "tedarikci");
      newRow.ucus_tedarikci = applyMap(newRow.ucus_tedarikci, "tedarikci");
      newRow.donus_ucus_tedarikci = applyMap(newRow.donus_ucus_tedarikci, "tedarikci");

      return newRow;
    });

    setParsedData(updatedData);
    setShowMappingWizard(false);
    toast.success("Eşleştirmeler tamamlandı! Veriler aktarıma hazır.");
  };`;

code = code.replace(applyMappingsRegex, newApplyMappings);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Rewrote applyMappings to cover all fields and fallback values!");
