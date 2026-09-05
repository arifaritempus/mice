const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', 'utf8');

// 1. Update saveServiceRow to correctly build reference fields from operational fields for Flight and Transfer
code = code.replace(
  /const payload: any = \{[\s\S]*?total_try: Number\(item\.exchange_rate\) \? \(Number\(item\.unit_price\) \|\| 0\) \* Number\(item\.exchange_rate\) : null\n\s*\};/,
  `const payload: any = {
        project_id: projectId,
        participant_id: participant.id,
        category: CATEGORY_UUIDS[category as keyof typeof CATEGORY_UUIDS],
        description: category === "Uçak" ? item.description : category === "Transfer" ? item.route : item.description,
        reference: category === "Uçak" ? (item.gidis_tarihi ? item.gidis_tarihi + (item.gidis_saati ? 'T'+item.gidis_saati : '') : null) : category === "Transfer" ? (item.date ? item.date + (item.time ? 'T'+item.time : '') : null) : (item.reference || null),
        unit_price: item.unit_price,
        unit_quantity: 1,
        total_price: item.unit_price,
        currency: item.currency,
        payer_company_id: item.payer_company_id || null,
        exchange_rate: Number(item.exchange_rate) || null,
        fx: Number(item.exchange_rate) || null,
        total_try: Number(item.exchange_rate) ? (Number(item.unit_price) || 0) * Number(item.exchange_rate) : null
      };`
);

// 2. Replace Flight UI
const flightRegex = /\{activeTab === "flight" && \([\s\S]*?\{\/\* END FLIGHT \*\/\}/;
// Actually I don't have {/* END FLIGHT */} so I'll just match until activeTab === "companion"
const flightBlockRegex = /\{activeTab === "flight" && \([\s\S]*?(?=\{activeTab === "companion")/g;

const newFlightBlock = `{activeTab === "flight" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><span className="text-blue-500">✈️</span> Uçuşlar</h3>
                <button onClick={() => addEmptyService("Uçak")} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"><Plus className="w-3 h-3" /> YENİ EKLE</button>
              </div>
              
              {flights.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı uçuş bulunamadı.</p>}

              {flights.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Uçuş Sınıfı</label>
                      <select value={item.sub_category || ""} onChange={e => updateServiceField("Uçak", item.id, "sub_category", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Sınıf --</option>
                        {categories.filter(c => c.parent_id === catUcak).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Parkur (IST-AYT vb.)</label>
                      <input type="text" value={item.description || ""} onChange={e => updateServiceField("Uçak", item.id, "description", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Gidiş Tarih / Saat / Kod</label>
                      <div className="flex gap-1">
                        <input type="date" value={item.gidis_tarihi || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_tarihi", e.target.value)} className="w-1/2 h-9 px-1 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.gidis_saati || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_saati", e.target.value)} className="w-1/4 h-9 px-1 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Kod" value={item.gidis_ucus_kodu || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_ucus_kodu", e.target.value)} className="w-1/4 h-9 px-1 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Dönüş Tarih / Saat / Kod</label>
                      <div className="flex gap-1">
                        <input type="date" value={item.donus_tarihi || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_tarihi", e.target.value)} className="w-1/2 h-9 px-1 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.donus_saati || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_saati", e.target.value)} className="w-1/4 h-9 px-1 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Kod" value={item.donus_ucus_kodu || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_ucus_kodu", e.target.value)} className="w-1/4 h-9 px-1 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">PNR</label>
                      <input type="text" value={item.pnr || ""} onChange={e => updateServiceField("Uçak", item.id, "pnr", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Havayolu</label>
                      <input type="text" value={item.havayolu || ""} onChange={e => updateServiceField("Uçak", item.id, "havayolu", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tedarikçi</label>
                      <input type="text" value={item.tedarikci || ""} onChange={e => updateServiceField("Uçak", item.id, "tedarikci", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-blue-600 dark:text-blue-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Uçak", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded text-blue-900 dark:text-blue-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2 md:col-start-3">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>
                      <div className="flex gap-2">
                        <input type="number" value={item.unit_price || 0} onChange={e => updateServiceField("Uçak", item.id, "unit_price", Number(e.target.value))} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <select value={item.currency || "EUR"} onChange={e => updateServiceField("Uçak", item.id, "currency", e.target.value)} className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                        </select>
                        <input type="number" step="0.0001" placeholder="Kur" value={item.exchange_rate || ''} onChange={e => updateServiceField("Uçak", item.id, "exchange_rate", e.target.value)} title="Manuel kur. Boş bırakırsanız projenin genel kurunu kullanır." className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <div className="h-9 px-3 flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-v3-border rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[90px]" title="Toplam TL (Sadece manuel kur girilirse anlık görünür)">
                          {item.exchange_rate && item.unit_price ? (Number(item.unit_price) * Number(item.exchange_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                        </div>
                        <button onClick={() => saveServiceRow("Uçak", item)} disabled={loading} className="px-4 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700">KAYDET</button>
                        <button onClick={() => removeService("Uçak", item.id)} className="px-3 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          `;

code = code.replace(flightBlockRegex, newFlightBlock);


const transferBlockRegex = /\{activeTab === "transfer" && \([\s\S]*?(?=\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\s*\}\s*export)/g;
const newTransferBlock = `{activeTab === "transfer" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-v3-text flex items-center gap-2"><span className="text-indigo-500">🚙</span> Transferler</h3>
                <button onClick={() => addEmptyService("Transfer")} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"><Plus className="w-3 h-3" /> YENİ EKLE</button>
              </div>
              
              {transfers.length === 0 && <p className="text-xs text-v3-muted text-center py-6">Kayıtlı transfer bulunamadı.</p>}

              {transfers.map((item, idx) => (
                <div key={item.id} className="bg-v3-surface border border-v3-border rounded-xl p-4 space-y-4 relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Transfer Tipi</label>
                      <select value={item.sub_category || ""} onChange={e => updateServiceField("Transfer", item.id, "sub_category", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                        <option value="">-- Araç Tipi --</option>
                        {categories.filter(c => c.parent_id === catTransfer).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Güzergah (HVL-Otel vb.)</label>
                      <input type="text" value={item.route || ""} onChange={e => updateServiceField("Transfer", item.id, "route", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tarih / Saat</label>
                      <div className="flex gap-1">
                        <input type="date" value={item.date || ""} onChange={e => updateServiceField("Transfer", item.id, "date", e.target.value)} className="w-2/3 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.time || ""} onChange={e => updateServiceField("Transfer", item.id, "time", e.target.value)} className="w-1/3 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Yön (Geliş / Dönüş)</label>
                      <input type="text" value={item.direction || ""} onChange={e => updateServiceField("Transfer", item.id, "direction", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tedarikçi Adı</label>
                      <input type="text" value={item.supplier_name || ""} onChange={e => updateServiceField("Transfer", item.id, "supplier_name", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Araç Tipi / Transfer Türü</label>
                      <div className="flex gap-1">
                        <input type="text" placeholder="Araç Tipi" value={item.vehicle_type || ""} onChange={e => updateServiceField("Transfer", item.id, "vehicle_type", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Tür (VIP vb.)" value={item.transfer_type || ""} onChange={e => updateServiceField("Transfer", item.id, "transfer_type", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Uçuş Kodu</label>
                      <input type="text" value={item.flight_code || ""} onChange={e => updateServiceField("Transfer", item.id, "flight_code", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-indigo-600 dark:text-indigo-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Transfer", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 rounded text-indigo-900 dark:text-indigo-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2 md:col-start-3">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>
                      <div className="flex gap-2">
                        <input type="number" value={item.unit_price || 0} onChange={e => updateServiceField("Transfer", item.id, "unit_price", Number(e.target.value))} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <select value={item.currency || "EUR"} onChange={e => updateServiceField("Transfer", item.id, "currency", e.target.value)} className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none">
                          <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="TRY">TRY</option>
                        </select>
                        <input type="number" step="0.0001" placeholder="Kur" value={item.exchange_rate || ''} onChange={e => updateServiceField("Transfer", item.id, "exchange_rate", e.target.value)} title="Manuel kur. Boş bırakırsanız projenin genel kurunu kullanır." className="w-20 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <div className="h-9 px-3 flex items-center bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-v3-border rounded text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap min-w-[90px]" title="Toplam TL (Sadece manuel kur girilirse anlık görünür)">
                          {item.exchange_rate && item.unit_price ? (Number(item.unit_price) * Number(item.exchange_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺' : '-'}
                        </div>
                        <button onClick={() => saveServiceRow("Transfer", item)} disabled={loading} className="px-4 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">KAYDET</button>
                        <button onClick={() => removeService("Transfer", item.id)} className="px-3 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
`;
code = code.replace(transferBlockRegex, newTransferBlock);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', code);
console.log("Fixed UI!");
