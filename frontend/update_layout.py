import re

with open('src/app/sejour/page.tsx', 'r') as f:
    content = f.read()

# 1. Main Wrappers
content = content.replace(
    '<div className="flex flex-col h-[calc(100vh-2rem)] p-2 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 w-full min-w-0 overflow-hidden">',
    '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
)
content = content.replace(
    '<div className="w-full min-w-0 flex flex-col flex-1 min-h-0">',
    '<div className="w-full min-w-0 flex-1 flex flex-col">'
)

# 2. Header
content = content.replace(
    '<div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-lg mb-2">',
    '<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">'
)
content = content.replace(
    '<div className="flex justify-between items-center p-2">\n                      <div>\n              <h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Sejour Yönetimi</h1>\n              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Sejour işlemlerini yönetin</p>\n            </div>',
    '<div className="flex justify-between items-center p-2">\n                      <div className="shrink-0 mr-4">\n              <h1 className="text-2xl font-light tracking-wide text-white glow-text">Sejour Yönetimi</h1>\n              <p className="text-xs text-slate-400 mt-1">Sejour işlemlerini yönetin</p>\n            </div>'
)

# Remove the extra </div> that closes flex-1 early
content = content.replace(
    '          </div>\n        </div>\n      </div>\n\n      {/* Stats Cards */}',
    '          </div>\n        </div>\n\n      {/* Stats Cards */}'
)

# Replace Stats Cards wrapper
content = content.replace(
    '<div className="flex flex-nowrap gap-2 mb-3">',
    '<div className="grid grid-cols-2 md:flex md:flex-wrap lg:flex-nowrap gap-3 mb-3 bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-sm shrink-0">'
)

# Stats Cards buttons
content = content.replace(
    "className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}",
    "className={`rounded-lg p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'all' ? 'bg-blue-500/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}`}"
)
content = content.replace(
    "className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'konfirme' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}",
    "className={`rounded-lg p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'konfirme' ? 'bg-green-500/20 border border-green-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}`}"
)
content = content.replace(
    "className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'bekleyen' ? 'bg-yellow-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}",
    "className={`rounded-lg p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'bekleyen' ? 'bg-yellow-500/20 border border-yellow-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}`}"
)
content = content.replace(
    "className={`rounded-lg shadow p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'iptal' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}",
    "className={`rounded-lg p-2 transition-colors duration-200 flex-1 min-w-0 text-left ${statusFilter === 'iptal' ? 'bg-red-500/20 border border-red-500/50 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'}`}"
)

# Filters wrapper
content = content.replace(
    '<div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 p-3 transition-colors duration-200 w-full min-w-0">',
    '<div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-xl mb-3 p-3 shrink-0">'
)

# Fix the end of Data Table (Add the </div> that we removed earlier, BUT at the very end of flex-1!)
# Wait, let's just append it right before {/* Delete Confirmation Modal */}
content = content.replace(
    '      {/* Delete Confirmation Modal */}',
    '      </div>\n      {/* Delete Confirmation Modal */}'
)

# 3. Table Wrapper
content = content.replace(
    '<div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden transition-colors duration-200">',
    '<div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl w-full min-w-0 flex-grow shrink-0 flex flex-col relative overflow-hidden">'
)

# 4. Table header
content = content.replace(
    '<thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-20 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">',
    '<thead className="bg-[#1e293b]/95 sticky top-0 z-20 backdrop-blur-md shadow-sm border-b border-white/10">'
)
content = content.replace(
    'className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"',
    'className="px-2.5 py-2.5 text-left text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10"'
)

# 5. Table Body
content = content.replace(
    '<tbody className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">',
    '<tbody className="divide-y divide-white/5">'
)

# 6. Rows
content = content.replace(
    '<tr key={sejour.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">',
    '<tr key={sejour.id} className="hover:bg-blue-500/10 transition-colors group cursor-pointer border-b border-white/5 last:border-0" onDoubleClick={() => router.push(`/sejour/${sejour.id}`)}>'
)

# 7. Cells
content = content.replace(
    'className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white"',
    'className="px-2.5 py-2.5 whitespace-nowrap text-xs font-medium text-white"'
)
content = content.replace(
    'className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300"',
    'className="px-2.5 py-2.5 whitespace-nowrap text-xs text-slate-200"'
)

with open('src/app/sejour/page.tsx', 'w') as f:
    f.write(content)
