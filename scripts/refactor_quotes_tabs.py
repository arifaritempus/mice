import re

filepath = "frontend/src/app/quotes/create/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Add state for activeMainTab
if "const [activeMainTab, setActiveMainTab]" not in content:
    content = content.replace(
        "const [loading, setLoading] = useState(true);",
        "const [loading, setLoading] = useState(true);\n  const [activeMainTab, setActiveMainTab] = useState<'info' | 'details'>('info');"
    )

# 2. Replace Header with Tabbed Header
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
          <div className="max-w-[1920px] mx-auto px-4 flex justify-between items-center w-full">
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
            
            {/* Right Placeholder to balance */}
            <div className="w-[120px] flex justify-end">
              <h1 className="text-sm font-bold text-white truncate">Yeni Teklif</h1>
            </div>
          </div>
        </div>"""

content = content.replace(header_old, header_new)

# 3. Wrap Teklif Bilgileri content with activeMainTab === 'info'
info_start_old = """          {/* Teklif Bilgileri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">"""
info_start_new = """          {/* Teklif Bilgileri */}
          <div className={activeMainTab === 'info' ? 'block animate-in fade-in slide-in-from-bottom-4 duration-300' : 'hidden'}>
          <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700/50 p-6 transition-colors duration-200 mb-6">"""

content = content.replace(info_start_old, info_start_new)

# Otel & Konaklama Seçimleri div de kapatalım (info tab)
# The transition to details tab happens at "Otel Sekmeleri (Çoklu Otel Desteği)"

hotels_tab_old = """              {/* Çoklu Otel Seçimi Başlangıcı */}
              <div className="w-full space-y-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mt-4">"""

hotels_tab_new = """              {/* Çoklu Otel Seçimi Başlangıcı */}
              <div className="w-full space-y-4 bg-[#0f172a]/50 p-4 rounded-xl border border-gray-700/50 mt-6">"""

content = content.replace(hotels_tab_old, hotels_tab_new)

# But wait, where should info end and details begin?
# The info tab should only end RIGHT BEFORE "Otel Sekmeleri (Çoklu Otel Desteği)" starts rendering the QuoteServiceEditor.
# In quotes/create, the hotel inputs are inside `hotels.map`.
# Let's see where QuoteServiceEditor is inside the map.
editor_start_old = """                          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                            
                            <QuoteServiceEditor"""
# We must NOT render the QuoteServiceEditor inside `info` tab.
# Wait, actually, the hotel form is inside `hotels.map`. If we just hide the whole form block and show details block it's hard because the editor is inside the map!
# INSTEAD OF THAT, let's just create two big blocks!
