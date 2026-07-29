import re

filepath = "frontend/src/app/sejour/[id]/edit/page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">.*?<option value="GBP">GBP</option>\s*</select>\s*</div>\s*</div>\s*</div>'

new_layout = """<div className="flex flex-col lg:flex-row gap-2 items-end w-full">
                            {/* Otel Secimi */}
                            <div className="flex-[1.5] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Otel Seçimi
                              </label>
                              <div className="h-[32px] relative z-[60]">
                                <SearchableSelect
                                  options={hotels}
                                  value={room.hotelId}
                                  onChange={(id) => updateRoom(room.id, "hotelId", id)}
                                  placeholder="Otel ara..."
                                  className="rounded-lg h-[32px] !min-h-[32px]"
                                />
                              </div>
                            </div>
                            {/* Tedarikci */}
                            <div className="flex-[1.5] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Tedarikçi
                              </label>
                              <div className="h-[32px] relative z-[50]">
                                <SearchableSelect
                                  options={suppliers || []}
                                  value={room.supplierId || ""}
                                  onChange={(id) => updateRoom(room.id, "supplierId", id)}
                                  placeholder="Tedarikçi ara..."
                                  className="rounded-lg h-[32px] !min-h-[32px]"
                                />
                              </div>
                            </div>
                            {/* C-IN / C-OUT */}
                            <div className="flex-[2] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                C-In / C-Out
                              </label>
                              <div className="flex gap-1 h-[32px]">
                                <input
                                  type="date"
                                  className="w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  value={room.checkIn || ""}
                                  onChange={(e) => updateRoom(room.id, "checkIn", e.target.value)}
                                />
                                <input
                                  type="date"
                                  className="w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  value={room.checkOut || ""}
                                  onChange={(e) => updateRoom(room.id, "checkOut", e.target.value)}
                                />
                              </div>
                            </div>
                            {/* Konaklama Tipi */}
                            <div className="flex-[1] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Konaklama Tipi
                              </label>
                              <select
                                className="w-full h-[32px] px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={room.accommodationType || ""}
                                onChange={(e) => updateRoom(room.id, "accommodationType", e.target.value)}
                              >
                                <option value="">Seçin</option>
                                {[
                                  "SNG", "DBL", "TWN", "TRP", "QUAD", "SNG+CHD", "SNG+2CHD",
                                  "DBL+CHD", "DBL+2CHD", "TRP+CHD", "TRP+2CHD", "QUAD+CHD",
                                  "SNG+INF", "DBL+INF", "DBL+CHD+INF", "TRP+INF"
                                ].map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            {/* Oda Tipi */}
                            <div className="flex-[1] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Oda Tipi
                              </label>
                              <select
                                className="w-full h-[32px] px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={room.roomType || ""}
                                onChange={(e) => updateRoom(room.id, "roomType", e.target.value)}
                              >
                                <option value="">Seçin</option>
                                {roomTypes.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            {/* Misafir Bilgileri */}
                            <div className="flex-[2] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Misafir Bilgileri
                              </label>
                              <input
                                className="w-full h-[32px] px-2 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                type="text"
                                value={room.guestInfo}
                                onChange={(e) => updateRoom(room.id, "guestInfo", e.target.value)}
                                placeholder="Örn: 2 Pax"
                              />
                            </div>
                            {/* Satis Tutari */}
                            <div className="flex-[1.5] w-full relative">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Satış Tutarı
                              </label>
                              <div className="flex gap-1 h-[32px]">
                                <input
                                  className="flex-1 px-2 h-full bg-v3-surface border border-v3-border rounded-lg text-[11px] font-black text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    servicePriceInput[room.id] ??
                                    (room.price ? formatAmount(room.price) : "")
                                  }
                                  onChange={(e) =>
                                    setServicePriceInput((prev) => ({
                                      ...prev,
                                      [room.id]: normalizeTyping(e.target.value),
                                    }))
                                  }
                                  onBlur={(e) => {
                                    const parsed = parseTrAmount(
                                      servicePriceInput[room.id] ?? e.target.value,
                                    );
                                    if (parsed !== null) {
                                      updateRoom(room.id, "price", parsed);
                                      setServicePriceInput((prev) => ({
                                        ...prev,
                                        [room.id]: formatAmount(parsed),
                                      }));
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const parsed = parseTrAmount(servicePriceInput[room.id] ?? e.currentTarget.value);
                                      if (parsed !== null) {
                                        updateRoom(room.id, "price", parsed);
                                        setServicePriceInput((prev) => ({
                                          ...prev,
                                          [room.id]: formatAmount(parsed),
                                        }));
                                      }
                                    }
                                  }}
                                />
                                <select
                                  className="w-[60px] h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-black text-v3-text transition-all duration-300 outline-none"
                                  value={room.currency}
                                  onChange={(e) => updateRoom(room.id, "currency", e.target.value)}
                                >
                                  <option value="TRY">TRY</option>
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                            </div>
                          </div>"""

if re.search(pattern, content, flags=re.DOTALL):
    content = re.sub(pattern, new_layout, content, flags=re.DOTALL)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success edit")
else:
    print("Failed edit")
