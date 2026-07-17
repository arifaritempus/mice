import re
import glob

def process_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Apply the dark card classes for the main 3 cards in 'info' tab
    # Find: <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700">
    content = content.replace(
        'className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700"',
        'className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden group transition-all duration-300"'
    )
    # The inner cards: bg-gray-50 dark:bg-gray-700/30
    content = content.replace(
        'className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600"',
        'className="bg-[#0f172a]/70 rounded-xl p-4 border border-gray-700/30 hover:bg-[#0f172a] transition-colors"'
    )
    # Text colors for inputs
    content = content.replace(
        'className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1"',
        'className="text-[10px] font-black text-blue-500/80 dark:text-blue-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5"'
    )
    
    # Text colors for details tab specific fields
    content = content.replace(
        'Opsiyon</label>',
        'Opsiyon</label>'
    ).replace(
        'className="block text-[9px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">\n                                Opsiyon',
        'className="block text-[10px] font-black text-yellow-500/90 uppercase tracking-widest mb-1.5">\n                                Opsiyon'
    )
    content = content.replace(
        'className="block text-[9px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">\n                                Opsiyon Tarihi',
        'className="block text-[10px] font-black text-orange-500/90 uppercase tracking-widest mb-1.5">\n                                Opsiyon Tarihi'
    )
    content = content.replace(
        'className="block text-[9px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">\n                                Otel Durumu',
        'className="block text-[10px] font-black text-green-500/90 uppercase tracking-widest mb-1.5">\n                                Otel Durumu'
    )
    content = content.replace(
        'className="block text-[9px] font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase"',
        'className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1.5"'
    )

    # Details tab outer card
    content = content.replace(
        'className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6"',
        'className="bg-[#1e293b]/90 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 mb-6"'
    )
    # Details tab inner grid row
    content = content.replace(
        'className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"',
        'className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 p-4 bg-[#0f172a]/70 border border-gray-700/30 rounded-xl shadow-lg transition-colors"'
    )
    
    # Details inputs
    content = content.replace(
        'className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white"',
        'className="w-full px-2 py-1.5 h-9 text-xs bg-transparent border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white placeholder-gray-500"'
    )
    content = content.replace(
        'className="w-full px-1 py-1 h-8 text-[11px] bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"',
        'className="w-full px-2 py-1.5 h-9 text-xs bg-transparent border border-orange-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-bold text-white placeholder-gray-500 disabled:opacity-50"'
    )
    
    # View page specific details
    content = content.replace(
        'className="w-full px-4 h-8 flex items-center bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-xs text-gray-900 dark:text-white truncate min-w-0"',
        'className="w-full px-3 h-9 flex items-center bg-transparent border border-gray-700/50 rounded-lg font-bold text-xs text-white truncate min-w-0"'
    )
    content = content.replace(
        'className="w-full px-4 h-8 flex items-center bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-xs text-gray-900 dark:text-white truncate min-w-0 opacity-50"',
        'className="w-full px-3 h-9 flex items-center bg-transparent border border-orange-500/30 rounded-lg font-bold text-xs text-white truncate min-w-0 opacity-50"'
    )

    with open(filepath, "w") as f:
        f.write(content)

for p in ["frontend/src/app/quotes/create/page.tsx", "frontend/src/app/quotes/[id]/edit/page.tsx", "frontend/src/app/quotes/[id]/page.tsx"]:
    process_file(p)

print("Applied CSS classes safely without touching JSX structure!")
