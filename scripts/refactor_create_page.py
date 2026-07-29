import re

filepath = "frontend/src/app/sejour/create/page.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to replace: From the start of the 3-column grid up to "Hizmetler Header"
pattern = r'<div className="grid grid-cols-1 lg:grid-cols-3 gap-2 responsive-filter-grid">\s*\{/\* Left Column: General Info \*/\}.*?\{/\* Hizmetler Header \*/\}'

# The exact form code we extracted from lines 1124 to 1282:
form_code = """<div className="grid grid-cols-1 md:grid-cols-2 gap-2 responsive-filter-grid">
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

new_layout = f"""{{/* Mockup Sejour Bilgileri */}}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-[#1e293b] dark:text-white">Sejour Bilgileri</h3>
                    <button type="button" onClick={{() => setIsEditingInfo(!isEditingInfo)}} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                      ✏️ Detayları Düzenle
                    </button>
                  </div>
                  {{!isEditingInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Voucher No</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{{salesData.voucherNumber}}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Müşteri Tipi</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{{salesData.customerType === 'agency' ? 'ACENTE' : 'ŞAHIS'}}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Müşteri Adı</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{{salesData.customerType === 'agency' ? (agencies.find(a => a.id === salesData.agencyId)?.name || '-') : salesData.customerName}}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Giriş - Çıkış Tarihi</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-white">{{salesData.checkInDate}} - {{salesData.checkOutDate}}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1">Rezervasyon Durumu</p>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[9px] font-bold">{{salesData.status}}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      {form_code}
                    </div>
                  )}}
                </div>

                {{/* Hizmetler Header */}}"""

if re.search(pattern, content, flags=re.DOTALL):
    content = re.sub(pattern, new_layout, content, flags=re.DOTALL)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success replace!")
else:
    print("Failed to find pattern!")
