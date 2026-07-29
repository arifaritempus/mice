import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def refactor_flights(content):
    # Find the entire showFlight block
    # It starts with {showFlight && ( and ends when {showTransfer && ( starts
    start_flight = "{showFlight && ("
    start_transfer = "{showTransfer && ("
    
    if start_flight not in content or start_transfer not in content:
        return content
        
    before_flight = content[:content.find(start_flight)]
    after_flight = content[content.find(start_transfer):]
    
    new_flight_block = """{showFlight && (
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "flights" ? "border-2 border-emerald-200 dark:border-emerald-800" : "border border-gray-200 dark:border-gray-800"}`}>
                    {/* UÇUŞLAR ACCORDION ROW */}
                    <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'flights' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'flights' ? null : 'flights')}>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-4 transition-colors ${expandedSection === 'flights' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                        <span className="text-lg">✈️</span>
                      </div>
                      <div className="w-48 shrink-0">
                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Uçuşlar ({flights.length})</h4>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{flights.length} uçuş eklendi</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        {expandedSection !== 'flights' && (
                          flights.length > 0 ? flights.map((f, i) => (
                            <div key={f.id} className="grid grid-cols-4 gap-4 items-center bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                              <div className="col-span-2">
                                <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">{f.type === 'departure' ? 'Gidiş' : 'Dönüş'} | Yön</p>
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                  {f.departureAirport} ➝ {f.arrivalAirport}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Satış Tutarı</p>
                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{f.price ? (f.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {f.currency}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-[11px] text-gray-400 italic">Henüz uçuş hizmeti eklenmedi</p>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-gray-400 ml-4 shrink-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowFlight(false); setExpandedSection(null); }} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hizmeti Sil">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                        <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'flights' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'flights' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* UÇUŞ İÇERİĞİ (AÇIK DURUM) */}
                    {expandedSection === "flights" && (
                      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                        <div className="flex flex-wrap gap-2 mb-4 justify-end">
                          <button
                            type="button"
                            onClick={() => addFlight("departure")}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                          >
                            + Gidiş Uçuşu
                          </button>
                          <button
                            type="button"
                            onClick={() => addFlight("return")}
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                          >
                            + Dönüş Uçuşu
                          </button>
                        </div>

                        <div className="space-y-3">
                          {flights.map((flight, index) => (
                            <div
                              key={flight.id}
                              className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="inline-flex items-center px-3 py-1 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-semibold tracking-wider uppercase border border-emerald-100 dark:border-emerald-800">
                                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${flight.type === "departure" ? "bg-emerald-500" : "bg-blue-500"}`}></span>
                                  {flight.type === "departure" ? "GİDİŞ UÇUŞU" : "DÖNÜŞ UÇUŞU"} {index + 1}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => removeFlight(flight.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-900 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="flex flex-col lg:flex-row gap-2 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[2] lg:[&>*:nth-child(6)]:flex-[1.5] lg:[&>*:nth-child(7)]:flex-[1] lg:[&>*:nth-child(8)]:flex-[1.5]">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TARİH</label>
                                  <input type="date" value={flight.flightDate || ""} onChange={(e) => updateFlight(flight.id, "flightDate", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">HAVAYOLU</label>
                                  <input type="text" placeholder="THY" value={flight.airline || ""} onChange={(e) => updateFlight(flight.id, "airline", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">KALKIŞ / VARIŞ</label>
                                  <div className="flex gap-1 items-center">
                                    <input type="text" placeholder="IST" value={flight.departureAirport || ""} onChange={(e) => updateFlight(flight.id, "departureAirport", e.target.value)} className="w-full h-[36px] px-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                    <span className="text-gray-400 text-xs">-</span>
                                    <input type="text" placeholder="JFK" value={flight.arrivalAirport || ""} onChange={(e) => updateFlight(flight.id, "arrivalAirport", e.target.value)} className="w-full h-[36px] px-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">UÇUŞ NO</label>
                                  <input type="text" placeholder="TK100" value={flight.flightNo || ""} onChange={(e) => updateFlight(flight.id, "flightNo", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">KALKIŞ & VARIŞ SAATİ</label>
                                  <div className="flex gap-1 items-center">
                                    <input type="time" value={flight.departureTime || ""} onChange={(e) => updateFlight(flight.id, "departureTime", e.target.value)} className="w-full h-[36px] px-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                    <span className="text-gray-400 text-xs">-</span>
                                    <input type="time" value={flight.arrivalTime || ""} onChange={(e) => updateFlight(flight.id, "arrivalTime", e.target.value)} className="w-full h-[36px] px-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TEDARİKÇİ & PNR</label>
                                  <div className="flex gap-1 items-center">
                                    <div className="flex-1">
                                      <SearchableSelect options={suppliers.map((s) => ({ id: s.id, name: s.name }))} value={flight.ticketingProvider || ""} onChange={(val) => updateFlight(flight.id, "ticketingProvider", val)} placeholder="Seçiniz..." />
                                    </div>
                                    <input type="text" placeholder="PNR" value={flight.pnr || ""} onChange={(e) => updateFlight(flight.id, "pnr", e.target.value)} className="w-20 h-[36px] px-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">BİLET TARİHİ</label>
                                  <input type="date" value={flight.ticketingDate || ""} onChange={(e) => updateFlight(flight.id, "ticketingDate", e.target.value)} className="w-full h-[36px] px-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">SATIŞ</label>
                                  <div className="flex gap-1 items-center">
                                    <input type="text" placeholder="0.00" value={servicePriceInput[`flight_${flight.id}`] !== undefined ? servicePriceInput[`flight_${flight.id}`] : flight.price ? flight.price.toString().replace(".", ",") : ""} onChange={(e) => { const val = e.target.value; setServicePriceInput((prev) => ({ ...prev, [`flight_${flight.id}`]: val })); }} onBlur={(e) => { const parsed = parseAmount(servicePriceInput[`flight_${flight.id}`] ?? e.target.value); if (parsed !== null) { updateFlight(flight.id, "price", parsed); setServicePriceInput((prev) => ({ ...prev, [`flight_${flight.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                    <select value={flight.currency || "USD"} onChange={(e) => updateFlight(flight.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
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
    
    return before_flight + new_flight_block + after_flight


for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = refactor_flights(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied Flight formatting to {filepath}")

