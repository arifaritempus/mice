const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/requests/edit/[id]/page.tsx', 'utf-8');

// 1. Add imports
const importsToAdd = `
import DateRangeField from "@/components/DateRangeField";
import QuoteServiceEditor from "@/components/QuoteServiceEditor";
`;
if (!code.includes("QuoteServiceEditor")) {
    code = code.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";' + importsToAdd);
}

// 2. Add states for QuoteServiceEditor
const oldStates = `const [responseLines, setResponseLines] = useState<any[]>([]);`;
const newStates = `const [responseLines, setResponseLines] = useState<any[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newItem, setNewItem] = useState<any>({
    id: "",
    unit_quantity: 1,
    sefer: 1,
    unit_price: 0,
    currency: "EUR",
    total: 0
  });`;
if (!code.includes("showAddRow, setShowAddRow")) {
    code = code.replace(oldStates, newStates);
}

// 3. Update table rendering for DBL/SNG to use sub_category instead of category_id if available
const oldTD = `const dbl = hr.response_details?.prices?.find((p: any) => p.category_id === categories.find((c: any) => c.name.includes("DOUBLE") || c.name.includes("DBL"))?.id);`;
const newTD = `const dbl = hr.response_details?.prices?.find((p: any) => (p.category_id || p.sub_category) === categories.find((c: any) => c.name.includes("DOUBLE") || c.name.includes("DBL"))?.id);`;
code = code.replace(oldTD, newTD);

const oldTDSng = `const sng = hr.response_details?.prices?.find((p: any) => p.category_id === categories.find((c: any) => c.name.includes("SINGLE") || c.name.includes("SNG"))?.id);`;
const newTDSng = `const sng = hr.response_details?.prices?.find((p: any) => (p.category_id || p.sub_category) === categories.find((c: any) => c.name.includes("SINGLE") || c.name.includes("SNG"))?.id);`;
code = code.replace(oldTDSng, newTDSng);


// 4. Update Modal body
const oldModalBodyRegex = /<div className="space-y-6">.*?<div className="flex gap-3 mt-8">/s;
const newModalBody = `<div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-v3-border">
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Durum</label>
                  <select value={responseStatus} onChange={(e) => setResponseStatus(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="BEKLEMEDE">Beklemede</option>
                    <option value="MAİL GÖNDERİLDİ">Mail Gönderildi</option>
                    <option value="FİYAT GİRDİ">Fiyat Girdi</option>
                    <option value="REDDEDİLDİ">Reddedildi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Opsiyon Tipi</label>
                  <select value={respOptionType} onChange={(e) => setRespOptionType(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="1. Opsiyon">1. Opsiyon</option>
                    <option value="2. Opsiyon">2. Opsiyon</option>
                    <option value="Sor-Sat">Sor-Sat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-v3-muted uppercase mb-1">Opsiyon Tarihi</label>
                  <input type="date" value={respOptionDate} onChange={(e) => setRespOptionDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-v3-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-v3-border">
                <DateRangeField
                  label="Tarih Aralığı (C-IN / C-OUT)"
                  startValue={respCIn}
                  endValue={respCOut}
                  onStartChange={(v) => setRespCIn(v)}
                  onEndChange={(v) => setRespCOut(v)}
                  onApply={(s, e) => {
                    if (s !== undefined) setRespCIn(s);
                    if (e !== undefined) setRespCOut(e);
                  }}
                />
              </div>

              <div className="pt-2 border-t border-v3-border">
                <QuoteServiceEditor
                  items={responseLines}
                  categories={categories}
                  onAdd={() => {
                    setResponseLines([...responseLines, {
                      ...newItem,
                      id: Date.now().toString(),
                      isEditing: true
                    }]);
                  }}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSave={(items) => setResponseLines(items)}
                  showAddRow={showAddRow}
                  setShowAddRow={setShowAddRow}
                  newItem={newItem}
                  setNewItem={setNewItem}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">`;

code = code.replace(oldModalBodyRegex, newModalBody);

// 5. Update pre-fill logic to avoid adding empty row
const oldPrefill = `if (!details.prices || details.prices.length === 0) {
                             setResponseLines([{ id: Date.now().toString(), category_id: "", price: "", currency: "EUR" }]);
                          }`;
const newPrefill = `// No prefill, QuoteServiceEditor can handle empty state
// if (!details.prices || details.prices.length === 0) {}`;
code = code.replace(oldPrefill, newPrefill);


// 6. Update handleSaveResponse to support QuoteServiceEditor schema
const oldSaveLines = `prices: responseLines.filter((l: any) => l.category_id && l.price)`;
const newSaveLines = `prices: responseLines.filter((l: any) => l.sub_category && l.unit_price)`;
code = code.replace(oldSaveLines, newSaveLines);

const oldTotalAmount = `const totalAmount = responseLines.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);`;
const newTotalAmount = `const totalAmount = responseLines.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);`;
code = code.replace(oldTotalAmount, newTotalAmount);


// 7. Make modal wider
const oldModalWidth = `w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto`;
const newModalWidth = `w-full max-w-[95vw] lg:max-w-7xl m-4 max-h-[90vh] overflow-y-auto`;
code = code.replace(oldModalWidth, newModalWidth);

fs.writeFileSync('frontend/src/app/requests/edit/[id]/page.tsx', code);
console.log("Upgraded modal to QuoteServiceEditor + DateRangeField!");
