import re
import os

files_to_fix = [
    ('src/app/projects/[id]/AccommodationTabOptimized.tsx', 'accommodationSearch', 'setAccommodationSearch', "Konaklama ara..."),
    ('src/app/projects/[id]/TransferTurTab.tsx', 'transferSearch', 'setTransferSearch', "Transfer ara..."),
    ('src/app/projects/[id]/UcakBiletiTab.tsx', 'flightTicketSearch', 'setFlightTicketSearch', "Arama yap..."),
    ('src/app/projects/[id]/DigerTab.tsx', 'searchInput', 'setSearchInput', "Arama yap...")
]

# Note: DigerTab uses searchTerms instead of searchTags.
# We will just rewrite DigerTab's UI part entirely.

UI_TEMPLATE = """        <div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e293b]/80 border border-gray-300 dark:border-gray-700 rounded-lg min-h-[40px] focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm w-full">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          {__TAGS__.map((tag, idx) => <span key={`${tag}-${idx}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-medium">
              {tag}
              <button onClick={() => __REMOVE_FUNC__(tag)} className="hover:text-blue-900 dark:hover:text-blue-100 ml-1 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>)}
          <input type="text" value={__INPUT_VAL__} onChange={e => __SET_INPUT_VAL__(e.target.value)} onKeyDown={__HANDLE_KEYDOWN__} placeholder={__TAGS__.length === 0 ? "__PLACEHOLDER__ (Enter ile çoğalt)" : "Yeni arama..."} className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-200 min-w-[120px] py-0.5 focus:ring-0 placeholder:text-gray-500 dark:placeholder:text-gray-400" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} />
          {__TAGS__.length > 0 && <button onClick={() => {
            __SET_TAGS__([]);
            __SET_GLOBAL_SEARCH__("");
          }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pl-1 shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </button>}
        </div>"""

for filepath, search_var, set_search_var, placeholder in files_to_fix:
    with open(filepath, 'r') as f:
        content = f.read()

    # DigerTab is a special case
    if 'DigerTab' in filepath:
        old_ui = re.search(r'<div className="flex-1 flex flex-wrap items-center gap-1\.5 p-1\.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-\[38px\] shadow-sm">.*?</button>\s*\}\s*</div>', content, re.DOTALL)
        if old_ui:
            new_ui = UI_TEMPLATE.replace('__TAGS__', 'searchTerms').replace('__REMOVE_FUNC__', 'tag => setSearchTerms(searchTerms.filter(t => t !== tag))').replace('__INPUT_VAL__', 'searchInput').replace('__SET_INPUT_VAL__', 'setSearchInput').replace('__HANDLE_KEYDOWN__', 'handleSearchKeyDown').replace('__PLACEHOLDER__', "Diğer ara...").replace('__SET_TAGS__', 'setSearchTerms').replace('__SET_GLOBAL_SEARCH__', '// local')
            content = content.replace(old_ui.group(0), new_ui)
        else:
            print("Could not find old UI in DigerTab")
    
    elif 'UcakBiletiTab' in filepath:
        old_ui = re.search(r'<div className="flex flex-wrap items-center gap-2 p-1\.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-\[38px\] w-full">.*?</button>\s*\}\s*</div>', content, re.DOTALL)
        if old_ui:
            new_ui = UI_TEMPLATE.replace('__TAGS__', 'searchTags').replace('__REMOVE_FUNC__', 'removeSearchTag').replace('__INPUT_VAL__', 'searchInput').replace('__SET_INPUT_VAL__', 'setSearchInput').replace('__HANDLE_KEYDOWN__', 'handleSearchKeyDown').replace('__PLACEHOLDER__', "Uçak bileti ara...").replace('__SET_TAGS__', 'setSearchTags').replace('__SET_GLOBAL_SEARCH__', 'setFlightTicketSearch')
            content = content.replace(old_ui.group(0), new_ui)
        else:
            print("Could not find old UI in UcakBiletiTab")

    elif 'TransferTurTab' in filepath:
        old_input = r'<input type="text" placeholder="Transfer ara..." value=\{transferSearch\} onChange=\{e => setTransferSearch\(e.target.value\)\} className="w-full px-3 py-1\.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled=\{\!permEdit \|\| compIsLocked && \!isSuperAdmin\} />'
        
        new_ui = UI_TEMPLATE.replace('__TAGS__', 'searchTags').replace('__REMOVE_FUNC__', 'removeSearchTag').replace('__INPUT_VAL__', 'searchInput').replace('__SET_INPUT_VAL__', 'setSearchInput').replace('__HANDLE_KEYDOWN__', 'handleSearchKeyDown').replace('__PLACEHOLDER__', "Transfer ara...").replace('__SET_TAGS__', 'setSearchTags').replace('__SET_GLOBAL_SEARCH__', 'setTransferSearch')
        content = re.sub(old_input, new_ui, content)

    elif 'AccommodationTabOptimized' in filepath:
        old_input = r'<input type="text" placeholder="Konaklama ara\.\.\." value=\{accommodationSearch\} onChange=\{e => setAccommodationSearch\(e\.target\.value\)\} className="w-full px-3 py-1\.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled=\{\!permEdit \|\| \(compIsLocked && \!isSuperAdmin\)\} />'
        
        new_ui = UI_TEMPLATE.replace('__TAGS__', 'searchTags').replace('__REMOVE_FUNC__', 'removeSearchTag').replace('__INPUT_VAL__', 'searchInput').replace('__SET_INPUT_VAL__', 'setSearchInput').replace('__HANDLE_KEYDOWN__', 'handleSearchKeyDown').replace('__PLACEHOLDER__', "Konaklama ara...").replace('__SET_TAGS__', 'setSearchTags').replace('__SET_GLOBAL_SEARCH__', 'setAccommodationSearch')
        content = re.sub(old_input, new_ui, content)

    with open(filepath, 'w') as f:
        f.write(content)

print("Done standardizing all search UI blocks.")
