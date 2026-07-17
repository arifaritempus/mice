import re
import os

# 1. Update UcakBiletiTab.tsx
filepath = 'src/app/projects/[id]/UcakBiletiTab.tsx'
with open(filepath, 'r') as f: content = f.read()

# Make sure imports are fine (it already has Search, X from lucide-react)
old_ui = """        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[38px] w-full">
          <Search className="w-4 h-4 text-gray-400 ml-1" />
          <div className="flex flex-wrap gap-1">
            {searchTags.map((tag, idx) => <span key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                {tag}
                <button onClick={() => removeSearchTag(tag)} className="hover:text-blue-600 dark:hover:text-blue-400">
                  <X className="w-3 h-3" />
                </button>
              </span>)}
          </div>
          <input type="text" className="flex-1 min-w-[100px] bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none" placeholder={searchTags.length === 0 ? (t('projects.searchWithEnter') || "Arama yap... (Enter ile çoğalt)") : (t('projects.newSearch') || "Yeni arama...")} value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} disabled={!permEdit || compIsLocked && !isSuperAdmin} />
          {searchTags.length > 0 && <button onClick={() => {
          setSearchTags([]);
          setFlightTicketSearch("");
        }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              <X className="w-4 h-4" />
            </button>}
        </div>"""

new_ui = """        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[38px] shadow-sm">
          <Search className="w-4 h-4 text-gray-400 ml-1.5" />
          {searchTags.map((tag, idx) => <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium">
              {tag}
              <button onClick={() => removeSearchTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>)}
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={searchTags.length === 0 ? (t('projects.searchWithEnter') || "Arama yap... (Enter ile çoğalt)") : (t('projects.newSearch') || "Yeni arama...")} className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 min-w-[120px] py-0.5 focus:ring-0 placeholder:text-gray-400" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} />
          {searchTags.length > 0 && <button onClick={() => {
            setSearchTags([]);
            setFlightTicketSearch("");
          }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pr-1">
            <X className="w-4 h-4" />
          </button>}
        </div>"""

content = content.replace(old_ui, new_ui)
with open(filepath, 'w') as f: f.write(content)

# 2. Update DigerTab.tsx
filepath = 'src/app/projects/[id]/DigerTab.tsx'
with open(filepath, 'r') as f: content = f.read()
# Replace indigo with blue, and change searchTerms to searchTags for consistency if we wanted, 
# but simply replacing indigo with blue and standardizing the UI is enough.
content = content.replace("bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200")
content = content.replace("hover:text-indigo-900 dark:hover:text-indigo-100", "hover:text-blue-900 dark:hover:text-blue-100 ml-1")
content = content.replace(
    '<svg className="w-4 h-4 text-gray-400 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />\n            </svg>',
    '<Search className="w-4 h-4 text-gray-400 ml-1.5" />'
)
content = content.replace(
    '<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />\n                  </svg>',
    '<X className="w-3 h-3" />'
)
content = content.replace(
    '<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />\n                </svg>',
    '<X className="w-4 h-4" />'
)

if 'import { Search, X }' not in content:
    content = content.replace('import { usePermissions, Module } from "@/lib/permissions";', 'import { usePermissions, Module } from "@/lib/permissions";\nimport { Search, X } from "lucide-react";')

with open(filepath, 'w') as f: f.write(content)

# 3. Update TransferTurTab.tsx
filepath = 'src/app/projects/[id]/TransferTurTab.tsx'
with open(filepath, 'r') as f: content = f.read()

# Add standard Search / X import if missing
if 'import { Search, X }' not in content:
    content = content.replace('import { usePermissions, Module } from "@/lib/permissions";', 'import { usePermissions, Module } from "@/lib/permissions";\nimport { Search, X } from "lucide-react";')

# Inject the state variables
state_injection = """  const [searchTags, setSearchTags] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState("");

  React.useEffect(() => {
    if (transferSearch && searchTags.length === 0) {
      setSearchTags(transferSearch.split(" ").filter((t: string) => t.trim() !== ""));
    }
  }, [transferSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        const newTags = [...searchTags, searchInput.trim()];
        setSearchTags(newTags);
        setTransferSearch(newTags.join(" "));
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      setTransferSearch(newTags.join(" "));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    setTransferSearch(newTags.join(" "));
  };
"""
# find where to inject: after `const [deletingTransferId, setDeletingTransferId] = React.useState<string | null>(null);`
content = content.replace('const [deletingTransferId, setDeletingTransferId] = React.useState<string | null>(null);', 'const [deletingTransferId, setDeletingTransferId] = React.useState<string | null>(null);\n' + state_injection)

old_input = '<input type="text" placeholder="Transfer ara..." value={transferSearch} onChange={e => setTransferSearch(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={!permEdit || compIsLocked && !isSuperAdmin} />'

new_ui_transfer = """        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[38px] shadow-sm">
          <Search className="w-4 h-4 text-gray-400 ml-1.5" />
          {searchTags.map((tag, idx) => <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium">
              {tag}
              <button onClick={() => removeSearchTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>)}
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={searchTags.length === 0 ? "Arama yap... (Enter ile çoğalt)" : "Yeni arama..."} className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 min-w-[120px] py-0.5 focus:ring-0 placeholder:text-gray-400" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} />
          {searchTags.length > 0 && <button onClick={() => {
            setSearchTags([]);
            setTransferSearch("");
          }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pr-1">
            <X className="w-4 h-4" />
          </button>}
        </div>"""

content = content.replace(old_input, new_ui_transfer)
with open(filepath, 'w') as f: f.write(content)

# 4. Update AccommodationTabOptimized.tsx
filepath = 'src/app/projects/[id]/AccommodationTabOptimized.tsx'
with open(filepath, 'r') as f: content = f.read()

if 'import { Search, X }' not in content:
    content = content.replace('import { usePermissions, Module } from "@/lib/permissions";', 'import { usePermissions, Module } from "@/lib/permissions";\nimport { Search, X } from "lucide-react";')

state_injection_acc = """  const [searchTags, setSearchTags] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState("");

  React.useEffect(() => {
    if (accommodationSearch && searchTags.length === 0) {
      setSearchTags(accommodationSearch.split(" ").filter((t: string) => t.trim() !== ""));
    }
  }, [accommodationSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        const newTags = [...searchTags, searchInput.trim()];
        setSearchTags(newTags);
        setAccommodationSearch(newTags.join(" "));
      }
      setSearchInput("");
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      setAccommodationSearch(newTags.join(" "));
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    setAccommodationSearch(newTags.join(" "));
  };
"""
content = content.replace('const [localAccommodationItems, setLocalAccommodationItems] = React.useState<any[]>([]);', 'const [localAccommodationItems, setLocalAccommodationItems] = React.useState<any[]>([]);\n' + state_injection_acc)

# Fix filter logic in AccommodationTabOptimized.tsx
old_filter_acc = """    if (!accommodationSearch.trim()) return hotelFilteredItems;
    const searchLower = accommodationSearch.toLowerCase();
    return hotelFilteredItems.filter(item => Object.values(item).some(value => value && value.toString().toLowerCase().includes(searchLower)));"""

new_filter_acc = """    if (!accommodationSearch.trim()) return hotelFilteredItems;
    const searchTerms = accommodationSearch.toLowerCase().split(' ').filter((t: string) => t.trim() !== '');
    return hotelFilteredItems.filter(item => {
      const textToSearch = Object.values(item).map(v => v ? v.toString().toLowerCase() : '').join(' ');
      return searchTerms.every((term: string) => textToSearch.includes(term));
    });"""

content = content.replace(old_filter_acc, new_filter_acc)

old_input_acc = """<input type="text" placeholder={t('projects.searchAccommodation') || "Konaklama ara..."} value={accommodationSearch} onChange={e => setAccommodationSearch(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} />"""

new_ui_acc = """        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[38px] shadow-sm">
          <Search className="w-4 h-4 text-gray-400 ml-1.5" />
          {searchTags.map((tag, idx) => <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium">
              {tag}
              <button onClick={() => removeSearchTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100 ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>)}
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={searchTags.length === 0 ? (t('projects.searchAccommodation') || "Konaklama ara... (Enter ile çoğalt)") : "Yeni arama..."} className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 min-w-[120px] py-0.5 focus:ring-0 placeholder:text-gray-400" disabled={!permEdit || (compIsLocked && !isSuperAdmin)} />
          {searchTags.length > 0 && <button onClick={() => {
            setSearchTags([]);
            setAccommodationSearch("");
          }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 pr-1">
            <X className="w-4 h-4" />
          </button>}
        </div>"""

content = content.replace(old_input_acc, new_ui_acc)
with open(filepath, 'w') as f: f.write(content)

print("Done standardizing all search bars.")
