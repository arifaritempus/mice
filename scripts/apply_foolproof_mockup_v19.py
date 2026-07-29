import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_foolproof_mockup_v19(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    is_edit = 'edit' in filepath

    price_state = "servicePriceInput[`room_sales_${room.id}`]" if is_edit else "roomPriceInput[room.id]"
    set_price_state = "setServicePriceInput" if is_edit else "setRoomPriceInput"
    price_key = "[`room_sales_${room.id}`]" if is_edit else "[room.id]"

    new_room_block = f"""<div className="flex flex-col lg:flex-row gap-3 items-end w-full">
                            {{/* Otel Seçimi */}}
                            <div className="flex-[1.5] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
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
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Tedarikçi
                              </label>
                              <div className="h-[34px] relative z-[50]">
                                <SearchableSelect
                                  options={{suppliers || []}}
                                  value={{(room as any).supplierId || ""}}
                                  onChange={{(id) =>
                                    updateRoom(room.id, "supplierId" as any, id)
                                  }}
                                  placeholder="Tedarikçi ara..."
                                />
                              </div>
                            </div>

                            {{/* Konaklama Tipi */}}
                            <div className="flex-[1] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Konaklama Tipi
                              </label>
                              <select
                                className="w-full h-[34px] px-2 bg-v3-surface border border-v3-border rounded-lg text-xs font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
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
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Oda Tipi
                              </label>
                              <select
                                className="w-full h-[34px] px-2 bg-v3-surface border border-v3-border rounded-lg text-xs font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
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
                            <div className="flex-[2] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Misafir Bilgileri
                              </label>
                              <input
                                className="w-full h-[34px] px-2 bg-v3-surface border border-v3-border rounded-lg text-xs font-bold text-v3-text focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
                                type="text"
                                value={{room.guestInfo || ""}}
                                onChange={{(e) =>
                                  updateRoom(room.id, "guestInfo", e.target.value)
                                }}
                                placeholder="Örn: 2 Pax"
                              />
                            </div>

                            {{/* Satış Tutarı */}}
                            <div className="flex-[1.5] w-full">
                              <label className="block text-[9px] font-black text-v3-muted uppercase tracking-widest mb-1.5 ml-1">
                                Satış Tutarı
                              </label>
                              <div className="flex gap-1 h-[34px]">
                                <input
                                  className="flex-1 h-full px-2 bg-v3-surface border border-v3-border rounded-lg text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 outline-none"
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
                                  className="w-16 h-full px-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-black text-v3-text transition-all duration-300 outline-none"
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
                          </div>"""

    # Replace
    pattern = re.compile(r'<div className="flex flex-col lg:flex-row gap-2 [^>]+>(?:(?!<div className="flex flex-col lg:flex-row gap-2).)*?<option value="GBP">GBP</option>\s*</select>\s*</div>\s*</div>\s*</div>', re.DOTALL)
    
    content, count = pattern.subn(new_room_block, content, count=1)
    if count > 0:
        print(f"SUCCESSFULLY INJECTED NEW ROOM LAYOUT IN {filepath}")
    else:
        print(f"FAILED TO INJECT NEW ROOM LAYOUT IN {filepath}")

    # Fix SearchableSelect classes
    searchable_select_inner = 'className="w-full px-2 py-1.5 bg-transparent text-xs text-v3-text placeholder-gray-400 outline-none"'
    searchable_select_new = 'className="w-full h-full px-2 bg-transparent text-xs font-bold text-v3-text placeholder-gray-400 outline-none"'
    content = content.replace(searchable_select_inner, searchable_select_new)
    
    searchable_select_outer = 'className={`relative flex items-center bg-v3-surface border ${open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-v3-border"} ${className} transition-all duration-200`}'
    searchable_select_outer_new = 'className={`relative flex items-center h-full bg-v3-surface border rounded-lg ${open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-v3-border"} ${className} transition-all duration-200`}'
    content = content.replace(searchable_select_outer, searchable_select_outer_new)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for fp in files:
    apply_foolproof_mockup_v19(fp)
