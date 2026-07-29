import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def refactor_transfers(content):
    start_transfer = "{showTransfer && ("
    start_extra = "{showExtraServices && ("
    
    if start_transfer not in content or start_extra not in content:
        return content
        
    before_transfer = content[:content.find(start_transfer)]
    after_transfer = content[content.find(start_extra):]
    
    new_transfer_block = """{showTransfer && (
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "transfers" ? "border-2 border-purple-200 dark:border-purple-800" : "border border-gray-200 dark:border-gray-800"}`}>
                    {/* TRANSFER ACCORDION ROW */}
                    <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'transfers' ? 'bg-purple-50/50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'transfers' ? null : 'transfers')}>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-4 transition-colors ${expandedSection === 'transfers' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'}`}>
                        <span className="text-lg">🚗</span>
                      </div>
                      <div className="w-48 shrink-0">
                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Transferler ({transfers.length})</h4>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{transfers.length} transfer eklendi</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        {expandedSection !== 'transfers' && (
                          transfers.length > 0 ? transfers.map((t, i) => (
                            <div key={t.id} className="grid grid-cols-4 gap-4 items-center bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                              <div className="col-span-2">
                                <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">{t.direction === 'arrival' ? 'Geliş' : t.direction === 'return' ? 'Dönüş' : 'Ara'} | Tedarikçi</p>
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                  {t.provider ? suppliers.find((s) => s.id === t.provider)?.name : "Tedarikçi Seçilmedi"} - {t.type === 'private' ? 'Özel' : t.type === 'economic' ? 'Ekonomik' : ''} {t.vehicle}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Satış Tutarı</p>
                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{t.price ? (t.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {t.currency}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-[11px] text-gray-400 italic">Henüz transfer hizmeti eklenmedi</p>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 ml-4 shrink-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowTransfer(false); setExpandedSection(null); }} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hizmeti Sil">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'transfers' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                          <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'transfers' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* TRANSFER İÇERİĞİ (AÇIK DURUM) */}
                    {expandedSection === "transfers" && (
                      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                        <div className="flex flex-wrap gap-2 mb-4 justify-end">
                          <button
                            type="button"
                            onClick={() => addTransfer("arrival")}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                          >
                            + Geliş
                          </button>
                          <button
                            type="button"
                            onClick={() => addTransfer("return")}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                          >
                            + Dönüş
                          </button>
                          <button
                            type="button"
                            onClick={() => addTransfer("intermediate")}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-md hover:bg-purple-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                          >
                            + Ara
                          </button>
                        </div>

                        <div className="space-y-3">
                          {transfers.map((transfer, index) => (
                            <div
                              key={transfer.id}
                              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="inline-flex items-center px-3 py-1 bg-purple-50/50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-md text-[10px] font-semibold tracking-wider uppercase border border-purple-100 dark:border-purple-800">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                                  {transfer.direction === "arrival" ? "GELİŞ" : transfer.direction === "return" ? "DÖNÜŞ" : "ARA"} TRANSFER {index + 1}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => removeTransfer(transfer.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-900 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="flex flex-col lg:flex-row gap-2 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[2] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[0.8] lg:[&>*:nth-child(6)]:flex-[1.5]">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TARİH</label>
                                  <input type="date" value={transfer.date || ""} onChange={(e) => updateTransfer(transfer.id, "date", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TEDARİKÇİ</label>
                                  <SearchableSelect options={suppliers.map(s => ({id: s.id, name: s.name}))} value={transfer.provider || ""} onChange={(id) => updateTransfer(transfer.id, "provider", id)} placeholder="Seçiniz..." />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TİP</label>
                                  <select value={transfer.type || ""} onChange={(e) => updateTransfer(transfer.id, "type", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                    <option value="private">Özel</option>
                                    <option value="economic">Ekonomik</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">ARAÇ</label>
                                  <select value={transfer.vehicle || ""} onChange={(e) => updateTransfer(transfer.id, "vehicle", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                    <option value="">Seçin</option>
                                    {vehicleTypes.map((type) => (
                                      <option key={type} value={type}>{type}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">SAAT</label>
                                  <input type="time" value={transfer.time || ""} onChange={(e) => updateTransfer(transfer.id, "time", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">SATIŞ</label>
                                  <div className="flex gap-1 items-center">
                                    <input type="text" placeholder="0.00" value={servicePriceInput[`transfer_${transfer.id}`] !== undefined ? servicePriceInput[`transfer_${transfer.id}`] : transfer.price ? transfer.price.toString().replace(".", ",") : ""} onChange={(e) => { const val = e.target.value; setServicePriceInput((prev) => ({ ...prev, [`transfer_${transfer.id}`]: val })); }} onBlur={(e) => { const parsed = parseAmount(servicePriceInput[`transfer_${transfer.id}`] ?? e.target.value); if (parsed !== null) { updateTransfer(transfer.id, "price", parsed); setServicePriceInput((prev) => ({ ...prev, [`transfer_${transfer.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                    <select value={transfer.currency || "USD"} onChange={(e) => updateTransfer(transfer.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                      <option value="USD">USD</option>
                                      <option value="EUR">EUR</option>
                                      <option value="TRY">TRY</option>
                                      <option value="GBP">GBP</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                """
    
    return before_transfer + new_transfer_block + after_transfer

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = refactor_transfers(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied Transfer formatting to {filepath}")

