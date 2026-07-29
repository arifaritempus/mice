import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def refactor_extras(content):
    start_extra = "{showExtraServices && ("
    start_summary = "{/* Summary */}"
    
    if start_extra not in content or start_summary not in content:
        return content
        
    before_extra = content[:content.find(start_extra)]
    after_extra = content[content.find(start_summary):]
    
    new_extra_block = """{showExtraServices && (
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "extras" ? "border-2 border-orange-200 dark:border-orange-800" : "border border-gray-200 dark:border-gray-800"}`}>
                    {/* EKSTRA HİZMETLER ACCORDION ROW */}
                    <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'extras' ? 'bg-orange-50/50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'extras' ? null : 'extras')}>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-4 transition-colors ${expandedSection === 'extras' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
                        <span className="text-lg">✨</span>
                      </div>
                      <div className="w-48 shrink-0">
                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Ekstra Hizmetler ({extraServices.length})</h4>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{extraServices.length} hizmet eklendi</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        {expandedSection !== 'extras' && (
                          extraServices.length > 0 ? extraServices.map((e, i) => (
                            <div key={e.id} className="grid grid-cols-4 gap-4 items-center bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                              <div className="col-span-2">
                                <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Hizmet | Tedarikçi</p>
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                  {e.serviceType ? supplierServiceTypes.find(t => t.id === e.serviceType)?.name : "Hizmet Tipi Seçilmedi"} - {e.provider ? suppliers.find((s) => s.id === e.provider)?.name : "Tedarikçi Seçilmedi"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Satış Tutarı</p>
                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{e.price ? (e.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {e.currency}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-[11px] text-gray-400 italic">Henüz ekstra hizmet eklenmedi</p>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 ml-4 shrink-0">
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); setShowExtraServices(false); setExpandedSection(null); }} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hizmeti Sil">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'extras' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                          <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'extras' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* EKSTRA HİZMETLER İÇERİĞİ (AÇIK DURUM) */}
                    {expandedSection === "extras" && (
                      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                        <div className="flex flex-wrap gap-2 mb-4 justify-end">
                          <button
                            type="button"
                            onClick={addExtraService}
                            className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-md hover:bg-orange-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                          >
                            + Yeni Hizmet Ekle
                          </button>
                        </div>

                        <div className="space-y-3">
                          {extraServices.map((service, index) => (
                            <div
                              key={service.id}
                              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-700 shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="inline-flex items-center px-3 py-1 bg-orange-50/50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-md text-[10px] font-semibold tracking-wider uppercase border border-orange-100 dark:border-orange-800">
                                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>
                                  EKSTRA HİZMET {index + 1}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => removeExtraService(service.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-900 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="flex flex-col lg:flex-row gap-2 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1.5] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[3] lg:[&>*:nth-child(5)]:flex-[1.5]">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TARİH</label>
                                  <input type="date" value={service.date || ""} onChange={(e) => updateExtraService(service.id, "date", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">HİZMET TİPİ</label>
                                  <select value={service.serviceType || ""} onChange={(e) => updateExtraService(service.id, "serviceType", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                    <option value="">Seçin</option>
                                    {supplierServiceTypes.map((type) => (
                                      <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TEDARİKÇİ</label>
                                  <SearchableSelect options={suppliers.map(s => ({id: s.id, name: s.name}))} value={service.provider || ""} onChange={(id) => updateExtraService(service.id, "provider", id)} placeholder="Tedarikçi ara..." />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">AÇIKLAMA</label>
                                  <input type="text" placeholder="Örn: Rehberlik" value={service.description || ""} onChange={(e) => updateExtraService(service.id, "description", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">SATIŞ</label>
                                  <div className="flex gap-1 items-center">
                                    <input type="text" placeholder="0.00" value={servicePriceInput[`extra_${service.id}`] !== undefined ? servicePriceInput[`extra_${service.id}`] : service.price ? service.price.toString().replace(".", ",") : ""} onChange={(e) => { const val = e.target.value; setServicePriceInput((prev) => ({ ...prev, [`extra_${service.id}`]: val })); }} onBlur={(e) => { const parsed = parseAmount(servicePriceInput[`extra_${service.id}`] ?? e.target.value); if (parsed !== null) { updateExtraService(service.id, "price", parsed); setServicePriceInput((prev) => ({ ...prev, [`extra_${service.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                    <select value={service.currency || "USD"} onChange={(e) => updateExtraService(service.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
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
    
    return before_extra + new_extra_block + after_extra

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = refactor_extras(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied Extra Services formatting to {filepath}")

