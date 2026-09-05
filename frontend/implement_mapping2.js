const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldValidation = /const errors: string\[\] = \[\];[\s\S]*?\} else \{\n\s*setImportErrors\(\[\]\);\n\s*\}/;

const newValidation = `
        const newMismatches: {type: string, excelValue: string, mappedId: string}[] = [];
        
        const addMismatch = (type: string, val: string) => {
          if (!val) return;
          const v = val.trim();
          if (v && !newMismatches.find(m => m.type === type && m.excelValue === v) && !mappingDict[\`\${type}:\${v}\`]) {
            newMismatches.push({ type, excelValue: v, mappedId: "" });
          }
        };

        formattedData.forEach((row, i) => {
          if (row.kayit_adi && !findSubCat([row.kayit_adi], catKayit, "Kayıt Tipi")) addMismatch("Kayıt Tipi", row.kayit_adi);
          if (row.konaklama_oda && !findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi")) addMismatch("Oda Tipi", row.konaklama_oda);
          
          if (row.konaklama_otel) {
            const hStr = row.konaklama_otel.trim();
            if (!mappingDict[\`Otel:\${hStr}\`]) {
              const hLow = hStr.toLowerCase();
              const hMatch = projectHotels.find(h => h.name.toLowerCase() === hLow) || projectHotels.find(h => h.name.toLowerCase().includes(hLow) || hLow.includes(h.name.toLowerCase()));
              if (!hMatch) addMismatch("Otel", hStr);
            }
          }
          
          if ((row.ucus_tipi || row.ucus_parkuru || row.havayolu) && !findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu], catUcak, "Uçuş Tipi")) addMismatch("Uçuş Tipi", row.ucus_tipi || row.ucus_parkuru || row.havayolu);
          if (row.ucus_tedarikci && !findSupplier(row.ucus_tedarikci)) addMismatch("Tedarikçi", row.ucus_tedarikci);
          
          if ((row.ucus_tipi || row.donus_ucus_parkuru || row.donus_havayolu) && !findSubCat([row.ucus_tipi, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi")) addMismatch("Uçuş Tipi", row.ucus_tipi || row.donus_ucus_parkuru || row.donus_havayolu);
          if (row.donus_ucus_tedarikci && !findSupplier(row.donus_ucus_tedarikci)) addMismatch("Tedarikçi", row.donus_ucus_tedarikci);
          
          if ((row.transfer_tipi || row.transfer_arac_tipi) && !findSubCat([row.transfer_arac_tipi, row.transfer_tipi], catTransfer, "Transfer Tipi")) addMismatch("Transfer Tipi", row.transfer_arac_tipi || row.transfer_tipi);
          if (row.transfer_tedarikci && !findSupplier(row.transfer_tedarikci)) addMismatch("Tedarikçi", row.transfer_tedarikci);
          
          if ((row.donus_transfer_tipi || row.donus_transfer_arac_tipi) && !findSubCat([row.donus_transfer_arac_tipi, row.donus_transfer_tipi], catTransfer, "Transfer Tipi")) addMismatch("Transfer Tipi", row.donus_transfer_arac_tipi || row.donus_transfer_tipi);
          if (row.donus_transfer_tedarikci && !findSupplier(row.donus_transfer_tedarikci)) addMismatch("Tedarikçi", row.donus_transfer_tedarikci);
        });

        if (newMismatches.length > 0) {
          setMismatches(newMismatches);
          setTempParsedData(formattedData);
          setShowMappingModal(true);
          return;
        }
`;
code = code.replace(oldValidation, newValidation);

// Change error UI back to rendering nothing (since we use modal)
const oldErrorUI = /\{importErrors\.length > 0 && \([\s\S]*?\}\)/;
code = code.replace(oldErrorUI, '');
// Change disable logic back
code = code.replace(/disabled=\{loading \|\| importErrors\.length > 0\}/, 'disabled={loading}');


// Add Mapping Modal to the JSX
const mappingModal = `
      {showMappingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-v3-bg rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-orange-500">⚠️</span> Eşleştirme Gerekli
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 dark:bg-transparent">
              <p className="text-sm text-v3-muted mb-6">Excel dosyanızdaki bazı veriler sistemdeki kayıtlarla otomatik olarak eşleştirilemedi. Lütfen aşağıdaki verilerin sistemdeki karşılıklarını seçin. Bu işlem sadece bu aktarım için geçerlidir.</p>
              
              <div className="space-y-4">
                {mismatches.map((m, idx) => {
                  let options: any[] = [];
                  if (m.type === "Kayıt Tipi") options = categories.filter(c => c.parent_id === catKayit);
                  else if (m.type === "Oda Tipi") options = categories.filter(c => c.parent_id === catKonaklama);
                  else if (m.type === "Uçuş Tipi") options = categories.filter(c => c.parent_id === catUcak);
                  else if (m.type === "Transfer Tipi") options = categories.filter(c => c.parent_id === catTransfer);
                  else if (m.type === "Otel") options = projectHotels;
                  else if (m.type === "Tedarikçi") options = [...dbSuppliers, ...projectHotels];

                  return (
                    <div key={idx} className="flex items-center gap-4 bg-white dark:bg-v3-surface border border-gray-200 dark:border-v3-border p-4 rounded-xl shadow-sm">
                      <div className="w-1/3">
                        <span className="text-[10px] font-black text-v3-muted uppercase block mb-1">{m.type}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{m.excelValue}</span>
                      </div>
                      <div className="w-8 flex justify-center text-gray-300 dark:text-gray-600">→</div>
                      <div className="flex-1">
                        <select 
                          value={m.mappedId} 
                          onChange={e => {
                            const newM = [...mismatches];
                            newM[idx].mappedId = e.target.value;
                            setMismatches(newM);
                          }}
                          className="w-full h-10 px-3 text-sm font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded-lg text-v3-text outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="">-- Karşılığını Seçin --</option>
                          {options.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-v3-bg flex justify-end gap-3">
              <button 
                onClick={() => { setShowMappingModal(false); setTempParsedData([]); }} 
                className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-v3-muted hover:text-gray-900 dark:hover:text-v3-text transition-colors"
              >
                İPTAL
              </button>
              <button 
                onClick={() => {
                  const unmapped = mismatches.filter(m => !m.mappedId);
                  if (unmapped.length > 0) {
                    alert("Lütfen tüm eşleştirmeleri tamamlayın veya iptal edip Excel dosyanızı düzeltin.");
                    return;
                  }
                  
                  const newDict = { ...mappingDict };
                  mismatches.forEach(m => {
                    newDict[\`\${m.type}:\${m.excelValue}\`] = m.mappedId;
                  });
                  setMappingDict(newDict);
                  setShowMappingModal(false);
                  
                  // Re-run validation with new dictionary
                  const formattedData = tempParsedData;
                  setTempParsedData([]);
                  
                  // Now that mapping is saved, we can just parse again or trust that it will pass.
                  // Easiest is to simulate file upload success and set parsed data.
                  setParsedData(formattedData);
                  toast.success(\`\${formattedData.length} katılımcı listeye eklendi.\`);
                }} 
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                EŞLEŞTİRMELERİ KAYDET VE AKTAR
              </button>
            </div>
          </div>
        </div>
      )}
`;

// Insert modal at the very end before the last closing div
code = code.replace(/(\s*)(<\/div>\s*<\/div>\s*\)\;\s*\})/, '$1' + mappingModal + '$2');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Step 2 done");
