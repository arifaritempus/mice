import os
import re

files = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx"
]

def apply_foolproof_mockup_v18(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. State
    if "const [expandedSection" not in content:
        content = content.replace(
            'const [activeTab, setActiveTab] = useState("sales");',
            'const [activeTab, setActiveTab] = useState("sales");\n  const [expandedSection, setExpandedSection] = useState<string | null>(null);\n  const [isEditingInfo, setIsEditingInfo] = useState(false);',
            1
        )

    # 2. Header
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
        content = re.sub(r'<div className="mb-1 animate-in.*?\{\/\*\s*Status and Messages\s*\*\/\}', new_header + '\n        {/* Status and Messages */}', content, count=1, flags=re.DOTALL)
        content = content.replace(
            '<div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent p-2 transition-colors duration-200 compact">',
            '<div className="w-full overflow-y-auto h-[100vh] pb-32 bg-[#fafbfc] dark:bg-gray-950 transition-colors duration-200">',
            1
        )
        content = content.replace(
            '<div className="w-full overflow-y-auto h-[90vh] pb-32 scroll-pt-32 bg-transparent transition-colors duration-200 compact">',
            '<div className="w-full overflow-y-auto h-[100vh] pb-32 bg-[#fafbfc] dark:bg-gray-950 transition-colors duration-200">',
            1
        )
        content = content.replace('<div className="max-w-[1800px] mx-auto">', '', 1)

    # 3. Tabs
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
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6 mt-2">
            <div className="flex max-w-[1920px] mx-auto overflow-x-auto custom-scrollbar gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2 whitespace-nowrap ${
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
        content = content.replace(old_tabs, new_tabs, 1)

    # 4. Info Wrapper + Modern Form Replace
    # NOTE: Changed from "grid-cols-2 lg:grid-cols-5" to "grid-cols-5" unconditionally
    modern_info_and_form = """{/* Mockup Sejour Bilgileri */}
                <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-6 ${isEditingInfo ? 'hidden' : 'block'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-[#1e293b] dark:text-white">Sejour Bilgileri</h3>
                    <button type="button" onClick={() => setIsEditingInfo(true)} className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                      ✏️ Düzenle
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Voucher No</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{(salesData as any).voucherNumber || "VOU-YENİ"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Müşteri Tipi</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{(salesData as any).customerType === 'agency' ? 'ACENTE' : 'ŞAHIS'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">{(salesData as any).customerType === 'agency' ? 'Acente' : 'Müşteri Adı'}</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{(salesData as any).customerType === 'agency' ? (agencies.find(a => a.id === (salesData as any).agencyId)?.name || "-") : ((salesData as any).customerName || "-")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Giriş - Çıkış Tarihi</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">{(salesData as any).checkInDate || "-"} - {(salesData as any).checkOutDate || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Rezervasyon Durumu</p>
                      <span className={`inline-block px-2.5 py-1 text-[9px] font-black rounded-md ${
                        (salesData as any).status === 'KONFIRME' ? 'bg-emerald-100 text-emerald-700' : 
                        (salesData as any).status === 'İPTAL' ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>{(salesData as any).status || "BEKLEMEDE"}</span>
                    </div>
                  </div>
                </div>

                {/* Mockup MODERN Düzenle Formu - ONE ROW */}
                <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-300 ${isEditingInfo ? 'block' : 'hidden'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-[#1e293b] dark:text-white">Sejour Bilgilerini Düzenle</h3>
                    <button type="button" onClick={() => setIsEditingInfo(false)} className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm">
                      Kaydet ve Kapat
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3 items-end">
                    {/* Voucher */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Voucher No *</label>
                      <input type="text" name="voucherNumber" value={salesData.voucherNumber} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-[#1e293b] dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" placeholder="VOU-YENİ" required />
                    </div>
                    
                    {/* Müşteri Tipi */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Müşteri Tipi *</label>
                      <div className="flex p-0.5 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 h-[34px]">
                        <button type="button" onClick={() => handleInputChange({target: {name: 'customerType', value: 'agency'}} as any)} className={`flex-1 text-[9px] font-black tracking-widest rounded-lg transition-all ${salesData.customerType === 'agency' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>ACENTE</button>
                        <button type="button" onClick={() => handleInputChange({target: {name: 'customerType', value: 'individual'}} as any)} className={`flex-1 text-[9px] font-black tracking-widest rounded-lg transition-all ${salesData.customerType === 'individual' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>ŞAHIS</button>
                      </div>
                    </div>

                    {/* Acente/Müşteri Adı */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                        {salesData.customerType === 'agency' ? 'Acente *' : 'Ad Soyad *'}
                      </label>
                      {salesData.customerType === 'agency' ? (
                        <div className="relative z-[60]"><SearchableSelect options={agencies} value={salesData.agencyId} onChange={(id) => handleInputChange({target: {name: 'agencyId', value: id}} as any)} placeholder="Acente ara..." className="w-full text-[11px]" /></div>
                      ) : (
                        <input type="text" name="customerName" value={salesData.customerName} onChange={handleInputChange} className="w-full px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] font-bold text-[#1e293b] dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" placeholder="Örn: Ahmet Yılmaz" />
                      )}
                    </div>

                    {/* Tarihler */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Giriş / Çıkış *</label>
                      <div className="flex gap-1">
                        <input type="date" name="checkInDate" value={salesData.checkInDate} onChange={handleInputChange} className="w-full px-1.5 py-2 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-[9px] font-bold text-[#1e293b] dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                        <input type="date" name="checkOutDate" value={salesData.checkOutDate} onChange={handleInputChange} className="w-full px-1.5 py-2 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-[9px] font-bold text-[#1e293b] dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                      </div>
                    </div>

                    {/* Durum */}
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Durum</label>
                      <div className="flex p-0.5 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 h-[34px]">
                        {['BEKLEMEDE', 'KONFIRME', 'İPTAL'].map(status => (
                            <button key={status} type="button" onClick={() => handleInputChange({target: {name: 'status', value: status}} as any)} className={`flex-1 text-[11px] font-black tracking-tighter rounded-lg transition-all ${salesData.status === status ? (status === 'BEKLEMEDE' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : status === 'KONFIRME' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600') : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                              {status === 'BEKLEMEDE' ? '⏳' : status === 'KONFIRME' ? '✅' : '❌'}
                            </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hizmetler Header */}
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className="text-base font-black text-[#1e293b] dark:text-white mb-1">Hizmetler</h3>
                    <p className="text-[11px] text-gray-500">Sejour için eklenen hizmetleri aşağıda yönetebilirsiniz.</p>
                  </div>
                  <button type="button" className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-blue-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                    + Hizmet Ekle
                  </button>
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 overflow-hidden">
                
                {/* Accommodation Section */}"""
    
    if "Mockup MODERN Düzenle Formu - ONE ROW" not in content:
        content, count = re.subn(
            r'<div className="grid grid-cols-1 lg:grid-cols-3 gap-2 responsive-filter-grid">.*?\{\/\*\s*Accommodation Section\s*\*\/\}',
            modern_info_and_form,
            content,
            count=1,
            flags=re.DOTALL
        )
        if count == 0:
            print(f"FAILED TO INJECT MODERN FORM IN {filepath}")
        else:
            print(f"SUCCESSFULLY INJECT MODERN FORM IN {filepath}")

        # Hide Satış Bilgileri
        content = content.replace(
            '<h2 className="text-xl font-black text-v3-text tracking-tight">\n                    Satış Bilgileri\n                  </h2>',
            '<h2 className="hidden text-xl font-black text-v3-text tracking-tight">\n                    Satış Bilgileri\n                  </h2>',
            1
        )
        content = content.replace(
            '<h2 className="text-xl font-black text-v3-text tracking-tight">\r\n                    Satış Bilgileri\r\n                  </h2>',
            '<h2 className="hidden text-xl font-black text-v3-text tracking-tight">\r\n                    Satış Bilgileri\r\n                  </h2>',
            1
        )

        # 5. Accommodation (REGEX EXACTLY 16 SPACES)
        rooms_header = """                  {/* KONAKLAMA ACCORDION ROW */}
                  <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => { setExpandedSection(expandedSection === 'rooms' ? null : 'rooms'); setShowAccommodation(true); }}>
                    <div className="w-8 h-8 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div className="w-40">
                      <h4 className="text-[11px] font-black text-[#1e293b] dark:text-gray-200">Konaklama ({rooms.length})</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{rooms.length} oda</p>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-3">
                      {rooms.length > 0 ? (
                        <>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Otel</p>
                            <p className="text-[10px] font-bold text-[#1e293b] truncate">{(rooms[0] as any).hotelName || 'Bilinmiyor'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Konsept</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(rooms[0] as any).concept || 'Bilinmiyor'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Oda Tipi</p>
                            <p className="text-[10px] font-bold text-[#1e293b] truncate">{(rooms[0] as any).roomType || 'Bilinmiyor'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Pax</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(rooms[0] as any).paxInfo?.adults || 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Satış Tutarı</p>
                            <p className="text-[10px] font-black text-[#1e293b]">{(rooms[0] as any).salesAmount || 0} {(rooms[0] as any).currency || 'TRY'}</p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-5 text-gray-400 text-[10px] italic flex items-center">Henüz konaklama eklenmedi.</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 ml-3">
                      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5 ${expandedSection === 'rooms' ? 'block' : 'hidden'}`}>
                  {showAccommodation && ("""
        content = re.sub(r'^\s{16}\{showAccommodation && \(', rooms_header, content, count=1, flags=re.MULTILINE)

        # 6. Flight
        flights_header = """                  </div>
                  {/* UÇUŞ ACCORDION ROW */}
                  <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => { setExpandedSection(expandedSection === 'flights' ? null : 'flights'); setShowFlight(true); }}>
                    <div className="w-8 h-8 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div className="w-40">
                      <h4 className="text-[11px] font-black text-[#1e293b] dark:text-gray-200">Uçuş ({flights.length})</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{flights.length} kayıt</p>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-3">
                      {flights.length > 0 ? (
                        <>
                          <div className="col-span-2">
                            <p className="text-[9px] text-gray-500 mb-0.5">Gidiş - Dönüş</p>
                            <p className="text-[10px] font-bold text-[#1e293b] truncate">{(flights[0] as any).departureDate || '-'} - {(flights[0] as any).returnDate || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Havayolu</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(flights[0] as any).airline || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Pax</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(flights[0] as any).pax || 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Satış Tutarı</p>
                            <p className="text-[10px] font-black text-[#1e293b]">{(flights[0] as any).salesAmount || 0} {(flights[0] as any).currency || 'TRY'}</p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-5 text-gray-400 text-[10px] italic flex items-center">Henüz uçuş eklenmedi.</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 ml-3">
                      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedSection === 'flights' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5 ${expandedSection === 'flights' ? 'block' : 'hidden'}`}>
                  {showFlight && ("""
        content = re.sub(r'^\s{16}\{showFlight && \(', flights_header, content, count=1, flags=re.MULTILINE)

        # 7. Transfer
        transfers_header = """                  </div>
                  {/* TRANSFER ACCORDION ROW */}
                  <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick={() => { setExpandedSection(expandedSection === 'transfers' ? null : 'transfers'); setShowTransfer(true); }}>
                    <div className="w-8 h-8 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                    </div>
                    <div className="w-40">
                      <h4 className="text-[11px] font-black text-[#1e293b] dark:text-gray-200">Transfer ({transfers.length})</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{transfers.length} kayıt</p>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-3">
                      {transfers.length > 0 ? (
                        <>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Hizmet Tipi</p>
                            <p className="text-[10px] font-bold text-[#1e293b] truncate">{(transfers[0] as any).serviceType || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Araç Tipi</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(transfers[0] as any).vehicleType || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 mb-0.5">Pax</p>
                            <p className="text-[10px] font-bold text-[#1e293b]">{(transfers[0] as any).pax || 0}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[9px] text-gray-500 mb-0.5">Satış Tutarı</p>
                            <p className="text-[10px] font-black text-[#1e293b]">{(transfers[0] as any).salesAmount || 0} {(transfers[0] as any).currency || 'TRY'}</p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-5 text-gray-400 text-[10px] italic flex items-center">Henüz transfer eklenmedi.</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 ml-3">
                      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedSection === 'transfers' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5 ${expandedSection === 'transfers' ? 'block' : 'hidden'}`}>
                  {showTransfer && ("""
        content = re.sub(r'^\s{16}\{showTransfer && \(', transfers_header, content, count=1, flags=re.MULTILINE)

        # 8. Extra Services
        extras_header = """                  </div>
                  {/* EXTRA ACCORDION ROW */}
                  <div className="flex items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => { setExpandedSection(expandedSection === 'extras' ? null : 'extras'); setShowExtraServices(true); }}>
                    <div className="w-8 h-8 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-black text-[#1e293b] dark:text-gray-200">Ekstra Hizmet ({extraServices.length})</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{extraServices.length > 0 ? `${extraServices.length} kayıt` : 'Ekstra hizmet bulunmuyor'}</p>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 ml-3">
                      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedSection === 'extras' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </div>
                  <div className={`border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5 ${expandedSection === 'extras' ? 'block' : 'hidden'}`}>
                  {showExtraServices && ("""
        content = re.sub(r'^\s{16}\{showExtraServices && \(', extras_header, content, count=1, flags=re.MULTILINE)

        # 9. Close the last div and insert Totals BEFORE the Summary Block
        totals_row = """                  </div>
                </div> {/* END OF HIZMETLER */}

                {/* MOCKUP TOTALS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Toplam Satış</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">
                        {rooms.reduce((acc, r) => acc + ((r as any).salesAmount || 0), 0) + 
                         flights.reduce((acc, f) => acc + ((f as any).salesAmount || 0), 0) + 
                         transfers.reduce((acc, t) => acc + ((t as any).salesAmount || 0), 0)} {(salesData as any).currency || 'EUR'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#f0f5ff] dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Toplam Alış</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">
                        {rooms.reduce((acc, r) => acc + ((r as any).purchaseAmount || 0), 0) + 
                         flights.reduce((acc, f) => acc + ((f as any).purchaseAmount || 0), 0) + 
                         transfers.reduce((acc, t) => acc + ((t as any).purchaseAmount || 0), 0)} {(salesData as any).currency || 'EUR'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#e6fff2] dark:bg-emerald-900/20 text-[#00b368] rounded-lg mr-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Tahmini Kâr</p>
                      <p className="text-xs font-black text-[#1e293b] dark:text-gray-200">
                        { (rooms.reduce((acc, r) => acc + ((r as any).salesAmount || 0), 0) + flights.reduce((acc, f) => acc + ((f as any).salesAmount || 0), 0) + transfers.reduce((acc, t) => acc + ((t as any).salesAmount || 0), 0)) - 
                          (rooms.reduce((acc, r) => acc + ((r as any).purchaseAmount || 0), 0) + flights.reduce((acc, f) => acc + ((f as any).purchaseAmount || 0), 0) + transfers.reduce((acc, t) => acc + ((t as any).purchaseAmount || 0), 0)) } {(salesData as any).currency || 'EUR'}
                      </p>
                    </div>
                  </div>
                </div>\n"""
        
        content, n_replaced = re.subn(
            r'(\s*)<div className="grid grid-cols-1 md:grid-cols-(?:4|2 lg:grid-cols-4) gap-2 responsive-filter-grid">',
            lambda m: m.group(1) + totals_row + m.group(0).replace('<div className="', '<div className="hidden '),
            content,
            count=1
        )
        if n_replaced == 0:
            print(f"FAILED TO INJECT TOTALS ROW IN {filepath}")
        else:
            print(f"SUCCESSFULLY INJECTED TOTALS ROW IN {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for fp in files:
    apply_foolproof_mockup_v18(fp)
