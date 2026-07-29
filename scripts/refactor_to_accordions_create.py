import re
filepath = "frontend/src/app/sejour/create/page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the top 2-column layout with the Sejour Bilgileri Card
top_pattern = r'<div className="grid grid-cols-1 lg:grid-cols-3 gap-2 responsive-filter-grid">.*?\{/\* Accommodation Section \*/\}'

sejour_form = """<div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">
                              Voucher Numarası *
                            </label>
                            <input
                              type="text"
                              name="voucherNumber"
                              value={salesData.voucherNumber}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1.5 bg-v3-surface border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              placeholder="VOU-2024-001"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">
                              Müşteri Tipi *
                            </label>
                            <div className="flex p-1.5 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() =>
                                  handleInputChange({
                                    target: {
                                      name: "customerType",
                                      value: "agency",
                                    },
                                  } as any)
                                }
                                className={`flex-1 py-3 px-4 rounded text-xs font-black tracking-widest transition-all duration-300 ${
                                  salesData.customerType === "agency"
                                    ? "bg-v3-surface text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700"
                                    : "text-v3-muted hover:text-gray-600 dark:hover:text-v3-muted"
                                }`}
                              >
                                ACENTE
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleInputChange({
                                    target: {
                                      name: "customerType",
                                      value: "individual",
                                    },
                                  } as any)
                                }
                                className={`flex-1 py-3 px-4 rounded text-xs font-black tracking-widest transition-all duration-300 ${
                                  salesData.customerType === "individual"
                                    ? "bg-v3-surface text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700"
                                    : "text-v3-muted hover:text-gray-600 dark:hover:text-v3-muted"
                                }`}
                              >
                                ŞAHIS
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            {salesData.customerType === "agency" ? (
                              <>
                                <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">
                                  Acente Seçimi *
                                </label>
                                <SearchableSelect
                                  options={agencies}
                                  value={salesData.agencyId}
                                  onChange={(id) =>
                                    handleInputChange({
                                      target: { name: "agencyId", value: id },
                                    } as any)
                                  }
                                  placeholder="Acente ara..."
                                  className="w-full"
                                />
                              </>
                            ) : (
                              <>
                                <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">
                                  Müşteri Adı Soyadı *
                                </label>
                                <input
                                  type="text"
                                  name="customerName"
                                  value={salesData.customerName}
                                  onChange={handleInputChange}
                                  className="w-full px-2 py-1.5 bg-v3-surface border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  placeholder="Örn: Ahmet Yılmaz"
                                />
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 responsive-filter-grid">
                            <div>
                              <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">
                                Giriş Tarihi *
                              </label>
                              <input
                                type="date"
                                name="checkInDate"
                                value={salesData.checkInDate}
                                onChange={handleInputChange}
                                className="w-full px-2 py-1.5 bg-v3-surface border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 ml-1">
                                Çıkış Tarihi *
                              </label>
                              <input
                                type="date"
                                name="checkOutDate"
                                value={salesData.checkOutDate}
                                onChange={handleInputChange}
                                className="w-full px-2 py-1.5 bg-v3-surface border-2 border-gray-100 dark:border-gray-700 rounded text-xs text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 ml-1">
                          Rezervasyon Durumu
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {["BEKLEMEDE", "KONFIRME", "İPTAL"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                handleInputChange({
                                  target: { name: "status", value: status },
                                } as any)
                              }
                              className={`px-8 py-3 rounded-lg text-[10px] font-black tracking-widest transition-all duration-300 ${
                                salesData.status === status
                                  ? status === "BEKLEMEDE"
                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-2 border-amber-200 dark:border-amber-800"
                                    : status === "KONFIRME"
                                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border-2 border-emerald-200 dark:border-emerald-800"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-600 border-2 border-red-200 dark:border-red-800"
                                  : "bg-v3-surface text-v3-muted border-2 border-gray-100 dark:border-gray-700 grayscale"
                              }`}
                            >
                              {status === "BEKLEMEDE"
                                ? "⏳ BEKLEMEDE"
                                : status === "KONFIRME"
                                  ? "✅ KONFİRME"
                                  : "❌ İPTAL"}
                            </button>
                          ))}
                        </div>
                      </div>"""

new_top = """{/* Mockup Sejour Bilgileri */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-[#1e293b] dark:text-white">Sejour Bilgileri</h3>
                    <button type="button" onClick={() => setIsEditingInfo(!isEditingInfo)} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                      ✏️ Detayları Düzenle
                    </button>
                  </div>
                  {!isEditingInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Voucher No</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{salesData.voucherNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Müşteri Tipi</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{salesData.customerType === 'agency' ? 'ACENTE' : 'ŞAHIS'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Müşteri Adı</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{salesData.customerType === 'agency' ? (agencies.find(a => a.id === salesData.agencyId)?.name || '-') : salesData.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Giriş - Çıkış Tarihi</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{salesData.checkInDate ? new Date(salesData.checkInDate).toLocaleDateString("tr-TR") : '--'} - {salesData.checkOutDate ? new Date(salesData.checkOutDate).toLocaleDateString("tr-TR") : '--'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Rezervasyon Durumu</p>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[9px] font-bold">{salesData.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      """ + sejour_form + """
                    </div>
                  )}
                </div>

                {/* Hizmetler Header */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-base font-black text-[#1e293b] dark:text-white mb-1">Hizmetler</h3>
                    <p className="text-xs text-gray-500">Sejour için eklenen hizmetleri aşağıda yönetebilirsiniz.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowAccommodation(true); setExpandedSection("rooms"); }} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                      + Konaklama Ekle
                    </button>
                    <button type="button" onClick={() => { setShowFlight(true); setExpandedSection("flights"); }} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-all shadow-sm">
                      + Uçuş Ekle
                    </button>
                    <button type="button" onClick={() => { setShowTransfer(true); setExpandedSection("transfers"); }} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-purple-600 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-all shadow-sm">
                      + Transfer Ekle
                    </button>
                    <button type="button" onClick={() => { setShowExtraServices(true); setExpandedSection("extras"); }} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-orange-600 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-all shadow-sm">
                      + Ekstra Hizmet Ekle
                    </button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                
                {/* Accommodation Section */}"""

content = re.sub(top_pattern, new_top, content, flags=re.DOTALL)

# Wrap Rooms
content = re.sub(
    r'\{showAccommodation && \(\s*<div className="bg-v3-surface border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500">',
    """{/* KONAKLAMA ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'rooms' ? null : 'rooms')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Konaklama ({rooms.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{rooms.length} oda</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      {rooms.length > 0 ? rooms.map((r, i) => (
                        <div key={r.id} className="grid grid-cols-4 gap-4 items-center bg-gray-50 dark:bg-gray-800/30 p-2 rounded-lg">
                          <div className="col-span-2">
                            <p className="text-[9px] text-gray-500 mb-0.5">Oda {i + 1} | Otel / Tip / Tarih</p>
                            <p className="text-[11px] font-bold text-[#1e293b] dark:text-gray-300 truncate">
                              {r.hotelId ? hotels.find((h) => h.id === r.hotelId)?.name : "Otel Seçilmedi"} - {r.accommodationType} {r.roomType}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Satış Tutarı</p>
                            <p className="text-[11px] font-black text-[#1e293b] dark:text-gray-300">{r.price ? (r.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {r.currency}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-500 italic">Henüz oda eklenmedi</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowAccommodation(false); setExpandedSection(null); }} className="p-1 hover:text-red-500 transition-colors" title="Bölümü Kapat">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  {showAccommodation && (
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "rooms" ? "block" : "hidden"}`}>""",
    content
)

# Wrap Flights
content = re.sub(
    r'\{showFlight && \(\s*<div className="bg-v3-surface border-2 border-emerald-100 dark:border-emerald-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500">',
    """{/* FLIGHTS ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'flights' ? null : 'flights')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <span className="text-xl">✈️</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Uçuş ({flights.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{flights.length} kayıt</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                       <p className="text-xs text-gray-500 italic">Genişletmek için tıklayın...</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowFlight(false); setExpandedSection(null); }} className="p-1 hover:text-red-500 transition-colors" title="Bölümü Kapat">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'flights' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  {showFlight && (
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "flights" ? "block" : "hidden"}`}>""",
    content
)

# Wrap Transfers
content = re.sub(
    r'\{showTransfer && \(\s*<div className="bg-v3-surface border-2 border-purple-100 dark:border-purple-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500">',
    """{/* TRANSFERS ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'transfers' ? null : 'transfers')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <span className="text-xl">🚗</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Transfer ({transfers.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{transfers.length} kayıt</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                       <p className="text-xs text-gray-500 italic">Genişletmek için tıklayın...</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowTransfer(false); setExpandedSection(null); }} className="p-1 hover:text-red-500 transition-colors" title="Bölümü Kapat">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'transfers' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  {showTransfer && (
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "transfers" ? "block" : "hidden"}`}>""",
    content
)

# Wrap Extras
content = re.sub(
    r'\{showExtraServices && \(\s*<div className="bg-v3-surface border-2 border-orange-100 dark:border-orange-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500">',
    """{/* EXTRAS ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'extras' ? null : 'extras')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <span className="text-xl">✨</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Ekstra Hizmet ({extraServices.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{extraServices.length} kayıt</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                       <p className="text-xs text-gray-500 italic">Genişletmek için tıklayın...</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowExtraServices(false); setExpandedSection(null); }} className="p-1 hover:text-red-500 transition-colors" title="Bölümü Kapat">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'extras' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  {showExtraServices && (
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "extras" ? "block" : "hidden"}`}>""",
    content
)

# Add closing div for Hizmetler container, right before {/* Purchase Tab */}
content = content.replace('{/* Purchase Tab */}', '</div>\n                {/* Purchase Tab */}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done refactoring create page")
