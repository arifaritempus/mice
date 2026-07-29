import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v20(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    is_edit = 'edit' in filepath
    price_state = "servicePriceInput[`room_sales_${room.id}`]" if is_edit else "roomPriceInput[room.id]"
    set_price_state = "setServicePriceInput" if is_edit else "setRoomPriceInput"
    price_key = "[`room_sales_${room.id}`]" if is_edit else "[room.id]"

    new_block = f"""{{rooms.map((room, index) => (
                        <div
                          key={{room.id}}
                          style={{{{ zIndex: 100 - index }}}}
                          className="group relative bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-lg p-2 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-semibold tracking-widest uppercase border border-blue-100 dark:border-blue-800">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              Oda {{index + 1}}
                            </h4>
                            <button
                              type="button"
                              onClick={{() => removeRoom(room.id)}}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-v3-surface text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex flex-col lg:flex-row gap-2 items-end w-full">
                            {{/* Otel Seçimi */}}
                            <div className="flex-[1.5] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Otel Seçimi
                              </label>
                              <div className="h-[34px] relative z-[60]">
                                <SearchableSelect
                                  options={{hotels}}
                                  value={{room.hotelId}}
                                  onChange={{(id) =>
                                    updateRoom(room.id, "hotelId", id)
                                  }}
                                  placeholder="Otel ara..."
                                />
                              </div>
                            </div>
                            
                            {{/* Tedarikçi Seçimi */}}
                            <div className="flex-[1.5] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Tedarikçi
                              </label>
                              <div className="h-[34px] relative z-[50]">
                                <SearchableSelect
                                  options={{suppliers || []}}
                                  value={{room.supplierId || ""}}
                                  onChange={{(id) =>
                                    updateRoom(room.id, "supplierId" as any, id)
                                  }}
                                  placeholder="Tedarikçi ara..."
                                />
                              </div>
                            </div>

                            {{/* Tarihler (C-In / C-Out) */}}
                            <div className="flex-[2] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                C-In / C-Out
                              </label>
                              <div className="flex gap-1 h-[34px]">
                                <input
                                  type="date"
                                  className="w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  value={{room.checkInDate || ""}}
                                  onChange={{(e) => updateRoom(room.id, "checkInDate" as any, e.target.value)}}
                                />
                                <input
                                  type="date"
                                  className="w-full h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  value={{room.checkOutDate || ""}}
                                  onChange={{(e) => updateRoom(room.id, "checkOutDate" as any, e.target.value)}}
                                />
                              </div>
                            </div>

                            {{/* Konaklama Tipi */}}
                            <div className="flex-[1] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Konaklama Tipi
                              </label>
                              <select
                                className="w-full h-[34px] px-2 bg-v3-surface border border-v3-border rounded-lg text-[11px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={{room.accommodationType || ""}}
                                onChange={{(e) =>
                                  updateRoom(room.id, "accommodationType", e.target.value)
                                }}
                              >
                                <option value="">Seçin</option>
                                {{[
                                  "SNG", "DBL", "TWN", "TRP", "QUAD",
                                  "SNG+CHD", "SNG+2CHD", "DBL+CHD", "DBL+2CHD",
                                  "TRP+CHD", "TRP+2CHD", "QUAD+CHD", "SNG+INF",
                                  "DBL+INF", "DBL+CHD+INF", "TRP+INF"
                                ].map((t) => (
                                  <option key={{t}} value={{t}}>{{t}}</option>
                                ))}}
                              </select>
                            </div>

                            {{/* Oda Tipi */}}
                            <div className="flex-[1] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Oda Tipi
                              </label>
                              <select
                                className="w-full h-[34px] px-2 bg-v3-surface border border-v3-border rounded-lg text-[11px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                value={{room.roomType || ""}}
                                onChange={{(e) =>
                                  updateRoom(room.id, "roomType", e.target.value)
                                }}
                              >
                                <option value="">Seçin</option>
                                {{roomTypes.map((type) => (
                                  <option key={{type}} value={{type}}>{{type}}</option>
                                ))}}
                              </select>
                            </div>

                            {{/* Misafir Bilgileri */}}
                            <div className="flex-[1.2] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Misafir Bilgileri
                              </label>
                              <input
                                className="w-full h-[34px] px-2 bg-v3-surface border border-v3-border rounded-lg text-[11px] font-medium text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                type="text"
                                value={{room.guestInfo || ""}}
                                onChange={{(e) =>
                                  updateRoom(room.id, "guestInfo", e.target.value)
                                }}
                                placeholder="Örn: 2 Pax"
                              />
                            </div>

                            {{/* Satış Tutarı */}}
                            <div className="flex-[1.2] w-full">
                              <label className="block text-[9px] font-semibold text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Satış Tutarı
                              </label>
                              <div className="flex gap-1 h-[34px]">
                                <input
                                  className="flex-1 h-full px-2 bg-v3-surface border border-v3-border rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                  type="text"
                                  inputMode="decimal"
                                  value={{
                                    {price_state} ??
                                    (room.price ? formatAmount(room.price) : "")
                                  }}
                                  onChange={{(e) =>
                                    {set_price_state}((prev: any) => ({{
                                      ...prev,
                                      {price_key}: normalizeTyping(e.target.value),
                                    }}))
                                  }}
                                  onBlur={{(e) => {{
                                    const parsed = parseTrAmount({price_state} ?? e.target.value);
                                    updateRoom(room.id, "price", parsed);
                                    {set_price_state}((prev: any) => ({{
                                      ...prev,
                                      {price_key}: formatAmount(parsed),
                                    }}));
                                  }}}}
                                />
                                <select
                                  className="w-[50px] h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-semibold text-v3-text transition-all duration-300 outline-none"
                                  value={{room.currency || "TRY"}}
                                  onChange={{(e) =>
                                    updateRoom(room.id, "currency", e.target.value)
                                  }}
                                >
                                  <option value="TRY">TRY</option>
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}}"""

    # We match from {rooms.map((room, index) => ( up to ))} 
    pattern = re.compile(r'\{rooms\.map\(\(room, index\) => \(\s*<div\s*key=\{room\.id\}(?:(?!\{rooms\.map).)*?</select>\s*</div>\s*</div>\s*</div>\s*</div>\s*\)\)\}', re.DOTALL)
    
    content, count = pattern.subn(new_block, content, count=1)
    if count > 0:
        print(f"SUCCESSFULLY INJECTED V20 LAYOUT IN {filepath}")
    else:
        print(f"FAILED TO INJECT V20 LAYOUT IN {filepath}")

    # Inject into Room interface
    interface_pattern = re.compile(r'(interface Room \{[\s\S]*?)(\n\})')
    def inject_fields(m):
        block = m.group(1)
        if "supplierId" not in block:
            return block + "\n  supplierId?: string;\n  checkInDate?: string;\n  checkOutDate?: string;" + m.group(2)
        return block + m.group(2)
    
    content = interface_pattern.sub(inject_fields, content)

    # Fix SearchableSelect classes for thinner fonts
    searchable_select_old = 'className="w-full h-full px-2 bg-transparent text-xs font-bold text-v3-text placeholder-gray-400 outline-none"'
    searchable_select_new = 'className="w-full h-full px-2 bg-transparent text-[11px] font-medium text-v3-text placeholder-gray-400 outline-none"'
    content = content.replace(searchable_select_old, searchable_select_new)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for fp in files:
    apply_v20(fp)
