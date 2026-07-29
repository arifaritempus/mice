import re
import os

def process_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Konaklama outer wrapper to be a distinct card with color theme
    # Replace the outer <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
    # Wait, it's safer to just replace the Konaklama block
    old_konaklama_summary = r'<div className="flex items-center p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors" onClick=\{\(\) => setExpandedSection\(expandedSection === \'rooms\' \? null : \'rooms\'\)\}>.*?<svg className=\{`w-4 h-4 transition-transform duration-300 \$\{expandedSection === \'rooms\' \? \'rotate-180\' : \'\'\}`\} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\} d="M19 9l-7 7-7-7"/></svg>\s*</div>'
    
    new_konaklama_summary = """{/* KONAKLAMA ACCORDION ROW */}
                  <div className={`flex items-center p-4 cursor-pointer transition-colors ${expandedSection === 'rooms' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setExpandedSection(expandedSection === 'rooms' ? null : 'rooms')}>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-4 transition-colors ${expandedSection === 'rooms' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div className="w-48 shrink-0">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">Konaklama ({rooms.length})</h4>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{rooms.length} oda eklendi</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {expandedSection !== 'rooms' && (
                        rooms.length > 0 ? rooms.map((r, i) => (
                          <div key={r.id} className="grid grid-cols-4 gap-4 items-center bg-gray-50/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                            <div className="col-span-2">
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Oda {i + 1} | Otel / Tip</p>
                              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {r.hotelId ? hotels.find((h) => h.id === r.hotelId)?.name : "Otel Seçilmedi"} - {r.accommodationType} {r.roomType}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 mb-0.5 uppercase tracking-wider">Satış Tutarı</p>
                              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{r.price ? (r.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0,00"} {r.currency}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[11px] text-gray-400 italic">Henüz konaklama hizmeti eklenmedi</p>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 ml-4 shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setShowAccommodation(false); setExpandedSection(null); }} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hizmeti Sil">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <div className={`p-1.5 rounded-md transition-colors ${expandedSection === 'rooms' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg className={`w-4 h-4 transition-transform duration-300 ${expandedSection === 'rooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </div>
                    </div>
                  </div>"""

    content = re.sub(old_konaklama_summary, new_konaklama_summary, content, flags=re.DOTALL)

    # 2. Fix outer wrapper of Konaklama
    content = content.replace(
        '<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">',
        '  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm mb-4 transition-all duration-300 ${expandedSection === "rooms" ? "border-2 border-blue-200 dark:border-blue-800" : "border border-gray-200 dark:border-gray-800"}`}>'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied Konaklama formatting to {filepath}")

process_file("frontend/src/app/sejour/create/page.tsx")
process_file("frontend/src/app/sejour/[id]/edit/page.tsx")
