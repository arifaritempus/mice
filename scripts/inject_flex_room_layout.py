import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_flex_layout(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The exact block to replace starts with:
    # <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
    # And ends after Satış Tutarı's input.
    
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
                                  placeholder="Tedarikçi..."
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
                            <div className="flex-[1.5] w-full">
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
                                type="text"
                                className="w-full h-[32px] px-2 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={room.guestInfo || ""}
                                onChange={(e) => updateRoom(room.id, "guestInfo", e.target.value)}
                                placeholder="Örn: 2 Pax"
                              />
                            </div>
                            {/* Satis Tutari */}
                            <div className="flex-[1] w-full relative">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Satış Tutarı
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  className="w-full h-[32px] pl-2 pr-6 bg-v3-surface border border-v3-border rounded-lg text-[11px] font-black text-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  value={room.salesPrice || ""}
                                  onChange={(e) => updateRoom(room.id, "salesPrice", e.target.value)}
                                  onKeyDown={(e) => handlePriceKeyDown(e, room.id)}
                                  onBlur={(e) => handlePriceKeyDown(e, room.id)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-v3-muted pointer-events-none">TRY</span>
                              </div>
                            </div>
                          </div>"""

    # We need to replace everything from <div className="grid ..."> up to the end of the Satis Tutari div
    # Because both files have the exact same grid block
    
    pattern = r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">.*?<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">TRY</span>\s*</div>\s*</div>\s*</div>'
    
    if re.search(pattern, content, flags=re.DOTALL):
        content = re.sub(pattern, new_layout, content, flags=re.DOTALL)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Applied flex layout to {filepath}")
    else:
        print(f"Could not find pattern in {filepath}")

for fp in files:
    apply_flex_layout(fp)
