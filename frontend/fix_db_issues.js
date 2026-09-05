const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Add dbSuppliers state and load function
const stateStr = 'const [projectHotels, setProjectHotels] = useState<any[]>([]);';
const newStateStr = `const [projectHotels, setProjectHotels] = useState<any[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);`;
code = code.replace(stateStr, newStateStr);

const loadCallStr = 'loadHotels();';
const newLoadCallStr = `loadHotels();
      loadDbSuppliers();`;
code = code.replace(loadCallStr, newLoadCallStr);

const loadFuncStr = `  const loadHotels = async () => {`;
const newLoadFuncStr = `  const loadDbSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name');
    if (data) setDbSuppliers(data);
  };

  const loadHotels = async () => {`;
code = code.replace(loadFuncStr, newLoadFuncStr);

// 2. Change supplier mismatch options to use dbSuppliers
const wizardOptionsRe = /\{m\.type === "tedarikci" && SUPPLIERS\.map\(\(c, i\) => <option key=\{i\} value=\{c\.toLowerCase\(\)\}>\{c\}<\/option>\)\}/g;
const newWizardOptions = `{m.type === "tedarikci" && [...dbSuppliers, ...projectHotels].map(c => <option key={c.id} value={c.name}>{c.name}</option>)}`;
code = code.replace(wizardOptionsRe, newWizardOptions);

// 3. Fix conditions for Hotel insertion
const hotelCondRe = /if \(row\.konaklama_ucreti \|\| row\.konaklama_checkin\) \{/g;
const newHotelCond = `if (row.konaklama_ucreti || row.konaklama_checkin || row.konaklama_otel || row.konaklama_oda) {`;
code = code.replace(hotelCondRe, newHotelCond);

// 4. Fix conditions for Transfer insertion
const transferCond1Re = /if \(row\.transfer_tipi \|\| row\.transfer_guzergah \|\| row\.transfer_ucreti\) \{/g;
const newTransferCond1 = `if (row.transfer_tipi || row.transfer_guzergah || row.transfer_ucreti || row.transfer_tedarikci || row.transfer_arac_tipi) {`;
code = code.replace(transferCond1Re, newTransferCond1);

const transferCond2Re = /if \(row\.donus_transfer_tipi \|\| row\.donus_transfer_guzergah \|\| row\.donus_transfer_ucreti\) \{/g;
const newTransferCond2 = `if (row.donus_transfer_tipi || row.donus_transfer_guzergah || row.donus_transfer_ucreti || row.donus_transfer_tedarikci || row.donus_transfer_arac_tipi) {`;
code = code.replace(transferCond2Re, newTransferCond2);

// 5. Fix supplier_id in transfersToInsert
const pushTransfersRe = /const isGelis = sale\.description\?\.startsWith\("Geliş:"\);\n\s*transfersToInsert\.push\(\{[\s\S]*?cost_amount: 0\n\s*\}\);/g;
code = code.replace(pushTransfersRe, (match) => {
    return `const isGelis = sale.description?.startsWith("Geliş:");
              const supplierStr = isGelis ? row.transfer_tedarikci : row.donus_transfer_tedarikci;
              const matchedSupplier = dbSuppliers.find(s => s.name.toLowerCase() === supplierStr?.trim().toLowerCase()) || projectHotels.find(h => h.name.toLowerCase() === supplierStr?.trim().toLowerCase());
              
              transfersToInsert.push({
                id: sale.id,
                project_id: projectId,
                direction: isGelis ? "arrival" : "departure",
                type_label: isGelis ? "Giriş" : "Çıkış",
                transfer_type: sale.sub_category || null,
                route: isGelis ? row.transfer_guzergah : row.donus_transfer_guzergah,
                vehicle_type: isGelis ? row.transfer_arac_tipi : row.donus_transfer_arac_tipi,
                flight_code: isGelis ? row.ucus_gidis_kodu : row.ucus_donus_kodu,
                supplier_name: supplierStr || null,
                supplier_id: matchedSupplier ? matchedSupplier.id : null,
                provider: matchedSupplier ? matchedSupplier.id : null,
                date: isGelis ? row.transfer_gidis : row.transfer_donus,
                time: isGelis ? row.transfer_gidis_saati : row.transfer_donus_saati,
                passengers: [\`\${participant.first_name} \${participant.last_name}\`],
                cost_amount: 0
              });`;
});

// Also fix ucus_tedarikci in flight insertion!
const flightCond1Re = /if \(row\.ucus_gidis_kodu \|\| row\.ucus_parkuru \|\| row\.ucus_ucreti\) \{/g;
const newFlightCond1 = `if (row.ucus_gidis_kodu || row.ucus_parkuru || row.ucus_ucreti || row.havayolu || row.ucus_tedarikci) {`;
code = code.replace(flightCond1Re, newFlightCond1);

const flightCond2Re = /if \(row\.ucus_donus_kodu \|\| row\.donus_ucus_parkuru \|\| row\.donus_ucus_ucreti\) \{/g;
const newFlightCond2 = `if (row.ucus_donus_kodu || row.donus_ucus_parkuru || row.donus_ucus_ucreti || row.donus_havayolu || row.donus_ucus_tedarikci) {`;
code = code.replace(flightCond2Re, newFlightCond2);

const pushFlightsRe = /total_price: row\.ucus_ucreti \|\| 0,\n\s*currency: currency,\n\s*payer_company_id: selectedCompanyId \|\| null\n\s*\}\);/g;
code = code.replace(pushFlightsRe, (match) => {
    return match.replace(/payer_company_id: selectedCompanyId \|\| null/g, `payer_company_id: selectedCompanyId || null,
            supplier_id: dbSuppliers.find(s => s.name.toLowerCase() === row.ucus_tedarikci?.trim().toLowerCase())?.id || projectHotels.find(h => h.name.toLowerCase() === row.ucus_tedarikci?.trim().toLowerCase())?.id || null,
            supplier_name: row.ucus_tedarikci || null`);
});

const pushFlights2Re = /total_price: row\.donus_ucus_ucreti \|\| 0,\n\s*currency: currency,\n\s*payer_company_id: selectedCompanyId \|\| null\n\s*\}\);/g;
code = code.replace(pushFlights2Re, (match) => {
    return match.replace(/payer_company_id: selectedCompanyId \|\| null/g, `payer_company_id: selectedCompanyId || null,
            supplier_id: dbSuppliers.find(s => s.name.toLowerCase() === row.donus_ucus_tedarikci?.trim().toLowerCase())?.id || projectHotels.find(h => h.name.toLowerCase() === row.donus_ucus_tedarikci?.trim().toLowerCase())?.id || null,
            supplier_name: row.donus_ucus_tedarikci || null`);
});

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed hotel/transfer parsing conditions and mapped supplier_id!");
