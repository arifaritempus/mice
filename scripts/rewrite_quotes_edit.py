import re

with open("frontend/src/app/quotes/[id]/edit/page.tsx", "r") as f:
    content = f.read()

start_idx = content.find('  if (loading) {\n    return (')
if start_idx == -1:
    print("Could not find start index")
    exit(1)

return_idx = content.find('  return (\n', start_idx + 50)
if return_idx == -1:
    return_idx = content.find('  return (', start_idx + 50)

new_return = """  return (
    <div className="h-full w-full overflow-y-auto pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">
      {/* Sticky Main Tabs - Full Width Minimal */}
      <div className="sticky top-0 z-40 pb-2 pt-2 mb-6 border-b border-white/5" style={{ backgroundColor: "rgb(var(--theme-bg-main, 15, 23, 42))" }}>
        <div className="max-w-[1920px] mx-auto px-4 flex justify-between items-center w-full">
          <div className="w-[100px]">
            <Link href="/quotes" className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              GERİ
            </Link>
          </div>
          
          <div className="flex bg-[#0f172a]/50 p-1 rounded-xl border border-white/5 w-full max-w-[350px]">
             <button 
               type="button"
               onClick={() => setActiveMainTab('info')} 
               className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'info' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
               TEKLİF BİLGİLERİ
             </button>
             <button 
               type="button"
               onClick={() => setActiveMainTab('details')} 
               className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeMainTab === 'details' ? 'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
             >
               TEKLİF DETAYLARI
             </button>
          </div>
          
          <div className="w-[100px] flex justify-end">
            <button onClick={handleSubmit} type="button" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-500 transition-colors text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Güncelle
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeMainTab === 'info' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 px-4">
              
              {/* Card 1: Temel Bilgiler */}
              <div className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    KOD *
                  </p>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    required
                    placeholder="Teklif kodu giriniz..."
                    className="w-full text-base font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                  />
                </div>
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    DURUM *
                  </p>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full text-xs font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                  >
                    <option value="TEKLİF">TEKLİF</option>
                    <option value="KONFİRME">KONFİRME</option>
                    <option value="İPTAL">İPTAL</option>
                  </select>
                </div>
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    TEKLİF TÜRÜ *
                  </p>
                  <select
                    name="quote_type"
                    value={formData.quote_type}
                    onChange={handleInputChange}
                    required
                    className="w-full text-xs font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                  >
                    <option value="BİRİM">BİRİM</option>
                    <option value="PAKET">PAKET</option>
                  </select>
                </div>
              </div>

              {/* Card 2: Paydaşlar */}
              <div className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    FİRMA ADI *
                  </p>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    required
                    className="w-full text-base font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                  />
                </div>
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors relative z-50">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    ACENTE *
                  </p>
                  <SearchableSelect
                    options={agencies}
                    value={formData.agency_id}
                    onChange={handleAgencySelect}
                    placeholder="Acente seç / ara..."
                  />
                </div>
              </div>

              {/* Card 3: Operasyon */}
              <div className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors h-full flex flex-col">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    OPERASYON SORUMLULARI
                  </p>
                  <div className="relative operation-managers-dropdown flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowOperationManagersDropdown(!showOperationManagersDropdown)
                      }
                      className="w-full text-left text-base font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 flex justify-between items-center"
                    >
                      <span className="flex-1 overflow-hidden">
                        {formData.operation_managers.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center">
                            {formData.operation_managers.map((id) => {
                              const u = users.find(x => x.id === id);
                              if (!u) return null;
                              return <span key={id} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs whitespace-nowrap">{u.first_name} {u.last_name}</span>;
                            })}
                          </div>
                        ) : "Kullanıcı seçin..."}
                      </span>
                    </button>
                    {showOperationManagersDropdown && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1e293b] border border-gray-700 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto">
                        {users.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 p-2 hover:bg-[#0f172a] rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.operation_managers.includes(user.id)}
                              onChange={(e) => {
                                const current = formData.operation_managers;
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    operation_managers: [...current, user.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    operation_managers: current.filter(
                                      (id) => id !== user.id,
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.role}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'details' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full px-4">
            REPLACE_ME_DETAILS
          </div>
        )}
      </form>
      </div>
    </div>
  );
}
"""

details_start = content.find('{/* Çoklu Otel Seçimi Başlangıcı */}')
details_end = content.find('</form>')
if details_start != -1 and details_end != -1:
    details_html = content[details_start:details_end]
else:
    details_start = content.find('<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">')
    details_end = content.find('</form>')
    details_html = content[details_start:details_end]

details_html = details_html.replace(
    'className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"',
    'className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 mb-6"'
)
details_html = details_html.replace(
    'className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"',
    'className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 p-4 bg-[#0f172a]/70 border border-gray-700/30 rounded-xl shadow-lg transition-colors"'
)
details_html = details_html.replace(
    'className="block text-[9px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase"',
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5"'
)
details_html = details_html.replace(
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">\n                                Opsiyon',
    'className="block text-[10px] font-black text-yellow-500/90 uppercase tracking-widest mb-1.5">\n                                Opsiyon'
)
details_html = details_html.replace(
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">\n                                Opsiyon Tarihi',
    'className="block text-[10px] font-black text-orange-500/90 uppercase tracking-widest mb-1.5">\n                                Opsiyon Tarihi'
)
details_html = details_html.replace(
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">\n                                Otel Durumu',
    'className="block text-[10px] font-black text-green-500/90 uppercase tracking-widest mb-1.5">\n                                Otel Durumu'
)
details_html = details_html.replace(
    'className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white"',
    'className="w-full px-2 py-1.5 h-9 text-xs bg-transparent border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white placeholder-gray-500"'
)
details_html = details_html.replace(
    'className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"',
    'className="w-full px-2 py-1.5 h-9 text-xs bg-transparent border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold text-white placeholder-gray-500 disabled:opacity-50"'
)

new_return = new_return.replace("REPLACE_ME_DETAILS", details_html)

new_content = content[:return_idx] + new_return
with open("frontend/src/app/quotes/[id]/edit/page.tsx", "w") as f:
    f.write(new_content)

print("Done generating quotes/[id]/edit/page.tsx")
