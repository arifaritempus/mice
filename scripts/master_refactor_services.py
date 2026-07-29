import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_token = "{/* Accommodation Section */}"
    end_token = "{/* Summary */}"
    
    if start_token not in content or end_token not in content:
        continue
        
    before_part = content[:content.find(start_token)]
    after_part = content[content.find(end_token):]
    
    new_services_block = """{/* KONAKLAMA ACCORDION ROW */}
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "rooms" ? "border-2 border-blue-200 dark:border-blue-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'rooms' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'rooms' ? null : 'rooms')}>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-4 transition-colors ${expandedSection === 'rooms' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                      <span className="text-lg">🏨</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Konaklama ({rooms.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{rooms.length} oda eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {expandedSection !== 'rooms' && (
                        rooms.length > 0 ? rooms.map((r, i) => (
                          <div key={r.id} className="grid grid-cols-4 gap-4 items-center bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Otel / Oda Tipi</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {r.hotelId ? hotels.find((h) => h.id === r.hotelId)?.name : "Otel Seçilmedi"} - {r.roomType}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {r.checkIn ? new Date(r.checkIn).toLocaleDateString("tr-TR") : "--"} ➝ {r.checkOut ? new Date(r.checkOut).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{r.price ? (r.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {r.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz konaklama hizmeti eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 ml-4 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowAccommodation(false); setExpandedSection(null); }} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hizmeti Sil">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'rooms' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* KONAKLAMA İÇERİĞİ (AÇIK DURUM) */}
                  {expandedSection === "rooms" && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                      <div className="flex flex-wrap gap-2 mb-4 justify-end">
                        <button
                          type="button"
                          onClick={addRoom}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 shadow-sm active:scale-[0.98] transition-all duration-200"
                        >
                          + Yeni Oda Ekle
                        </button>
                      </div>

                      <div className="space-y-3">
                        {rooms.map((room, index) => (
                          <div
                            key={room.id}
                            className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="inline-flex items-center px-3 py-1 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-semibold tracking-wider uppercase border border-blue-100 dark:border-blue-800">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                ODA {index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeRoom(room.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-gray-900 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row gap-2 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1.5] lg:[&>*:nth-child(5)]:flex-[2] lg:[&>*:nth-child(6)]:flex-[1.5] lg:[&>*:nth-child(7)]:flex-[1.5]">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">OTEL</label>
                                <SearchableSelect options={hotels.map((h) => ({ id: h.id, name: h.name }))} value={room.hotelId || ""} onChange={(val) => updateRoom(room.id, "hotelId", val)} placeholder="Otel Seçiniz..." />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">ODA TİPİ</label>
                                <select value={room.roomType || ""} onChange={(e) => updateRoom(room.id, "roomType", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                  <option value="">Seçin</option>
                                  {hotelRoomTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">PAX (Y+Ç+B)</label>
                                <div className="flex gap-1 items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden shadow-sm h-[36px]">
                                  <input type="number" min="1" value={room.adultCount || 1} onChange={(e) => updateRoom(room.id, "adultCount", parseInt(e.target.value) || 1)} className="w-10 h-full text-center text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20" title="Yetişkin" />
                                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                  <input type="number" min="0" value={room.childCount || 0} onChange={(e) => updateRoom(room.id, "childCount", parseInt(e.target.value) || 0)} className="w-10 h-full text-center text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20" title="Çocuk" />
                                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                  <input type="number" min="0" value={room.infantCount || 0} onChange={(e) => updateRoom(room.id, "infantCount", parseInt(e.target.value) || 0)} className="w-10 h-full text-center text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20" title="Bebek" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">GİRİŞ / ÇIKIŞ (C-IN & C-OUT)</label>
                                <div className="flex gap-1 items-center">
                                  <input type="date" value={room.checkIn || ""} onChange={(e) => updateRoom(room.id, "checkIn", e.target.value)} className="w-full h-[36px] px-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" title="Check-in Tarihi" />
                                  <span className="text-gray-400 text-xs">-</span>
                                  <input type="date" value={room.checkOut || ""} onChange={(e) => updateRoom(room.id, "checkOut", e.target.value)} className="w-full h-[36px] px-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" title="Check-out Tarihi" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">MİSAFİR BİLGİSİ</label>
                                <input type="text" placeholder="Örn: John Doe" value={room.guestInfo || ""} onChange={(e) => updateRoom(room.id, "guestInfo", e.target.value)} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">TEDARİKÇİ</label>
                                <SearchableSelect options={suppliers.map(s => ({ id: s.id, name: s.name }))} value={room.supplierId || ""} onChange={(val) => updateRoom(room.id, "supplierId", val)} placeholder="Tedarikçi Seçiniz..." />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex gap-1 items-center">
                                  <input type="text" placeholder="0.00" value={roomPriceInput[room.id] !== undefined ? roomPriceInput[room.id] : room.price ? room.price.toString().replace(".", ",") : ""} onChange={(e) => { const val = e.target.value; setRoomPriceInput((prev) => ({ ...prev, [room.id]: val })); }} onBlur={(e) => { const parsed = parseAmount(roomPriceInput[room.id] ?? e.target.value); if (parsed !== null) { updateRoom(room.id, "price", parsed); setRoomPriceInput((prev) => ({ ...prev, [room.id]: formatAmount(parsed) })); } }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const parsed = parseTrAmount((e.target as HTMLInputElement).value); if(parsed !== null) { updateRoom(room.id, "price", parsed); setRoomPriceInput((prev) => ({ ...prev, [room.id]: formatAmount(parsed) })); } } }} className="flex-1 h-[36px] px-2 text-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                                  <select value={room.currency || "USD"} onChange={(e) => updateRoom(room.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
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

                {/* UÇUŞLAR ACCORDION ROW */}
                {showFlight && (
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "flights" ? "border-2 border-emerald-200 dark:border-emerald-800" : "border border-gray-200 dark:border-gray-800"}`}>
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

                {/* TRANSFER ACCORDION ROW */}
                {showTransfer && (
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "transfers" ? "border-2 border-purple-200 dark:border-purple-800" : "border border-gray-200 dark:border-gray-800"}`}>
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

                {/* EKSTRA HİZMETLER ACCORDION ROW */}
                {showExtraServices && (
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "extras" ? "border-2 border-orange-200 dark:border-orange-800" : "border border-gray-200 dark:border-gray-800"}`}>
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
    
    content = before_part + new_services_block + after_part
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied master service refactor.")
