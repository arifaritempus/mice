import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Room interface
    content = re.sub(
        r'interface Room \{\n\s*id: string;\n\s*roomNumber: string;\n\s*hotelId: string;',
        'interface Room {\n  id: string;\n  roomNumber: string;\n  hotelId: string;\n  supplierId?: string;\n  checkIn?: string;\n  checkOut?: string;',
        content
    )

    # 2. Remove hotelConcept
    content = re.sub(r'\s*hotelConcept\?: string;', '', content)
    
    # 3. Update addRoom / handleAddRoom
    content = re.sub(
        r'(roomNumber:\s*`Oda \$\{rooms\.length \+ 1\}`,\n\s*hotelId:\s*"",)',
        r'\1\n      supplierId: "",\n      checkIn: salesData.checkInDate,\n      checkOut: salesData.checkOutDate,',
        content
    )

    # 4. Update the Grid layout and add fields
    old_grid = r'<div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-end w-full lg:\[&>\*:nth-child\(1\)\]:flex-\[3\][^"]+">\s*<div className="md:col-span-2">\s*<label className="block text-\[10px\] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">\s*Otel Seçimi\s*</label>\s*<SearchableSelect\s*options=\{hotels\}\s*value=\{room\.hotelId\}\s*onChange=\{\(id\) =>\s*updateRoom\(room\.id, "hotelId", id\)\s*\}\s*placeholder="Otel ara\.\.\."\s*className="rounded-lg"\s*/>\s*</div>'
    
    new_grid = """<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Otel Seçimi
                              </label>
                              <SearchableSelect
                                options={hotels}
                                value={room.hotelId}
                                onChange={(id) => updateRoom(room.id, "hotelId", id)}
                                placeholder="Otel ara..."
                                className="rounded-lg"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Tedarikçi
                              </label>
                              <SearchableSelect
                                options={suppliers || []}
                                value={room.supplierId || ""}
                                onChange={(id) => updateRoom(room.id, "supplierId", id)}
                                placeholder="Tedarikçi ara..."
                                className="rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Giriş Tarihi
                              </label>
                              <input
                                type="date"
                                className="w-full px-2 py-1 bg-v3-surface border border-v3-border rounded-lg text-xs font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={room.checkIn || ""}
                                onChange={(e) => updateRoom(room.id, "checkIn", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Çıkış Tarihi
                              </label>
                              <input
                                type="date"
                                className="w-full px-2 py-1 bg-v3-surface border border-v3-border rounded-lg text-xs font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={room.checkOut || ""}
                                onChange={(e) => updateRoom(room.id, "checkOut", e.target.value)}
                              />
                            </div>"""

    content = re.sub(old_grid, new_grid, content)

    # 5. Fix price input Enter key handling
    old_input = r'(<input\s+className="flex-1 px-2 py-1[^>]+value=\{[^>]+onChange=\{[^>]+onBlur=\{[^\}]+})'
    
    # We will inject onKeyDown right after onBlur inside the input tag
    # Actually, we can use a simpler regex
    content = re.sub(
        r'(onBlur=\{\(e\) => \{[^\}]+\}\s*\})',
        r'\1\n                                  onKeyDown={(e) => {\n                                    if (e.key === "Enter") {\n                                      e.preventDefault();\n                                      const parsed = parseTrAmount((e.target as HTMLInputElement).value);\n                                      updateRoom(room.id, "price", parsed);\n                                      setRoomPriceInput((prev) => ({ ...prev, [room.id]: formatAmount(parsed) }));\n                                    }\n                                  }}',
        content
    )

    # 6. Fix Summary display
    # Replace the single summary item with a map over rooms
    old_summary = r'<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 overflow-hidden">\s*<div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors"[^>]+>\s*<div className="w-10 h-10 flex items-center justify-center bg-\[\#f0f5ff\] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">\s*<svg[^>]+><path[^>]+></path></svg>\s*</div>\s*<div className="w-48">\s*<h4 className="text-xs font-black text-\[\#1e293b\] dark:text-gray-200">Konaklama \(\{rooms\.length\}\)</h4>\s*<p className="text-\[10px\] text-gray-500 mt-1">\{rooms\.length\} oda</p>\s*</div>\s*<div className="flex-1 grid grid-cols-5 gap-4">\s*<div className="col-span-2">\s*<p className="text-\[9px\] text-gray-500 mb-1">Otel / Oda Tipi</p>\s*<p className="text-\[11px\] font-bold text-\[\#1e293b\] truncate">\{rooms\[0\]\?.hotelId \? hotels\.find\(\(h\) => h\.id === rooms\[0\]\.hotelId\)\?.name : "Otel Seçilmedi"\} - \{rooms\[0\]\?.roomType\}</p>\s*</div>\s*<div>\s*<p className="text-\[9px\] text-gray-500 mb-1">Pax</p>\s*<p className="text-\[11px\] font-bold text-\[\#1e293b\]">\{rooms\[0\]\?.adultCount\} Yetişkin, \{rooms\[0\]\?.childCount\} Çocuk</p>\s*</div>\s*<div>\s*<p className="text-\[9px\] text-gray-500 mb-1">Satış Tutarı</p>\s*<p className="text-\[11px\] font-black text-\[\#1e293b\]">\{rooms\[0\]\?.price \? formatAmount\(rooms\[0\]\.price\) : "0,00"\} \{rooms\[0\]\?.currency\}</p>\s*</div>\s*</div>\s*<div className="flex items-center gap-4 text-gray-400 ml-4">\s*<svg className={`w-4 h-4 transition-transform duration-300 \$\{expandedSection === \'rooms\' \? \'rotate-180\' : \'\'\}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M19 9l-7 7-7-7"/></svg>\s*</div>\s*</div>'

    new_summary = """<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 overflow-hidden">
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => { setExpandedSection(expandedSection === 'rooms' ? null : 'rooms'); setShowAccommodation(true); }}>
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
                            <p className="text-[10px] text-gray-500 font-medium">
                              {r.checkIn ? new Date(r.checkIn).toLocaleDateString("tr-TR") : "--"} - {r.checkOut ? new Date(r.checkOut).toLocaleDateString("tr-TR") : "--"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Pax</p>
                            <p className="text-[11px] font-bold text-[#1e293b] dark:text-gray-300">{r.adultCount + r.childCount + r.infantCount}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Satış Tutarı</p>
                            <p className="text-[11px] font-black text-[#1e293b] dark:text-gray-300">{r.price ? formatAmount(r.price) : "0,00"} {r.currency}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-500 italic">Henüz oda eklenmedi</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4 shrink-0">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>"""

    content = re.sub(old_summary, new_summary, content)
    
    # Format the dates in the summary block (e.g. checkInDate in Sejour Details)
    content = re.sub(
        r'new Date\(salesData\.checkInDate\)\.toLocaleDateString\(\s*"en-US"\s*,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"numeric"\s*\}\s*\)',
        r'new Date(salesData.checkInDate).toLocaleDateString("tr-TR")',
        content
    )
    content = re.sub(
        r'new Date\(salesData\.checkOutDate\)\.toLocaleDateString\(\s*"en-US"\s*,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"numeric"\s*\}\s*\)',
        r'new Date(salesData.checkOutDate).toLocaleDateString("tr-TR")',
        content
    )
    content = re.sub(
        r'new Date\(salesData\.creationDate\)\.toLocaleDateString\(\s*"en-US"\s*,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"numeric"\s*\}\s*\)',
        r'new Date(salesData.creationDate).toLocaleDateString("tr-TR")',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Now fix supabaseService.ts
supabase_file = "frontend/src/lib/supabaseService.ts"
with open(supabase_file, 'r', encoding='utf-8') as f:
    sb = f.read()

# createSejour
sb = re.sub(
    r'(room_number:\s*room\.roomNumber \|\| null,)',
    r'\1\n          supplier_id: room.supplierId || null,\n          check_in: room.checkIn || null,\n          check_out: room.checkOut || null,',
    sb
)

# getAllSejours / getSejourById map
sb = re.sub(
    r'(roomNumber:\s*room\.room_number \|\| room\.roomNumber,)',
    r'\1\n        supplierId: room.supplier_id || room.supplierId || "",\n        checkIn: room.check_in || room.checkIn || "",\n        checkOut: room.check_out || room.checkOut || "",',
    sb
)

with open(supabase_file, 'w', encoding='utf-8') as f:
    f.write(sb)

print("Done")
