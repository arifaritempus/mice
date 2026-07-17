import re

with open("frontend/src/components/QuoteServiceEditor.tsx", "r") as f:
    content = f.read()

# Add activeCategory state
if "const [activeCategory, setActiveCategory]" not in content:
    content = content.replace(
        "const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);",
        "const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);\n  const [activeCategoryId, setActiveCategoryId] = useState<string>(\"all\");"
    )

# Add Category Tabs UI above the table
tabs_ui = """
      {/* Kategori Sekmeleri (Tasarım Birebir Projelerle Aynı) */}
      <div className="mb-4">
        <div className="flex bg-gray-50 dark:bg-[#0f172a]/70 dark:backdrop-blur-md p-1.5 rounded-xl border border-gray-100 dark:border-gray-700/50 space-x-2 overflow-x-auto shadow-sm">
          <button
            type="button"
            onClick={() => setActiveCategoryId("all")}
            className={`flex-1 text-center py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeCategoryId === "all"
                ? "bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
            }`}
          >
            TÜMÜ
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex-1 text-center py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeCategoryId === cat.id
                  ? "bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
"""

# Find where the table starts and inject the tabs
table_start = content.find('<div className="bg-white dark:bg-gray-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">')
if table_start != -1:
    content = content[:table_start] + tabs_ui + '\n      ' + content[table_start:]

# Replace the table container classes to match the dark premium theme from projects
content = content.replace(
    '<div className="bg-white dark:bg-gray-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">',
    '<div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden transition-all duration-300">'
)

# Table Header classes
content = content.replace(
    '<thead className="bg-gray-50 dark:bg-gray-800/50">',
    '<thead className="bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-10 shadow-lg">'
)
content = content.replace(
    'className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"',
    'className="px-4 py-3 text-left text-[10px] font-black text-blue-500/80 uppercase tracking-widest"'
)

# Filter items in the map function based on activeCategoryId
content = content.replace(
    'items.map((item, index) => (',
    'items.filter(item => activeCategoryId === "all" || item.main_category === activeCategoryId).map((item, index) => ('
)

# Update the input fields inside the table to look like the dark theme
content = content.replace(
    'className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"',
    'className="w-full bg-[#0f172a]/50 border border-gray-700/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"'
)

with open("frontend/src/components/QuoteServiceEditor.tsx", "w") as f:
    f.write(content)

print("QuoteServiceEditor.tsx updated!")
