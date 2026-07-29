import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_v24(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    is_edit = 'edit' in filepath
    price_state = "servicePriceInput[`extra_${service.id}`]"
    set_price_state = "setServicePriceInput"

    new_block = f"""{{extraServices.map((service, index) => (
                        <div
                          key={{service.id}}
                          className="group relative bg-gray-50/60 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700 rounded-xl p-3 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-700"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="inline-flex items-center px-3 py-1 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-orange-100 dark:border-orange-800">
                              <span className="w-1 h-1 bg-orange-500 rounded-full mr-2"></span>
                              HİZMET {{index + 1}}
                            </h4>
                            <button
                              type="button"
                              onClick={{() => removeExtraService(service.id)}}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-v3-surface text-red-500 border border-red-50 dark:border-red-900/30 shadow-sm hover:bg-red-500 hover:text-white transition-all duration-200"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            {{/* Tarih */}}
                            <div>
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Tarih
                              </label>
                              <input
                                type="date"
                                value={{(service as any).date || ""}}
                                onChange={{(e) => updateExtraService(service.id, "date" as any, e.target.value)}}
                                className="w-full px-2 py-1 bg-v3-surface border border-v3-border rounded text-[11px] font-medium text-v3-text focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 outline-none h-9"
                              />
                            </div>
                            
                            <div className="flex-[2]">
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Hizmet Tipi
                              </label>
                              <select
                                value={{service.serviceType || ""}}
                                onChange={{(e) =>
                                  updateExtraService(
                                    service.id,
                                    "serviceType",
                                    e.target.value,
                                  )
                                }}
                                className="w-full px-3 py-1 bg-v3-surface border border-v3-border rounded text-[10px] font-bold text-v3-text focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 outline-none h-9"
                              >
                                <option value="">Seçin</option>
                                {{supplierServiceTypes.map((type) => (
                                  <option key={{type.id}} value={{type.id}}>
                                    {{type.name}}
                                  </option>
                                ))}}
                              </select>
                            </div>
                            <div className="flex-[2] h-9">
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Tedarikçi
                              </label>
                              <SearchableSelect
                                options={{suppliers}}
                                value={{service.provider || ""}}
                                onChange={{(id) =>
                                  updateExtraService(service.id, "provider", id)
                                }}
                                placeholder="Tedarikçi..."
                                className="rounded h-9"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Açıklama
                              </label>
                              <input
                                type="text"
                                value={{service.description || ""}}
                                onChange={{(e) =>
                                  updateExtraService(
                                    service.id,
                                    "description",
                                    e.target.value,
                                  )
                                }}
                                className="w-full px-2 py-1 bg-v3-surface border border-v3-border rounded text-xs font-bold text-v3-text focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300 outline-none h-9"
                                placeholder="Örn: Rehberlik"
                              />
                            </div>
                            <div className="flex-[2]">
                              <label className="block text-[10px] font-black text-v3-muted uppercase tracking-widest mb-2 ml-1">
                                Satış Tutarı
                              </label>
                              <div className="flex gap-2">
                                <input
                                  className="flex-1 px-2 py-1 bg-v3-surface border border-v3-border rounded-lg text-xs font-black text-orange-600 dark:text-orange-400 text-right focus:ring-4 focus:ring-orange-500/10 focus:border-blue-500 transition-all duration-300 outline-none h-9"
                                  type="text"
                                  inputMode="decimal"
                                  value={{
                                    {price_state} ??
                                    (service.price
                                      ? formatAmount(service.price)
                                      : "")
                                  }}
                                  onChange={{(e) =>
                                    {set_price_state}((prev: any) => ({{
                                      ...prev,
                                      [`extra_${{service.id}}`]: normalizeTyping(
                                        e.target.value,
                                      ),
                                    }}))
                                  }}
                                  onBlur={{(e) => {{
                                    const parsed = parseTrAmount(
                                      {price_state} ?? e.target.value,
                                    );
                                    if (parsed !== null) {{
                                      updateExtraService(
                                        service.id,
                                        "price",
                                        parsed,
                                      );
                                      {set_price_state}((prev: any) => ({{
                                        ...prev,
                                        [`extra_${{service.id}}`]:
                                          formatAmount(parsed),
                                      }}));
                                    }}
                                  }}}}
                                />
                                <select
                                  className="w-20 px-1 py-1 bg-v3-surface border border-v3-border rounded-lg text-[10px] font-black text-v3-text transition-all duration-300 outline-none h-9"
                                  value={{service.currency}}
                                  onChange={{(e) =>
                                    updateExtraService(
                                      service.id,
                                      "currency",
                                      e.target.value,
                                    )
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

    pattern = re.compile(r'\{extraServices\.map\(\(service,\s*index\)\s*=>\s*\(\s*<div[\s\S]*?<\/div>\s*<\/div>\s*\)\)\}?', re.DOTALL)
    
    content, count = pattern.subn(new_block, content, count=1)
    if count > 0:
        print(f"SUCCESSFULLY INJECTED V24 EXTRA SERVICES LAYOUT IN {filepath}")
    else:
        print(f"FAILED TO INJECT V24 IN {filepath}")

    # Inject into addExtraService
    add_pattern = re.compile(r'(description:\s*"",\s*\n)(\s*\};)')
    def add_repl(m):
        return m.group(1) + '      date: salesData.checkInDate || "",\n' + m.group(2)
    content = add_pattern.sub(add_repl, content)

    # Inject into ExtraService interface
    interface_pattern = re.compile(r'(interface ExtraService \{[\s\S]*?)(\n\})')
    def int_repl(m):
        block = m.group(1)
        if "date?:" not in block:
            return block + "\n  date?: string;" + m.group(2)
        return block + m.group(2)
    content = interface_pattern.sub(int_repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for fp in files:
    apply_v24(fp)
