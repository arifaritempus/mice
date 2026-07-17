import re

with open("frontend/src/app/quotes/[id]/page.tsx", "r") as f:
    content = f.read()

# For the view page, we want the sticky top nav, and the dark cards.

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
          
          <div className="w-[100px] flex justify-end gap-2">
            <button
              onClick={() => {
                const pdf = new jsPDF("p", "pt", "a4");
                const content = document.getElementById("quote-pdf-content");
                if (content) {
                  pdf.html(content, {
                    callback: function (doc) {
                      doc.save(`Teklif_${quote?.reference || quote?.id}.pdf`);
                    },
                    x: 10,
                    y: 10,
                    width: 550,
                    windowWidth: 1024,
                  });
                }
              }}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-500 transition-colors text-xs font-bold flex items-center gap-2"
            >
              PDF
            </button>
            <Link
              href={`/quotes/${id}/edit`}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors text-xs font-bold flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Düzenle
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto">
      <div id="quote-pdf-content">
        {activeMainTab === 'info' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 px-4">
              
              {/* Card 1: Temel Bilgiler */}
              <div className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    KOD
                  </p>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {quote?.reference}
                  </p>
                </div>
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    DURUM
                  </p>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {quote?.status}
                  </p>
                </div>
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    TEKLİF TÜRÜ
                  </p>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {quote?.quote_type}
                  </p>
                </div>
              </div>

              {/* Card 2: Paydaşlar */}
              <div className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    FİRMA ADI
                  </p>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {quote?.company_name}
                  </p>
                </div>
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    ACENTE
                  </p>
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {agencies.find((a) => a.id === quote?.agency_id)?.name || "-"}
                  </p>
                </div>
              </div>

              {/* Card 3: Operasyon */}
              <div className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
                <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors h-full flex flex-col">
                  <p className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    OPERASYON SORUMLULARI
                  </p>
                  <div className="flex flex-wrap gap-1 items-center">
                    {quote?.operation_managers && quote.operation_managers.length > 0 ? (
                      quote.operation_managers.map((id) => {
                        const u = users.find(x => x.id === id);
                        if (!u) return null;
                        return <span key={id} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs whitespace-nowrap">{u.first_name} {u.last_name}</span>;
                      })
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS TAB COMPONENT INJECTION HERE */}
        {activeMainTab === 'details' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full px-4">
            REPLACE_ME_DETAILS
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
"""

details_start = content.find('{/* Çoklu Otel Seçimi Başlangıcı */}')
details_end = content.find('{/* Fiyatlandırma Kartları */}')
if details_start != -1 and details_end != -1:
    details_html = content[details_start:details_end]
else:
    details_start = content.find('<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">')
    details_end = content.find('{/* Fiyatlandırma Kartları */}')
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
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">\n                            Opsiyon',
    'className="block text-[10px] font-black text-yellow-500/90 uppercase tracking-widest mb-1.5">\n                            Opsiyon'
)
details_html = details_html.replace(
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">\n                            Opsiyon Tarihi',
    'className="block text-[10px] font-black text-orange-500/90 uppercase tracking-widest mb-1.5">\n                            Opsiyon Tarihi'
)
details_html = details_html.replace(
    'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5">\n                            Otel Durumu',
    'className="block text-[10px] font-black text-green-500/90 uppercase tracking-widest mb-1.5">\n                            Otel Durumu'
)
details_html = details_html.replace(
    'className="w-full px-4 h-8 flex items-center bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-xs text-gray-900 dark:text-white truncate min-w-0"',
    'className="w-full px-3 h-9 flex items-center bg-transparent border border-gray-700/50 rounded-lg font-bold text-xs text-white truncate min-w-0"'
)
details_html = details_html.replace(
    'className="w-full px-4 h-8 flex items-center bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-xs text-gray-900 dark:text-white truncate min-w-0 opacity-50"',
    'className="w-full px-3 h-9 flex items-center bg-transparent border border-orange-500/30 rounded-lg font-bold text-xs text-white truncate min-w-0 opacity-50"'
)


new_return = new_return.replace("REPLACE_ME_DETAILS", details_html + "\n            {/* Fiyatlandırma Kartları */}\n            " + content[details_end:content.find('</div>\n    </div>\n  );\n}')])

new_content = content[:return_idx] + new_return
with open("frontend/src/app/quotes/[id]/page.tsx", "w") as f:
    f.write(new_content)

print("Done generating quotes/[id]/page.tsx")
