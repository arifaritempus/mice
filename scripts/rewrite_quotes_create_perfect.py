import re

filepath = "frontend/src/app/quotes/create/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add state
if "const [activeMainTab, setActiveMainTab]" not in content:
    content = content.replace(
        "const [loading, setLoading] = useState(true);",
        "const [loading, setLoading] = useState(true);\n  const [activeMainTab, setActiveMainTab] = useState<'info' | 'details'>('info');"
    )

# Fix Header (sticky top with tabs)
header_pattern = r'\{\/\* Header \*\/\}.*?<\/div>'
# Wait, replacing using exact string is safer.
header_old = """        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
              Yeni Teklif Oluştur
            </h1>
          </div>
          <Link
            href="/quotes"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            GERİ DÖN
          </Link>
        </div>"""

header_new = """        {/* NEW: Sticky Main Tabs - Full Width Minimal */}
        <div className="sticky top-0 z-40 pb-2 pt-2 mb-6 border-b border-white/5 bg-[#0a0f18]/90 backdrop-blur-xl">
          <div className="max-w-[1920px] mx-auto flex justify-between items-center w-full">
            {/* Left Back Button */}
            <div className="w-[120px]">
              <Link
                href="/quotes"
                className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                GERİ DÖN
              </Link>
            </div>
            
            {/* Center Tabs */}
            <div className="flex bg-transparent p-1 rounded-xl border border-white/5 w-full max-w-[350px]">
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
            
            {/* Right Title Placeholder */}
            <div className="w-[120px] flex justify-end">
              <h1 className="text-sm font-bold text-white truncate">Yeni Teklif</h1>
            </div>
          </div>
        </div>"""

content = content.replace(header_old, header_new)

# TEKLİF BİLGİLERİ BLOCK START
info_start_old = """          {/* Teklif Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">"""
info_start_new = """          {/* Teklif Bilgileri */}
          <div className={activeMainTab === 'info' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6' : 'hidden'}>
          <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 p-6 transition-colors duration-200">"""
content = content.replace(info_start_old, info_start_new)

# TEKLİF BİLGİLERİ BLOCK END
# The "Otel & Konaklama Seçimleri" should ALSO be inside info, up to the hotel mapping?
# Wait! In quotes, the form (Check-in, Check-out, etc) is rendered for EACH hotel.
# We want the ENTIRE form to be in info, but the TABLE to be in details!
# Let's just put the HTML for the Table inside a `details` conditional.
# Where does the table start?
# The table is `<QuoteServiceEditor`
# Wait, `QuoteServiceEditor` is rendered inside `selectedHotels.map`.
# If `activeMainTab === 'info'`, we show the FORM (c/in, c/out, etc)
# If `activeMainTab === 'details'`, we show the QuoteServiceEditor.
# We can just wrap the form parts with `{activeMainTab === 'info' && (...)}` and QuoteServiceEditor with `{activeMainTab === 'details' && (...)}`!
# AND wrap the entire page structure carefully.

# Close the first info block before "Çoklu Otel Seçimi"
info_end_old = """              {/* Çoklu Otel Seçimi Başlangıcı */}
              <div className="w-full space-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mt-4">"""
info_end_new = """              {/* Çoklu Otel Seçimi Başlangıcı */}
              <div className="w-full space-y-4 bg-[#0f172a]/50 p-4 rounded-xl border border-gray-700/50 mt-6">"""
content = content.replace(info_end_old, info_end_new)

# Make the outer hotel tabs look like Premium Dark mode
content = content.replace(
    'className="flex bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700 space-x-2 overflow-x-auto"',
    'className="flex md:justify-center bg-gray-50 dark:bg-[#0f172a]/70 dark:backdrop-blur-md p-1.5 rounded-xl border border-gray-100 dark:border-gray-700/50 space-x-2 overflow-x-auto shadow-sm"'
)
content = content.replace(
    'bg-blue-500 text-white shadow-md shadow-blue-500/20',
    'bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
)
content = content.replace(
    'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
    'bg-[#1e293b]/50 text-gray-400 hover:text-white hover:bg-[#1e293b]'
)
content = content.replace(
    'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    'bg-indigo-600/90 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
)
content = content.replace(
    'className="text-xs font-semibold mr-2"',
    'className="text-[10px] font-black uppercase tracking-tight mr-2"'
)
content = content.replace(
    'className="text-xs font-semibold"',
    'className="text-[10px] font-black uppercase tracking-tight"'
)


# Now wrap the form inputs (Check-in, Check-out, etc)
# It starts at: `<div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-3">`
inputs_start_old = """                          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-3">"""
inputs_start_new = """                          {activeMainTab === 'info' && (
                            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-3 animate-in fade-in duration-300">"""
content = content.replace(inputs_start_old, inputs_start_new)

# It ends right before: `<div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">`
inputs_end_old = """                          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">"""
inputs_end_new = """                          )}
                          <div className="mt-6 pt-2">"""
content = content.replace(inputs_end_old, inputs_end_new)


# Now wrap QuoteServiceEditor
editor_start_old = """                            <QuoteServiceEditor"""
editor_start_new = """                            {activeMainTab === 'details' && (
                              <QuoteServiceEditor"""
content = content.replace(editor_start_old, editor_start_new)

editor_end_old = """                              hotelId={h.id}
                            />
                          </div>
                        </div>"""
editor_end_new = """                              hotelId={h.id}
                            />
                            )}
                          </div>
                        </div>"""
content = content.replace(editor_end_old, editor_end_new)


# Do the same for General Services block!
gen_start_old = """                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Otelden bağımsız genel hizmet kalemlerini buradan ekleyebilirsiniz.
                    </div>
                    
                    <QuoteServiceEditor"""
gen_start_new = """                    {activeMainTab === 'info' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 animate-in fade-in duration-300">
                        Otelden bağımsız genel hizmet kalemlerini buradan ekleyebilirsiniz.
                      </div>
                    )}
                    
                    {activeMainTab === 'details' && (
                    <QuoteServiceEditor"""
content = content.replace(gen_start_old, gen_start_new)

gen_end_old = """                      hotelId="general"
                    />
                  </div>"""
gen_end_new = """                      hotelId="general"
                    />
                    )}
                  </div>"""
content = content.replace(gen_end_old, gen_end_new)

# Lastly, close the giant div that was wrapping BOTH info and details (from Teklif Bilgileri)
# Wait, Teklif Bilgileri div is closed BEFORE Otel & Konaklama Seçimleri?
# No, in my first replacement:
#           <div className={activeMainTab === 'info' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6' : 'hidden'}>
#           <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 p-6 transition-colors duration-200">
# Wait, that outer div must wrap EVERYTHING up to the submit button?
# No! The outer div should ONLY wrap the info section.
# The `Otel & Konaklama Secimleri` is a SEPARATE section!
# Let's fix the first replacement properly:
info_start_old = """          {/* Teklif Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">"""
info_start_new = """          {/* Teklif Bilgileri */}
          <div className={activeMainTab === 'info' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
            <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 p-6 transition-colors duration-200 mb-6">"""
# Wait, if I open `<div className="...">` for `activeMainTab === 'info'`, I need to close it before "Otel & Konaklama Seçimleri".
# Where does Teklif Bilgileri end? It ends at `</textarea>\n              </div>\n\n              {/* Çoklu Otel Seçimi Başlangıcı */}`
# Let's just search for it!
# It actually ends here:
end_of_info_old = """                  placeholder="Teklif notlarını buraya yazın..."
                />
              </div>

              {/* Çoklu Otel Seçimi Başlangıcı */}"""

end_of_info_new = """                  placeholder="Teklif notlarını buraya yazın..."
                />
              </div>
            </div>
          </div>

              {/* Çoklu Otel Seçimi Başlangıcı */}"""
content = content.replace(info_start_old, info_start_new)
content = content.replace(end_of_info_old, end_of_info_new)

with open(filepath, "w") as f:
    f.write(content)

print("quotes/create rewritten!")
