import re

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

def ensure_lucide_import(content):
    if "import { Search" not in content and "import { X" not in content and "import {Search" not in content:
        if "import { usePermissions" in content:
            return content.replace('import { usePermissions', 'import { Search, X } from "lucide-react";\nimport { usePermissions')
        else:
            return 'import { Search, X } from "lucide-react";\n' + content
    return content

# 1. UcakBiletiTab.tsx
filepath = 'src/app/projects/[id]/UcakBiletiTab.tsx'
with open(filepath, 'r') as f: content = f.read()
new_ui = UI_TEMPLATE.replace('__TAGS__', 'searchTags').replace('__REMOVE_FUNC__', 'removeSearchTag').replace('__INPUT_VAL__', 'searchInput').replace('__SET_INPUT_VAL__', 'setSearchInput').replace('__HANDLE_KEYDOWN__', 'handleSearchKeyDown').replace('__PLACEHOLDER__', "Uçak bileti ara...").replace('__SET_TAGS__', 'setSearchTags').replace('__SET_GLOBAL_SEARCH__', 'setFlightTicketSearch')
# Use regex to find the block
content = re.sub(r'<div className="flex flex-wrap items-center gap-2 p-1\.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-\[38px\] w-full">.*?</button>\s*\}\s*</div>', new_ui, content, flags=re.DOTALL)
content = ensure_lucide_import(content)
with open(filepath, 'w') as f: f.write(content)

# 2. DigerTab.tsx
filepath = 'src/app/projects/[id]/DigerTab.tsx'
with open(filepath, 'r') as f: content = f.read()
new_ui = UI_TEMPLATE.replace('__TAGS__', 'searchTerms').replace('__REMOVE_FUNC__', 'tag => setSearchTerms(searchTerms.filter(t => t !== tag))').replace('__INPUT_VAL__', 'searchInput').replace('__SET_INPUT_VAL__', 'setSearchInput').replace('__HANDLE_KEYDOWN__', 'handleSearchKeyDown').replace('__PLACEHOLDER__', "Diğer ara...").replace('__SET_TAGS__', 'setSearchTerms').replace('__SET_GLOBAL_SEARCH__', '// local')
content = re.sub(r'<div className="flex-1 flex flex-wrap items-center gap-1\.5 p-1\.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-\[38px\] shadow-sm">.*?</button>\s*\}\s*</div>', new_ui, content, flags=re.DOTALL)
content = ensure_lucide_import(content)
with open(filepath, 'w') as f: f.write(content)

# For Accommodation and Transfer, they just need `import { Search, X } from "lucide-react";` injected.
filepath = 'src/app/projects/[id]/TransferTurTab.tsx'
with open(filepath, 'r') as f: content = f.read()
content = ensure_lucide_import(content)
with open(filepath, 'w') as f: f.write(content)

filepath = 'src/app/projects/[id]/AccommodationTabOptimized.tsx'
with open(filepath, 'r') as f: content = f.read()
content = ensure_lucide_import(content)
with open(filepath, 'w') as f: f.write(content)

print("Done wrapping up.")
