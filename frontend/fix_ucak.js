const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', 'utf8');

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
                    
                    {/* Row 1 */}
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
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Gidiş Tarih / Saat / Kod</label>
                      <div className="flex gap-2">
                        <input type="date" value={item.gidis_tarihi || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_tarihi", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.gidis_saati || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_saati", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Kod" value={item.gidis_ucus_kodu || ""} onChange={e => updateServiceField("Uçak", item.id, "gidis_ucus_kodu", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">PNR</label>
                      <input type="text" value={item.pnr || ""} onChange={e => updateServiceField("Uçak", item.id, "pnr", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Havayolu</label>
                      <input type="text" value={item.havayolu || ""} onChange={e => updateServiceField("Uçak", item.id, "havayolu", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Dönüş Tarih / Saat / Kod</label>
                      <div className="flex gap-2">
                        <input type="date" value={item.donus_tarihi || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_tarihi", e.target.value)} className="w-1/2 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="time" value={item.donus_saati || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_saati", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                        <input type="text" placeholder="Kod" value={item.donus_ucus_kodu || ""} onChange={e => updateServiceField("Uçak", item.id, "donus_ucus_kodu", e.target.value)} className="w-1/4 h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tedarikçi</label>
                      <input type="text" value={item.tedarikci || ""} onChange={e => updateServiceField("Uçak", item.id, "tedarikci", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-v3-border rounded text-v3-text outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1 text-blue-600 dark:text-blue-400">Ödeyen Kurum</label>
                      <select value={item.payer_company_id || ""} onChange={e => updateServiceField("Uçak", item.id, "payer_company_id", e.target.value)} className="w-full h-9 px-2 text-xs font-semibold bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded text-blue-900 dark:text-blue-100 outline-none">
                        <option value="">-- Katılımcı (Bireysel) --</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    {/* Row 4 */}
                    <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
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
          )}`;

const flightBlockRegex = /\{activeTab === "flight" && \([\s\S]*?(?=\{activeTab === "companion")/g;
code = code.replace(flightBlockRegex, newFlightBlock);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', code);
console.log("Fixed Ucak layout!");
