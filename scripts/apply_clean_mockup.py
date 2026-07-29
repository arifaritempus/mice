import re
import os

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_clean_mockup(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. State
    if "const [expandedSection" not in content:
        content = content.replace(
            'const [activeTab, setActiveTab] = useState("sales");',
            'const [activeTab, setActiveTab] = useState("sales");\n  const [expandedSection, setExpandedSection] = useState<string | null>(null);\n  const [isEditingInfo, setIsEditingInfo] = useState(false);'
        )

    # 2. Header and Main Tabs
    old_header_start = '{/* Header */}'
    old_header_end = '{/* Status and Messages */}'
    
    new_header = """{/* Mockup Top Header */}
        <div className="bg-[#f8faff] dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-[1920px] mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-[#1e293b] dark:text-white tracking-tight">Yeni Sejour Oluştur</h1>
              <div className="text-[11px] text-gray-500 font-medium mt-1 flex items-center gap-2">
                <span>Sejour</span> <span className="text-gray-300">&gt;</span> <span>Yeni Sejour</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 rounded-lg text-blue-600 font-bold text-[11px] hover:bg-blue-50 transition-all shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                PDF İndir
              </button>
              <button type="button" onClick={(e) => handleSubmit(e as any)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 transition-all shadow-[0_4px_10px_rgba(37,99,235,0.2)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Kaydet
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1920px] mx-auto px-6 mt-2">
"""
    
    if "Mockup Top Header" not in content:
        content = re.sub(r'<div className="mb-1 animate-in.*?\{\/\*\s*Status and Messages\s*\*\/\}', new_header + '\n        {/* Status and Messages */}', content, flags=re.DOTALL)
        content = content.replace(
            '<div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">',
            '<div className="w-full overflow-y-auto h-[100vh] pb-32 bg-[#fafbfc] dark:bg-gray-950 transition-colors duration-200">'
        )
        content = content.replace('<div className="max-w-[1800px] mx-auto">', '')

    old_tabs = """          {/* Main Navigation Tabs */}
          <div className="relative mb-2">
            <div className="flex p-1 space-x-1 bg-v3-surface border border-v3-border rounded-lg shadow-sm max-w-md mx-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center flex-1 px-2 py-1.5 text-xs font-black leading-5 rounded transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "text-v3-muted hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="mr-2 text-base">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>"""
          
    new_tabs = """          {/* Main Navigation Tabs Mockup */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-8 mt-4">
            <div className="flex max-w-[1920px] mx-auto overflow-x-auto custom-scrollbar gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  <span className="mr-2 text-sm opacity-70">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>"""
    
    if "Main Navigation Tabs Mockup" not in content:
        content = content.replace(old_tabs, new_tabs)

    # 3. Info Card Replacement
    # The General Info starts at `Satış Bilgileri`
    satis_header_old = """                  <h2 className="text-xl font-black text-v3-text tracking-tight">
                    Satış Bilgileri
                  </h2>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 mx-6"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">"""

    satis_header_new = """                  <h2 className="hidden text-xl font-black text-v3-text tracking-tight">
                    Satış Bilgileri
                  </h2>
                </div>

                {/* Mockup Sejour Bilgileri */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-[#1e293b] dark:text-white">Sejour Bilgileri</h3>
                    <button type="button" onClick={() => setIsEditingInfo(!isEditingInfo)} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                      ✏️ Detayları Düzenle
                    </button>
                  </div>
                  {!isEditingInfo ? (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2">Voucher No</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{salesData.voucherNumber || "VOU-2024-001"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2">Acente</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{salesData.customerName || "Denfen"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2">Giriş - Çıkış</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{salesData.checkInDate || "04.08.2026"} - {salesData.checkOutDate || "07.08.2026"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2">Otel Konsepti</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">HD</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2">Pax</p>
                        <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">300 | 300</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-2">Durum</p>
                        <span className="inline-block px-2.5 py-1 bg-[#fff8e6] text-[#b8860b] text-[9px] font-black rounded-md">{salesData.status || "BEKLEMEDE"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
"""
    if "Mockup Sejour Bilgileri" not in content:
        content = content.replace(satis_header_old, satis_header_new)

        # Close the Info Card right before {showAccommodation && (
        info_end_old = """                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Section */}"""

        info_end_new = """                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Hizmetler Header */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-base font-black text-[#1e293b] dark:text-white mb-1">Hizmetler</h3>
                    <p className="text-xs text-gray-500">Sejour için eklenen hizmetleri aşağıda yönetebilirsiniz.</p>
                  </div>
                  <button type="button" className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                    + Hizmet Ekle
                  </button>
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                
                {/* Accommodation Section */}"""
        
        # Replace the info_end by using regex for safety
        content = re.sub(
            r'\{\/\*\s*Accommodation Section\s*\*\/\}.*?\{showAccommodation && \(',
            info_end_new + '\n                {showAccommodation && (',
            content,
            flags=re.DOTALL
        )

        # Inject Accordion Headers before the existing containers
        # ROOMS
        rooms_accordion = """
                  {/* KONAKLAMA ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'rooms' ? null : 'rooms')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div className="w-48">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Konaklama ({rooms.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{rooms.length} oda</p>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Otel</p>
                        <p className="text-[11px] font-bold text-[#1e293b] truncate">ACAPULCO RESORT</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Konsept</p>
                        <p className="text-[11px] font-bold text-[#1e293b]">HD</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Oda Tipi</p>
                        <p className="text-[11px] font-bold text-[#1e293b] truncate">DOUBLE ODADA...</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Pax</p>
                        <p className="text-[11px] font-bold text-[#1e293b]">300</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Satış Tutarı</p>
                        <p className="text-[11px] font-black text-[#1e293b]">202.500,00 EUR</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </div>
                  </div>
"""
        content = content.replace(
            '<div className="bg-v3-surface border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500">',
            rooms_accordion + '\n<div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "rooms" ? "block" : "hidden"}`}>'
        )

        # FLIGHTS
        flights_accordion = """
                  {/* UÇUŞ ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'flights' ? null : 'flights')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div className="w-48">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Uçuş ({flights.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{flights.length} kayıt</p>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-500 mb-1">Gidiş - Dönüş</p>
                        <p className="text-[11px] font-bold text-[#1e293b] truncate">04.08.2026 - 07.08.2026</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Havayolu</p>
                        <p className="text-[11px] font-bold text-[#1e293b]">SOR-SAT</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Pax</p>
                        <p className="text-[11px] font-bold text-[#1e293b]">300</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Satış Tutarı</p>
                        <p className="text-[11px] font-black text-[#1e293b]">202.500,00 EUR</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'flights' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </div>
                  </div>
"""
        content = content.replace(
            '<div className="bg-v3-surface border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500">',
            flights_accordion + '\n<div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "flights" ? "block" : "hidden"}`}>'
        )

        # TRANSFERS
        transfers_accordion = """
                  {/* TRANSFER ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'transfers' ? null : 'transfers')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                    </div>
                    <div className="w-48">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Transfer ({transfers.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{transfers.length} kayıt</p>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Hizmet Tipi</p>
                        <p className="text-[11px] font-bold text-[#1e293b] truncate">GİDİŞ - DÖNÜŞ</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Araç Tipi</p>
                        <p className="text-[11px] font-bold text-[#1e293b]">ÖZEL</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 mb-1">Pax</p>
                        <p className="text-[11px] font-bold text-[#1e293b]">300</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-500 mb-1">Satış Tutarı</p>
                        <p className="text-[11px] font-black text-[#1e293b]">53.920,00 EUR</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'transfers' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </div>
                  </div>
"""
        content = content.replace(
            '<div className="bg-v3-surface border-2 border-purple-100 dark:border-purple-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500">',
            transfers_accordion + '\n<div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "transfers" ? "block" : "hidden"}`}>'
        )

        # EXTRAS
        extras_accordion = """
                  {/* EXTRA ACCORDION ROW */}
                  <div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => setExpandedSection(expandedSection === 'extras' ? null : 'extras')}>
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-xl mr-5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-[#1e293b] dark:text-gray-200">Ekstra Hizmet ({extraServices.length})</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{extraServices.length > 0 ? `${extraServices.length} kayıt` : 'Ekstra hizmet bulunmuyor'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 ml-4">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'extras' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
"""
        content = content.replace(
            '<div className="bg-v3-surface border-2 border-orange-100 dark:border-orange-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500">',
            extras_accordion + '\n<div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-6 ${expandedSection === "extras" ? "block" : "hidden"}`}>'
        )

        # Totals Row injection right before `{/* Purchase Tab */}`
        totals_row = """
                </div> {/* End of Hizmetler Container */}

                {/* MOCKUP TOTALS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Toplam Satış</p>
                      <p className="text-sm font-black text-[#1e293b] dark:text-gray-200">459.920,00 EUR</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Toplam Alış</p>
                      <p className="text-sm font-black text-[#1e293b] dark:text-gray-200">385.120,00 EUR</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#e6fff2] dark:bg-emerald-900/20 text-[#00b368] rounded-lg mr-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Tahmini Kâr</p>
                      <p className="text-sm font-black text-[#1e293b] dark:text-gray-200">74.800,00 EUR</p>
                    </div>
                  </div>
                </div>

                {/* Purchase Tab */}"""
        
        # Inject the totals row right before Purchase tab
        content = content.replace('{/* Purchase Tab */}', totals_row)
        content = re.sub(r'(\s*</div>\n\s*</div>\n\s*\);\n})', r'\n      </div>\1', content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
for fp in files:
    apply_clean_mockup(fp)
