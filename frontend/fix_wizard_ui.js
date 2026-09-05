const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Change modal width
code = code.replace(/<div className="w-full max-w-2xl bg-white/g, '<div className="w-full max-w-5xl bg-white');

// 2. Replace the mismatches mapping logic with a table
const wizardUiRe = /<div className="p-4 space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<div className="p-4 border-t/m;

const newWizardUi = `<div className="p-4 overflow-x-auto">
                <table className="w-full text-sm text-left border border-gray-200 dark:border-v3-border rounded-lg overflow-hidden">
                  <thead className="text-xs text-gray-500 dark:text-v3-muted bg-gray-50 dark:bg-v3-bg uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Hatalı Veri</th>
                      <th className="px-4 py-3 font-semibold">Alan / Sütun</th>
                      <th className="px-4 py-3 font-semibold">Etkilenen</th>
                      <th className="px-4 py-3 font-semibold">Örnek Katılımcı</th>
                      <th className="px-4 py-3 font-semibold min-w-[250px]">Doğru Karşılığı Seçin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-v3-border">
                {mismatches.map((m, idx) => {
                  let options: any[] = [];
                  let label = "";
                  if (m.type === "kayit") { options = categories.filter(c => c.parent_id === catKayit); label = "Kayıt Paketi"; }
                  if (m.type === "konaklama") { options = categories.filter(c => c.parent_id === catKonaklama); label = "Oda Tipi"; }
                  if (m.type === "ucak") { options = categories.filter(c => c.parent_id === catUcak); label = "Uçuş Tipi"; }
                  if (m.type === "transfer") { options = categories.filter(c => c.parent_id === catTransfer); label = "Transfer Tipi"; }
                  if (m.type === "otel") { options = projectHotels; label = "Otel Adı"; }
                  if (m.type === "havayolu") { label = "Havayolu"; }
                  if (m.type === "arac") { label = "Araç Tipi"; }
                  if (m.type === "tedarikci") { label = "Tedarikçi"; }

                  return (
                    <tr key={idx} className="bg-white dark:bg-v3-surface hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-red-500 dark:text-red-400">{m.invalidValue}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{label}</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-semibold">{m.count} Kayıt</span></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-v3-muted text-xs truncate max-w-[200px]">{m.sample}</td>
                      <td className="px-4 py-3">
                        <select
                          value={m.mappedValue || ""}
                          onChange={(e) => {
                            const newM = [...mismatches];
                            newM[idx].mappedValue = e.target.value;
                            setMismatches(newM);
                          }}
                          className="w-full h-9 rounded-lg border-gray-300 dark:border-v3-border bg-white dark:bg-v3-bg text-gray-900 dark:text-white text-sm focus:ring-brand focus:border-brand"
                        >
                          <option value="">-- Doğru Karşılığı Seçin --</option>
                          {m.type === "kayit" && options.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          {m.type === "konaklama" && options.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          {m.type === "ucak" && options.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          {m.type === "transfer" && options.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          {m.type === "otel" && options.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          {m.type === "havayolu" && AIRLINES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                          {m.type === "arac" && VEHICLE_TYPES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                          {m.type === "tedarikci" && SUPPLIERS.map((c, i) => <option key={i} value={c}>{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t`;

code = code.replace(wizardUiRe, newWizardUi);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success updated mapping wizard ui to table!");
