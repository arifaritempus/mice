import re
import os

files_to_process = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def upgrade_design(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add activeSubTab state
    if "const [activeSubTab, setActiveSubTab]" not in content:
        content = content.replace(
            'const [activeTab, setActiveTab] = useState("sales");',
            'const [activeTab, setActiveTab] = useState("sales");\n  const [activeSubTab, setActiveSubTab] = useState("info");'
        )

    # 2. Upgrade the main page container (Dark Glassmorphism)
    content = content.replace(
        'className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact"',
        'className="w-full overflow-y-auto h-[100vh] pb-32 scroll-pt-32 bg-[#030712] p-0 transition-colors duration-200 custom-scrollbar"'
    )
    content = content.replace(
        '<div className="max-w-[1800px] mx-auto">',
        '<div className="max-w-[1920px] mx-auto">'
    )

    # 3. Replace the old sticky header with a breathtaking one
    old_header_start = '{/* Header */}'
    old_header_end = '{/* Status and Messages */}'
    
    new_header = """{/* Ultimate Glassmorphism Header */}
        <div className="sticky top-0 z-[100] w-full mb-6">
          <div className="absolute inset-0 bg-[#030712]/70 backdrop-blur-3xl border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"></div>
          <div className="relative px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-1.5 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                  SEJOUR KONTROL MERKEZİ
                </h1>
                <p className="text-[10px] font-black text-blue-400 mt-0.5 uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {salesData.voucherNumber || "YENİ KAYIT OLUŞTURULUYOR"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="group relative px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all duration-300 flex items-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  PDF İNDİR
                </span>
              </button>
              
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any)}
                className="group relative px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all duration-300 flex items-center overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
              >
                <span className="relative z-10 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  KAYDET
                </span>
              </button>
            </div>
          </div>
        </div>

        """
    
    if "SEJOUR KONTROL MERKEZİ" not in content:
        # Regex to replace everything from {/* Header */} to {/* Status and Messages */}
        content = re.sub(r'\{\/\*\s*Header\s*\*\/\}.*?(?=\{\/\*\s*Status and Messages\s*\*\/})', new_header, content, flags=re.DOTALL)
        
    # 4. Inject SubTab Navigation inside the Form
    SUBTAB_NAV = """
        {/* SUBTAB NAVIGATION (Dahiyane Mimar) */}
        {activeTab === 'sales' && (
          <div className="flex bg-[#0f172a]/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-full max-w-[900px] mx-auto mb-8 shadow-2xl">
            {[
              { id: 'info', label: 'GENEL BİLGİLER', icon: 'ℹ️' },
              { id: 'rooms', label: 'ODALAR', icon: '🛏️' },
              { id: 'flights', label: 'UÇUŞLAR', icon: '✈️' },
              { id: 'transfers', label: 'TRANSFERLER', icon: '🚐' },
              { id: 'extras', label: 'EKSTRALAR', icon: '✨' }
            ].map(tab => (
              <button 
                key={tab.id}
                type="button" 
                onClick={() => setActiveSubTab(tab.id)} 
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ease-out ${
                  activeSubTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-[1.02]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm mb-1">{tab.icon}</span> 
                {tab.label}
              </button>
            ))}
          </div>
        )}
"""

    if "SUBTAB NAVIGATION (Dahiyane Mimar)" not in content:
        content = content.replace(
            '<form onSubmit={handleSubmit} className="relative">',
            '<form onSubmit={handleSubmit} className="relative px-6">\n' + SUBTAB_NAV
        )

    # 5. Hide inactive sections correctly without hiding buttons
    # General Info
    info_old = 'className="grid grid-cols-1 lg:grid-cols-3 gap-2 responsive-filter-grid"'
    info_new = 'className={`grid grid-cols-1 xl:grid-cols-4 gap-6 responsive-filter-grid ${activeSubTab !== "info" ? "hidden" : ""}`}'
    content = content.replace(info_old, info_new)

    # Convert the 5 massive containers to use conditional classes
    # Rooms
    rooms_old = 'className="bg-v3-surface border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    rooms_new = 'className={`bg-[#0f172a]/60 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "rooms" ? "hidden" : ""}`}'
    content = content.replace(rooms_old, rooms_new)

    # Flights
    flights_old = 'className="bg-v3-surface border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    flights_new = 'className={`bg-[#0f172a]/60 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "flights" ? "hidden" : ""}`}'
    content = content.replace(flights_old, flights_new)

    # Transfers
    transfers_old = 'className="bg-v3-surface border-2 border-purple-100 dark:border-purple-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    transfers_new = 'className={`bg-[#0f172a]/60 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "transfers" ? "hidden" : ""}`}'
    content = content.replace(transfers_old, transfers_new)

    # Extras
    extras_old = 'className="bg-v3-surface border-2 border-orange-100 dark:border-orange-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    extras_new = 'className={`bg-[#0f172a]/60 backdrop-blur-2xl border border-orange-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "extras" ? "hidden" : ""}`}'
    content = content.replace(extras_old, extras_new)

    # 6. Enhance the General Info boxes to match glassmorphism
    info_box_old = 'className="bg-v3-surface border border-gray-100 dark:border-gray-700 rounded p-2 shadow-sm transition-all duration-300"'
    info_box_new = 'className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300"'
    content = content.replace(info_box_old, info_box_new)

    # Make the "Satış Bilgileri" header in the form hidden since we have SubTabs
    content = content.replace(
        '<h2 className="text-xl font-black text-v3-text tracking-tight">\n                    Satış Bilgileri\n                  </h2>',
        '<h2 className="hidden text-xl font-black text-v3-text tracking-tight">\n                    Satış Bilgileri\n                  </h2>'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied ULTIMATE glassmorphism and sub-tabs to {filepath}")

for fp in files_to_process:
    upgrade_design(fp)
