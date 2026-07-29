import re
import os

files_to_process = [
    "frontend/src/app/sejour/create/page.tsx",
    "frontend/src/app/sejour/[id]/edit/page.tsx",
]

SUBTAB_NAV = """
        {/* SUBTAB NAVIGATION (dahiyane fikir) */}
        {activeTab === 'sales' && (
          <div className="flex bg-v3-surface p-1 rounded-xl border border-v3-border w-full max-w-[800px] mx-auto mb-6 shadow-sm">
            <button type="button" onClick={() => setActiveSubTab('info')} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeSubTab === 'info' ? 'bg-blue-600/90 text-white shadow-md' : 'text-v3-muted hover:text-v3-text hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-sm mb-0.5">ℹ️</span> GENEL BİLGİLER
            </button>
            <button type="button" onClick={() => setActiveSubTab('rooms')} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeSubTab === 'rooms' ? 'bg-blue-600/90 text-white shadow-md' : 'text-v3-muted hover:text-v3-text hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-sm mb-0.5">🛏️</span> ODALAR
            </button>
            <button type="button" onClick={() => setActiveSubTab('flights')} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeSubTab === 'flights' ? 'bg-blue-600/90 text-white shadow-md' : 'text-v3-muted hover:text-v3-text hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-sm mb-0.5">✈️</span> UÇUŞLAR
            </button>
            <button type="button" onClick={() => setActiveSubTab('transfers')} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeSubTab === 'transfers' ? 'bg-blue-600/90 text-white shadow-md' : 'text-v3-muted hover:text-v3-text hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-sm mb-0.5">🚐</span> TRANSFERLER
            </button>
            <button type="button" onClick={() => setActiveSubTab('extras')} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeSubTab === 'extras' ? 'bg-blue-600/90 text-white shadow-md' : 'text-v3-muted hover:text-v3-text hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className="text-sm mb-0.5">✨</span> EKSTRALAR
            </button>
          </div>
        )}
"""

def apply_genius_tabs(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Inject useState
    if "const [activeSubTab, setActiveSubTab]" not in content:
        content = content.replace(
            'const [activeTab, setActiveTab] = useState("sales");',
            'const [activeTab, setActiveTab] = useState("sales");\n  const [activeSubTab, setActiveSubTab] = useState("info");'
        )

    # 2. Inject SubTab Navigation right after the Status/Messages block
    if "SUBTAB NAVIGATION" not in content:
        # Looking for the form start
        form_start = '<form onSubmit={handleSubmit} className="relative pb-32">'
        content = content.replace(
            form_start,
            form_start + SUBTAB_NAV
        )

    # 3. Add `hidden` logic to containers
    # Info Section container:
    info_old = 'className="grid grid-cols-1 xl:grid-cols-4 gap-2 responsive-filter-grid"'
    info_new = 'className={`grid grid-cols-1 xl:grid-cols-4 gap-2 responsive-filter-grid ${activeSubTab !== "info" ? "hidden" : ""}`}'
    content = content.replace(info_old, info_new)

    # Rooms Section container (has blue border):
    rooms_old = 'className="bg-v3-surface border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    rooms_new = 'className={`bg-v3-surface border-2 border-blue-100 dark:border-blue-900/30 rounded shadow-xl animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "rooms" ? "hidden" : ""}`}'
    content = content.replace(rooms_old, rooms_new)

    # Flights Section container (has emerald border):
    flights_old = 'className="bg-v3-surface border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    flights_new = 'className={`bg-v3-surface border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "flights" ? "hidden" : ""}`}'
    content = content.replace(flights_old, flights_new)

    # Transfers Section container (has purple border):
    transfers_old = 'className="bg-v3-surface border-2 border-purple-100 dark:border-purple-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    transfers_new = 'className={`bg-v3-surface border-2 border-purple-100 dark:border-purple-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "transfers" ? "hidden" : ""}`}'
    content = content.replace(transfers_old, transfers_new)

    # Extras Section container (has orange border):
    extras_old = 'className="bg-v3-surface border-2 border-orange-100 dark:border-orange-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500"'
    extras_new = 'className={`bg-v3-surface border-2 border-orange-100 dark:border-orange-900/30 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-500 ${activeSubTab !== "extras" ? "hidden" : ""}`}'
    content = content.replace(extras_old, extras_new)
    
    # Also hide the "Satış Bilgileri" header as the tabs replace it
    sales_header_old = 'Satış Bilgileri\n                  </h2>'
    sales_header_new = 'Satış Bilgileri\n                  </h2>\n                  <div className="hidden">'
    # I won't do that, it's safer to just let it say Satış Bilgileri.

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Applied genius sub-tabs to {filepath}")

for fp in files_to_process:
    apply_genius_tabs(fp)

