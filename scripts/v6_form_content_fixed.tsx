        <form onSubmit={handleSubmit} className="relative pb-32">
          
          {/* Main Navigation Tabs */}
          <div className="relative mb-6">
            <div className="flex p-1.5 space-x-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-w-lg mx-auto">
              <button type="button" onClick={() => setActiveTab('sales')} className={`flex items-center justify-center flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${activeTab === 'sales' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>SATIŞ BİLGİLERİ</button>
              <button type="button" onClick={() => setActiveTab('purchase')} className={`flex items-center justify-center flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${activeTab === 'purchase' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>ALIŞ (MALİYET)</button>
              <button type="button" onClick={() => setActiveTab('collection')} className={`flex items-center justify-center flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${activeTab === 'collection' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>TAHSİLAT</button>
            </div>
          </div>

          {/* SATIŞ BİLGİLERİ TABI */}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* SEJOUR BİLGİLERİ (HEADER) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sejour Bilgileri</h2>
                      <p className="text-[10px] text-gray-500 font-medium">Voucher detayları ve genel rezervasyon bilgileri</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingInfo(!isEditingInfo)}
                    className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    {isEditingInfo ? "Detayları Gizle" : "Detayları Düzenle"}
                  </button>
                </div>

                {!isEditingInfo ? (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Voucher No</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{salesData.voucherNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Acente</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {salesData.agencyId ? agencies.find(a => a.id === salesData.agencyId)?.name : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Giriş - Çıkış</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {salesData.checkInDate ? new Date(salesData.checkInDate).toLocaleDateString("tr-TR") : "-"} - {salesData.checkOutDate ? new Date(salesData.checkOutDate).toLocaleDateString("tr-TR") : "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">İç Notlar</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{salesData.notes || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Durum</p>
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                        salesData.status === "BEKLEMEDE" ? "bg-amber-100 text-amber-700" :
                        salesData.status === "KONFIRME" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {salesData.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1] lg:[&>*:nth-child(6)]:flex-[1] lg:[&>*:nth-child(7)]:flex-[1.5]">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Voucher No *</label>
                        <input type="text" name="voucherNumber" value={salesData.voucherNumber} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Müşteri Tipi *</label>
                        <select name="customerType" value={salesData.customerType || "agency"} onChange={(e) => setSalesData(prev => ({...prev, customerType: e.target.value, agencyId: "", customerName: ""}))} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                          <option value="agency">Acente</option>
                          <option value="individual">Şahıs</option>
                        </select>
                      </div>
                      {salesData.customerType === "agency" ? (
                        <div className="relative z-[100]">
                          <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Acente Seçimi *</label>
                          <div className="h-[36px]">
                            <SearchableSelect options={agencies.map(a => ({id: a.id, name: a.name}))} value={salesData.agencyId} onChange={(val) => setSalesData(prev => ({...prev, agencyId: val}))} placeholder="Acente ara..." />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Şahıs (Ad Soyad) *</label>
                          <input type="text" name="customerName" value={salesData.customerName || ""} onChange={handleInputChange} placeholder="İsim Soyisim..." className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Giriş Tarihi *</label>
                        <input type="date" name="checkInDate" value={salesData.checkInDate} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Çıkış Tarihi *</label>
                        <input type="date" name="checkOutDate" value={salesData.checkOutDate} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Durum</label>
                        <select name="status" value={salesData.status} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                          <option value="BEKLEMEDE">⏳ BEKLEMEDE</option>
                          <option value="KONFIRME">✅ KONFİRME</option>
                          <option value="İPTAL">❌ İPTAL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">İç Notlar</label>
                        <input type="text" name="notes" placeholder="Eklemek istediğiniz notlar..." value={salesData.notes} onChange={handleInputChange} className="w-full h-[36px] px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HİZMETLER BÖLÜMÜ BAŞLIĞI */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Satış Hizmetleri</h2>
                  <p className="text-xs text-gray-500">Sejour için eklenen hizmetlerin satış bedellerini ve detaylarını aşağıda yönetebilirsiniz.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowAccommodation(true); setExpandedSection("rooms"); }} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">+ Konaklama</button>
                  <button type="button" onClick={() => { setShowFlight(true); setExpandedSection("flights"); }} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">+ Uçuş</button>
                  <button type="button" onClick={() => { setShowTransfer(true); setExpandedSection("transfers"); }} className="px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">+ Transfer</button>
                  <button type="button" onClick={() => { setShowExtraServices(true); setExpandedSection("extras"); }} className="px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">+ Ekstra</button>
                </div>
              </div>

              {/* KONAKLAMA ACCORDION ROW */}
              {showAccommodation && (
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "rooms" ? "border border-blue-200 dark:border-blue-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'rooms' ? 'bg-blue-50/30 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'rooms' ? null : 'rooms')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                      <span className="text-lg">🏨</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Konaklama ({rooms.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{rooms.reduce((acc, r) => acc + (r.adultCount||0) + (r.childCount||0) + (r.infantCount||0), 0)} kişi • {rooms.length} oda</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {expandedSection !== 'rooms' && (
                        rooms.length > 0 ? rooms.map((r, i) => (
                          <div key={r.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Otel</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {r.hotelId ? hotels.find((h) => h.id === r.hotelId)?.name : "Otel Seçilmedi"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Oda Tipi</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{r.roomType || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Giriş / Çıkış</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {r.checkIn ? new Date(r.checkIn).toLocaleDateString("tr-TR") : "--"} - {r.checkOut ? new Date(r.checkOut).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{r.price ? (r.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {r.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz oda eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'rooms' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowAccommodation(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* KONAKLAMA İÇERİĞİ (AÇIK DURUM) */}
                  {expandedSection === "rooms" && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4">
                        <button type="button" onClick={addRoom} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          <span className="text-lg leading-none">+</span> Oda Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {rooms.map((room, index) => (
                          <div key={room.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            <button type="button" onClick={() => removeRoom(room.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Odayı Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.5] lg:[&>*:nth-child(6)]:flex-[1.5] lg:[&>*:nth-child(7)]:flex-[1.2]">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">OTEL</label>
                                <SearchableSelect options={hotels.map((h) => ({ id: h.id, name: h.name }))} value={room.hotelId || ""} onChange={(val) => updateRoom(room.id, "hotelId", val)} placeholder="Otel Seçiniz..." />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ODA TİPİ</label>
                                <select value={room.roomType || ""} onChange={(e) => updateRoom(room.id, "roomType", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-blue-500 outline-none">
                                  <option value="">Seçin</option>
                                  {roomTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KONAK. TİPİ</label>
                                <select value={room.accommodationType || ""} onChange={(e) => updateRoom(room.id, "accommodationType", e.target.value)} className="w-full h-[36px] px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-blue-500 outline-none">
                                  <option value="">Seçin</option>
                                  <option value="SNG">SNG</option>
                                  <option value="DBL">DBL</option>
                                  <option value="TRP">TRP</option>
                                  <option value="QUAD">QUAD</option>
                                  <option value="CHLD">CHLD</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PAX (Y|Ç|B)</label>
                                <div className="flex gap-0 items-center border border-gray-200 rounded-md overflow-hidden h-[36px]">
                                  <input type="number" min="1" value={room.adultCount || 1} onChange={(e) => updateRoom(room.id, "adultCount", parseInt(e.target.value) || 1)} className="w-1/3 h-full text-center text-[11px] font-semibold outline-none focus:bg-blue-50" title="Yetişkin" />
                                  <div className="w-px h-4 bg-gray-200"></div>
                                  <input type="number" min="0" value={room.childCount || 0} onChange={(e) => updateRoom(room.id, "childCount", parseInt(e.target.value) || 0)} className="w-1/3 h-full text-center text-[11px] font-semibold outline-none focus:bg-blue-50" title="Çocuk" />
                                  <div className="w-px h-4 bg-gray-200"></div>
                                  <input type="number" min="0" value={room.infantCount || 0} onChange={(e) => updateRoom(room.id, "infantCount", parseInt(e.target.value) || 0)} className="w-1/3 h-full text-center text-[11px] font-semibold outline-none focus:bg-blue-50" title="Bebek" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">C-IN & C-OUT</label>
                                <div className="flex items-center gap-1">
                                  <input type="date" value={room.checkIn || ""} onChange={(e) => updateRoom(room.id, "checkIn", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" />
                                  <span className="text-gray-400">-</span>
                                  <input type="date" value={room.checkOut || ""} onChange={(e) => updateRoom(room.id, "checkOut", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">MİSAFİR</label>
                                <input type="text" placeholder="İsim Soyisim" value={room.guestInfo || ""} onChange={(e) => updateRoom(room.id, "guestInfo", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" value={roomPriceInput[room.id] !== undefined ? roomPriceInput[room.id] : room.price ? room.price.toString().replace(".", ",") : ""} onChange={(e) => setRoomPriceInput((prev) => ({ ...prev, [room.id]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateRoom(room.id, "price", parsed); setRoomPriceInput((prev) => ({ ...prev, [room.id]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-blue-600 outline-none focus:border-blue-500 bg-blue-50/30" />
                                  <select value={room.currency || "TRY"} onChange={(e) => updateRoom(room.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
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

              {/* UÇUŞ ACCORDION ROW */}
              {showFlight && (
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "flights" ? "border border-emerald-200 dark:border-emerald-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'flights' ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'flights' ? null : 'flights')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                      <span className="text-lg">✈️</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Uçuşlar ({flights.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{flights.length} uçuş eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {expandedSection !== 'flights' && (
                        flights.length > 0 ? flights.map((f, i) => (
                          <div key={f.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Gidiş - Dönüş</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {f.departureAirport} ➝ {f.arrivalAirport}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Havayolu</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{f.airline || "-"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {f.flightDate ? new Date(f.flightDate).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{f.price ? (f.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {f.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz uçuş eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'flights' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'flights' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowFlight(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedSection === "flights" && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4 gap-2">
                        <button type="button" onClick={() => addFlight("departure")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Gidiş Ekle
                        </button>
                        <button type="button" onClick={() => addFlight("return")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Dönüş Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {flights.map((flight, index) => (
                          <div key={flight.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            <button type="button" onClick={() => removeFlight(flight.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Uçuşu Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                            <span className="absolute top-2 left-4 text-[9px] font-bold text-gray-400">{flight.type === 'departure' ? 'GİDİŞ' : 'DÖNÜŞ'} UÇUŞU {index + 1}</span>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.2] lg:[&>*:nth-child(6)]:flex-[1] lg:[&>*:nth-child(7)]:flex-[1] lg:[&>*:nth-child(8)]:flex-[1.2] mt-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                                <input type="date" value={flight.flightDate || ""} onChange={(e) => updateFlight(flight.id, "flightDate", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">HAVAYOLU</label>
                                <input type="text" placeholder="THY" value={flight.airline || ""} onChange={(e) => updateFlight(flight.id, "airline", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KALKIŞ / VARIŞ (HVL)</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="IST" value={flight.departureAirport || ""} onChange={(e) => updateFlight(flight.id, "departureAirport", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                  <span className="text-gray-400">-</span>
                                  <input type="text" placeholder="JFK" value={flight.arrivalAirport || ""} onChange={(e) => updateFlight(flight.id, "arrivalAirport", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">UÇUŞ NO</label>
                                <input type="text" placeholder="TK100" value={flight.flightNo || ""} onChange={(e) => updateFlight(flight.id, "flightNo", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">KALKIŞ / VARIŞ SAAT</label>
                                <div className="flex items-center gap-1">
                                  <input type="time" value={flight.departureTime || ""} onChange={(e) => updateFlight(flight.id, "departureTime", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                  <span className="text-gray-400">-</span>
                                  <input type="time" value={flight.arrivalTime || ""} onChange={(e) => updateFlight(flight.id, "arrivalTime", e.target.value)} className="w-full h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                                </div>
                              </div>
                                                            <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PNR</label>
                                <input type="text" placeholder="PNR" value={flight.pnr || ""} onChange={(e) => updateFlight(flight.id, "pnr", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">BİLET TARİHİ</label>
                                <input type="date" value={flight.ticketingDate || ""} onChange={(e) => updateFlight(flight.id, "ticketingDate", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-emerald-500" />
                              </div>
<div>
                                <label className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" value={servicePriceInput[`flight_${flight.id}`] !== undefined ? servicePriceInput[`flight_${flight.id}`] : flight.price ? flight.price.toString().replace(".", ",") : ""} onChange={(e) => setServicePriceInput((prev) => ({ ...prev, [`flight_${flight.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateFlight(flight.id, "price", parsed); setServicePriceInput((prev) => ({ ...prev, [`flight_${flight.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-emerald-600 outline-none focus:border-emerald-500 bg-emerald-50/30" />
                                  <select value={flight.currency || "TRY"} onChange={(e) => updateFlight(flight.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
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
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "transfers" ? "border border-purple-200 dark:border-purple-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'transfers' ? 'bg-purple-50/30 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'transfers' ? null : 'transfers')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                      <span className="text-lg">🚗</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Transferler ({transfers.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{transfers.length} transfer eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {expandedSection !== 'transfers' && (
                        transfers.length > 0 ? transfers.map((t, i) => (
                          <div key={t.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tip & Yön</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {t.type === 'private' ? 'Özel' : 'Ekonomik'} - {t.direction === 'arrival' ? 'Geliş' : t.direction === 'return' ? 'Dönüş' : 'Ara'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "--"} {t.time || ""}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Araç</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{t.vehicle || "-"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{t.price ? (t.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {t.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz transfer eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'transfers' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'transfers' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowTransfer(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedSection === "transfers" && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4 gap-2">
                        <button type="button" onClick={() => addTransfer("arrival")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Geliş Ekle
                        </button>
                        <button type="button" onClick={() => addTransfer("return")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Dönüş Ekle
                        </button>
                        <button type="button" onClick={() => addTransfer("intermediate")} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          + Ara Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {transfers.map((transfer, index) => (
                          <div key={transfer.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            <button type="button" onClick={() => removeTransfer(transfer.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Transferi Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                            <span className="absolute top-2 left-4 text-[9px] font-bold text-gray-400">{transfer.direction === 'arrival' ? 'GELİŞ' : transfer.direction === 'return' ? 'DÖNÜŞ' : 'ARA'} TRANSFER {index + 1}</span>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5] lg:[&>*:nth-child(4)]:flex-[1] lg:[&>*:nth-child(5)]:flex-[1.2] mt-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH & SAAT</label>
                                <div className="flex items-center gap-1">
                                  <input type="date" value={transfer.date || ""} onChange={(e) => updateTransfer(transfer.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />
                                  <input type="time" value={transfer.time || ""} onChange={(e) => updateTransfer(transfer.id, "time", e.target.value)} className="w-20 h-[36px] px-1 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TİP</label>
                                <select value={transfer.type || ""} onChange={(e) => updateTransfer(transfer.id, "type", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-purple-500 outline-none">
                                  <option value="private">Özel</option><option value="economic">Ekonomik</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ARAÇ</label>
                                <select value={transfer.vehicle || ""} onChange={(e) => updateTransfer(transfer.id, "vehicle", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-purple-500 outline-none">
                                  <option value="">Seçin</option>
                                  {vehicleTypes.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">GÜZERGAH NOTU</label>
                                <input type="text" value={transfer.routeDescription || ""} onChange={(e) => updateTransfer(transfer.id, "routeDescription", e.target.value)} placeholder="Örn: Otel - Havalimanı" className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-purple-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-purple-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" value={servicePriceInput[`transfer_${transfer.id}`] !== undefined ? servicePriceInput[`transfer_${transfer.id}`] : transfer.price ? transfer.price.toString().replace(".", ",") : ""} onChange={(e) => setServicePriceInput((prev) => ({ ...prev, [`transfer_${transfer.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateTransfer(transfer.id, "price", parsed); setServicePriceInput((prev) => ({ ...prev, [`transfer_${transfer.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-purple-600 outline-none focus:border-purple-500 bg-purple-50/30" />
                                  <select value={transfer.currency || "TRY"} onChange={(e) => updateTransfer(transfer.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
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
                <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "extras" ? "border border-orange-200 dark:border-orange-800" : "border border-gray-200 dark:border-gray-800"}`}>
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'extras' ? 'bg-orange-50/30 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'extras' ? null : 'extras')}>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl mr-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600">
                      <span className="text-lg">✨</span>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Ekstra Hizmetler ({extraServices.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{extraServices.length} hizmet eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {expandedSection !== 'extras' && (
                        extraServices.length > 0 ? extraServices.map((e, i) => (
                          <div key={e.id} className="grid grid-cols-5 gap-4 items-center px-2 py-1">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Hizmet Tipi</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {e.serviceType ? supplierServiceTypes.find(t => t.id === e.serviceType)?.name : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Tarih</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                {e.date ? new Date(e.date).toLocaleDateString("tr-TR") : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Açıklama</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{e.description || "-"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase font-semibold">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{e.price ? (e.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {e.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz ekstra hizmet eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 ml-4 shrink-0">
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'extras' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'extras' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                      <div className="relative group/menu">
                        <button type="button" onClick={(ev) => ev.stopPropagation()} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2m0-6a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2z" /></svg>
                        </button>
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                          <button type="button" onClick={() => setShowExtraServices(false)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg">Komple Sil</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedSection === "extras" && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 p-4">
                      <div className="flex justify-end mb-4">
                        <button type="button" onClick={addExtraService} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center gap-1">
                          <span className="text-lg leading-none">+</span> Hizmet Ekle
                        </button>
                      </div>
                      <div className="space-y-4">
                        {extraServices.map((service, index) => (
                          <div key={service.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 relative">
                            <button type="button" onClick={() => removeExtraService(service.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Hizmeti Sil">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                            <span className="absolute top-2 left-4 text-[9px] font-bold text-gray-400">EKSTRA HİZMET {index + 1}</span>
                            <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[1] lg:[&>*:nth-child(2)]:flex-[1.5] lg:[&>*:nth-child(3)]:flex-[2] lg:[&>*:nth-child(4)]:flex-[1.2] mt-4">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                                <input type="date" value={service.date || ""} onChange={(e) => updateExtraService(service.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-orange-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">HİZMET TİPİ</label>
                                <select value={service.serviceType || ""} onChange={(e) => updateExtraService(service.id, "serviceType", e.target.value)} className="w-full h-[36px] px-3 bg-white border border-gray-200 rounded-md text-[11px] font-medium focus:border-orange-500 outline-none">
                                  <option value="">Seçin</option>
                                  {supplierServiceTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">AÇIKLAMA</label>
                                <input type="text" placeholder="Örn: Rehberlik" value={service.description || ""} onChange={(e) => updateExtraService(service.id, "description", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none focus:border-orange-500" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="flex items-center gap-1">
                                  <input type="text" placeholder="0,00" value={servicePriceInput[`extra_${service.id}`] !== undefined ? servicePriceInput[`extra_${service.id}`] : service.price ? service.price.toString().replace(".", ",") : ""} onChange={(e) => setServicePriceInput((prev) => ({ ...prev, [`extra_${service.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateExtraService(service.id, "price", parsed); setServicePriceInput((prev) => ({ ...prev, [`extra_${service.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-orange-600 outline-none focus:border-orange-500 bg-orange-50/30" />
                                  <select value={service.currency || "TRY"} onChange={(e) => updateExtraService(service.id, "currency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                    <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
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
            </div>
          )}

          {/* ALIŞ (MALİYET) BİLGİLERİ TABI */}
          {activeTab === 'purchase' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Alış (Maliyet) Detayları</h2>
                  <p className="text-xs text-gray-500">Sejour için eklenen hizmetlerin tedarikçi ve maliyet bilgilerini aşağıda yönetebilirsiniz.</p>
                </div>
              </div>

              {/* KONAKLAMA MALİYETLERİ */}
              {showAccommodation && rooms.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"><span className="text-sm">🏨</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Konaklama Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {rooms.map((room, index) => (
                      <div key={room.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">ODA {index + 1} - {room.hotelId ? hotels.find(h => h.id === room.hotelId)?.name : "Otel Yok"}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={room.supplierId || ""} onChange={(val) => updateRoom(room.id, "supplierId", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                                                        <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                                  {room.price ? room.price.toLocaleString("tr-TR") : "0"} {room.currency || "TRY"}
                                </div>
                              </div>
<div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" value={roomCostInput?.[room.id] !== undefined ? roomCostInput[room.id] : room.costPrice ? room.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setRoomCostInput((prev) => ({ ...prev, [room.id]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateRoom(room.id, "costPrice", parsed); setRoomCostInput((prev) => ({ ...prev, [room.id]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500" />
                              <select value={room.costCurrency || "TRY"} onChange={(e) => updateRoom(room.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UÇUŞ MALİYETLERİ */}
              {showFlight && flights.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg"><span className="text-sm">✈️</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Uçuş Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {flights.map((flight, index) => (
                      <div key={flight.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">{flight.type === 'departure' ? 'GİDİŞ' : 'DÖNÜŞ'} UÇUŞU {index + 1} - {flight.departureAirport} ➝ {flight.arrivalAirport}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ (TICKETING)</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={flight.ticketingProvider || ""} onChange={(val) => updateFlight(flight.id, "ticketingProvider", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                          
                                                        <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                                  {flight.price ? flight.price.toLocaleString("tr-TR") : "0"} {flight.currency || "TRY"}
                                </div>
                              </div>
<div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" value={serviceCostInput?.[`flight_${flight.id}`] !== undefined ? serviceCostInput[`flight_${flight.id}`] : flight.costPrice ? flight.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setServiceCostInput((prev) => ({ ...prev, [`flight_${flight.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateFlight(flight.id, "costPrice", parsed); setServiceCostInput((prev) => ({ ...prev, [`flight_${flight.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500" />
                              <select value={flight.costCurrency || "TRY"} onChange={(e) => updateFlight(flight.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSFER MALİYETLERİ */}
              {showTransfer && transfers.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg"><span className="text-sm">🚗</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Transfer Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {transfers.map((transfer, index) => (
                      <div key={transfer.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">{transfer.direction === 'arrival' ? 'GELİŞ' : transfer.direction === 'return' ? 'DÖNÜŞ' : 'ARA'} TRANSFER {index + 1}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={transfer.provider || ""} onChange={(val) => updateTransfer(transfer.id, "provider", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                                                        <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                                  {transfer.price ? transfer.price.toLocaleString("tr-TR") : "0"} {transfer.currency || "TRY"}
                                </div>
                              </div>
<div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" value={serviceCostInput?.[`transfer_${transfer.id}`] !== undefined ? serviceCostInput[`transfer_${transfer.id}`] : transfer.costPrice ? transfer.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setServiceCostInput((prev) => ({ ...prev, [`transfer_${transfer.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateTransfer(transfer.id, "costPrice", parsed); setServiceCostInput((prev) => ({ ...prev, [`transfer_${transfer.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500" />
                              <select value={transfer.costCurrency || "TRY"} onChange={(e) => updateTransfer(transfer.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EKSTRA HİZMET MALİYETLERİ */}
              {showExtraServices && extraServices.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-lg"><span className="text-sm">✨</span></div>
                    <h3 className="text-sm font-bold text-gray-900">Ekstra Hizmet Maliyetleri</h3>
                  </div>
                  <div className="space-y-4">
                    {extraServices.map((service, index) => (
                      <div key={service.id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                        <span className="block text-[9px] font-bold text-gray-400 mb-2">EKSTRA HİZMET {index + 1}</span>
                        <div className="flex flex-col lg:flex-row gap-3 items-end w-full lg:[&>*:nth-child(1)]:flex-[2] lg:[&>*:nth-child(2)]:flex-[1] lg:[&>*:nth-child(3)]:flex-[1.5]">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TEDARİKÇİ</label>
                            <SearchableSelect options={[...suppliers.map(s => ({id: s.id, name: s.name})), ...hotels.map(h => ({id: h.id, name: h.name}))].sort((a, b) => a.name.localeCompare(b.name))} value={service.provider || ""} onChange={(val) => updateExtraService(service.id, "provider", val)} placeholder="Tedarikçi Seçiniz..." />
                          </div>
                                                        <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SATIŞ TUTARI</label>
                                <div className="h-[36px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-600">
                                  {service.price ? service.price.toLocaleString("tr-TR") : "0"} {service.currency || "TRY"}
                                </div>
                              </div>
<div>
                            <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ALIŞ (MALİYET) TUTARI</label>
                            <div className="flex items-center gap-1">
                              <input type="text" placeholder="0,00" value={serviceCostInput?.[`extra_${service.id}`] !== undefined ? serviceCostInput[`extra_${service.id}`] : service.costPrice ? service.costPrice.toString().replace(".", ",") : ""} onChange={(e) => setServiceCostInput((prev) => ({ ...prev, [`extra_${service.id}`]: e.target.value }))} onBlur={(e) => { const parsed = parseAmount(e.target.value); if (parsed !== null) { updateExtraService(service.id, "costPrice", parsed); setServiceCostInput((prev) => ({ ...prev, [`extra_${service.id}`]: formatAmount(parsed) })); } }} className="flex-1 h-[36px] px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 outline-none focus:border-gray-500" />
                              <select value={service.costCurrency || "TRY"} onChange={(e) => updateExtraService(service.id, "costCurrency", e.target.value)} className="w-[60px] h-[36px] px-1 bg-white border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                                <option value="TRY">TRY</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAHSİLAT TABI */}
          {activeTab === 'collection' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tahsilat Bilgileri</h2>
                  <p className="text-xs text-gray-500">Sejour tahsilatlarını buradan ekleyebilir ve yönetebilirsiniz.</p>
                </div>
                <button type="button" onClick={addCollection} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  <span className="text-lg leading-none">+</span> Tahsilat Ekle
                </button>
              </div>

              {collections.length > 0 ? (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
                      <button type="button" onClick={() => removeCollection(collection.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors" title="Tahsilatı Sil">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                                            <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TARİH</label>
                        <input type="date" value={collection.date || ""} onChange={(e) => updateCollection(collection.id, "date", e.target.value)} className="w-full h-[36px] px-2 border border-gray-200 rounded-md text-[11px] font-medium outline-none" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">YÖNTEM</label>
                        <select value={collection.type || "cash"} onChange={(e) => updateCollection(collection.id, "type", e.target.value)} className="w-full h-[36px] px-3 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                          <option value="cash">Nakit</option>
                          <option value="bank">Havale / EFT</option>
                          <option value="credit_card">Kredi Kartı</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">AÇIKLAMA</label>
                        <input type="text" placeholder="Tahsilat notu..." value={collection.description || ""} onChange={(e) => updateCollection(collection.id, "description", e.target.value)} className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[11px] font-medium outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">TUTAR VE BİRİM</label>
                        <div className="flex gap-1 h-[36px]">
                          <input type="number" value={collection.amount || 0} onChange={(e) => updateCollection(collection.id, "amount", parseFloat(e.target.value) || 0)} className="w-full px-2 text-right border border-gray-200 rounded-md text-[11px] font-bold outline-none" />
                          <select value={collection.currency || "TRY"} onChange={(e) => updateCollection(collection.id, "currency", e.target.value)} className="w-[60px] px-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold outline-none">
                            <option value="TRY">TRY</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
                  <span className="text-3xl block mb-2">💳</span>
                  <p className="text-sm font-semibold text-gray-500">Henüz tahsilat eklenmemiş</p>
                </div>
              )}
            </div>
          )}

          {/* TOTALS FOOTER */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] p-4 z-40 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Toplam Satış</p>
                    <p className="text-sm font-bold text-gray-900">{getTotalForCurrency("USD").toLocaleString("tr-TR", { minimumFractionDigits: 2 })} USD</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Toplam Alış (Maliyet)</p>
                    <p className="text-sm font-bold text-gray-900">{getCostForCurrency("USD").toLocaleString("tr-TR", { minimumFractionDigits: 2 })} USD</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-600/70 font-semibold uppercase tracking-wider mb-0.5">Tahmini Kâr</p>
                    <p className="text-sm font-bold text-emerald-600">{(getTotalForCurrency("USD") - getCostForCurrency("USD")).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} USD</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push("/sejour/list")} className="px-6 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : "Sejour'u Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </form>
